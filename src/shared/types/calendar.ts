/**
 * Kalender-Event-Typen und Schnittstellen
 */

/**
 * Ein Kalendertermin/Event
 */
export interface CalendarEvent {
  id: string
  title: string
  description?: string
  startTime: Date
  endTime: Date
  isAllDay: boolean
  location?: string
}

/**
 * Konfigurierbare Arbeitszeit-Einstellungen
 */
export interface WorkingHoursConfig {
  /** Startzeitpunkt der Arbeitszeit in HH:mm Format (z.B. "08:00") */
  startTime: string
  /** Endzeitpunkt der Arbeitszeit in HH:mm Format (z.B. "18:00") */
  endTime: string
  /** Array von Arbeitstagen (0 = Sonntag, 1 = Montag, ..., 6 = Samstag) */
  workDays: number[]
}

/**
 * Freier Zeitblock innerhalb der Arbeitszeit
 */
export interface FreeTimeBlock {
  startTime: Date
  endTime: Date
  duration: number // in Minuten
}

/**
 * Statistiken für Termine pro Tag
 */
export interface DayEventStats {
  date: Date
  eventCount: number
  totalDuration: number // in Minuten
}

/**
 * Zusammengefasste Basiskennzahlen
 */
export interface BaseMetrics {
  eventCount: number
  totalMeetingMinutes: number
  averageMeetingDuration: number | null // in Minuten
  freeTimeBlocks: FreeTimeBlock[]
  eventsByDay: DayEventStats[]
}
