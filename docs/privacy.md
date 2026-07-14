# Datenschutz und Privatsphäre

## Ziel

Die Anwendung soll Datenschutz und Transparenz an oberster Stelle behandeln.

## Status

- Grundsätze werden in der ersten Projektphase festgehalten
- Spätere Implementierungen müssen diese Regeln beachten

## Lokale Kalenderverarbeitung

ICS-Inhalte werden als Text im Browser verarbeitet und unmittelbar in das interne Kalendermodell normalisiert. Die Parser- und Normalisierungsschicht benötigt weder Netzwerkzugriff noch eine Cloud- oder Serverkomponente. Kalenderinhalte und Importfehler verlassen den Browser nicht.
