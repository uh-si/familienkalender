"""Konstanten für den Familienkalender."""
from __future__ import annotations

DOMAIN = "familienkalender"
VERSION = "2.0.1"
MAX_USERS = 10

URL_BASE = "/familienkalender_static"
CARD_FILE = "familienkalender-card.js"

STORAGE_KEY_EVENTS = "familienkalender.termine"
STORAGE_VERSION_EVENTS = 1
STORAGE_MINOR_EVENTS = 1
STORAGE_KEY_SCHOOL = "familienkalender.schulferien"

SIGNAL_CHANGED = "familienkalender_changed"

# Optionen
OPT_STATE = "state"
OPT_SHOW_HOLIDAYS = "show_holidays"
OPT_SHOW_SCHOOL = "show_school_holidays"
OPT_ASSUMPTION_BY = "assumption_by"
OPT_USERS = "users"
OPT_PERMISSIONS = "permissions"
OPT_DEFAULT_PERMISSION = "default_permission"
OPT_DEFAULT_REMINDERS = "default_reminders"
OPT_ALLDAY_TIME = "allday_reminder_time"
OPT_KIOSK = "kiosk_users"            # {ha_user_id: True}
OPT_KIOSK_TIMEOUT = "kiosk_timeout"  # Minuten bis zur Rückkehr zu „Heute“
OPT_KIOSK_NIGHT = "kiosk_night"      # nachts abdunkeln
OPT_KIOSK_NIGHT_START = "kiosk_night_start"
OPT_KIOSK_NIGHT_END = "kiosk_night_end"
OPT_KIOSK_SOLID = "kiosk_solid"      # deckende Farben (gegen Grafikfehler mancher Android-Tablets)
OPT_TTS_ENGINE = "tts_engine"         # Sprachausgabe für Lautsprecher-Ansagen
OPT_QUIET_START = "quiet_start"      # Ruhezeit: keine Sprachansagen
OPT_QUIET_END = "quiet_end"
OPT_BACKUP = "ics_backup"            # wöchentliche ICS-Sicherung
OPT_BACKUP_KEEP = "ics_backup_keep"
OPT_TT = "timetable"                 # Stundenplan-Funktion anzeigen
OPT_TT_BLOCKS = "timetable_blocks"   # Schulzeit in Wochen-/Tagesansicht zeigen
OPT_TT_REMIND = "timetable_remind_time"  # Uhrzeit der Erinnerung am Vorabend

HOUSEHOLD_ID = "hh"
HOUSEHOLD_COLOR = "#78909c"
HOUSEHOLD_NAMES = {"de": "Haushalt", "en": "Household", "hu": "Háztartás"}

PERM_READ = "read"
PERM_WRITE = "write"
PERM_FULL = "full"
LANGUAGES = ("de", "hu", "en")

PERMISSION_LABELS = {
    PERM_READ: "Nur lesen",
    PERM_WRITE: "Schreiben (anlegen & bearbeiten)",
    PERM_FULL: "Schreiben + Löschen",
}

DEFAULT_COLORS = [
    "#1e88e5", "#e53980", "#8e44ad", "#f39c12", "#16a085",
    "#e74c3c", "#3949ab", "#6d4c41", "#00acc1", "#7cb342",
]

REMINDER_CHOICES = {
    0: "Zum Beginn / am Tag",
    5: "5 Minuten vorher",
    15: "15 Minuten vorher",
    30: "30 Minuten vorher",
    60: "1 Stunde vorher",
    120: "2 Stunden vorher",
    1440: "1 Tag vorher",
    2880: "2 Tage vorher",
    10080: "1 Woche vorher",
}


def default_users() -> list[dict]:
    users = [
        {"id": f"u{i + 1}", "name": "", "color": DEFAULT_COLORS[i], "active": False, "notify": [], "lang": "de",
         "speak_media": [], "speak_alexa": []}
        for i in range(MAX_USERS)
    ]
    # Platz für Termine ohne bestimmte Person (z. B. Müll, Handwerker)
    users.append({"id": HOUSEHOLD_ID, "name": "", "color": HOUSEHOLD_COLOR, "active": True, "notify": [], "lang": "de",
                  "speak_media": [], "speak_alexa": [], "household": True})
    return users
