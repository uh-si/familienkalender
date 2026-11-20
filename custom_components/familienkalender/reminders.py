"""Push-Erinnerungen über die notify-Dienste (z. B. Companion-App)."""
from __future__ import annotations

import logging
from datetime import datetime, time, timedelta
from typing import TYPE_CHECKING

from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.event import async_track_time_change
from homeassistant.util import dt as dt_util

from .announce import Announcer
from .const import OPT_ALLDAY_TIME

if TYPE_CHECKING:
    from .data import CalendarData
    from .model import Occurrence

_LOGGER = logging.getLogger(__name__)
LOOKAHEAD = timedelta(days=32)
# Gesprochene Ansagen (kurz, gut vorlesbar)
SPEAK = {
    "de": {"intro": lambda who: f"Erinnerung für {who}" if who else "Erinnerung", "and": " und ",
           "today": "heute", "tomorrow": "morgen", "on": lambda wd, d: f"am {wd}, {d.day}. {MONTHS_DE[d.month - 1]}",
           "at": lambda day, t: f"{day} um {t} Uhr", "age": lambda n: f"wird {n}",
           "wd": ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"]},
    "en": {"intro": lambda who: f"Reminder for {who}" if who else "Reminder", "and": " and ",
           "today": "today", "tomorrow": "tomorrow", "on": lambda wd, d: f"on {wd}, {d.day} {MONTHS_EN[d.month - 1]}",
           "at": lambda day, t: f"{day} at {t}", "age": lambda n: f"turns {n}",
           "wd": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]},
    "hu": {"intro": lambda who: f"Emlékeztető, {who}" if who else "Emlékeztető", "and": " és ",
           "today": "ma", "tomorrow": "holnap", "on": lambda wd, d: f"{MONTHS_HU[d.month - 1]} {_hu_day(d.day)}, {wd}",
           "at": lambda day, t: f"{day} {_hu_time(t)}", "age": lambda n: f"{n} éves lesz",
           "wd": ["hétfőn", "kedden", "szerdán", "csütörtökön", "pénteken", "szombaton", "vasárnap"]},
}
MONTHS_DE = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"]
MONTHS_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
def _hu_day(n: int) -> str:
    """Ungarisches Datum mit richtiger Endung: 1-jén (elsején), 2-án (másodikán), 12-én (tizenkettedikén),
    3-án, 6-án, 8-án, 20-án, 30-án; sonst -én."""
    if n == 1:
        return "1-jén"
    if n == 2 or n in (20, 30) or n % 10 in (3, 6, 8):
        return f"{n}-án"
    return f"{n}-én"


def _hu_time(t: str) -> str:
    """„15:00“ → „15 órakor“, „15:30“ → „15 óra 30 perckor“ (gut vorlesbar)."""
    h, m = (int(x) for x in t.split(":")[:2])
    return f"{h} órakor" if m == 0 else f"{h} óra {m} perckor"


MONTHS_HU_SHORT = ["jan.", "febr.", "márc.", "ápr.", "máj.", "jún.", "júl.", "aug.", "szept.", "okt.", "nov.", "dec."]
MONTHS_HU = ["január", "február", "március", "április", "május", "június", "július", "augusztus", "szeptember", "október", "november", "december"]

TXT = {
    "de": {"wd": ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"], "today": "Heute", "tomorrow": "Morgen",
           "date": lambda w, d: f"{w}, {d:%d.%m.}", "allday": "ganztägig", "time": lambda a, b: f"{a}–{b} Uhr", "for": "Für"},
    "en": {"wd": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"], "today": "Today", "tomorrow": "Tomorrow",
           "date": lambda w, d: f"{w}, {d.day} {d:%b}", "allday": "all day", "time": lambda a, b: f"{a}–{b}", "for": "For"},
    "hu": {"wd": ["hétfő", "kedd", "szerda", "csütörtök", "péntek", "szombat", "vasárnap"], "today": "Ma", "tomorrow": "Holnap",
           "date": lambda w, d: f"{MONTHS_HU_SHORT[d.month - 1]} {d.day}., {w}", "allday": "egész nap", "time": lambda a, b: f"{a}–{b}", "for": "Kinek"},
}


def _allday_time(value: str | None) -> time:
    try:
        h, m = (value or "08:00").split(":")[:2]
        return time(int(h), int(m))
    except ValueError:
        return time(8, 0)


