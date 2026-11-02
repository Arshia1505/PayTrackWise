import hashlib
import json
import os
import urllib.error
import urllib.request
from datetime import datetime, timezone

from app.core.db import connect

OLLAMA_HOST = os.environ.get("OLLAMA_HOST", "http://127.0.0.1:11434").rstrip("/")
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "llama3:8b")


def content_hash(prompt: str) -> str:
    return hashlib.sha256(prompt.encode()).hexdigest()


def bullets_from_text(text: str) -> list[str]:
    lines = []
    for raw in text.splitlines():
        cleaned = raw.strip().lstrip("-*•").strip()
        if len(cleaned) > 2 and cleaned[:2].rstrip(".").isdigit():
            cleaned = cleaned.split(".", 1)[-1].strip()
        cleaned = cleaned.strip("`").strip()
        if cleaned:
            lines.append(cleaned[:400])
    return lines[:4]


def ask_ollama(prompt: str, system: str | None = None, num_predict: int = 220, timeout: int = 120) -> str:
    payload = json.dumps(
        {
            "model": OLLAMA_MODEL,
            "stream": False,
            "messages": [
                {
                    "role": "system",
                    "content": system
                    or (
                        "You explain a personal bank statement in plain English. "
                        "Reply with exactly 3 short bullets, one per line. "
                        "No title, no markdown, no advice that requires a bank login."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            "options": {"temperature": 0.2, "num_predict": num_predict},
        }
    ).encode()
    request = urllib.request.Request(
        f"{OLLAMA_HOST}/api/chat",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=timeout) as response:
        data = json.loads(response.read().decode())
    message = data.get("message") or {}
    return str(message.get("content") or "").strip()


def _read_cached(digest: str) -> dict | None:
    with connect() as conn:
        row = conn.execute(
            "SELECT source, model, summary FROM ai_insights WHERE content_hash = ?",
            (digest,),
        ).fetchone()
    if row is None:
        return None
    try:
        summary = json.loads(row["summary"])
    except json.JSONDecodeError:
        summary = []
    if not isinstance(summary, list) or not summary:
        return None
    return {"source": row["source"], "model": row["model"], "summary": [str(item) for item in summary[:4]]}


def _write_insight(digest: str, source: str, model: str, summary: list[str], replace: bool) -> None:
    now = datetime.now(timezone.utc).isoformat()
    payload = json.dumps(summary)
    with connect() as conn:
        if replace:
            conn.execute(
                """
                INSERT INTO ai_insights (content_hash, source, model, summary, created_at)
                VALUES (?, ?, ?, ?, ?)
                ON CONFLICT(content_hash) DO UPDATE SET
                    source = excluded.source,
                    model = excluded.model,
                    summary = excluded.summary,
                    created_at = excluded.created_at
                """,
                (digest, source, model, payload, now),
            )
            return
        conn.execute(
            """
            INSERT INTO ai_insights (content_hash, source, model, summary, created_at)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(content_hash) DO NOTHING
            """,
            (digest, source, model, payload, now),
        )


def summarize(prompt: str, fallback: list[str]) -> dict:
    digest = content_hash(prompt)
    clean_fallback = [item.strip()[:400] for item in fallback if item and item.strip()][:4]
    try:
        completion = ask_ollama(prompt)
        summary = bullets_from_text(completion)
        if not summary:
            raise RuntimeError("Ollama returned an empty summary")
        _write_insight(digest, "ollama", OLLAMA_MODEL, summary, replace=True)
        return {"mode": "ollama", "model": OLLAMA_MODEL, "summary": summary, "cached": False}
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError, RuntimeError, OSError):
        cached = _read_cached(digest)
        if cached:
            return {
                "mode": "sqlite",
                "model": cached["model"],
                "summary": cached["summary"],
                "cached": True,
            }
        summary = clean_fallback or ["No statement summary is available yet."]
        _write_insight(digest, "sqlite", "sqlite", summary, replace=False)
        return {"mode": "sqlite", "model": "sqlite", "summary": summary, "cached": False}
