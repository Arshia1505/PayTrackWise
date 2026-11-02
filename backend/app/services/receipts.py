import base64
import hashlib
import json
import re
import shutil
import subprocess
from datetime import datetime, timezone
from pathlib import Path

from app.core.db import connect
from app.services.ollama import OLLAMA_MODEL, ask_ollama

RECEIPTS = Path(__file__).resolve().parents[2] / "data" / "receipts"
MONEY = re.compile(
    r"(?:(?:₹|rs\.?|inr)\s*)(\d[\d,]*(?:\.\d{1,2})?)|(\d{1,3}(?:,\d{2,3})+(?:\.\d{1,2})?)|(\d+\.\d{2})"
)
INVOICE_NO = re.compile(r"invoice[ \t]*#[ \t]*:?[ \t]*([A-Z0-9][A-Z0-9\-/]{2,})", re.I)
DATE_LINE = re.compile(r"\bdate\s*:\s*([0-9]{1,2}\s*[A-Za-z]{3,9}\s*[0-9]{2,4}|[0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{2,4})", re.I)


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _decode(image: str) -> bytes:
    payload = image.split(",", 1)[-1].strip()
    return base64.b64decode(payload, validate=False)


def _tesseract() -> str | None:
    found = shutil.which("tesseract")
    if found:
        return found
    for candidate in ("/opt/homebrew/bin/tesseract", "/usr/local/bin/tesseract"):
        if Path(candidate).is_file():
            return candidate
    return None


def _enhance(path: Path) -> Path:
    try:
        from PIL import Image, ImageOps
    except ImportError:
        return path
    try:
        image = Image.open(path).convert("L")
        image = ImageOps.autocontrast(image)
        longest = max(image.size)
        if longest < 1800:
            scale = 1800 / longest
            image = image.resize((int(image.width * scale), int(image.height * scale)))
        out = path.with_name(f"{path.stem}-ocr.png")
        image.save(out)
        return out
    except (OSError, ValueError):
        return path


def _reread_amount(binary: str, image, box: tuple[int, int, int, int]) -> str:
    left, top, width, height = box
    if width < 8 or height < 6:
        return ""
    crop = image.crop((max(0, left - 3), max(0, top - 4), left + width + 8, top + height + 6))
    crop = crop.convert("L").resize((crop.width * 6, crop.height * 6))
    tmp = path_for_crop()
    try:
        crop.save(tmp)
        result = subprocess.run(
            [
                binary,
                str(tmp),
                "stdout",
                "--psm",
                "7",
                "-c",
                "tessedit_char_whitelist=0123456789.",
            ],
            capture_output=True,
            timeout=8,
            check=False,
        )
    except (OSError, subprocess.TimeoutExpired):
        return ""
    finally:
        tmp.unlink(missing_ok=True)
    text = result.stdout.decode(errors="ignore").strip()
    return text if re.fullmatch(r"\d+\.\d{2}", text) else ""


def path_for_crop() -> Path:
    folder = RECEIPTS / "_tmp"
    folder.mkdir(parents=True, exist_ok=True)
    return folder / f"{hashlib.sha256(os_token()).hexdigest()[:12]}.png"


def os_token() -> bytes:
    return datetime.now(timezone.utc).isoformat().encode() + str(id(object())).encode()


def _ocr_layout(binary: str, path: Path) -> str:
    try:
        from PIL import Image
    except ImportError:
        return ""
    try:
        image = Image.open(path).convert("RGB")
        result = subprocess.run(
            [binary, str(path), "stdout", "--psm", "6", "tsv"],
            capture_output=True,
            timeout=25,
            check=False,
        )
    except (OSError, subprocess.TimeoutExpired, ValueError):
        return ""
    rows = result.stdout.decode(errors="ignore").splitlines()
    grouped: dict[tuple[str, str, str, str], list[tuple[int, int, str]]] = {}
    money_word = re.compile(r"\d+\.\d{2}")
    for row in rows[1:]:
        parts = row.split("\t")
        if len(parts) < 12 or parts[0] != "5" or not parts[11].strip():
            continue
        try:
            left, top, width, height = (int(parts[6]), int(parts[7]), int(parts[8]), int(parts[9]))
        except ValueError:
            continue
        token = parts[11].strip()
        if money_word.search(token) and len(token) <= 12:
            fixed = _reread_amount(binary, image, (left, top, width, height))
            if fixed:
                token = fixed
        key = (parts[1], parts[2], parts[3], parts[4])
        grouped.setdefault(key, []).append((top, left, token))
    lines = []
    for words in grouped.values():
        words.sort(key=lambda item: item[1])
        lines.append((min(item[0] for item in words), words[0][1], " ".join(token for _, _, token in words)))
    lines.sort()
    return "\n".join(line for _, _, line in lines).strip()


