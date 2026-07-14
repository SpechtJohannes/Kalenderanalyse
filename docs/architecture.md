# Architektur

## Aktuelle Entscheidung

Die Anwendung basiert auf einer einfachen React- und Vite-Struktur. Für die erste Projektphase wird die Basis bewusst schlank gehalten und um Test- und Qualitätswerkzeuge erweitert.

## Status

- Basisarchitektur vorhanden
- Test- und CI-Integration ist eingerichtet
- Basiskennzahlen-Berechnungen implementiert

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

- **calendar.ts** – CalendarEvent, WorkingHoursConfig, BaseMetrics und verwandte Typen

### Features

Feature-Module für die Anwendung:

- **analysis** – Analysefunktionalität, nutzt MetricsDisplay zur Darstellung
- **calendar** – Kalender-Integration (geplant)
- **insights** – Weitere Analysen und Empfehlungen (geplant)

## Basiskennzahlen

### Definition

1. **Anzahl Termine** – Gesamtzahl aller Termine im Analysezeitraum
2. **Meetingstunden** – Summe aller Termindauern in Minuten (intern), formatiert als Stunden
3. **Durchschnittliche Meetingdauer** – (Gesamt-Meetingminuten / Anzahl Termine); null wenn keine Termine
4. **Freie Zeitblöcke** – Kontinuierliche freie Zeit zwischen/um Termine innerhalb der Arbeitszeit
5. **Termine pro Tag** – Anzahl und Gesamtdauer der Termine pro Kalendertag

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
- **Ganztägige Termine**: Werden als 8 Stunden Arbeitszeit gezählt
- **Termine über Mitternacht**: Werden auf den Starttag begrenzt
- **Überschneidende Termine**: Werden vor Berechnung zusammengeführt
- **Direkt aneinandergrenzende Termine**: Werden als ein Block behandelt
- **Termine außerhalb Arbeitszeit**: Beeinflussen freie Zeitblöcke nicht
- **Negative oder ungültige Dauern**: Werden als 0 Minuten behandelt