class ReminderService:
    def __init__(self, hass: HomeAssistant, data: CalendarData) -> None:
        self.hass = hass
        self.data = data
        self._last = dt_util.now().replace(second=0, microsecond=0)
        self._unsub = None

    def start(self) -> None:
        self._unsub = async_track_time_change(self.hass, self._tick, second=5)

    def stop(self) -> None:
        if self._unsub:
            self._unsub()
            self._unsub = None

    def _fire_times(self, o: Occurrence, minutes: int) -> datetime:
        tz = self.data.tz
        if o.all_day:
            at = _allday_time(self.data.options.get(OPT_ALLDAY_TIME))
            days = minutes // 1440  # unter 1 Tag = am Tag selbst
            return datetime.combine(o.start - timedelta(days=days), at, tzinfo=tz)  # type: ignore[operator]
        return o.start - timedelta(minutes=minutes)  # type: ignore[operator]

    @callback
    def _tick(self, now: datetime) -> None:
        now = dt_util.as_local(now)
        last, self._last = self._last, now
        if now - last > timedelta(hours=2):
            last = now - timedelta(minutes=2)  # nach langer Pause keine Flut alter Erinnerungen
        due: list[tuple[Occurrence, int]] = []
        for o in self.data.occurrences(last - timedelta(days=1), now + LOOKAHEAD):
            for m in o.event.get("reminders") or []:
                if last < self._fire_times(o, m) <= now:
                    due.append((o, m))
        for o, m in due:
            self.hass.async_create_task(self._send(o, m))

    def _text(self, o: Occurrence, lang: str) -> str:
        t = TXT.get(lang, TXT["de"])
        tz = self.data.tz
        today = dt_util.now().date()
        day = o.day
        if day == today:
            d = t["today"]
        elif day == today + timedelta(days=1):
            d = t["tomorrow"]
        else:
            d = t["date"](t["wd"][day.weekday()], day)
        if o.all_day:
            when = f"{d} ({t['allday']})"
        else:
            s, e = o.start.astimezone(tz), o.end.astimezone(tz)  # type: ignore[union-attr]
            when = f"{d}, " + t["time"](f"{s:%H:%M}", f"{e:%H:%M}")
        names = self.data.user_names(lang)
        who = ", ".join(names.get(u, u) for u in o.event["users"])
        parts = [when, f"{t['for']}: {who}"]
        if o.event.get("location"):
            parts.append(o.event["location"])
        return "\n".join(parts)

    def _speech(self, o: Occurrence, lang: str) -> str:
        """Satz für die Sprachansage, z. B. „Erinnerung für Lena: Zahnarzt, heute um 15:00 Uhr.“"""
        t = SPEAK.get(lang, SPEAK["de"])
        today = dt_util.now().date()
        day = o.day
        if day == today:
            dname = t["today"]
        elif day == today + timedelta(days=1):
            dname = t["tomorrow"]
        else:
            dname = t["on"](t["wd"][day.weekday()], day)
        when = dname if o.all_day else t["at"](dname, f"{o.start.astimezone(self.data.tz):%H:%M}")  # type: ignore[union-attr]
        names = self.data.user_names(lang)
        persons = [names.get(u, u) for u in o.event["users"] if u != "hh"]
        who = t["and"].join(persons) if len(persons) <= 2 else ", ".join(persons[:-1]) + t["and"] + persons[-1]
        title = o.event["title"]
        if o.event.get("birth_year"):
            title += f" – {t['age'](o.day.year - o.event['birth_year'])}"
        return f"{t['intro'](who)}: {title}, {when}."

    async def _announce(self, o: Occurrence) -> None:
        users = [u for u in self.data.users if u["active"] and u["id"] in o.event["users"]
                 and (u.get("speak_media") or u.get("speak_alexa"))]
        if not users:
            return
        texts = {lang: self._speech(o, lang) for lang in {u.get("lang", "de") for u in users} | {"de"}}
        await Announcer(self.hass, self.data.options).async_announce(users, texts)

    async def _send(self, o: Occurrence, minutes: int) -> None:
        # Zusätzlich zur Push-Nachricht: Sprachansage (falls eingerichtet)
        try:
            await self._announce(o)
        except Exception as err:  # noqa: BLE001
            _LOGGER.warning("Familienkalender: Sprachansage fehlgeschlagen: %s", err)
        # Jeder Dienst bekommt die Sprache der jeweiligen Person
        targets: dict[str, str] = {}
        for u in self.data.users:
            if u["active"] and u["id"] in o.event["users"]:
                for svc in u["notify"]:
                    targets.setdefault(svc, u.get("lang", "de"))
        for svc, lang in targets.items():
            domain, _, name = svc.partition(".")
            if domain != "notify" or not name or not self.hass.services.has_service("notify", name):
                _LOGGER.warning("Familienkalender: Benachrichtigungsdienst %s nicht gefunden", svc)
                continue
            try:
                await self.hass.services.async_call("notify", name, {
                    "title": f"📅 {o.event['title']}" + (f" ({o.day.year - o.event['birth_year']})"
                                                          if o.event.get("birth_year") else ""),
                    "message": self._text(o, lang),
                    "data": {"tag": f"familienkalender-{o.key}-{minutes}", "group": "familienkalender"},
                }, blocking=True)
            except Exception as err:  # noqa: BLE001 – ein defekter Dienst darf die anderen nicht stoppen
                _LOGGER.warning("Familienkalender: Senden an %s fehlgeschlagen: %s", svc, err)
