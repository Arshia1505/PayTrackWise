import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parents[2] / "data" / "paytrackwise.db"


def connect() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with connect() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                salt TEXT NOT NULL,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS profiles (
                user_id INTEGER PRIMARY KEY,
                city TEXT NOT NULL DEFAULT '',
                monthly_income REAL NOT NULL DEFAULT 0,
                housing_cost REAL NOT NULL DEFAULT 0,
                goal_name TEXT NOT NULL DEFAULT '',
                goal_target REAL NOT NULL DEFAULT 0,
                alerts INTEGER NOT NULL DEFAULT 1,
                onboarded INTEGER NOT NULL DEFAULT 0,
                FOREIGN KEY (user_id) REFERENCES users(id)
            );

            CREATE TABLE IF NOT EXISTS ai_insights (
                content_hash TEXT PRIMARY KEY,
                source TEXT NOT NULL,
                model TEXT NOT NULL,
                summary TEXT NOT NULL,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS receipts (
                content_hash TEXT PRIMARY KEY,
                file_name TEXT NOT NULL,
                merchant TEXT NOT NULL DEFAULT '',
                invoice_number TEXT NOT NULL DEFAULT '',
                bill_date TEXT NOT NULL DEFAULT '',
                category TEXT NOT NULL DEFAULT '',
                tax_amount REAL NOT NULL DEFAULT 0,
                line_items TEXT NOT NULL DEFAULT '[]',
                note TEXT NOT NULL DEFAULT '',
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS ledger_snapshots (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                transaction_count INTEGER NOT NULL,
                payload TEXT NOT NULL,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                client_id TEXT NOT NULL,
                merchant TEXT NOT NULL,
                category TEXT NOT NULL,
                date TEXT NOT NULL,
                time TEXT NOT NULL,
                amount REAL NOT NULL,
                type TEXT NOT NULL,
                payment_method TEXT NOT NULL DEFAULT '',
                FOREIGN KEY (user_id) REFERENCES users(id)
            );
            """
        )
