import { formatMinutesToHours } from './metrics'
import { getZonedDateParts } from './timeZone'
import type { BaseMetrics } from '../types/calendar'

export type WeekdayChartDatum = {
  weekday: number
  label: string
  shortLabel: string
  eventCount: number
  meetingMinutes: number
  focusMinutes: number
  freeBlockCount: number
  freeBlockMinutes: number
}

const WEEKDAYS = [
  { weekday: 1, label: 'Montag', shortLabel: 'Mo' },
  { weekday: 2, label: 'Dienstag', shortLabel: 'Di' },
  { weekday: 3, label: 'Mittwoch', shortLabel: 'Mi' },
  { weekday: 4, label: 'Donnerstag', shortLabel: 'Do' },
  { weekday: 5, label: 'Freitag', shortLabel: 'Fr' },
  { weekday: 6, label: 'Samstag', shortLabel: 'Sa' },
  { weekday: 0, label: 'Sonntag', shortLabel: 'So' },
] as const

function getWeekday(date: Date): number {
  const { year, month, day } = getZonedDateParts(date)
  return new Date(Date.UTC(year, month - 1, day, 12)).getUTCDay()
}

export function createWeekdayChartData(metrics: BaseMetrics): WeekdayChartDatum[] {
  const data = WEEKDAYS.map((day) => ({
    ...day,
    eventCount: 0,
    meetingMinutes: 0,
    focusMinutes: 0,
    freeBlockCount: 0,
    freeBlockMinutes: 0,
  }))
  const byWeekday = new Map<number, WeekdayChartDatum>(data.map((day) => [day.weekday, day]))

  for (const day of metrics.eventsByDay) {
    const target = byWeekday.get(getWeekday(day.date))
    if (target) {
      target.eventCount += day.eventCount
      target.meetingMinutes += day.totalDuration
    }
  }

  for (const block of metrics.freeTimeBlocks) {
    const target = byWeekday.get(getWeekday(block.startTime))
    if (target) {
      target.freeBlockCount += 1
      target.freeBlockMinutes += block.duration
      target.focusMinutes += block.duration
    }
  }

  return data
}

export function createChartSummary(
  data: WeekdayChartDatum[],
  value: (day: WeekdayChartDatum) => number,
  formatValue: (value: number) => string,
): string {
  return data.map((day) => `${day.label}: ${formatValue(value(day))}`).join('; ')
}

export { formatMinutesToHours }
