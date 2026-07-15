import { describe, expect, it } from 'vitest'
import type { BaseMetrics } from '../types/calendar'
import { zonedDateTimeToDate } from './timeZone'
import { createWeekdayChartData, formatMinutesToHours } from './chartData'

const date = (day: number, hour = 0) =>
  zonedDateTimeToDate({ year: 2024, month: 1, day, hour, minute: 0, second: 0 })

describe('Wochentags-Diagrammdaten', () => {
  it('liefert Montag bis Sonntag stabil und füllt fehlende Tage mit null', () => {
    const metrics: BaseMetrics = {
      eventCount: 2,
      totalMeetingMinutes: 90,
      averageMeetingDuration: 45,
      eventsByDay: [{ date: date(10), eventCount: 2, totalDuration: 90 }],
      freeTimeBlocks: [{ startTime: date(10, 10), endTime: date(10, 11), duration: 60 }],
    }

    const result = createWeekdayChartData(metrics)

    expect(result.map((day) => day.label)).toEqual([
      'Montag',
      'Dienstag',
      'Mittwoch',
      'Donnerstag',
      'Freitag',
      'Samstag',
      'Sonntag',
    ])
    expect(result.map((day) => day.eventCount)).toEqual([0, 0, 2, 0, 0, 0, 0])
    expect(result[2]).toMatchObject({
      meetingMinutes: 90,
      focusMinutes: 60,
      freeBlockCount: 1,
      freeBlockMinutes: 60,
    })
  })

  it('summiert gleiche Wochentage über mehrere Wochen', () => {
    const metrics: BaseMetrics = {
      eventCount: 3,
      totalMeetingMinutes: 120,
      averageMeetingDuration: 40,
      eventsByDay: [
        { date: date(8), eventCount: 1, totalDuration: 30 },
        { date: date(15), eventCount: 2, totalDuration: 90 },
      ],
      freeTimeBlocks: [],
    }
    expect(createWeekdayChartData(metrics)[0]).toMatchObject({ eventCount: 3, meetingMinutes: 120 })
  })

  it('formatiert Zeitwerte als verständliche Stunden und Minuten', () => {
    expect(formatMinutesToHours(90)).toBe('1 Std. 30 Min.')
    expect(formatMinutesToHours(120)).toBe('2 Std.')
  })
})
