# Changelog / Änderungsprotokoll

## 1.7.1 – 20.11.2026

### Neu
- Übersicht: Mülleimer rechts neben jedem Termin zum direkten Löschen – mit Sicherheitsabfrage (Titel, Datum und Uhrzeit; bei Serien „Nur diesen“ oder „Ganze Serie“) und „Rückgängig“. Nur für Konten mit Löschrecht sichtbar.
- Löschabfrage zeigt jetzt auch Datum und Uhrzeit des Termins.

### Geändert
- README: Installation über „Über Link hinzufügen“ im Marketplace.

## 1.7.0 – 20.11.2026

### Neu
- Bereit für den Home Assistant Marketplace (ab Home Assistant 2026.11): Installation und Updates direkt unter Einstellungen → Marketplace. Quelle: https://github.com/uh-si/familienkalender
- Manifest mit Dokumentation, Fehlermeldungen (Issue-Tracker), Verantwortlichem und Kategorie „Productivity & information → Calendars & todos“.

### Geändert
- Einstellungen → Bundesland: interne Auswahlwerte klein geschrieben (Vorgabe von Home Assistant für Übersetzungen). Gespeicherte Einstellungen bleiben gültig.
- Anleitung (PDF/TXT): Installation, Update und Deinstallation über den Marketplace; der Windows-Installer bleibt als Alternative.

## 1.6.2 – 20.11.2026

### Behoben
- Wandtablet-Modus: Bei ca. 1280 Pixel Breite (z. B. Lenovo Tab M11 quer) wurde der Knopf „Übersicht“ abgeschnitten. Die Uhr bleibt mittig; wird es eng, behalten die Knöpfe ihre volle Breite und die Uhr rückt etwas zur Seite.
- Tablets im Hochformat (normaler Modus): Der Titel schob sich unter die Ansichtsknöpfe. Er wird jetzt notfalls mit „…“ gekürzt, nichts überlappt mehr.

### Geändert
- Kopfzeile passt sich der Breite stufenweise an: „+ Termin“ wird zum runden „+“, Ansichtsknöpfe werden schmaler, der Monat wird abgekürzt („Nov. 2026“).
- Uhr im Wandtablet-Modus: zwischen ca. 1150 und 1500 Pixel Breite kurzes Datum neben der Uhr („Mo, 16. Nov.“), darüber wie bisher das lange Datum.
- Übersicht: Titel ohne Wochentag („16. Nov. 2026 – 15. Feb. 2027“), auf schmaleren Tablets zweizeilig.

## 1.6.1 – 20.11.2026

### Geändert
- Die Startdatei des Installers heißt jetzt „setup.cmd“ (bisher „Installieren.cmd“). Installation, Update und Deinstallation funktionieren unverändert per Doppelklick.
- Anleitung (PDF/TXT) entsprechend angepasst.

## 1.6.0 – 20.11.2026

### Neu
- Terminübersicht: neuer Knopf „Übersicht“ neben Monat/Woche/Tag. Liste aller Termine ab heute, nach Monaten und Tagen gruppiert. Zeitraum wählbar: 1 Monat, 3 Monate (Standard), 6 Monate oder 1 Jahr (maximal); mit ‹ › blättern, „Heute“ springt zurück. Personenfilter gelten, Antippen öffnet den Termin, Schulferien als grüne Zeile.
- Suche: Lupe in der Kopfzeile öffnet ein Suchfeld. Durchsucht Titel, Ort, Notiz und Personennamen, 12 Monate zurück und voraus. Treffer erscheinen beim Tippen (ab 2 Zeichen), getrennt nach kommenden und vergangenen Terminen, mit hervorgehobenem Suchbegriff. Unabhängig von Groß-/Kleinschreibung und Akzenten („fussball“ findet „Fußballtraining“). Serien erscheinen einmal mit dem nächsten Termin. Mehrere Wörter grenzen ein. Schließen mit ✕ oder Esc.
- Smartphone: Übersichts-Titel kompakt auf zwei Zeilen.
- Texte auf Deutsch, Ungarisch und Englisch.
- Anleitung (PDF/TXT): neue Abschnitte „Terminübersicht“ und „Termine suchen“.

