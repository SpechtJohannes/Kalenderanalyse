# Produktvision

## Vision

Kalenderanalyse hilft Menschen, die Struktur ihres eigenen Arbeitskalenders zu verstehen und bewusst zu verbessern. Die Anwendung macht sichtbar, wie viel Zeit durch Termine gebunden ist, wie sich diese Belastung über Tage verteilt und wo zusammenhängende freie Zeit für konzentriertes Arbeiten verbleibt.

Die Ergebnisse sollen nachvollziehbare Hinweise liefern, keine Bewertung der Arbeitsleistung. Nutzende entscheiden selbst, welche Termine notwendig sind und welche Veränderungen zu ihrer Arbeitssituation passen.

## Ausgangssituation

Arbeitskalender enthalten viele einzelne Termine, lassen aber wichtige Zusammenhänge nur schwer erkennen. Eine hohe Meetingdauer, ungünstig verteilte Termine, Überschneidungen oder kurze Lücken können Fokuszeit einschränken, ohne in der üblichen Kalenderansicht deutlich zu werden.

Kalenderanalyse bereitet exportierte Kalenderdaten deshalb so auf, dass zeitliche Belastungen und wiederkehrende Muster verständlich werden. Auffälligkeiten sollen auf konkrete Termine und Zeiträume zurückführbar sein.

## Zielgruppe

Das Produkt richtet sich in erster Linie an Einzelpersonen, die ihren eigenen Arbeitskalender analysieren möchten. Dazu gehören insbesondere:

- Wissensarbeiterinnen und Wissensarbeiter
- Entwicklerinnen und Entwickler
- Scrum Master und agile Coaches
- Führungskräfte
- Projektverantwortliche
- Menschen mit einem hohen Anteil an Besprechungen

Kalenderanalyse ist kein Administrations- oder Überwachungswerkzeug für Unternehmen. Die betrachtete Person behält die Kontrolle über Auswahl, Verarbeitung und Interpretation ihrer Kalenderdaten.

## Ziele und Nutzen

Kalenderanalyse soll Nutzenden ermöglichen:

- ihre gesamte Meetingbelastung und die durchschnittliche Termindauer zu erkennen,
- die Verteilung von Terminen und Meetingzeit über den Analysezeitraum zu verstehen,
- zusammenhängende freie Zeitblöcke und verfügbare Fokuszeit sichtbar zu machen,
- Überschneidungen, ungünstige Zeitlagen und weitere belastende Muster zu erkennen,
- auffällige Ergebnisse auf konkrete Termine und Tage zurückzuführen und
- auf dieser Grundlage eigene, informierte Entscheidungen über die Kalendergestaltung zu treffen.

Das Produkt unterstützt Reflexion und Veränderung. Es vergibt keine Leistungsnote und leitet aus Kalenderdaten keine Aussage über Produktivität, Engagement oder den Wert einzelner Personen ab.

## Produktumfang als Zielbild

Der langfristige Produktumfang kann folgende Fähigkeiten umfassen:

- eine oder mehrere ICS-Dateien lokal einlesen,
- Kalenderdaten in ein einheitliches internes Modell überführen,
- einen Analysezeitraum auswählen,
- verständlich definierte Basiskennzahlen berechnen,
- auffällige Termine und problematische zeitliche Strukturen erkennen,
- Ergebnisse mit Kennzahlen, Listen und geeigneten Diagrammen darstellen,
- Ergebnisse bis zu den relevanten Terminen und Berechnungsschritten nachvollziehbar machen und
- Entwicklung und Tests ausschließlich mit synthetischen Kalenderdaten ermöglichen.

Diese Punkte beschreiben die langfristige Ausrichtung und sind keine Zusage, dass jede Funktion bereits verfügbar ist oder in einer bestimmten Reihenfolge umgesetzt wird.

## Aktueller Stand

Die Anwendung verfügt bereits über technische Grundlagen zum Parsen und Normalisieren von ICS-Daten, zur Auswahl eines Analysezeitraums und zur Berechnung von Basiskennzahlen. Einzelne Abläufe in der Oberfläche, weitergehende Analysen von Problemmustern und umfassende Visualisierungen befinden sich noch im Aufbau oder sind als spätere Erweiterungen vorgesehen.

Die Dokumentation des Zielbilds soll Entscheidungen für diese Erweiterungen lenken, ohne den aktuellen Implementierungsstand größer darzustellen, als er ist.

## Nicht-Ziele

Kalenderanalyse ist ausdrücklich:

- kein vollständiger Kalender und kein Kalendereditor,
- kein Ersatz für Outlook, Google Calendar oder vergleichbare Kalenderprodukte,
- kein Dienst mit verpflichtender Cloud- oder Serververarbeitung,
- kein Werkzeug zur Leistungsbewertung von Mitarbeitenden,
- kein Instrument zur Überwachung von Teams oder Einzelpersonen,
- keine medizinische oder psychologische Bewertung,
- keine Instanz, die abschließend über notwendige oder unnötige Termine urteilt,
- keine unternehmensweite Kalender- oder Administrationsplattform,
- kein dauerhaftes Archiv realer Kalenderdaten und
- kein Grund, reale Kalenderdaten in Entwicklung oder automatisierten Tests zu verwenden.

