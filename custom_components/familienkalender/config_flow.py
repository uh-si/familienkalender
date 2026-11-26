"""Einrichtung und Einstellungen des Familienkalenders."""
from __future__ import annotations

from typing import Any

import voluptuous as vol

from homeassistant.config_entries import ConfigEntry, ConfigFlow, ConfigFlowResult, OptionsFlow
from homeassistant.core import callback
from homeassistant.helpers import selector as sel

from .const import (
    DEFAULT_COLORS,
    DOMAIN,
    LANGUAGES,
    MAX_USERS,
    OPT_ALLDAY_TIME,
    OPT_BACKUP,
    OPT_BACKUP_KEEP,
    OPT_KIOSK,
    OPT_KIOSK_NIGHT,
    OPT_KIOSK_NIGHT_END,
    OPT_KIOSK_NIGHT_START,
    OPT_KIOSK_SOLID,
    OPT_KIOSK_TIMEOUT,
    OPT_ASSUMPTION_BY,
    OPT_DEFAULT_PERMISSION,
    OPT_DEFAULT_REMINDERS,
    OPT_PERMISSIONS,
    OPT_QUIET_END,
    OPT_QUIET_START,
    OPT_TTS_ENGINE,
    OPT_SHOW_HOLIDAYS,
    OPT_SHOW_SCHOOL,
    OPT_STATE,
    OPT_TT,
    OPT_TT_BLOCKS,
    OPT_TT_REMIND,
    OPT_USERS,
    PERM_WRITE,
    PERMISSION_LABELS,
    REMINDER_CHOICES,
)
from .announce import Announcer
from .data import normalize_users
from .holidays_de import STATES
from .i18n import CALENDAR_NAME


def _state_selector() -> sel.SelectSelector:
    return sel.SelectSelector(sel.SelectSelectorConfig(
        # Werte klein (Übersetzungsschlüssel erlauben nur a-z/0-9), gespeichert wird groß („BY“)
        options=[sel.SelectOptionDict(value=k.lower(), label=v) for k, v in sorted(STATES.items(), key=lambda x: x[1])],
        translation_key="state", mode=sel.SelectSelectorMode.DROPDOWN,
    ))


def _reminder_selector() -> sel.SelectSelector:
    return sel.SelectSelector(sel.SelectSelectorConfig(
        options=[str(k) for k in REMINDER_CHOICES], translation_key="reminder",
        multiple=True, mode=sel.SelectSelectorMode.LIST,
    ))


def _hex_to_rgb(h: str) -> list[int]:
    h = h.lstrip("#")
    return [int(h[i:i + 2], 16) for i in (0, 2, 4)]


def _rgb_to_hex(rgb: Any) -> str:
    try:
        r, g, b = (max(0, min(255, int(x))) for x in rgb)
        return f"#{r:02x}{g:02x}{b:02x}"
    except (TypeError, ValueError):
        return DEFAULT_COLORS[0]


