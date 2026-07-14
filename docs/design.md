# Design

## Ziel

Dieses Dokument sammelt die Grundprinzipien für UI, Struktur und Nutzerführung.

## Status

- Layout und Komponentenstruktur werden schrittweise definiert
- Fokus liegt auf Klarheit und Wartbarkeit

## Analyse-Dashboard

Basiskennzahlen werden als ruhige, nicht interaktive Karten mit klarer Bezeichnung, hervorgehobenem Wert und kurzer Einordnung dargestellt. Karten verwenden ausschließlich zentrale Farben, Abstände, Rundungen und Schatten. Farbe unterstützt die Hierarchie, trägt aber keine Information allein.

Das Kennzahlengrid besitzt auf Smartphones eine, auf mittleren Bildschirmen zwei und ab großen Bildschirmen vier Spalten. Beschriftungen dürfen umbrechen; feste Kartenbreiten und horizontaler Seitenlauf werden vermieden. Karten einer Reihe haben eine konsistente Mindesthöhe.

„Termine pro Tag“ bleibt wegen seines mehrteiligen fachlichen Inhalts eine breite Dashboard-Karte mit Datum, Terminanzahl und Meetingzeit. Auf kleinen Bildschirmen werden Tabellenzeilen als beschriftete Blöcke dargestellt, damit kein horizontales Scrollen erforderlich ist.

Die dauerhafte visuelle Referenz ist [dashboard light reference.png](dashboard%20light%20reference.png). Sie dient als Orientierung für Hierarchie und Kartenraster, nicht als Vorgabe für noch nicht implementierte Kennzahlen.
