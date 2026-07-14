/**
 * Berechnungslogik für Basiskennzahlen
 */

import type {
  BaseMetrics,
  CalendarEvent,
  DayEventStats,
  FreeTimeBlock,
  WorkingHoursConfig,
} from '../types/calendar'

/**
 * Standard-Arbeitszeit-Konfiguration
 */
export const DEFAULT_WORKING_HOURS: WorkingHoursConfig = {
  startTime: '08:00',
  endTime: '18:00',
  workDays: [1, 2, 3, 4, 5], // Montag bis Freitag
}

/**
 * Hilfsfunktion: Parse Zeitstring (HH:mm) zu Minuten seit Mitternacht
 */
function timeStringToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number)
  return hours * 60 + minutes
}

/**
 * Hilfsfunktion: Minutenwert zu HH:mm String
 * Wird derzeit nicht verwendet, ist aber für zukünftige Erweiterungen reserviert
 */
// function minutesToTimeString(minutes: number): string {
//   const hours = Math.floor(minutes / 60)
//   const mins = minutes % 60
//   return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
// }

/**
 * Hilfsfunktion: Berechne die Dauer eines Events in Minuten
 * Gibt 0 zurück, wenn die Dauer ungültig ist
 */
function getEventDurationMinutes(event: CalendarEvent): number {
  if (event.isAllDay) {
    // Ganztägige Termine werden als ~8 Stunden gerechnet (oder 0, je nach Anforderung)
    // Die Spezifikation sagt: "Ganztägige Termine" sind ein Sonderfall
    // Wir zählen sie als volle 8 Stunden Arbeitszeit
    return 8 * 60
  }

  const duration = event.endTime.getTime() - event.startTime.getTime()
  const minutes = Math.round(duration / 1000 / 60)

  // Ungültige oder negative Dauern zurückweisen
  return minutes > 0 ? minutes : 0
}

/**
 * Berechne die Anzahl der Termine
 */
export function calculateEventCount(events: CalendarEvent[]): number {
  return events.length
}

/**
 * Berechne die Summe aller Meetingminuten
 */
export function calculateTotalMeetingMinutes(events: CalendarEvent[]): number {
  return events.reduce((sum, event) => sum + getEventDurationMinutes(event), 0)
}

/**
 * Berechne die durchschnittliche Termindauer
 * Gibt null zurück, wenn keine Termine vorhanden sind
 */
export function calculateAverageMeetingDuration(events: CalendarEvent[]): number | null {
  if (events.length === 0) {
    return null
  }

  const totalMinutes = calculateTotalMeetingMinutes(events)
  return totalMinutes / events.length
}

/**
 * Prüfe, ob ein Datum ein Arbeitstag ist
 * Wird derzeit nicht verwendet, ist aber für zukünftige Erweiterungen reserviert
 */
// function isWorkDay(date: Date, config: WorkingHoursConfig): boolean {
//   return config.workDays.includes(date.getDay())
// }

/**
 * Prüfe, ob zwei Events sich überschneiden
 * Wird derzeit nicht verwendet, ist aber für zukünftige Erweiterungen reserviert
 */
// function eventsOverlap(event1: CalendarEvent, event2: CalendarEvent): boolean {
//   return event1.startTime < event2.endTime && event1.endTime > event2.startTime
// }

/**
 * Prüfe, ob zwei Events direkt aneinandergrenzend sind (oder sich überschneiden)
 */
function eventsAdjacentOrOverlap(event1: CalendarEvent, event2: CalendarEvent): boolean {
  return event1.startTime <= event2.endTime && event1.endTime >= event2.startTime
}

/**
 * Merge benachbarte oder überlappende Events
 */
