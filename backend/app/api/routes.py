import json
from datetime import datetime, timezone

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field

from app.core.db import connect
from app.core.security import hash_password, make_token, new_salt, read_user_id
from app.services.generic_score import generic_score
from app.services.ollama import summarize
from app.services.receipts import scan_receipt

router = APIRouter()


class Credentials(BaseModel):
    email: str
    password: str = Field(min_length=8, max_length=128)


class SignUpBody(Credentials):
    name: str = Field(min_length=1, max_length=80)


class OnboardingBody(BaseModel):
    name: str = ""
    city: str = ""
    monthlyIncome: float = Field(ge=0, default=0)
    housingCost: float = Field(ge=0, default=0)
    goalName: str = ""
    goalTarget: float = Field(ge=0, default=0)
    alerts: bool = True


class SummaryBody(BaseModel):
    prompt: str = Field(min_length=1, max_length=8000)
    fallback: list[str] = Field(default_factory=list, max_length=8)


class ReceiptBody(BaseModel):
    fileName: str = "receipt"
    image: str = Field(min_length=8, max_length=12_000_000)


class ScoreTransaction(BaseModel):
    merchant: str = ""
    category: str = ""
    amount: float = 0
    type: str = "debit"


class ScoreBody(BaseModel):
    monthlyIncome: float = Field(ge=0, default=0)
    transactions: list[ScoreTransaction] = Field(default_factory=list, max_length=200)


class SnapshotBody(BaseModel):
    transactionCount: int = Field(ge=0, default=0)
    transactions: list[dict] = Field(default_factory=list, max_length=500)


class TransactionBody(BaseModel):
    id: str = ""
    merchant: str = Field(min_length=1, max_length=160)
    category: str = Field(min_length=1, max_length=80)
    date: str = ""
    time: str = ""
    amount: float = Field(gt=0)
    type: str
    paymentMethod: str = ""


def clean_email(value: str) -> str:
    email = value.strip().lower()
    domain = email.split("@")[-1] if "@" in email else ""
    if "@" not in email or "." not in domain or len(email) > 200:
        raise HTTPException(status_code=422, detail="Enter a valid email address")
    return email


def bearer_user(authorization: str | None) -> int:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Sign in required")
    user_id = read_user_id(authorization.split(" ", 1)[1].strip())
    if user_id is None:
        raise HTTPException(status_code=401, detail="Sign in required")
    return user_id


def account_payload(conn, user_id: int) -> dict:
    user = conn.execute("SELECT id, name, email FROM users WHERE id = ?", (user_id,)).fetchone()
    if user is None:
        raise HTTPException(status_code=401, detail="Sign in required")
    profile = conn.execute("SELECT * FROM profiles WHERE user_id = ?", (user_id,)).fetchone()
    rows = conn.execute(
        """
        SELECT client_id, merchant, category, date, time, amount, type, payment_method
        FROM transactions WHERE user_id = ? ORDER BY id DESC
        """,
        (user_id,),
    ).fetchall()
    return {
        "token": make_token(user_id),
        "user": {"name": user["name"], "email": user["email"]},
        "profile": {
            "city": profile["city"] if profile else "",
            "monthlyIncome": profile["monthly_income"] if profile else 0,
            "housingCost": profile["housing_cost"] if profile else 0,
            "goalName": profile["goal_name"] if profile else "",
            "goalTarget": profile["goal_target"] if profile else 0,
            "alerts": bool(profile["alerts"]) if profile else True,
            "onboarded": bool(profile["onboarded"]) if profile else False,
        },
        "transactions": [
            {
                "id": row["client_id"],
                "merchant": row["merchant"],
                "category": row["category"],
                "date": row["date"],
                "time": row["time"],
                "amount": row["amount"],
                "type": row["type"],
                "paymentMethod": row["payment_method"],
            }
            for row in rows
        ],
    }


@router.post("/auth/signup")
def signup(body: SignUpBody):
    email = clean_email(body.email)
    name = body.name.strip()
    salt = new_salt()
    now = datetime.now(timezone.utc).isoformat()
    with connect() as conn:
        existing = conn.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
        if existing:
            raise HTTPException(status_code=409, detail="An account with that email already exists")
        cursor = conn.execute(
            "INSERT INTO users (name, email, password_hash, salt, created_at) VALUES (?, ?, ?, ?, ?)",
            (name, email, hash_password(body.password, salt), salt, now),
        )
        user_id = cursor.lastrowid
        conn.execute("INSERT INTO profiles (user_id) VALUES (?)", (user_id,))
        return account_payload(conn, user_id)


