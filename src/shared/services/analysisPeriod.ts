import type { AnalysisDateRange, AnalysisDateRangeValidation, AnalysisPeriodPreset } from '../types/analysis'
import type { CalendarEvent } from '../types/calendar'
import {
  addCalendarDays,
  addCalendarMonths,
  ANALYSIS_TIME_ZONE,
  getDayBoundaries,
  getLocalDateKey,
} from './timeZone'

export const DEFAULT_ANALYSIS_PERIOD_PRESET: AnalysisPeriodPreset = 'week'

export const ANALYSIS_PERIOD_OPTIONS: ReadonlyArray<{
  value: AnalysisPeriodPreset
  label: string
}> = [
  { value: 'week', label: 'Kommende Woche' },
  { value: 'two-weeks', label: 'Kommende zwei Wochen' },
  { value: 'month', label: 'Kommender Monat' },
  { value: 'three-months', label: 'Kommende drei Monate' },
  { value: 'custom', label: 'Benutzerdefinierter Zeitraum' },
]

function createRange(
  preset: AnalysisPeriodPreset,
  startDateKey: string,
  endDateKey: string,
): AnalysisDateRange {
  return {
    preset,
    startDateKey,
    endDateKey,
    startTime: getDayBoundaries(startDateKey).startTime,
    endTime: getDayBoundaries(endDateKey).endTime,
  }
}

export function createAnalysisDateRange(
  preset: Exclude<AnalysisPeriodPreset, 'custom'>,
  now: Date = new Date(),
): AnalysisDateRange {
  const startDateKey = getLocalDateKey(now)
  switch (preset) {
    case 'week':
      return createRange(preset, startDateKey, addCalendarDays(startDateKey, 6))
    case 'two-weeks':
      return createRange(preset, startDateKey, addCalendarDays(startDateKey, 13))
    case 'month':
      return createRange(preset, startDateKey, addCalendarMonths(startDateKey, 1))
    case 'three-months':
      return createRange(preset, startDateKey, addCalendarMonths(startDateKey, 3))
  }
}

export function createCustomAnalysisDateRange(
  startDateKey: string,
  endDateKey: string,
): AnalysisDateRangeValidation {
  try {
    const start = getDayBoundaries(startDateKey)
    const end = getDayBoundaries(endDateKey)
    if (start.startTime > end.startTime) {
      return { range: null, error: 'Das Enddatum darf nicht vor dem Startdatum liegen.' }
    }
    return { range: createRange('custom', startDateKey, endDateKey), error: null }
  } catch {
    return { range: null, error: 'Bitte wählen Sie ein gültiges Start- und Enddatum.' }
  }
}

export function filterEventsByDateRange(
  events: CalendarEvent[],
  range: AnalysisDateRange,
): CalendarEvent[] {
  return events.flatMap((event) => {
    if (
      !Number.isFinite(event.startTime.getTime()) ||
      !Number.isFinite(event.endTime.getTime()) ||
      event.endTime <= event.startTime ||
      event.endTime <= range.startTime ||
      event.startTime >= range.endTime
    ) {
      return []
    }

    const startTime = new Date(Math.max(event.startTime.getTime(), range.startTime.getTime()))
    const endTime = new Date(Math.min(event.endTime.getTime(), range.endTime.getTime()))
    return [
      {
        ...event,
        startTime,
        endTime,
        durationMinutes: (endTime.getTime() - startTime.getTime()) / 60_000,
      },
    ]
  })
}

export function formatAnalysisDateRange(range: AnalysisDateRange): string {
  const formatter = new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: ANALYSIS_TIME_ZONE,
  })
  return `${formatter.format(range.startTime)} bis ${formatter.format(new Date(range.endTime.getTime() - 1))}`
}
