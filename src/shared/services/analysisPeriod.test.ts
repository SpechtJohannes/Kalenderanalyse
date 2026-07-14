import { describe, expect, it } from 'vitest'
import type { CalendarEvent } from '../types/calendar'
import {
  createAnalysisDateRange,
  createCustomAnalysisDateRange,
  filterEventsByDateRange,
  formatAnalysisDateRange,
} from './analysisPeriod'
import { calculateBaseMetricsForRange } from './metrics'

function event(id: string, start: string, end: string, isAllDay = false): CalendarEvent {
  const startTime = new Date(start)
  const endTime = new Date(end)
  return {
    id,
    title: id,
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

describe('Analysezeitraum', () => {
  const now = new Date('2024-01-08T12:00:00+01:00')

  it.each([
    ['week', '2024-01-08', '2024-01-14'],
    ['two-weeks', '2024-01-08', '2024-01-21'],
    ['month', '2024-01-08', '2024-02-08'],
    ['three-months', '2024-01-08', '2024-04-08'],
  ] as const)('berechnet das Preset %s inklusive Start- und Endtag', (preset, start, end) => {
    expect(createAnalysisDateRange(preset, now)).toMatchObject({
      preset,
      startDateKey: start,
      endDateKey: end,
    })
  })

  it.each([
    ['Monatsende', '2024-01-31T12:00:00+01:00', 'month', '2024-02-29'],
    ['drei Monate ab Monatsende', '2024-01-31T12:00:00+01:00', 'three-months', '2024-04-30'],
    ['Jahreswechsel', '2024-12-31T12:00:00+01:00', 'month', '2025-01-31'],
    ['Schaltjahr', '2024-02-29T12:00:00+01:00', 'month', '2024-03-29'],
    ['Nicht-Schaltjahr', '2023-01-31T12:00:00+01:00', 'month', '2023-02-28'],
  ] as const)('behandelt $0 korrekt', (_name, current, preset, expectedEnd) => {
    expect(createAnalysisDateRange(preset, new Date(current)).endDateKey).toBe(expectedEnd)
  })

  it('erstellt einen benutzerdefinierten Zeitraum mit gleichem Start- und Endtag', () => {
    const validation = createCustomAnalysisDateRange('2024-02-10', '2024-02-10')

    expect(validation.error).toBeNull()
    expect(validation.range).toMatchObject({
      preset: 'custom',
      startDateKey: '2024-02-10',
      endDateKey: '2024-02-10',
    })
  })

  it('weist ein Enddatum vor dem Startdatum sowie ungültige Daten zurück', () => {
    expect(createCustomAnalysisDateRange('2024-02-11', '2024-02-10')).toEqual({
      range: null,
      error: 'Das Enddatum darf nicht vor dem Startdatum liegen.',
    })
    expect(createCustomAnalysisDateRange('2024-02-31', '2024-03-01').range).toBeNull()
  })

  it('bildet absolute Berliner Grenzen unabhängig von der Prozesszeitzone', () => {
    const range = createCustomAnalysisDateRange('2024-01-08', '2024-01-08').range

    expect(range?.startTime.toISOString()).toBe('2024-01-07T23:00:00.000Z')
    expect(range?.endTime.toISOString()).toBe('2024-01-08T23:00:00.000Z')
    expect(range && formatAnalysisDateRange(range)).toBe('08.01.2024 bis 08.01.2024')
  })

  describe('Terminfilterung', () => {
    const range = createCustomAnalysisDateRange('2024-01-08', '2024-01-08').range!

    it('behält vollständig enthaltene Termine und entfernt vollständig äußere', () => {
      const filtered = filterEventsByDateRange(
        [
          event('inside', '2024-01-08T09:00:00+01:00', '2024-01-08T10:00:00+01:00'),
          event('before', '2024-01-07T09:00:00+01:00', '2024-01-07T10:00:00+01:00'),
          event('after', '2024-01-09T09:00:00+01:00', '2024-01-09T10:00:00+01:00'),
        ],
        range,
      )

      expect(filtered.map((item) => item.id)).toEqual(['inside'])
      expect(filtered[0].durationMinutes).toBe(60)
    })

    it.each([
      ['beginnt davor', '2024-01-07T23:30:00+01:00', '2024-01-08T00:30:00+01:00', 30],
      ['endet danach', '2024-01-08T23:30:00+01:00', '2024-01-09T00:30:00+01:00', 30],
      ['umfasst alles', '2024-01-07T00:00:00+01:00', '2024-01-10T00:00:00+01:00', 1440],
      ['ganztägig', '2024-01-08T00:00:00+01:00', '2024-01-09T00:00:00+01:00', 1440],
    ])('begrenzt einen Termin, der $0', (_name, start, end, expectedMinutes) => {
      const filtered = filterEventsByDateRange(
        [event('boundary', start, end, _name === 'ganztägig')],
        range,
      )

      expect(filtered).toHaveLength(1)
      expect(filtered[0].durationMinutes).toBe(expectedMinutes)
    })

    it('behandelt exakte Grenzen als halb-offenes Intervall', () => {
      const filtered = filterEventsByDateRange(
        [
          event('ends-at-start', '2024-01-07T23:00:00+01:00', '2024-01-08T00:00:00+01:00'),
          event('starts-at-start', '2024-01-08T00:00:00+01:00', '2024-01-08T01:00:00+01:00'),
          event('starts-at-end', '2024-01-09T00:00:00+01:00', '2024-01-09T01:00:00+01:00'),
        ],
        range,
      )

      expect(filtered.map((item) => item.id)).toEqual(['starts-at-start'])
    })

    it('behält einen Termin über Mitternacht innerhalb eines mehrtägigen Zeitraums', () => {
      const twoDays = createCustomAnalysisDateRange('2024-01-08', '2024-01-09').range!
      const filtered = filterEventsByDateRange(
        [event('overnight', '2024-01-08T23:30:00+01:00', '2024-01-09T00:30:00+01:00')],
        twoDays,
      )

      expect(filtered[0].durationMinutes).toBe(60)
    })

    it('wendet den Zeitraum auf alle bestehenden Basiskennzahlen an', () => {
      const events = [
        event('inside', '2024-01-08T09:00:00+01:00', '2024-01-08T10:00:00+01:00'),
        event('outside', '2024-01-09T09:00:00+01:00', '2024-01-09T11:00:00+01:00'),
      ]
      const oneDay = calculateBaseMetricsForRange(events, range)
      const twoDays = calculateBaseMetricsForRange(
        events,
        createCustomAnalysisDateRange('2024-01-08', '2024-01-09').range!,
      )

      expect(oneDay).toMatchObject({
        eventCount: 1,
        totalMeetingMinutes: 60,
        averageMeetingDuration: 60,
      })
      expect(oneDay.eventsByDay).toHaveLength(1)
      expect(twoDays).toMatchObject({
        eventCount: 2,
        totalMeetingMinutes: 180,
        averageMeetingDuration: 90,
      })
      expect(twoDays.eventsByDay).toHaveLength(2)
    })

    it('liefert für einen Zeitraum ohne Termine sichere leere Kennzahlen', () => {
      const metrics = calculateBaseMetricsForRange([], range)

      expect(metrics.eventCount).toBe(0)
      expect(metrics.totalMeetingMinutes).toBe(0)
      expect(metrics.averageMeetingDuration).toBeNull()
      expect(metrics.eventsByDay).toHaveLength(1)
    })
  })
})
