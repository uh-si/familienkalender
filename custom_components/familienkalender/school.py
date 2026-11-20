"""Schulferien von der OpenHolidays API (openholidaysapi.org) laden und zwischenspeichern.

- Lädt aktuelles Jahr + 2 Folgejahre, täglich aktualisiert.
- Bei Fehlern bleiben die zuletzt geladenen Daten erhalten (offline nutzbar).
"""
from __future__ import annotations

import asyncio
import logging
import re
from datetime import date, timedelta
from typing import Any

import aiohttp

from homeassistant.core import HomeAssistant
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.storage import Store
from homeassistant.util import dt as dt_util

from .const import STORAGE_KEY_SCHOOL

_LOGGER = logging.getLogger(__name__)
API = "https://openholidaysapi.org/SchoolHolidays"
ID_RE = re.compile(r"^[A-Za-z0-9-]{1,64}$")


class SchoolHolidays:
    def __init__(self, hass: HomeAssistant, state: str) -> None:
        self.hass = hass
        self.state = state
        self._store = Store(hass, 1, STORAGE_KEY_SCHOOL, private=True)
        self.items: list[dict[str, str]] = []
        self.last_update: str | None = None

    async def async_load(self) -> None:
        data = await self._store.async_load() or {}
        if data.get("state") == self.state:
            self.items = [i for i in (data.get("items") or []) if self._valid(i)]
            self.last_update = data.get("last_update")

    @staticmethod
    def _valid(i: Any) -> bool:
        try:
            return (isinstance(i, dict) and date.fromisoformat(i["start"]) <= date.fromisoformat(i["end"])
                    and isinstance(i.get("name"), str) and len(i["name"]) <= 100)
        except (KeyError, TypeError, ValueError):
            return False

    async def async_update(self) -> bool:
        """Neu laden. Gibt True zurück, wenn sich etwas geändert hat."""
        session = async_get_clientsession(self.hass)
        year = dt_util.now().year
        found: dict[str, dict[str, str]] = {}
        try:
            for y in (year, year + 1, year + 2):
                params = {
                    "countryIsoCode": "DE",
                    "subdivisionCode": f"DE-{self.state}",
                    "languageIsoCode": "DE",
                    "validFrom": f"{y}-01-01",
                    "validTo": f"{y}-12-31",
                }
                async with asyncio.timeout(20):
                    resp = await session.get(API, params=params, headers={"Accept": "application/json"})
                    resp.raise_for_status()
                    data = await resp.json(content_type=None)
                if not isinstance(data, list):
                    raise ValueError("Unerwartete Antwort")
                for item in data[:200]:
                    parsed = self._parse(item)
                    if parsed:
                        found[parsed["id"]] = parsed
        except (aiohttp.ClientError, TimeoutError, ValueError) as err:
            _LOGGER.info("Schulferien konnten nicht aktualisiert werden (%s) – nutze gespeicherte Daten", err)
            return False

        # Ältere, bereits bekannte Ferien (Vorjahr) behalten
        keep_from = date(year - 1, 1, 1).isoformat()
        old = {i["id"]: i for i in self.items if i["end"] >= keep_from and i["start"] < f"{year}-01-01"}
        merged = {**old, **found}
        new_items = sorted(merged.values(), key=lambda i: i["start"])
        changed = new_items != self.items
        self.items = new_items
        self.last_update = dt_util.utcnow().isoformat(timespec="seconds")
        await self._store.async_save({"state": self.state, "items": self.items, "last_update": self.last_update})
        return changed

    def _parse(self, item: Any) -> dict[str, str] | None:
        try:
            names = item.get("name") or []
            name = next((n["text"] for n in names if n.get("language") == "DE"), names[0]["text"] if names else "Ferien")
            parsed = {
                "id": str(item["id"]),
                "start": date.fromisoformat(item["startDate"][:10]).isoformat(),
                "end": date.fromisoformat(item["endDate"][:10]).isoformat(),
                "name": str(name).strip()[:100] or "Ferien",
            }
        except (KeyError, TypeError, ValueError, IndexError, AttributeError):
            return None
        if not ID_RE.match(parsed["id"]) or not self._valid(parsed):
            return None
        return parsed

    def between(self, start: date, end: date) -> list[dict[str, str]]:
        """Ferien, die [start, end) berühren (Ende inklusive)."""
        s, e = start.isoformat(), (end - timedelta(days=1)).isoformat()
        return [{"start": i["start"], "end": i["end"], "name": i["name"]} for i in self.items
                if i["start"] <= e and i["end"] >= s]
