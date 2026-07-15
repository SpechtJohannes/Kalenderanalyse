# Scoring-Modell

## Ziel

Dieses Dokument beschreibt die erste Idee für ein Bewertungssystem zur Einschätzung von Kalendermustern.

## Status

Die erste deterministische Terminbewertung ist implementiert. Sie verwendet ausschließlich
Informationen, die zuverlässig im internen Kalendermodell vorhanden sind. Der Score ist ein
nachvollziehbarer Hinweis auf auffällige Kalendereigenschaften und keine Bewertung der
Arbeitsleistung oder der Notwendigkeit eines Termins.

## Umgesetzte Regeln

| Regel                     | Schwellenwert                                                                             | Punkte |
| ------------------------- | ----------------------------------------------------------------------------------------- | -----: |
| Fehlende Agenda           | Beschreibung ist `null`, leer oder enthält nur Leerzeichen                                |     10 |
| Sehr langer Termin        | Dauer ist mindestens 120 Minuten                                                          |     20 |
| Außerhalb der Arbeitszeit | Termin liegt ganz oder teilweise außerhalb 08:00–18:00 Uhr oder an einem Nicht-Arbeitstag |     15 |
| Terminüberschneidung      | Start liegt vor dem Ende eines anderen Termins im Analysezeitraum                         |     25 |

Als Arbeitstage gelten entsprechend der zentralen Standardkonfiguration Montag bis Freitag. Ein
Termin, der exakt um 08:00 Uhr beginnt oder exakt um 18:00 Uhr endet, liegt innerhalb der
Arbeitszeit. Mehrtägige Termine gelten als teilweise außerhalb der täglichen Arbeitszeit.

## Gesamtscore und Begründungen

Alle Punkte der zutreffenden Regeln werden addiert. Der Gesamtscore ist daher immer größer oder
gleich null. Jede zutreffende Regel erzeugt eine eigene verständliche Begründung mit ihrem
Punkteanteil. Ein unauffälliger Termin erhält Score `0` und keine Begründung.

Die Funktion für problematische Termine filtert Ergebnisse mit Score `0` heraus. Die übrigen
Termine werden sortiert nach:

1. Score absteigend,
2. Beginn aufsteigend,
3. Titel alphabetisch (`de`) als letzter stabiler Vergleich.

Überschneidungen werden nach einer Sortierung der Termine über das jeweils am weitesten reichende
Ende erkannt. Eingaben werden weder sortiert noch anderweitig verändert.

## Noch nicht umgesetzte Regeln

Sehr viele Teilnehmende, Mittagspausen, dichte Folgen kurzer Termine und sehr kurze Pausen sind
noch nicht bewertet. Dafür fehlen bislang verbindliche Schwellenwerte beziehungsweise eine zentrale
Pausenzeit-Konfiguration. Diese Regeln werden erst ergänzt, wenn ihre fachliche Definition eindeutig
festgelegt ist.
