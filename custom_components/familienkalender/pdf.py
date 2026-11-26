"""Kalenderblätter als PDF: speichern, ausliefern und aufs Handy schicken.

Das PDF entsteht im Browser (Dashboard-Karte). Home Assistant legt es im
Medien-Ordner ab, liefert es über einen zeitlich begrenzten, signierten Link aus
und kann diesen Link per Push an die Handys der Familie schicken.
"""
from __future__ import annotations

import base64
import binascii
import logging
import re
from datetime import datetime, timedelta
from pathlib import Path

from aiohttp import web

from homeassistant.components.http import HomeAssistantView
from homeassistant.components.http.auth import async_sign_path
from homeassistant.core import HomeAssistant
from homeassistant.helpers.network import NoURLAvailableError, get_url

_LOGGER = logging.getLogger(__name__)

PDF_DIR_NAME = "Familienkalender"
PDF_URL = "/api/familienkalender/pdf"
PDF_PREFIX = "Familienkalender_"
PDF_KEEP = 10
MAX_PDF_BYTES = 8 * 1024 * 1024
MAX_PDF_B64 = MAX_PDF_BYTES * 4 // 3 + 8
LINK_VALID = timedelta(hours=24)
NAME_RE = re.compile(r"^Familienkalender_[A-Za-z0-9-]{1,40}_\d{8}-\d{6}(?:-\d{1,2})?\.pdf$")
SLUG_RE = re.compile(r"^[A-Za-z0-9-]{1,40}$")

PUSH_TEXT = {
    "de": ("📄 Kalenderblatt", "{label} – tippe zum Öffnen."),
    "en": ("📄 Calendar sheet", "{label} – tap to open."),
    "hu": ("📄 Naptárlap", "{label} – koppints a megnyitáshoz."),
}


class PdfError(Exception):
    """Fehler mit Code, den die Karte übersetzt."""

    def __init__(self, message: str, code: str) -> None:
        super().__init__(message)
        self.code = code


def pdf_dir(hass: HomeAssistant) -> Path:
    """Ordner im Medienbereich (Home Assistant OS: /media/Familienkalender)."""
    dirs = getattr(hass.config, "media_dirs", None) or {}
    base = dirs.get("local") or next(iter(dirs.values()), None) or hass.config.path("media")
    return Path(base) / PDF_DIR_NAME


def decode_pdf(data: str) -> bytes:
    if len(data) > MAX_PDF_B64:
        raise PdfError("Das PDF ist zu groß.", "pdf_too_big")
    try:
        raw = base64.b64decode(data, validate=True)
    except (binascii.Error, ValueError) as err:
        raise PdfError("Ungültige PDF-Datei.", "pdf_invalid") from err
    if not raw.startswith(b"%PDF-") or len(raw) > MAX_PDF_BYTES:
        raise PdfError("Ungültige PDF-Datei.", "pdf_invalid")
    return raw


def write_pdf(folder: Path, slug: str, raw: bytes, now: datetime, keep: int = PDF_KEEP) -> str:
    """PDF speichern und nur die neuesten `keep` Blätter behalten (läuft im Executor)."""
    if not SLUG_RE.match(slug):
        raise PdfError("Ungültiger Name.", "invalid")
    folder.mkdir(parents=True, exist_ok=True)
    stem = f"{PDF_PREFIX}{slug}_{now:%Y%m%d-%H%M%S}"
    name = f"{stem}.pdf"
    for n in range(2, 100):  # zwei Blätter in derselben Sekunde
        if not (folder / name).exists():
            break
        name = f"{stem}-{n}.pdf"
    path = folder / name
    tmp = path.with_suffix(".tmp")
    tmp.write_bytes(raw)
    tmp.replace(path)
    mine = sorted((p for p in folder.glob(f"{PDF_PREFIX}*.pdf") if NAME_RE.match(p.name)),
                  key=lambda p: (p.stat().st_mtime_ns, p.name), reverse=True)
    for old in mine[keep:]:
        try:
            old.unlink()
        except OSError:
            pass
    return name


def file_exists(folder: Path, name: str) -> bool:
    return bool(NAME_RE.match(name)) and (folder / name).is_file()


def signed_path(hass: HomeAssistant, name: str, refresh_token_id: str | None) -> str:
    return async_sign_path(hass, f"{PDF_URL}/{name}", LINK_VALID, refresh_token_id=refresh_token_id)


def absolute_url(hass: HomeAssistant, path: str) -> str | None:
    """Vollständiger Link fürs Handy – bevorzugt die externe Adresse (auch unterwegs)."""
    try:
        return get_url(hass, prefer_external=True) + path
    except NoURLAvailableError:
        return None


async def async_push(hass: HomeAssistant, services: list[str], lang: str, label: str, path: str) -> int:
    """Link per Push senden. Gibt die Zahl der erfolgreich angesprochenen Dienste zurück."""
    url = absolute_url(hass, path) or path
    title, text = PUSH_TEXT.get(lang, PUSH_TEXT["de"])
    sent = 0
    for svc in services:
        domain, _, name = svc.partition(".")
        if domain != "notify" or not name or not hass.services.has_service("notify", name):
            _LOGGER.warning("Familienkalender: Benachrichtigungsdienst %s nicht gefunden", svc)
            continue
        message = text.format(label=label)
        if not name.startswith("mobile_app_"):
            message += f"\n{url}"  # z. B. Telegram/E-Mail: Link als Text
        try:
            await hass.services.async_call("notify", name, {
                "title": title,
                "message": message,
                "data": {
                    "url": url,            # iOS
                    "clickAction": url,    # Android
                    "tag": "familienkalender-pdf",
                    "group": "familienkalender",
                },
            }, blocking=True)
            sent += 1
        except Exception as err:  # noqa: BLE001 – ein defekter Dienst darf die anderen nicht stoppen
            _LOGGER.warning("Familienkalender: Senden an %s fehlgeschlagen: %s", svc, err)
    return sent


class PdfView(HomeAssistantView):
    """Liefert gespeicherte Kalenderblätter aus (Anmeldung oder signierter Link nötig)."""

    url = PDF_URL + "/{name}"
    name = "api:familienkalender:pdf"
    requires_auth = True

    def __init__(self, hass: HomeAssistant) -> None:
        self.hass = hass

    async def get(self, request, name: str):
        folder = pdf_dir(self.hass)
        if not await self.hass.async_add_executor_job(file_exists, folder, name):
            return web.Response(status=404, text="Not found")
        return web.FileResponse(folder / name, headers={
            "Content-Type": "application/pdf",
            "Content-Disposition": f'inline; filename="{name}"',
            "Cache-Control": "no-store",
        })
