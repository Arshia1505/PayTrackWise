import hashlib
import hmac
import os
import secrets
import time

SECRET = os.environ.get("FINSHIELD_SECRET", "dev-only-change-me")
TOKEN_TTL_SECONDS = 60 * 60 * 24 * 14


def hash_password(password: str, salt: str) -> str:
    return hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 200_000).hex()


def new_salt() -> str:
    return secrets.token_hex(16)


def make_token(user_id: int) -> str:
    expires = int(time.time()) + TOKEN_TTL_SECONDS
    body = f"{user_id}.{expires}"
    signature = hmac.new(SECRET.encode(), body.encode(), hashlib.sha256).hexdigest()
    return f"{body}.{signature}"


def read_user_id(token: str) -> int | None:
    try:
        user_id, expires, signature = token.split(".")
        body = f"{user_id}.{expires}"
        expected = hmac.new(SECRET.encode(), body.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected, signature):
            return None
        if int(expires) < time.time():
            return None
        return int(user_id)
    except (ValueError, TypeError):
        return None
