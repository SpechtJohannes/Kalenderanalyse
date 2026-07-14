# Architektur

## Aktuelle Entscheidung

Die Anwendung basiert auf einer einfachen React- und Vite-Struktur. Für die erste Projektphase wird die Basis bewusst schlank gehalten und um Test- und Qualitätswerkzeuge erweitert.

## Status

- Basisarchitektur vorhanden
- Test- und CI-Integration ist eingerichtet
- Basiskennzahlen-Berechnungen implementiert
- Bibliotheksunabhängiges Kalendermodell und ICS-Normalisierung implementiert

## Schichten

### Shared Components

Wiederverwendbare UI-Komponenten:

- **SectionCard** – Einfache Darstellung von Feature-Übersichten
- **AppShell** – Layout-Komponente für die Anwendung
- **MetricsDisplay** – Darstellung von Basiskennzahlen mit Kennzahlenkarten und Tabelle

### Shared Services

Geschäftslogik und Berechnungen:

- **metrics** – Berechnung aller Basiskennzahlen:
  - Anzahl Termine
  - Meetingstunden (Summe aller Termindauern)
  - Durchschnittliche Meetingdauer
  - Freie Zeitblöcke (mit Zusammenführung überlappender/benachbarter Termine)
  - Termine pro Tag

### Shared Types

Zentrale Typendefinitionen:

- **calendar.ts** – Zentrales, bibliotheksunabhängiges `CalendarEvent`-Modell sowie WorkingHoursConfig, BaseMetrics und verwandte Typen

### Features

Feature-Module für die Anwendung:

- **analysis** – Analysefunktionalität, nutzt MetricsDisplay zur Darstellung
- **calendar** – Kalender-Integration (geplant)
- **insights** – Weitere Analysen und Empfehlungen (geplant)

## Basiskennzahlen

### Definition

1. **Anzahl Termine** – Anzahl aller gültigen Termine, die den inklusiven Analysezeitraum berühren
2. **Meetingstunden** – Summe der einzelnen Termindauern innerhalb des Analysezeitraums in Minuten (intern), formatiert als Stunden. Überschneidende Termine werden hier einzeln gezählt.
3. **Durchschnittliche Meetingdauer** – Gesamt-Meetingminuten geteilt durch die Anzahl gültiger Termine; `null`, wenn keine gültigen Termine vorhanden sind
4. **Freie Zeitblöcke** – Kontinuierliche freie Zeit zwischen/um Termine innerhalb der Arbeitszeit
5. **Termine pro Tag** – Anzahl und anteilige Dauer der Termine pro lokalem Kalendertag. Alle Tage im Analysezeitraum werden ausgegeben, auch wenn ihre Anzahl null ist. Mehrtägige Termine zählen an jedem berührten Tag.

### Arbeitszeit-Konfiguration

Standardwerte (konfigurierbar):

- Arbeitsbeginn: 08:00 Uhr
- Arbeitsende: 18:00 Uhr
- Arbeitstage: Montag bis Freitag

### Berechnung der freien Zeitblöcke

1. Iteriere über jeden Tag im Analysezeitraum
2. Für Arbeitstage: Filtere Events des Tages
3. Beschneide Events auf Arbeitszeiten (außerhalb ignoriert)
4. Merge benachbarte und überlappende Events
5. Berechne Lücken zwischen Events innerhalb der Arbeitszeit
6. Ein vollständig freier Arbeitstag zählt als ein Zeitblock

### Sonderfälle

- **Keine Termine**: Vollständiger Tag als freier Block, Durchschnitt = null
- **Ganztägige Termine**: Ihre tatsächliche Start-/Enddauer fließt in Meetingstunden ein; bei freien Blöcken belegen sie nur die überschneidende Arbeitszeit
- **Termine über Mitternacht**: Werden pro berührtem Kalendertag betrachtet
- **Überschneidende Termine**: Werden nur für die belegte Arbeitszeit zusammengeführt; Anzahl und Meetingstunden bleiben terminbezogen
- **Direkt aneinandergrenzende Termine**: Werden als ein Block behandelt
- **Termine außerhalb Arbeitszeit**: Beeinflussen freie Zeitblöcke nicht
- **Negative, leere oder ungültige Dauern**: Werden vollständig aus den Kennzahlen ausgeschlossen
- **Zeitzonen und Sommerzeit**: `Date`-Zeitpunkte werden als absolute Zeitpunkte ausgewertet; Kalendertage und Arbeitszeiten werden ausdrücklich in der zentralen Analysezeitzone `Europe/Berlin` gebildet

## Kalenderimport und Normalisierung

### Internes Terminmodell

Alle Funktionen außerhalb der Importgrenze arbeiten ausschließlich mit `CalendarEvent` aus `src/shared/types/calendar.ts`. Ein normalisierter Termin enthält eine stabile ID, Titel, Beschreibung, Ort, Start, Ende, Dauer in Minuten, Ganztagskennzeichnung, Status, Organisator und Teilnehmende. Optionale Text- und Personenwerte werden einheitlich mit `null` dargestellt; Teilnehmende sind immer ein Array. Das Modell exportiert keine Rohstrukturen oder Typen eines ICS-Parsers.