@router.post("/auth/signin")
def signin(body: Credentials):
    email = clean_email(body.email)
    with connect() as conn:
        user = conn.execute("SELECT id, password_hash, salt FROM users WHERE email = ?", (email,)).fetchone()
        if user is None or user["password_hash"] != hash_password(body.password, user["salt"]):
            raise HTTPException(status_code=401, detail="Email or password is incorrect")
        return account_payload(conn, user["id"])


@router.get("/auth/me")
def me(authorization: str | None = Header(default=None)):
    user_id = bearer_user(authorization)
    with connect() as conn:
        return account_payload(conn, user_id)


@router.put("/onboarding")
def onboarding(body: OnboardingBody, authorization: str | None = Header(default=None)):
    user_id = bearer_user(authorization)
    with connect() as conn:
        if body.name.strip():
            conn.execute("UPDATE users SET name = ? WHERE id = ?", (body.name.strip(), user_id))
        conn.execute(
            """
            UPDATE profiles
            SET city = ?, monthly_income = ?, housing_cost = ?, goal_name = ?, goal_target = ?,
                alerts = ?, onboarded = 1
            WHERE user_id = ?
            """,
            (
                body.city.strip(),
                body.monthlyIncome,
                body.housingCost,
                body.goalName.strip(),
                body.goalTarget,
                1 if body.alerts else 0,
                user_id,
            ),
        )
        if body.monthlyIncome > 0:
            already = conn.execute(
                "SELECT id FROM transactions WHERE user_id = ? AND category = ? AND amount = ?",
                (user_id, "Salary / Income", body.monthlyIncome),
            ).fetchone()
            if already is None:
                conn.execute(
                    """
                    INSERT INTO transactions
                    (user_id, client_id, merchant, category, date, time, amount, type, payment_method)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        user_id,
                        f"income-{user_id}",
                        "Monthly income",
                        "Salary / Income",
                        "Today",
                        "Onboarding",
                        body.monthlyIncome,
                        "credit",
                        "Auto-Debit",
                    ),
                )
        return account_payload(conn, user_id)


@router.post("/transactions")
def create_transaction(body: TransactionBody, authorization: str | None = Header(default=None)):
    user_id = bearer_user(authorization)
    if body.type not in {"debit", "credit"}:
        raise HTTPException(status_code=422, detail="Transaction type must be debit or credit")
    client_id = body.id or f"tx-{int(datetime.now(timezone.utc).timestamp() * 1000)}"
    with connect() as conn:
        conn.execute(
            """
            INSERT INTO transactions
            (user_id, client_id, merchant, category, date, time, amount, type, payment_method)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                user_id,
                client_id,
                body.merchant.strip(),
                body.category.strip(),
                body.date or "Today",
                body.time or "",
                body.amount,
                body.type,
                body.paymentMethod,
            ),
        )
        return account_payload(conn, user_id)


@router.post("/ai/summary")
def ai_summary(body: SummaryBody):
    return summarize(body.prompt, body.fallback)


@router.post("/ai/generic-score")
def ai_generic_score(body: ScoreBody):
    rows = [item.model_dump() for item in body.transactions]
    return generic_score(rows, body.monthlyIncome)


@router.post("/ocr/scan")
def ocr_scan(body: ReceiptBody):
    return scan_receipt(body.fileName, body.image)


@router.post("/ledger/snapshot")
def ledger_snapshot(body: SnapshotBody):
    with connect() as conn:
        conn.execute(
            """
            INSERT INTO ledger_snapshots (transaction_count, payload, created_at)
            VALUES (?, ?, ?)
            """,
            (
                body.transactionCount,
                json.dumps(body.transactions)[:200_000],
                datetime.now(timezone.utc).isoformat(),
            ),
        )
    return {"saved": True, "storage": "sqlite", "count": body.transactionCount}


@router.get("/transactions")
def list_transactions(authorization: str | None = Header(default=None)):
    user_id = bearer_user(authorization)
    with connect() as conn:
        payload = account_payload(conn, user_id)
        return payload["transactions"]