function mergeAdjacentEvents(events: CalendarEvent[]): CalendarEvent[] {
  if (events.length === 0) return []

  // Sortiere nach Startzeit
  const sorted = [...events].sort((a, b) => a.startTime.getTime() - b.startTime.getTime())

  const merged: CalendarEvent[] = []

  for (const event of sorted) {
    if (merged.length === 0) {
      merged.push(event)
      continue
    }

    const lastEvent = merged[merged.length - 1]

    if (eventsAdjacentOrOverlap(lastEvent, event)) {
      // Merge mit letztem Event
      merged[merged.length - 1] = {
        ...lastEvent,
        endTime: event.endTime.getTime() > lastEvent.endTime.getTime() ? event.endTime : lastEvent.endTime,
      }
    } else {
      merged.push(event)
    }
  }

  return merged
}

/**
 * Berechne die Dauer eines Zeitblocks in Minuten
 */
function getBlockDurationMinutes(startTime: Date, endTime: Date): number {
  const diffMs = endTime.getTime() - startTime.getTime()
  return Math.max(0, Math.round(diffMs / 1000 / 60))
}

/**
 * Berechne freie Zeitblöcke innerhalb der Arbeitszeit
 */
export function calculateFreeTimeBlocks(
  events: CalendarEvent[],
  startDate: Date,
  endDate: Date,
  config: WorkingHoursConfig = DEFAULT_WORKING_HOURS,
): FreeTimeBlock[] {
  const freeBlocks: FreeTimeBlock[] = []

  // Parse Arbeitszeiten
  const workStartMinutes = timeStringToMinutes(config.startTime)
  const workEndMinutes = timeStringToMinutes(config.endTime)

  // Iteriere über jeden Tag im Bereich
  const currentDate = new Date(startDate)
  currentDate.setHours(0, 0, 0, 0)

  const endDateCopy = new Date(endDate)
  endDateCopy.setHours(23, 59, 59, 999)

  while (currentDate <= endDateCopy) {
    const dayOfWeek = currentDate.getDay()

    // Prüfe ob Arbeitstag
    if (config.workDays.includes(dayOfWeek)) {
      // Filtere Events für diesen Tag und innerhalb/überschneidend mit Arbeitszeit
      const dayStart = new Date(currentDate)
      dayStart.setHours(0, 0, 0, 0)

      const dayEnd = new Date(currentDate)
      dayEnd.setHours(23, 59, 59, 999)

      const workStartTime = new Date(currentDate)
      const startHours = Math.floor(workStartMinutes / 60)
      const startMins = workStartMinutes % 60
      workStartTime.setHours(startHours, startMins, 0, 0)

      const workEndTime = new Date(currentDate)
      const endHours = Math.floor(workEndMinutes / 60)
      const endMins = workEndMinutes % 60
      workEndTime.setHours(endHours, endMins, 0, 0)

      // Filtere Events, die diesen Tag beeinflussen
      const dayEvents = events.filter((event) => {
        // Event-Enddatum ist nach oder gleich Tagesstart
        // Event-Startdatum ist vor oder gleich Tagesende
        return event.endTime > dayStart && event.startTime < dayEnd
      })

      // Merge benachbarte/überlappende Events
      const mergedEvents = mergeAdjacentEvents(dayEvents)

      // Berechne freie Zeitblöcke
      let currentTime = new Date(workStartTime)
      let hasAnyEvent = false

      for (const event of mergedEvents) {
        // Berechne Überschneidung mit Arbeitszeit
        const eventStart = new Date(event.startTime)
        const eventEnd = new Date(event.endTime)

        // Limitiere auf Arbeitszeit
        if (eventStart < workStartTime) {
          eventStart.setTime(workStartTime.getTime())
        }
        if (eventEnd > workEndTime) {
          eventEnd.setTime(workEndTime.getTime())
        }

        // Wenn Event nach Arbeitsstart ist, gibt es einen freien Block davor
        if (eventStart > currentTime) {
          const duration = getBlockDurationMinutes(currentTime, eventStart)
          if (duration > 0) {
            freeBlocks.push({
              startTime: new Date(currentTime),
              endTime: new Date(eventStart),
              duration,
            })
          }
        }

        currentTime = new Date(eventEnd)
        hasAnyEvent = true
      }

      // Freier Block nach letztem Event (bis Arbeitsende)
      if (currentTime < workEndTime) {
        const duration = getBlockDurationMinutes(currentTime, workEndTime)
        if (duration > 0) {
          freeBlocks.push({
            startTime: new Date(currentTime),
            endTime: new Date(workEndTime),
            duration,
          })
        }
      } else if (!hasAnyEvent) {
        // Vollständig freier Arbeitstag (kein Event an diesem Tag)
        const duration = getBlockDurationMinutes(workStartTime, workEndTime)
        if (duration > 0) {
          freeBlocks.push({
            startTime: new Date(workStartTime),
            endTime: new Date(workEndTime),
            duration,
          })
        }
      }
    }

    // Nächster Tag
    currentDate.setDate(currentDate.getDate() + 1)
  }

  return freeBlocks
}