def _ocr_file(binary: str, path: Path) -> str:
    laid_out = _ocr_layout(binary, path)
    if laid_out:
        return laid_out
    try:
        result = subprocess.run(
            [binary, str(path), "stdout", "--psm", "6"],
            capture_output=True,
            timeout=20,
            check=False,
        )
    except (OSError, subprocess.TimeoutExpired):
        return ""
    return result.stdout.decode(errors="ignore").strip()


def _read_text(path: Path) -> tuple[bool, str]:
    binary = _tesseract()
    if not binary or not path.is_file() or path.suffix.lower() == ".pdf":
        return binary is not None, ""
    plain = _ocr_file(binary, path)
    if _amounts(plain):
        return True, plain
    enhanced = _enhance(path)
    if enhanced == path:
        return True, plain
    boosted = _ocr_file(binary, enhanced)
    if (len(_amounts(boosted)), len(boosted)) > (len(_amounts(plain)), len(plain)):
        return True, boosted
    return True, plain


def _amounts(text: str) -> list[float]:
    found = []
    for groups in MONEY.findall(text):
        raw = next((part for part in groups if part), "")
        try:
            value = float(raw.replace(",", ""))
        except ValueError:
            continue
        if 0 <= value < 10_000_000:
            found.append(value)
    return found


def _render_pdf(pdf_path: Path) -> Path | None:
    preview = pdf_path.with_name(pdf_path.stem + "-page.png")
    tool = shutil.which("qlmanage") or "/usr/bin/qlmanage"
    if not Path(tool).is_file():
        return None
    try:
        subprocess.run(
            [tool, "-t", "-s", "1600", "-o", str(pdf_path.parent), str(pdf_path)],
            capture_output=True,
            timeout=20,
            check=False,
        )
    except (OSError, subprocess.TimeoutExpired):
        return None
    produced = pdf_path.parent / f"{pdf_path.name}.png"
    if not produced.is_file():
        return None
    produced.replace(preview)
    return preview


def _prepare_image(path: Path, raw: bytes) -> Path:
    if raw.startswith(b"%PDF") or path.suffix == ".pdf":
        pdf_path = path.with_suffix(".pdf")
        if pdf_path != path:
            path.replace(pdf_path)
        rendered = _render_pdf(pdf_path)
        return rendered or pdf_path
    if path.suffix in {".img", ".heic", ".heif", ".webp"}:
        png = path.with_suffix(".png")
        sips = shutil.which("sips") or "/usr/bin/sips"
        if Path(sips).is_file():
            try:
                subprocess.run(
                    [sips, "-s", "format", "png", str(path), "--out", str(png)],
                    capture_output=True,
                    timeout=15,
                    check=False,
                )
            except (OSError, subprocess.TimeoutExpired):
                return path
            if png.is_file():
                return png
    return path


def _seen(value: str, text: str) -> bool:
    cleaned = re.sub(r"\s+", " ", value).strip().lower()
    source = re.sub(r"\s+", " ", text).lower()
    if len(cleaned) < 2:
        return False
    return cleaned in source


def _only_from_text(extraction: dict, text: str) -> dict:
    items = []
    for item in extraction.get("lineItems") or []:
        description = str(item.get("description") or "")
        if _seen(description, text):
            items.append(item)
    merchant = str(extraction.get("merchant") or "")
    invoice = str(extraction.get("invoiceNumber") or "")
    dated = str(extraction.get("date") or "")
    return {
        **extraction,
        "merchant": merchant if _seen(merchant, text) else "",
        "invoiceNumber": invoice if _seen(invoice, text) else "",
        "date": dated if _seen(dated, text) else "",
        "category": "",
        "lineItems": items,
    }


