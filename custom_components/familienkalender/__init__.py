"""Familienkalender – eigenständiger Kalender für die ganze Familie."""
from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import timedelta
from pathlib import Path

from homeassistant.components.frontend import add_extra_js_url
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import Platform
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers import config_validation as cv
from homeassistant.helpers.dispatcher import async_dispatcher_send
from homeassistant.helpers.event import async_track_time_interval
from homeassistant.helpers.start import async_at_started
from homeassistant.helpers.typing import ConfigType

from .backup import IcsBackup
from .const import CARD_FILE, DOMAIN, OPT_BACKUP, OPT_BACKUP_KEEP, OPT_SHOW_SCHOOL, OPT_STATE, SIGNAL_CHANGED, URL_BASE, VERSION
from .data import CalendarData
from .pdf import PdfView
from .reminders import ReminderService
from .school import SchoolHolidays
from .websocket import async_register

_LOGGER = logging.getLogger(__name__)
PLATFORMS = [Platform.CALENDAR]
CONFIG_SCHEMA = cv.config_entry_only_config_schema(DOMAIN)


@dataclass
class Runtime:
    data: CalendarData
    school: SchoolHolidays
    reminders: ReminderService
    backup: IcsBackup


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Karte ausliefern und WebSocket-Befehle registrieren (einmal pro Start)."""
    await hass.http.async_register_static_paths([
        StaticPathConfig(URL_BASE, str(Path(__file__).parent / "frontend"), False)
    ])
    add_extra_js_url(hass, f"{URL_BASE}/{CARD_FILE}?v={VERSION}")
    async_register(hass)
    hass.http.register_view(PdfView(hass))
    return True


def _resources(hass: HomeAssistant):
    """Ressourcen-Sammlung der Dashboards (nur im UI-Modus vorhanden)."""
    ll = hass.data.get("lovelace")
    res = ll.get("resources") if isinstance(ll, dict) else getattr(ll, "resources", None)
    return res if res is not None and hasattr(res, "async_create_item") else None


async def _async_register_resource(hass: HomeAssistant) -> None:
    """Karte als Dashboard-Ressource eintragen bzw. auf die aktuelle Version bringen.

    So taucht sie zuverlässig in der Kartenauswahl jedes Dashboards auf.
    """
    url = f"{URL_BASE}/{CARD_FILE}?v={VERSION}"
    try:
        res = _resources(hass)
        if res is None:
            _LOGGER.info("Dashboards im YAML-Modus: Ressource ggf. manuell eintragen: %s (Typ: module)", url)
            return
        if not getattr(res, "loaded", True):
            await res.async_load()
            res.loaded = True
        mine = [i for i in res.async_items() if str(i.get("url", "")).split("?")[0] == url.split("?")[0]]
        if not mine:
            await res.async_create_item({"res_type": "module", "url": url})
            _LOGGER.info("Familienkalender-Karte als Dashboard-Ressource eingetragen")
        else:
            if mine[0].get("url") != url:
                await res.async_update_item(mine[0]["id"], {"res_type": "module", "url": url})
            for extra in mine[1:]:
                await res.async_delete_item(extra["id"])
    except Exception as err:  # noqa: BLE001 – darf den Start nie verhindern
        _LOGGER.warning("Familienkalender: Dashboard-Ressource konnte nicht eingetragen werden: %s", err)


async def _async_remove_resource(hass: HomeAssistant) -> None:
    try:
        res = _resources(hass)
        if res is None:
            return
        if not getattr(res, "loaded", True):
            await res.async_load()
            res.loaded = True
        for item in list(res.async_items()):
            if str(item.get("url", "")).startswith(URL_BASE + "/"):
                await res.async_delete_item(item["id"])
    except Exception as err:  # noqa: BLE001
        _LOGGER.warning("Familienkalender: Dashboard-Ressource konnte nicht entfernt werden: %s", err)


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    # Erst eintragen, wenn Home Assistant vollständig gestartet ist (Dashboards sind dann bereit)
    async def _register_when_started(_hass: HomeAssistant) -> None:
        await _async_register_resource(hass)

    entry.async_on_unload(async_at_started(hass, _register_when_started))
    data = CalendarData(hass, dict(entry.options))
    await data.async_load()

    school = SchoolHolidays(hass, entry.options.get(OPT_STATE, "BY"))
    await school.async_load()

    reminders = ReminderService(hass, data)
    backup = IcsBackup(hass, data, entry.options.get(OPT_BACKUP_KEEP, 8))
    entry.runtime_data = Runtime(data, school, reminders, backup)

    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    reminders.start()
    entry.async_on_unload(reminders.stop)
    if entry.options.get(OPT_BACKUP, True):
        backup.start()
        entry.async_on_unload(backup.stop)

    async def _update_school(_now=None) -> None:
        if entry.options.get(OPT_SHOW_SCHOOL, True) and await school.async_update():
            async_dispatcher_send(hass, SIGNAL_CHANGED, {"changed": True})

    # Im Hintergrund laden, damit der Start nicht vom Internet abhängt
    entry.async_create_background_task(hass, _update_school(), "familienkalender_schulferien")
    entry.async_on_unload(async_track_time_interval(hass, _update_school, timedelta(hours=24)))
    entry.async_on_unload(entry.add_update_listener(_options_updated))

    # Offene Karten neu laden lassen (z. B. nach Änderung der Personen)
    async_dispatcher_send(hass, SIGNAL_CHANGED, {"config_changed": True})
    return True


async def _options_updated(hass: HomeAssistant, entry: ConfigEntry) -> None:
    await hass.config_entries.async_reload(entry.entry_id)


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    ok = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    if ok:
        await entry.runtime_data.data.async_flush()
    return ok


async def async_remove_entry(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Beim Entfernen bleiben die Termine absichtlich erhalten.

    So gehen bei einer Neuinstallation keine Daten verloren. Vollständiges
    Löschen erledigt der Installer (Deinstallieren → „Termine löschen“) oder
    man löscht /config/.storage/familienkalender.* von Hand.
    """
    await _async_remove_resource(hass)
    _LOGGER.info("Familienkalender entfernt – Termine bleiben in .storage erhalten")