/**
 * Berechne Ereignisse pro Tag
 */
export function calculateEventsByDay(
  events: CalendarEvent[],
  startDate: Date,
  endDate: Date,
): DayEventStats[] {
  const eventsByDate: Map<string, DayEventStats> = new Map()

  // Initialisiere alle Tage im Bereich mit 0 Events
  const currentDate = new Date(startDate)
  currentDate.setHours(0, 0, 0, 0)

  const endDateCopy = new Date(endDate)
  endDateCopy.setHours(23, 59, 59, 999)

  while (currentDate <= endDateCopy) {
    const dateKey = currentDate.toISOString().split('T')[0]
    eventsByDate.set(dateKey, {
      date: new Date(currentDate),
      eventCount: 0,
      totalDuration: 0,
    })
    currentDate.setDate(currentDate.getDate() + 1)
  }

  // Zähle Events pro Tag
  for (const event of events) {
    const dayStart = new Date(event.startTime)
    dayStart.setHours(0, 0, 0, 0)

    const dayEnd = new Date(event.startTime)
    dayEnd.setHours(23, 59, 59, 999)

    const dateKey = dayStart.toISOString().split('T')[0]

    if (eventsByDate.has(dateKey)) {
      const stats = eventsByDate.get(dateKey)!
      stats.eventCount += 1
      stats.totalDuration += getEventDurationMinutes(event)
    } else {
      // Event außerhalb des Bereichs - nur hinzufügen, wenn es innerhalb ist
      if (event.startTime >= dayStart && event.startTime <= dayEnd) {
        eventsByDate.set(dateKey, {
          date: new Date(dayStart),
          eventCount: 1,
          totalDuration: getEventDurationMinutes(event),
        })
      }
    }
  }

  // Sortiere nach Datum und gebe zurück
  return Array.from(eventsByDate.values()).sort((a, b) => a.date.getTime() - b.date.getTime())
}

/**
 * Berechne alle Basiskennzahlen für einen Zeitraum
 */
export function calculateBaseMetrics(
  events: CalendarEvent[],
  startDate: Date,
  endDate: Date,
  workingHoursConfig: WorkingHoursConfig = DEFAULT_WORKING_HOURS,
): BaseMetrics {
  return {
    eventCount: calculateEventCount(events),
    totalMeetingMinutes: calculateTotalMeetingMinutes(events),
    averageMeetingDuration: calculateAverageMeetingDuration(events),
    freeTimeBlocks: calculateFreeTimeBlocks(events, startDate, endDate, workingHoursConfig),
    eventsByDay: calculateEventsByDay(events, startDate, endDate),
  }
}

/**
 * Formatiere Minuten in ein lesbares Format
 * z.B. 90 -> "1h 30m" oder "1,5h"
 */
export function formatMinutesToHours(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes < 0) {
    return '-'
  }

  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60

  if (mins === 0) {
    return `${hours}h`
  }

  return `${hours}h ${mins}m`
}

/**
 * Formatiere Minuten als gerundete Stunden
 * z.B. 90 -> "1,5h"
 */
export function formatMinutesToDecimalHours(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes < 0) {
    return '-'
  }

  const hours = minutes / 60
  return `${hours.toFixed(1)}h`
}