### Verantwortlichkeiten und Datenfluss

```text
lokale ICS-Datei
  → Einlesen als Text im Browser
  → ICS-Syntax parsen (`icsParser`)
  → Rohtermine zentral normalisieren
  → `CalendarImportResult` mit `CalendarEvent[]` und Importhinweisen
  → Analysen und Darstellung verwenden ausschließlich `CalendarEvent`
```

Das Einlesen einer lokalen Datei ist von der Formatverarbeitung getrennt. `parseIcs` erhält nur den bereits gelesenen Text. Parserinterne Properties und Parameter bleiben innerhalb von `icsParser.ts`. Fehlerhafte Einträge werden ausgeschlossen und als strukturierte `CalendarImportIssue` gemeldet.

Da vor diesem Issue keine ICS-Bibliothek oder bestehende Parserschicht vorhanden war, wird keine zusätzliche Laufzeitabhängigkeit eingeführt. Wiederholungsregeln werden derzeit nicht expandiert; bereits als einzelne `VEVENT`-Blöcke vorhandene Instanzen werden jeweils normalisiert.

### Datum, Uhrzeit und Zeitzonen

- UTC-Werte mit `Z` werden direkt als absolute `Date`-Zeitpunkte gespeichert.
- Werte mit `TZID` werden über die IANA-Zeitzonenunterstützung von `Intl.DateTimeFormat` in absolute Zeitpunkte überführt. Die jeweilige Sommerzeitregel bleibt dadurch erhalten.
- „Floating“-Zeitpunkte ohne UTC-Kennung oder `TZID` werden in der Analysezeitzone `Europe/Berlin` interpretiert.
- Ganztägige `VALUE=DATE`-Werte werden an Tagesgrenzen der Analysezeitzone erzeugt; das in ICS exklusive Enddatum bleibt erhalten.
- Ungültige Datumswerte, fehlende Grenzen und nicht positive Dauern werden verworfen und gemeldet.
- Doppelte UIDs erhalten in Eingabereihenfolge stabile Suffixe wie `#2`, damit keine Termine überschrieben werden.

Die Funktionen in `shared/services/timeZone.ts` kapseln Datumsschlüssel, zonierte Tages- und Arbeitszeitgrenzen sowie Intervallüberschneidungen. Dadurch hängt die fachliche Zuordnung nicht von der Prozesszeitzone des Browsers, Entwicklungsrechners oder CI-Runners ab. Sommer- und Winterzeit werden über die IANA-Regeln von `Intl.DateTimeFormat` berücksichtigt.

## Analysezeitraum

### Modell und Presets

`AnalysisDateRange` beschreibt den ausgewählten Zeitraum durch das Preset, inklusive Start- und Endtag als `YYYY-MM-DD` sowie absolute Grenzen. `startTime` ist der Beginn des Starttags; `endTime` ist die exklusive Grenze am Beginn des Folgetags. Beide Grenzen werden in `Europe/Berlin` erzeugt.

Die zentralen Funktionen in `shared/services/analysisPeriod.ts` definieren folgende Presets, jeweils einschließlich des aktuellen Berliner Kalendertags:

- **Kommende Woche:** aktueller Tag plus sechs weitere Kalendertage, insgesamt sieben Tage
- **Kommende zwei Wochen:** aktueller Tag plus dreizehn weitere Kalendertage, insgesamt vierzehn Tage
- **Kommender Monat:** bis zum korrespondierenden Tag des Folgemonats
- **Kommende drei Monate:** bis zum korrespondierenden Tag drei Monate später
- **Benutzerdefiniert:** frei gewählter Start- und Endtag einschließlich beider Tage

Existiert der korrespondierende Tag im Zielmonat nicht, wird dessen letzter gültiger Tag verwendet. Ein benutzerdefiniertes Enddatum vor dem Startdatum ist ungültig.

### Datenfluss und Grenzen

```text
Auswahl in AnalysisFeature
  → AnalysisDateRange
  → Termine auf [startTime, endTime) filtern und begrenzen
  → calculateBaseMetricsForRange
  → MetricsDisplay
```

Ein Termin wird berücksichtigt, wenn er den halb-offenen absoluten Zeitraum `[startTime, endTime)` überschneidet. Überragende Teile werden vor zeitbasierten Kennzahlen abgeschnitten. Ein Termin, der exakt an `startTime` endet oder exakt an `endTime` beginnt, liegt außerhalb. Die Auswahl wird im Zustand der Analysekomponente gehalten und bleibt deshalb erhalten, wenn sich die übergebenen Importdaten ändern; eine dauerhafte Speicherung über einen Neustart erfolgt nicht.