def _from_text(text: str) -> dict:
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    items = []
    subtotal = 0.0
    total = 0.0
    tax = 0.0
    pending = ""
    skip_words = ("invoice", "phone", "date", "bill to", "hsn", "upi", "payable", "words", "scan", "thank", "description", "amount")
    for line in lines:
        lowered = line.lower()
        values = _amounts(line)
        if "subtotal" in lowered and values:
            subtotal = values[-1]
            pending = ""
            continue
        if re.search(r"\btotal\b", lowered) and "subtotal" not in lowered and values:
            total = values[-1]
            pending = ""
            continue
        if re.match(r"^(cgst|sgst|igst|gst|tax)\b", lowered) and values:
            tax = values[-1]
            pending = ""
            continue
        if any(word in lowered for word in skip_words):
            pending = ""
            continue
        description = MONEY.sub("", line)
        description = re.sub(r"\b\d{4,}\b", "", description)
        description = re.sub(r"(?:\s+\d{1,3})+\s*$", "", description).strip(" -:|/")
        letters = re.sub(r"[^A-Za-z]", "", description)
        if values and len(letters) >= 3:
            items.append({"description": description[:80], "qty": 1, "amount": values[-1], "confidence": 60})
            pending = ""
        elif values and pending:
            items.append({"description": pending[:80], "qty": 1, "amount": values[-1], "confidence": 60})
            pending = ""
        elif len(letters) >= 3:
            pending = description
    if not items and (subtotal or total):
        items.append(
            {
                "description": "Bill total",
                "qty": 1,
                "amount": subtotal or total,
                "confidence": 60,
            }
        )
    merchant = lines[0] if lines else ""
    merchant = re.sub(r"\binvoice\b", "", merchant, flags=re.I).strip(" -:|")
    invoice = INVOICE_NO.search(text)
    dated = DATE_LINE.search(text)
    return {
        "merchant": merchant[:80],
        "invoiceNumber": (invoice.group(1) if invoice else "")[:40],
        "date": (dated.group(1) if dated else "")[:40],
        "category": "",
        "taxAmount": tax,
        "lineItems": items[:8],
        "note": "",
    }


def _from_ollama(text: str) -> dict | None:
    try:
        raw = ask_ollama(
            text[:1800],
            system=(
                "Turn receipt text into one JSON object with keys "
                "merchant, invoiceNumber, date, category, taxAmount, lineItems. "
                "lineItems is a list of {description, qty, amount}. "
                "Use only words and numbers present in the text. Reply with JSON only."
            ),
            num_predict=180,
            timeout=20,
        )
    except (OSError, TimeoutError, json.JSONDecodeError, RuntimeError, ValueError):
        return None
    start = raw.find("{")
    end = raw.rfind("}")
    if start < 0 or end <= start:
        return None
    try:
        parsed = json.loads(raw[start : end + 1])
    except json.JSONDecodeError:
        return None
    items = []
    for item in parsed.get("lineItems") or []:
        if not isinstance(item, dict):
            continue
        try:
            amount = float(item.get("amount") or 0)
        except (TypeError, ValueError):
            amount = 0
        if amount <= 0:
            continue
        items.append(
            {
                "description": str(item.get("description") or "Item")[:80],
                "qty": 1,
                "amount": amount,
                "confidence": 85,
            }
        )
    return {
        "merchant": str(parsed.get("merchant") or "")[:80],
        "invoiceNumber": str(parsed.get("invoiceNumber") or "")[:40],
        "date": str(parsed.get("date") or "")[:40],
        "category": "",
        "taxAmount": float(parsed.get("taxAmount") or 0),
        "lineItems": items[:6],
        "note": f"Read by Ollama · {OLLAMA_MODEL}",
    }


def _row(digest: str, file_name: str, extraction: dict) -> dict:
    with connect() as conn:
        conn.execute(
            """
            INSERT INTO receipts
            (content_hash, file_name, merchant, invoice_number, bill_date, category, tax_amount, line_items, note, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(content_hash) DO NOTHING
            """,
            (
                digest,
                file_name[:180],
                extraction["merchant"],
                extraction["invoiceNumber"],
                extraction["date"],
                extraction["category"],
                extraction["taxAmount"],
                json.dumps(extraction["lineItems"]),
                extraction["note"],
                _now(),
            ),
        )
    return {"extraction": extraction, "cached": False}


def scan_receipt(file_name: str, image: str) -> dict:
    raw = _decode(image)
    if not raw:
        return {"extraction": _empty("The file was empty."), "cached": False}
    digest = hashlib.sha256(raw).hexdigest()
    RECEIPTS.mkdir(parents=True, exist_ok=True)
    suffix = Path(file_name).suffix.lower()
    if suffix not in {".png", ".jpg", ".jpeg", ".webp", ".tif", ".tiff", ".bmp"}:
        suffix = ".img"
    stored = RECEIPTS / f"{digest[:20]}{suffix}"
    stored.write_bytes(raw)
    image_path = _prepare_image(stored, raw)
    available, text = _read_text(image_path)
    if not text:
        note = (
            "This photo had no readable text. Enter the receipt yourself."
            if available
            else "This photo could not be read. Type the receipt, or install Tesseract on this machine."
        )
        return {"extraction": _empty(note), "text": "", "cached": False}
    extraction = _only_from_text(_from_text(text), text)
    extraction["note"] = "Read from this file."
    saved = _row(digest, file_name, extraction)
    saved["text"] = text
    return saved


def _empty(note: str) -> dict:
    return {
        "merchant": "",
        "invoiceNumber": "",
        "date": "",
        "category": "",
        "taxAmount": 0,
        "lineItems": [],
        "note": note,
    }