## 1.5.0 – 19.11.2026

### Neu
- Mehrere aufeinanderfolgende Tage markieren, um einen mehrtägigen Termin anzulegen: PC: klicken und über die Tage ziehen oder Umschalt + Klick; Tablet/Smartphone: kurz gedrückt halten, dann ziehen (Wischen scrollt weiterhin). Funktioniert in der Monatsansicht (auch Smartphone) und über die Tagesköpfe der Wochenansicht. Anzeige „N Tage markiert ✕“ in der Personenleiste.
- „+ Termin“ übernimmt die Markierung: Formular ganztägig vom ersten bis zum letzten markierten Tag vorausgefüllt. Nach dem Speichern wird die Markierung aufgehoben.
- Texte auf Deutsch, Ungarisch und Englisch. Konten mit „Nur lesen“ markieren nicht.
- Anleitung (PDF/TXT): neuer Abschnitt „Mehrere Tage markieren“.

## 1.4.3 – 17.11.2026
Behoben (Ungarisch vollständig, keine deutschen Reste mehr)
- Kalender-Entitäten in Home Assistant: „Feiertage“, „Schulferien“, „Haushalt“ und der Gerätename werden jetzt übersetzt (Ünnepnapok, Iskolai szünetek, Háztartás, Családi naptár). Maßgeblich ist die Systemsprache von Home Assistant.
- Feiertags- und Ferien-Namen im HA-Kalender werden übersetzt; unbekannte Ferien-Namen der Ferien-Datenquelle erhalten in der Karte einen allgemeinen Namen statt Deutsch.
- Einstellungen: Bundesländer, Sprachnamen, Haushalt-Eintrag, Titel der Integration und Personen-Felder auf Ungarisch (bzw. Englisch).
- Erinnerungen/Sprachansagen auf Ungarisch: richtige Datumsendungen (1-jén, 2-án, 12-én, 18-án …), Uhrzeit gut vorlesbar („15 órakor“), Datum „nov. 20., szombat“.
- Karte: Erinnerungen in der Terminansicht grammatisch korrekt („30 perccel előtte“), Enddatum von Serien („2026. december 31-ig“), ungarische Anführungszeichen „…”, Wortwahl („Duplikálás“), Name in der Kartenauswahl („Családi naptár“).
- ICS-Export: Kalendername in der gewählten Sprache.
- Deutsch: Erinnerungen in der Terminansicht jetzt „zu Beginn, 30 Min. vorher“.

## 1.4.2 – 17.11.2026

### Geändert
- Aussehen wieder wie bis 1.4.0: Die Karte nutzt wieder die Farben des Home-Assistant-Themes einschließlich durchscheinender Hintergründe.
- Die deckende Darstellung aus 1.4.1 ist jetzt ein Schalter: Integration konfigurieren → Wandtablet-Modus → „Deckende Farben (gegen Grafikfehler)“. Standard: aus. Wirkt nur für Konten im Wandtablet-Modus.
- Erhalten bleiben aus 1.4.1: durchgehende Balken für mehrtägige Termine und Ferien, keine Grafikfilter beim Antippen auf Touch-Geräten, filterfreie Nachtabdunklung, Uhr zeichnet nur beim Minutenwechsel neu.

## 1.4.1 – 17.11.2026

### Behoben
- Wandtablets (z. B. Lenovo Tab M11 im Fully Kiosk Browser): hellere Kästchen bzw. Grafikfehler in allen Ansichten. Ursache sind Grafiktreiber mancher Android-Chips (Mali), die halbtransparente Flächen beim teilweisen Neuzeichnen doppelt auftragen. Die Karte rechnet jetzt alle Farben – auch die des Home-Assistant-Themes (Kartenhintergrund, Trennlinien, Zweit-Hintergrund) – beim Laden in deckende Farben um, verzichtet auf Grafikfilter und Deckkraft-Effekte und dunkelt nachts über eine einfache Fläche ab. Die Uhr im Wandtablet-Modus zeichnet nur noch beim Minutenwechsel neu.

