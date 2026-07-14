import { describe, expect, it } from 'vitest'
import type { CalendarEvent } from '../types/calendar'
import {
  calculateAverageMeetingDuration,
  calculateBaseMetrics,
  calculateEventCount,
  calculateEventsByDay,
  calculateFreeTimeBlocks,
  calculateTotalMeetingMinutes,
  formatMinutesToDecimalHours,
  formatMinutesToHours,
} from './metrics'
import { getLocalDateKey, getZonedDateParts, zonedDateTimeToDate } from './timeZone'

const monday = localDate(8)
const friday = localDate(12)

function event(id: string, startTime: Date, endTime: Date, isAllDay = false): CalendarEvent {
  return {
    id,
    title: `Termin ${id}`,
    description: null,
    location: null,
    startTime,
    endTime,
    durationMinutes: (endTime.getTime() - startTime.getTime()) / 60_000,
    isAllDay,
    status: 'confirmed',
    organizer: null,
    attendees: [],
  }
}

function localDate(day: number, hour = 0, minute = 0): Date {
  return zonedDateTimeToDate({ year: 2024, month: 1, day, hour, minute, second: 0 })
}

describe('Basiskennzahlen', () => {
  it('liefert für einen leeren Kalender sichere Nullwerte und freie Arbeitstage', () => {
    const metrics = calculateBaseMetrics([], monday, friday)

    expect(metrics.eventCount).toBe(0)
    expect(metrics.totalMeetingMinutes).toBe(0)
    expect(metrics.averageMeetingDuration).toBeNull()
    expect(metrics.freeTimeBlocks).toHaveLength(5)
    expect(metrics.freeTimeBlocks.every((block) => block.duration === 600)).toBe(true)
    expect(metrics.eventsByDay.map((day) => day.eventCount)).toEqual([0, 0, 0, 0, 0])
  })

  it('berechnet Anzahl, Summe und Durchschnitt mehrerer Termine getrennt von belegter Zeit', () => {
    const events = [
      event('1', localDate(8, 9), localDate(8, 10)),
      event('2', localDate(8, 9, 30), localDate(8, 11)),
      event('3', localDate(9, 14), localDate(9, 14, 30)),
    ]

    expect(calculateEventCount(events)).toBe(3)
    expect(calculateTotalMeetingMinutes(events)).toBe(180)
    expect(calculateAverageMeetingDuration(events)).toBe(60)

    const mondayBlocks = calculateFreeTimeBlocks(events, monday, monday)
    expect(mondayBlocks.map((block) => block.duration)).toEqual([60, 420])
  })

  it('ignoriert ungültige und nicht positive Termindauern konsistent', () => {
    const events = [
      event('negative', localDate(8, 10), localDate(8, 9)),
      event('zero', localDate(8, 10), localDate(8, 10)),
      event('invalid', new Date(Number.NaN), localDate(8, 10)),
    ]

    expect(calculateEventCount(events)).toBe(0)
    expect(calculateTotalMeetingMinutes(events)).toBe(0)
    expect(calculateAverageMeetingDuration(events)).toBeNull()
  })

  it('berechnet die tatsächliche Dauer ganztägiger Termine', () => {
    const allDay = event('all-day', localDate(8), localDate(9), true)

    expect(calculateTotalMeetingMinutes([allDay])).toBe(24 * 60)
    expect(calculateFreeTimeBlocks([allDay], monday, monday)).toEqual([])
  })

  it('berechnet Dauern über einen Sommerzeitwechsel anhand absoluter Zeitpunkte', () => {
    const dstEvent = event(
      'dst',
      new Date('2024-03-31T01:30:00+01:00'),
      new Date('2024-03-31T03:30:00+02:00'),
    )

    expect(calculateTotalMeetingMinutes([dstEvent])).toBe(60)
  })

  describe('freie Zeitblöcke', () => {
    it('führt überlappende und direkt angrenzende Termine zusammen', () => {
      const events = [
        event('1', localDate(8, 9), localDate(8, 10)),
        event('2', localDate(8, 9, 30), localDate(8, 11)),
        event('3', localDate(8, 11), localDate(8, 12)),
      ]

      expect(
        calculateFreeTimeBlocks(events, monday, monday).map((block) => block.duration),
      ).toEqual([60, 360])
    })

    it('begrenzt teilweise außerhalb der Arbeitszeit liegende Termine', () => {
      const events = [
        event('early', localDate(8, 7), localDate(8, 9)),
        event('late', localDate(8, 17), localDate(8, 19)),
      ]

      const blocks = calculateFreeTimeBlocks(events, monday, monday)
      expect(blocks).toHaveLength(1)
      expect(getZonedDateParts(blocks[0].startTime).hour).toBe(9)
      expect(getZonedDateParts(blocks[0].endTime).hour).toBe(17)
      expect(blocks[0].duration).toBe(480)
    })

    it('ignoriert vollständig außerhalb der Arbeitszeit liegende Termine exakt', () => {
      const events = [
        event('before', localDate(8, 6), localDate(8, 7)),
        event('after', localDate(8, 19), localDate(8, 20)),
      ]

      const blocks = calculateFreeTimeBlocks(events, monday, monday)
      expect(blocks).toHaveLength(1)
      expect(getZonedDateParts(blocks[0].startTime).hour).toBe(8)
      expect(getZonedDateParts(blocks[0].endTime).hour).toBe(18)
      expect(blocks[0].duration).toBe(600)
    })

    it('ignoriert Wochenenden', () => {
      expect(calculateFreeTimeBlocks([], localDate(13), localDate(14))).toEqual([])
      expect(
        calculateFreeTimeBlocks(
          [event('weekend', localDate(13, 9), localDate(13, 10))],
          localDate(13),
          localDate(14),
        ),
      ).toEqual([])
    })

    it('berücksichtigt einen Termin über Mitternacht an jedem betroffenen Arbeitstag', () => {
      const overnight = event('overnight', localDate(8, 17), localDate(9, 9))
      const blocks = calculateFreeTimeBlocks([overnight], monday, localDate(9))

      expect(blocks.map((block) => [getLocalDateKey(block.startTime), block.duration])).toEqual([
        ['2024-01-08', 540],
        ['2024-01-09', 540],
      ])
    })
  })

  describe('Termine pro Tag und Analysezeitraum', () => {
    it('enthält alle Kalendertage des Zeitraums einschließlich Tagen ohne Termine', () => {
      const stats = calculateEventsByDay(
        [event('1', localDate(8, 9), localDate(8, 10))],
        monday,
        friday,
      )

      expect(stats).toHaveLength(5)
      expect(stats.map((day) => day.eventCount)).toEqual([1, 0, 0, 0, 0])
    })

    it('zählt mehrtägige Termine je betroffenem Kalendertag und teilt ihre Dauer auf', () => {
      const stats = calculateEventsByDay(
        [event('overnight', localDate(8, 23), localDate(9, 1))],
        monday,
        localDate(9),
      )

      expect(stats.map((day) => day.eventCount)).toEqual([1, 1])
      expect(stats.map((day) => day.totalDuration)).toEqual([60, 60])
    })

    it('verwendet lokale Kalendertage auch bei Zeitpunkten mit explizitem Offset', () => {
      const offsetEvent = event(
        'offset',
        new Date('2024-01-08T00:30:00+01:00'),
        new Date('2024-01-08T01:30:00+01:00'),
      )
      const stats = calculateEventsByDay([offsetEvent], monday, monday)

      expect(stats[0].eventCount).toBe(1)
      expect(stats[0].totalDuration).toBe(60)
    })

    it('teilt einen Termin an lokaler Berliner Mitternacht exakt auf', () => {
      const crossingMidnight = event(
        'midnight',
        new Date('2024-01-08T23:30:00+01:00'),
        new Date('2024-01-09T00:30:00+01:00'),
      )
      const stats = calculateEventsByDay([crossingMidnight], monday, localDate(9))

      expect(stats.map((day) => [getLocalDateKey(day.date), day.totalDuration])).toEqual([
        ['2024-01-08', 30],
        ['2024-01-09', 30],
      ])
    })

    it('berechnet Arbeitszeitblöcke auch in der Sommerzeit in Europe/Berlin', () => {
      const july8 = zonedDateTimeToDate({
        year: 2024,
        month: 7,
        day: 8,
        hour: 0,
        minute: 0,
        second: 0,
      })
      const summerMeeting = event(
        'summer',
        new Date('2024-07-08T09:00:00+02:00'),
        new Date('2024-07-08T10:00:00+02:00'),
      )

      expect(
        calculateFreeTimeBlocks([summerMeeting], july8, july8).map((block) => block.duration),
      ).toEqual([60, 480])
    })

    it('ordnet einen UTC-Termin dem Berliner Folgetag zu', () => {
      const nextDayInBerlin = event(
        'utc-next-day',
        new Date('2024-01-08T23:30:00Z'),
        new Date('2024-01-08T23:45:00Z'),
      )
      const stats = calculateEventsByDay([nextDayInBerlin], monday, localDate(9))

      expect(stats.map((day) => day.eventCount)).toEqual([0, 1])
      expect(stats.map((day) => day.totalDuration)).toEqual([0, 15])
    })

    it.each([
      {
        name: 'Winterzeit',
        start: '2024-01-08T09:00:00+01:00',
        end: '2024-01-08T10:00:00+01:00',
        analysisDay: zonedDateTimeToDate({
          year: 2024,
          month: 1,
          day: 8,
          hour: 0,
          minute: 0,
          second: 0,
        }),
      },
      {
        name: 'Sommerzeit',
        start: '2024-07-08T09:00:00+02:00',
        end: '2024-07-08T10:00:00+02:00',
        analysisDay: zonedDateTimeToDate({
          year: 2024,
          month: 7,
          day: 8,
          hour: 0,
          minute: 0,
          second: 0,
        }),
      },
      {
        name: 'Umstellung auf Sommerzeit',
        start: '2024-03-31T01:30:00+01:00',
        end: '2024-03-31T03:30:00+02:00',
        analysisDay: zonedDateTimeToDate({
          year: 2024,
          month: 3,
          day: 31,
          hour: 0,
          minute: 0,
          second: 0,
        }),
      },
      {
        name: 'Umstellung auf Winterzeit',
        start: '2024-10-27T02:30:00+02:00',
        end: '2024-10-27T02:30:00+01:00',
        analysisDay: zonedDateTimeToDate({
          year: 2024,
          month: 10,
          day: 27,
          hour: 0,
          minute: 0,
          second: 0,
        }),
      },
    ])(
      'berechnet Tagesminuten während $name unabhängig von der Systemzeitzone',
      ({ start, end, analysisDay }) => {
        const stats = calculateEventsByDay(
          [event('zoned', new Date(start), new Date(end))],
          analysisDay,
          analysisDay,
        )

        expect(stats[0].eventCount).toBe(1)
        expect(stats[0].totalDuration).toBe(60)
      },
    )

    it('filtert auf den Analysezeitraum und begrenzt über dessen Rand laufende Termine', () => {
      const events = [
        event('outside', localDate(7, 9), localDate(7, 10)),
        event('crossing', localDate(7, 23), localDate(8, 1)),
        event('inside', localDate(8, 9), localDate(8, 10)),
      ]
      const metrics = calculateBaseMetrics(events, monday, monday)

      expect(metrics.eventCount).toBe(2)
      expect(metrics.totalMeetingMinutes).toBe(120)
      expect(metrics.averageMeetingDuration).toBe(60)
      expect(metrics.eventsByDay[0]).toMatchObject({ eventCount: 2, totalDuration: 120 })
    })
  })

  describe('Formatierung und Rundung', () => {
    it('formatiert und rundet auf die nächste volle Minute', () => {
      expect(formatMinutesToHours(0)).toBe('0 Min.')
      expect(formatMinutesToHours(30)).toBe('30 Min.')
      expect(formatMinutesToHours(60)).toBe('1 Std.')
      expect(formatMinutesToHours(89.6)).toBe('1 Std. 30 Min.')
      expect(formatMinutesToHours(149.4)).toBe('2 Std. 29 Min.')
      expect(formatMinutesToDecimalHours(90)).toBe('1.5h')
      expect(formatMinutesToDecimalHours(92)).toBe('1.5h')
    })

    it('weist negative und nicht endliche Werte zurück', () => {
      for (const value of [-1, Number.NaN, Number.POSITIVE_INFINITY]) {
        expect(formatMinutesToHours(value)).toBe('-')
        expect(formatMinutesToDecimalHours(value)).toBe('-')
      }
    })
  })
})
