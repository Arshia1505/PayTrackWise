import json
import re

import urllib.error

from app.services.ollama import OLLAMA_MODEL, ask_ollama

RATINGS = (
    (300, 499, "Building"),
    (500, 649, "Fair"),
    (650, 749, "Good"),
    (750, 849, "Strong"),
    (850, 900, "Excellent"),
)

FIXED_WORDS = ("rent", "emi", "loan", "housing", "mortgage", "utilities")


def rating_for(score: int) -> str:
    for low, high, name in RATINGS:
        if low <= score <= high:
            return name
    return "Building"


def inr(value: float) -> str:
    rounded = int(round(value))
    sign = "-" if rounded < 0 else ""
    text = str(abs(rounded))
    if len(text) <= 3:
        return f"₹{sign}{text}"
    head, tail = text[:-3], text[-3:]
    parts = [tail]
    while head:
        parts.append(head[-2:])
        head = head[:-2]
    return "₹" + sign + ",".join(reversed(parts))


def _money(value) -> float:
    try:
        amount = float(value)
    except (TypeError, ValueError):
        return 0.0
    if amount < 0 or amount > 100_000_000:
        return 0.0
    return amount


def facts_from(transactions: list[dict], monthly_income: float) -> dict:
    credits = 0.0
    debits = 0.0
    by_category: dict[str, float] = {}
    fixed = 0.0
    largest: list[tuple[float, str, str]] = []
    counted = 0
    for row in transactions[:200]:
        if not isinstance(row, dict):
            continue
        amount = _money(row.get("amount"))
        if amount <= 0:
            continue
        kind = str(row.get("type") or "").lower()
        if kind not in {"debit", "credit"}:
            continue
        counted += 1
        category = str(row.get("category") or "Uncategorized").strip()[:80] or "Uncategorized"
        merchant = str(row.get("merchant") or "Unknown").strip()[:80] or "Unknown"
        if kind == "credit":
            credits += amount
            continue
        debits += amount
        by_category[category] = by_category.get(category, 0.0) + amount
        label = f"{category} {merchant}".lower()
        if any(word in label for word in FIXED_WORDS):
            fixed += amount
        largest.append((amount, merchant, category))
    money_in = credits if credits > 0 else max(0.0, monthly_income)
    top_category = ""
    top_amount = 0.0
    for name, amount in by_category.items():
        if amount > top_amount:
            top_category, top_amount = name, amount
    largest.sort(reverse=True)
    return {
        "count": counted,
        "moneyIn": money_in,
        "moneyOut": debits,
        "topCategory": top_category,
        "topShare": (top_amount / debits) if debits else 0.0,
        "fixedShare": (fixed / money_in) if money_in else 0.0,
        "categories": sorted(by_category.items(), key=lambda item: item[1], reverse=True)[:6],
        "largest": largest[:8],
    }


def local_score(facts: dict) -> int:
    count = facts["count"]
    if count == 0:
        return 300
    money_in = facts["moneyIn"]
    money_out = facts["moneyOut"]
    history = min(count, 24) / 24 * 120
    if money_in > 0:
        rate = max(-1.0, min(1.0, (money_in - money_out) / money_in))
    else:
        rate = -0.4 if money_out > 0 else 0.0
    savings = ((rate + 1) / 2) * 250
    spread = 80 if money_out == 0 or facts["topShare"] <= 0.45 else 30
    if money_in <= 0:
        fixed = 20
    elif facts["fixedShare"] <= 0.3:
        fixed = 80
    elif facts["fixedShare"] <= 0.5:
        fixed = 40
    else:
        fixed = 10
    covered = 70 if money_in > 0 and money_out <= money_in else 15
    score = round(300 + history + savings + spread + fixed + covered)
    return _cap(max(300, min(900, score)), facts)


def _cap(score: int, facts: dict) -> int:
    count = facts["count"]
    if count == 0:
        return 300
    if count == 1:
        score = min(score, 420)
    if facts["moneyIn"] <= 0 and facts["moneyOut"] > 0:
        score = min(score, 560)
    elif facts["moneyOut"] > facts["moneyIn"] > 0:
        score = min(score, 680)
    return max(300, min(900, score))