class FamilienkalenderConfigFlow(ConfigFlow, domain=DOMAIN):
    VERSION = 1
    MINOR_VERSION = 1

    def __init__(self) -> None:
        self._opts: dict[str, Any] = {}

    @staticmethod
    @callback
    def async_get_options_flow(config_entry: ConfigEntry) -> OptionsFlow:
        return FamilienkalenderOptionsFlow()

    async def async_step_user(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        if user_input is not None:
            self._opts = {
                OPT_STATE: str(user_input[OPT_STATE]).upper(),
                OPT_SHOW_HOLIDAYS: user_input[OPT_SHOW_HOLIDAYS],
                OPT_SHOW_SCHOOL: user_input[OPT_SHOW_SCHOOL],
                OPT_ASSUMPTION_BY: True,
            }
            return await self.async_step_personen()
        return self.async_show_form(step_id="user", data_schema=vol.Schema({
            vol.Required(OPT_STATE, default="by"): _state_selector(),
            vol.Required(OPT_SHOW_HOLIDAYS, default=True): sel.BooleanSelector(),
            vol.Required(OPT_SHOW_SCHOOL, default=True): sel.BooleanSelector(),
        }))

    async def async_step_personen(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        errors: dict[str, str] = {}
        if user_input is not None:
            names = [str(user_input.get(f"name_{i + 1}") or "").strip() for i in range(MAX_USERS)]
            if not any(names):
                errors["base"] = "keine_person"
            else:
                users = normalize_users([
                    {"id": f"u{i + 1}", "name": n, "color": DEFAULT_COLORS[i], "active": bool(n)}
                    for i, n in enumerate(names)
                ] + [{"id": "hh", "active": True}])
                opts = {**self._opts, OPT_USERS: users, OPT_PERMISSIONS: {}, OPT_DEFAULT_PERMISSION: PERM_WRITE,
                        OPT_DEFAULT_REMINDERS: [30], OPT_ALLDAY_TIME: "08:00"}
                return self.async_create_entry(title=CALENDAR_NAME.get((self.hass.config.language or "de")[:2], CALENDAR_NAME["de"]),
                                              data={}, options=opts)
        schema = {vol.Optional(f"name_{i + 1}"): sel.TextSelector() for i in range(MAX_USERS)}
        return self.async_show_form(step_id="personen", data_schema=vol.Schema(schema), errors=errors)


class FamilienkalenderOptionsFlow(OptionsFlow):
    def __init__(self) -> None:
        self._slot: str | None = None

    @property
    def _o(self) -> dict[str, Any]:
        return dict(self.config_entry.options)

    async def async_step_init(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        return self.async_show_menu(step_id="init",
                                    menu_options=["personen", "berechtigungen", "stundenplan", "wandtablet", "feiertage", "erinnerungen",
                                                  "sprachansage", "sicherung"])

    # ----------------------------------------------------- Personen
    async def async_step_personen(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        users = normalize_users(self._o.get(OPT_USERS))
        if user_input is not None:
            slot = user_input["slot"]
            self._slot = "hh" if slot.startswith("hh") else slot
            return await self.async_step_person()
        # Beschriftung: ✓ = aktiv, ✗ = inaktiv, — = frei. Der Haushalt ohne eigenen Namen wird über
        # die Übersetzung beschriftet (Werte „hh_on“/„hh_off“ → „🏠 Háztartás ✓“ usw.).
        options = []
        for i, u in enumerate(users):
            mark = "✓" if u["active"] else "✗"
            if u.get("household"):
                value = "hh_named" if u["name"] else ("hh_on" if u["active"] else "hh_off")
                options.append(sel.SelectOptionDict(value=value, label=f"🏠 {u['name'] or 'Haushalt'} {mark}"))
            else:
                options.append(sel.SelectOptionDict(value=u["id"], label=f"{i + 1} · " + (f"{u['name']} {mark}" if u["name"] else "—")))
        return self.async_show_form(step_id="personen", data_schema=vol.Schema({
            vol.Required("slot"): sel.SelectSelector(sel.SelectSelectorConfig(
                options=options, translation_key="slot", mode=sel.SelectSelectorMode.LIST)),
        }))

    async def async_step_person(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        users = normalize_users(self._o.get(OPT_USERS))
        u = next(x for x in users if x["id"] == self._slot)
        errors: dict[str, str] = {}
        if user_input is not None:
            name = str(user_input.get("name") or "").strip()
            active = bool(user_input.get("active"))
            if active and not name and not u.get("household"):
                errors["name"] = "name_fehlt"
            else:
                u.update({"name": name, "color": _rgb_to_hex(user_input.get("color")), "active": active,
                          "notify": list(user_input.get("notify") or []), "lang": user_input.get("lang", "de"),
                          "speak_media": list(user_input.get("speak_media") or []),
                          "speak_alexa": list(user_input.get("speak_alexa") or [])})
                return self.async_create_entry(data={**self._o, OPT_USERS: normalize_users(users)})
        notify = sorted(f"notify.{s}" for s in self.hass.services.async_services_for_domain("notify")
                        if s not in ("send_message", "persistent_notification"))
        # Alexa-Ziele: Notify-Entitäten der Integration „Alexa Devices“ (…_announce zuerst)
        # sowie Dienste der Community-Integration „Alexa Media Player“ (notify.alexa_media_…)
        ents = sorted(st.entity_id for st in self.hass.states.async_all("notify"))
        alexa = [e for e in ents if e.endswith("_announce")] + [e for e in ents if not e.endswith("_announce")]
        alexa += [n for n in notify if n.startswith("notify.alexa_media")]
        alexa = list(dict.fromkeys(alexa + list(u.get("speak_alexa", []))))
        return self.async_show_form(step_id="person", data_schema=vol.Schema({
            vol.Optional("name", description={"suggested_value": u["name"]}): sel.TextSelector(),
            vol.Required("color", default=_hex_to_rgb(u["color"])): sel.ColorRGBSelector(),
            vol.Required("active", default=u["active"] or not u["name"]): sel.BooleanSelector(),
            vol.Optional("notify", default=[n for n in u["notify"] if n in notify] or []): sel.SelectSelector(
                sel.SelectSelectorConfig(options=notify, multiple=True, custom_value=True,
                                         mode=sel.SelectSelectorMode.DROPDOWN)),
            vol.Required("lang", default=u.get("lang", "de")): sel.SelectSelector(sel.SelectSelectorConfig(
                options=list(LANGUAGES), translation_key="language", mode=sel.SelectSelectorMode.DROPDOWN)),
            vol.Optional("speak_media", default=u.get("speak_media", [])): sel.EntitySelector(
                sel.EntitySelectorConfig(domain="media_player", multiple=True)),
            vol.Optional("speak_alexa", default=[a for a in u.get("speak_alexa", []) if a in alexa] or []): sel.SelectSelector(
                sel.SelectSelectorConfig(options=alexa, multiple=True, custom_value=True, mode=sel.SelectSelectorMode.DROPDOWN)),
        }), errors=errors, description_placeholders={"slot": "🏠" if u.get("household") else self._slot[1:]})

    # ----------------------------------------------------- Wandtablet-Modus
    async def async_step_wandtablet(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        accounts = [u for u in await self.hass.auth.async_get_users() if not u.system_generated and u.is_active]
        keys: dict[str, str] = {}
        for acc in sorted(accounts, key=lambda a: (a.name or "").lower()):
            label = acc.name or acc.id[:8]
            while label in keys or label in ("kiosk_timeout", "kiosk_night", "kiosk_night_start", "kiosk_night_end"):
                label += " "
            keys[label] = acc.id
        o = self._o
        current = o.get(OPT_KIOSK) or {}
        if user_input is not None:
            return self.async_create_entry(data={
                **o,
                OPT_KIOSK: {uid: True for label, uid in keys.items() if user_input.get(label)},
                OPT_KIOSK_TIMEOUT: int(user_input.get(OPT_KIOSK_TIMEOUT, 5)),
                OPT_KIOSK_NIGHT: bool(user_input.get(OPT_KIOSK_NIGHT)),
                OPT_KIOSK_NIGHT_START: str(user_input.get(OPT_KIOSK_NIGHT_START) or "22:00")[:5],
                OPT_KIOSK_NIGHT_END: str(user_input.get(OPT_KIOSK_NIGHT_END) or "06:00")[:5],
                OPT_KIOSK_SOLID: bool(user_input.get(OPT_KIOSK_SOLID)),
            })
        schema: dict = {}
        for label, uid in keys.items():
            schema[vol.Required(label, default=bool(current.get(uid)))] = sel.BooleanSelector()
        schema[vol.Required(OPT_KIOSK_TIMEOUT, default=int(o.get(OPT_KIOSK_TIMEOUT, 5)))] = sel.NumberSelector(
            sel.NumberSelectorConfig(min=1, max=60, step=1, mode=sel.NumberSelectorMode.BOX, unit_of_measurement="min"))
        schema[vol.Required(OPT_KIOSK_NIGHT, default=bool(o.get(OPT_KIOSK_NIGHT, True)))] = sel.BooleanSelector()
        schema[vol.Required(OPT_KIOSK_NIGHT_START, default=(o.get(OPT_KIOSK_NIGHT_START, "22:00") + ":00")[:8])] = sel.TimeSelector()
        schema[vol.Required(OPT_KIOSK_NIGHT_END, default=(o.get(OPT_KIOSK_NIGHT_END, "06:00") + ":00")[:8])] = sel.TimeSelector()
        schema[vol.Required(OPT_KIOSK_SOLID, default=bool(o.get(OPT_KIOSK_SOLID, False)))] = sel.BooleanSelector()
        return self.async_show_form(step_id="wandtablet", data_schema=vol.Schema(schema))

    # ----------------------------------------------------- Sprachansage
    async def async_step_sprachansage(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        o = self._o
        if user_input is not None:
            new = {**o, OPT_TTS_ENGINE: user_input.get(OPT_TTS_ENGINE) or None,
                   OPT_QUIET_START: str(user_input.get(OPT_QUIET_START) or "21:00")[:5],
                   OPT_QUIET_END: str(user_input.get(OPT_QUIET_END) or "07:00")[:5]}
            if user_input.get("test"):
                # Testansage an alle eingerichteten Lautsprecher/Echos (ohne Ruhezeit)
                users = [u for u in normalize_users(o.get(OPT_USERS)) if u["active"]]
                texts = {"de": "Das ist eine Testansage vom Familienkalender.",
                         "en": "This is a test announcement from the family calendar.",
                         "hu": "Ez a családi naptár próbabejelentése."}
                self.hass.async_create_task(Announcer(self.hass, new).async_announce(users, texts, respect_quiet=False))
            return self.async_create_entry(data=new)
        schema: dict = {}
        schema[vol.Optional(OPT_TTS_ENGINE, description={"suggested_value": o.get(OPT_TTS_ENGINE)})] = sel.EntitySelector(
            sel.EntitySelectorConfig(domain="tts"))
        schema[vol.Required(OPT_QUIET_START, default=(o.get(OPT_QUIET_START, "21:00") + ":00")[:8])] = sel.TimeSelector()
        schema[vol.Required(OPT_QUIET_END, default=(o.get(OPT_QUIET_END, "07:00") + ":00")[:8])] = sel.TimeSelector()
        schema[vol.Optional("test", default=False)] = sel.BooleanSelector()
        return self.async_show_form(step_id="sprachansage", data_schema=vol.Schema(schema))

    # ----------------------------------------------------- ICS-Sicherung
    async def async_step_sicherung(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        o = self._o
        if user_input is not None:
            return self.async_create_entry(data={**o, OPT_BACKUP: bool(user_input.get(OPT_BACKUP)),
                                                 OPT_BACKUP_KEEP: int(user_input.get(OPT_BACKUP_KEEP, 8))})
        return self.async_show_form(step_id="sicherung", data_schema=vol.Schema({
            vol.Required(OPT_BACKUP, default=bool(o.get(OPT_BACKUP, True))): sel.BooleanSelector(),
            vol.Required(OPT_BACKUP_KEEP, default=int(o.get(OPT_BACKUP_KEEP, 8))): sel.NumberSelector(
                sel.NumberSelectorConfig(min=1, max=52, step=1, mode=sel.NumberSelectorMode.BOX)),
        }))

    # ----------------------------------------------------- Berechtigungen
    async def async_step_berechtigungen(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        accounts = [u for u in await self.hass.auth.async_get_users()
                    if not u.system_generated and u.is_active and not u.is_admin]
        # Feldnamen = Anzeigename (eindeutig gemacht)
        keys: dict[str, str] = {}
        for acc in sorted(accounts, key=lambda a: (a.name or "").lower()):
            label = acc.name or acc.id[:8]
            while label in keys:
                label += " "
            keys[label] = acc.id
        perms = dict(self._o.get(OPT_PERMISSIONS) or {})
        default = self._o.get(OPT_DEFAULT_PERMISSION, PERM_WRITE)
        if user_input is not None:
            new = {uid: user_input[label] for label, uid in keys.items() if label in user_input}
            return self.async_create_entry(data={**self._o, OPT_PERMISSIONS: new,
                                                 OPT_DEFAULT_PERMISSION: user_input[OPT_DEFAULT_PERMISSION]})
        level = sel.SelectSelector(sel.SelectSelectorConfig(
            options=list(PERMISSION_LABELS), translation_key="permission",
            mode=sel.SelectSelectorMode.DROPDOWN))
        schema: dict = {vol.Required(OPT_DEFAULT_PERMISSION, default=default): level}
        for label, uid in keys.items():
            schema[vol.Required(label, default=perms.get(uid, default))] = level
        return self.async_show_form(step_id="berechtigungen", data_schema=vol.Schema(schema),
                                    description_placeholders={"count": str(len(keys))})

    # ----------------------------------------------------- Feiertage
    async def async_step_feiertage(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        o = self._o
        if user_input is not None:
            return self.async_create_entry(data={**o, **user_input, OPT_STATE: str(user_input[OPT_STATE]).upper()})
        return self.async_show_form(step_id="feiertage", data_schema=vol.Schema({
            vol.Required(OPT_STATE, default=str(o.get(OPT_STATE, "BY")).lower()): _state_selector(),
            vol.Required(OPT_SHOW_HOLIDAYS, default=o.get(OPT_SHOW_HOLIDAYS, True)): sel.BooleanSelector(),
            vol.Required(OPT_SHOW_SCHOOL, default=o.get(OPT_SHOW_SCHOOL, True)): sel.BooleanSelector(),
            vol.Required(OPT_ASSUMPTION_BY, default=o.get(OPT_ASSUMPTION_BY, True)): sel.BooleanSelector(),
        }))

    # ----------------------------------------------------- Erinnerungen
    async def async_step_erinnerungen(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        o = self._o
        if user_input is not None:
            return self.async_create_entry(data={
                **o,
                OPT_DEFAULT_REMINDERS: sorted(int(x) for x in user_input.get(OPT_DEFAULT_REMINDERS) or []),
                OPT_ALLDAY_TIME: str(user_input.get(OPT_ALLDAY_TIME) or "08:00")[:5],
            })
        return self.async_show_form(step_id="erinnerungen", data_schema=vol.Schema({
            vol.Optional(OPT_DEFAULT_REMINDERS, default=[str(x) for x in o.get(OPT_DEFAULT_REMINDERS, [30])]):
                _reminder_selector(),
            vol.Required(OPT_ALLDAY_TIME, default=(o.get(OPT_ALLDAY_TIME, "08:00") + ":00")[:8]): sel.TimeSelector(),
        }))

    # ----------------------------------------------------- Stundenplan
    async def async_step_stundenplan(self, user_input: dict[str, Any] | None = None) -> ConfigFlowResult:
        o = self._o
        if user_input is not None:
            return self.async_create_entry(data={
                **o,
                OPT_TT: bool(user_input.get(OPT_TT)),
                OPT_TT_BLOCKS: bool(user_input.get(OPT_TT_BLOCKS)),
                OPT_TT_REMIND: str(user_input.get(OPT_TT_REMIND) or "19:00")[:5],
            })
        return self.async_show_form(step_id="stundenplan", data_schema=vol.Schema({
            vol.Required(OPT_TT, default=bool(o.get(OPT_TT, True))): sel.BooleanSelector(),
            vol.Required(OPT_TT_BLOCKS, default=bool(o.get(OPT_TT_BLOCKS, True))): sel.BooleanSelector(),
            vol.Required(OPT_TT_REMIND, default=(o.get(OPT_TT_REMIND, "19:00") + ":00")[:8]): sel.TimeSelector(),
        }))