## Produktprinzipien

1. **Nachvollziehbarkeit:** Kennzahlen und Auffälligkeiten müssen auf verständliche Definitionen und konkrete Kalenderdaten zurückführbar sein.
2. **Erklärung vor Bewertung:** Das Produkt erklärt, was erkannt wurde und wie ein Ergebnis zustande kommt.
3. **Unterstützung statt Vorgabe:** Hinweise unterstützen die persönliche Einordnung, ersetzen sie aber nicht.
4. **Konkreter Bezug:** Auffällige Muster sollen mit den betroffenen Terminen oder Zeiträumen verknüpft werden.
5. **Datenschutz vor Bequemlichkeit:** Eine bequemere Funktion rechtfertigt nicht automatisch die Weitergabe sensibler Kalenderdaten.
6. **Verständlichkeit vor Kennzahlenmenge:** Wenige klar definierte Aussagen sind wertvoller als viele schwer interpretierbare Werte.
7. **Ehrlicher Funktionsumfang:** Zielbild, aktueller Stand und geplante Erweiterungen werden klar voneinander unterschieden.

## Architekturprinzipien

Die technische Entwicklung folgt diesen Leitlinien:

1. Kalenderdaten werden lokal im Browser verarbeitet.
2. Es werden nur die für Import und Analyse erforderlichen Daten verarbeitet.
3. Import, Normalisierung, Analyse und Darstellung bleiben voneinander getrennt.
4. Analysen arbeiten auf einem einheitlichen internen Kalendermodell.
5. Fachlogik bleibt unabhängig von der konkret eingesetzten ICS-Bibliothek.
6. Berechnungen werden möglichst als reine, deterministische und automatisiert testbare Funktionen umgesetzt.
7. Datums-, Zeitzonen- und Zeitraumregeln werden ausdrücklich definiert und zentral angewendet.
8. Abhängigkeiten zwischen Modulen bleiben klar und gerichtet.
9. Oberflächenkomponenten bleiben klein, verständlich und möglichst wiederverwendbar.
10. Neue Analysearten lassen sich ergänzen, ohne bestehende Berechnungen mehrfach zu implementieren.
11. Entwicklung und Tests verwenden synthetische Daten und sind ohne reale Kalenderdaten ausführbar.
12. Zusätzliche Infrastruktur, Abhängigkeiten und Komplexität werden nur eingeführt, wenn sie einen klaren Produktnutzen haben.

Details zur aktuellen technischen Struktur stehen in der [Architekturdokumentation](architecture.md).

## Datenschutz und lokale Verarbeitung

Kalenderdaten können vertrauliche Informationen über Personen, Projekte, Kunden und Arbeitsweisen enthalten. Deshalb ist lokale Verarbeitung ein grundlegendes Produktversprechen:

- Es ist kein Benutzerkonto erforderlich.
- Kalenderdateien müssen nicht auf einen externen Server hochgeladen werden.
- Die Analyse findet im Browser auf dem Gerät der nutzenden Person statt.
- Reale Kalenderdaten werden nicht als Entwicklungs- oder Testdaten vorausgesetzt.

Künftige Funktionen dürfen dieses Prinzip nicht stillschweigend aufheben. Sollte eine optionale externe Verarbeitung jemals erwogen werden, müsste sie klar erkennbar, freiwillig, begründet und getrennt von der lokal nutzbaren Kernfunktion sein.

Weitere Festlegungen enthält die [Datenschutzdokumentation](privacy.md).

## Langfristige Orientierung

Die Produktentwicklung priorisiert zunächst eine verlässliche Datenbasis und verständliche Kennzahlen. Darauf können nachvollziehbare Hinweise zu auffälligen Terminen und Kalenderstrukturen sowie geeignete Darstellungen aufbauen. Erweiterungen werden daran gemessen, ob sie Einzelpersonen einen konkreten Erkenntnisgewinn bieten, ohne Datenschutz, Nachvollziehbarkeit oder lokale Nutzbarkeit zu schwächen.

Bei Zielkonflikten gelten folgende Prioritäten:

1. Schutz und Kontrolle der Kalenderdaten
2. fachlich korrekte und nachvollziehbare Ergebnisse
3. verständliche Bedienung und Darstellung
4. Umfang zusätzlicher Funktionen

## Erfolgskriterien

Die Produktvision ist erreicht, wenn Nutzende:

- Kalenderdaten ohne verpflichtende externe Übertragung analysieren können,
- die Definition und Herkunft der angezeigten Kennzahlen verstehen,
- Meetingbelastung, Verteilung und freie Zeit im gewählten Zeitraum erkennen,
- auffällige Ergebnisse mit konkreten Terminen oder Zeiträumen in Verbindung bringen können,
- aus den Ergebnissen eigene Handlungsoptionen ableiten können und
- darauf vertrauen können, dass das Produkt keine Leistungsbewertung oder verdeckte Überwachung durchführt.