def local_improvements(facts: dict) -> list[str]:
    if facts["count"] == 0:
        return [
            "Record income and spending. Generic Score only changes when it can read transactions."
        ]
    tips = []
    money_in = facts["moneyIn"]
    money_out = facts["moneyOut"]
    if money_in <= 0:
        tips.append("Add the money that comes in. The score compares spending with income.")
    elif money_out > money_in:
        tips.append(
            f"Spending is {inr(money_out)} and money in is {inr(money_in)}. Spending less than what comes in raises the score."
        )
    else:
        kept = round((money_in - money_out) / money_in * 100) if money_in else 0
        tips.append(
            f"About {kept}% of the money that came in is still unspent. Keeping that share holds the score up."
        )
    if facts["topCategory"] and facts["topShare"] > 0.5 and money_out > 0:
        tips.append(
            f"{facts['topCategory']} is {round(facts['topShare'] * 100)}% of spending. A smaller share in one category raises the score."
        )
    if facts["fixedShare"] > 0.4 and money_in > 0:
        tips.append(
            f"Rent and loan payments are about {round(facts['fixedShare'] * 100)}% of money in. A lower fixed-bill share raises the score."
        )
    if facts["count"] < 8:
        tips.append("A longer list of transactions makes this score steadier.")
    unique = []
    for tip in tips:
        if tip not in unique:
            unique.append(tip)
    return unique[:3]


def _prompt(facts: dict, baseline: int) -> str:
    lines = [
        f"Transactions read: {facts['count']}",
        f"Money in: {inr(facts['moneyIn'])}",
        f"Money out: {inr(facts['moneyOut'])}",
        f"Left after spending: {inr(facts['moneyIn'] - facts['moneyOut'])}",
        f"A total-based score for these same figures is {baseline}. Stay within 40 points of it.",
        "Spending by category:",
    ]
    if facts["categories"]:
        for name, amount in facts["categories"]:
            lines.append(f"- {name}: {inr(amount)}")
    else:
        lines.append("- none")
    lines.append("Largest expenses:")
    if facts["largest"]:
        for amount, merchant, category in facts["largest"]:
            lines.append(f"- {merchant} ({category}): {inr(amount)}")
    else:
        lines.append("- none")
    return "\n".join(lines)


def _grounded(tips: list[str], facts: dict) -> list[str]:
    known = " ".join(
        [
            str(facts["topCategory"]),
            *[name for name, _ in facts["categories"]],
            *[merchant for _, merchant, _ in facts["largest"]],
            *[category for _, _, category in facts["largest"]],
        ]
    ).lower()
    topics = (
        "dining",
        "grocery",
        "groceries",
        "transport",
        "shopping",
        "rent",
        "emi",
        "loan",
        "utility",
        "utilities",
        "entertainment",
        "travel",
        "fuel",
        "medical",
        "education",
        "subscription",
        "crypto",
    )
    kept = []
    for tip in tips:
        lowered = tip.lower()
        mentioned = [word for word in topics if word in lowered]
        if mentioned and not all(word[:5] in known for word in mentioned):
            continue
        kept.append(tip)
    return kept[:3]


def _from_model(raw: str) -> tuple[int | None, list[str]]:
    start = raw.find("{")
    end = raw.rfind("}")
    if start < 0 or end <= start:
        return None, []
    try:
        parsed = json.loads(raw[start : end + 1])
    except json.JSONDecodeError:
        return None, []
    if not isinstance(parsed, dict):
        return None, []
    score = None
    try:
        score = int(round(float(parsed.get("score"))))
    except (TypeError, ValueError):
        score = None
    improvements = parsed.get("improvements")
    if isinstance(improvements, str):
        improvements = [part.strip() for part in re.split(r"[\n;]+", improvements)]
    cleaned = []
    if isinstance(improvements, list):
        for item in improvements:
            text = str(item).strip().lstrip("-*•").strip()
            if len(text) > 8:
                cleaned.append(text[:240])
    return score, cleaned[:3]


def generic_score(transactions: list[dict], monthly_income: float) -> dict:
    facts = facts_from(transactions, monthly_income)
    baseline = local_score(facts)
    score = baseline
    improvements = local_improvements(facts)
    mode = "local"
    model = "transactions"
    try:
        raw = ask_ollama(
            _prompt(facts, baseline),
            system=(
                "You write a Generic Score for a personal ledger. Reply with JSON only. "
                "Keys: score (integer from 300 to 900), improvements (3 short sentences). "
                "Use only the merchants, categories, and amounts in the user message. "
                "Do not invent loans, banks, or purchases."
            ),
            num_predict=180,
            timeout=45,
        )
        model_score, model_tips = _from_model(raw)
        if model_score is not None:
            score = _cap(max(300, min(900, model_score)), facts)
            score = max(baseline - 40, min(baseline + 40, score))
            score = _cap(score, facts)
        grounded = _grounded(model_tips, facts)
        if facts["count"] > 0 and grounded:
            improvements = grounded
        mode = "ollama"
        model = OLLAMA_MODEL
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, RuntimeError, OSError, ValueError):
        pass
    return {
        "name": "Generic Score",
        "score": score,
        "rating": rating_for(score),
        "ratings": [{"from": low, "to": high, "label": label} for low, high, label in RATINGS],
        "improvements": improvements,
        "mode": mode,
        "model": model,
        "transactionCount": facts["count"],
        "moneyIn": round(facts["moneyIn"], 2),
        "moneyOut": round(facts["moneyOut"], 2),
    }