### Geändert
- Mehrtägige und ganztägige Termine sowie Ferien werden in Monats- und Wochenansicht als durchgehende Balken über die Woche gezeichnet (statt Stück für Stück pro Tag).
- Anleitung (PDF/TXT): neuer Eintrag zu Grafikfehlern auf Wandtablets.

## 1.4.0 – 16.11.2026

### Neu
- Sprachansagen: Erinnerungen zusätzlich auf Lautsprechern (Mediaplayer, über die Sprachausgabe von Home Assistant) oder auf Alexa ansagen lassen (Integration „Alexa Devices“ mit „… Announce“-Entität sowie „Alexa Media Player“). Geräte pro Person wählbar, Sprache je Person (de/hu/en), einstellbare Ruhezeit, Testansage in den Einstellungen.
- Installer im Windows-11-Stil (abgerundete Ecken, Akzentfarbe, Statuszeile).
- Installer schließt sich nach erfolgreicher Installation, Aktualisierung oder Deinstallation automatisch (Meldung mit „OK“ bestätigen).
- Ausführliche Bedienungsanleitung als PDF (Familienkalender-Anleitung.pdf).
- Dieses Änderungsprotokoll liegt ab jetzt jedem Paket bei.

## 1.3.1 – 16.11.2026

### Neu
- Sprung-Kalender („Heute ▾“): roter Punkt an Tagen mit Terminen.

## 1.3.0 – 16.11.2026

### Neu
- Einzelnen Termin einer Serie ändern („Nur diesen Termin“ / „Ganze Serie“).
- Termine in Wochen-/Tagesansicht per Ziehen verschieben, Dauer am unteren Rand ändern (Raster 15 Minuten; auf Tablet/Handy kurz gedrückt halten).
- „Duplizieren“ im Termin.
- „Rückgängig“ nach Löschen und Verschieben.
- Geburtstage mit Alter (Geburtsjahr bei jährlichen Terminen).
- 🏠 Haushalt für Termine ohne bestimmte Person.
- Wandtablet-Modus pro Home-Assistant-Konto: Uhr und Datum mittig in der Kopfzeile, automatische Rückkehr zu „Heute“, nachts abgedunkelt (nicht auf dem Smartphone).
- Wöchentliche automatische ICS-Sicherung nach /config/familienkalender_backup/ics/.
Verbessert
- „Konfigurationsfehler“ beim Laden des Dashboards wird automatisch behoben.
- Code-Prüfung: Kleinere Fehler behoben (u. a. „Uhr“ bei mehrtägigen Terminen in Englisch/Ungarisch, Serien-Verknüpfung nach Neustart).

## 1.2.0 – 16.11.2026

### Neu
- Klick auf „Heute ▾“ öffnet einen Kalender zum Springen zu einem beliebigen Datum.

## 1.1.3 – 16.11.2026

### Geändert
- Kürzel der Personen mit zwei Buchstaben (z. B. „Pa“, „Ma“).

## 1.1.2 – 16.11.2026

### Behoben
- Karte wurde in der Kartenauswahl teils nicht gefunden: Sie wird jetzt automatisch als Dashboard-Ressource eingetragen.

## 1.1.1 – 16.11.2026

### Behoben
- Installer: Windows-Fehler 1219 („Mehrfache Verbindungen …“) bei bestehender Netzwerkverbindung zu Home Assistant.

## 1.1.0 – 16.11.2026

### Neu
- Dreisprachig: Deutsch, Ungarisch, Englisch – automatisch nach Gerätesprache.
- Karte für vorhandene Dashboards optimiert (eigenes Dashboard nur noch optional).

## 1.0.0 – 16.11.2026
- Erste Version: Monats-/Wochen-/Tagesansicht, bis zu 10 Personen mit Farben, gemeinsame Termine, Wiederholungen, Push-Erinnerungen, Feiertage und Schulferien, ICS-Import/-Export, Berechtigungen pro Konto, Windows-Installer.
