import { describe, expect, it } from 'vitest'
import {
  ANALYSIS_TIME_ZONE,
  calculateOverlapMinutes,
  getDayBoundaries,
  getLocalDateKey,
  getZonedDateParts,
} from './timeZone'

describe('explizite Analysezeitzone', () => {
  it('verwendet zentral Europe/Berlin', () => {
    expect(ANALYSIS_TIME_ZONE).toBe('Europe/Berlin')
  })

  it('erzeugt Datumsschlüssel unabhängig von der Prozesszeitzone', () => {
    expect(getLocalDateKey(new Date('2024-01-07T23:30:00Z'))).toBe('2024-01-08')
    expect(getLocalDateKey(new Date('2024-07-07T22:30:00Z'))).toBe('2024-07-08')
  })

  it('erzeugt Berliner Tagesgrenzen als absolute Zeitpunkte', () => {
    const winter = getDayBoundaries('2024-01-08')
    const summer = getDayBoundaries('2024-07-08')

    expect(winter.startTime.toISOString()).toBe('2024-01-07T23:00:00.000Z')
    expect(winter.endTime.toISOString()).toBe('2024-01-08T23:00:00.000Z')
    expect(summer.startTime.toISOString()).toBe('2024-07-07T22:00:00.000Z')
    expect(summer.endTime.toISOString()).toBe('2024-07-08T22:00:00.000Z')
  })

  it('berücksichtigt 23- und 25-stündige Tage bei den Zeitumstellungen', () => {
    const spring = getDayBoundaries('2024-03-31')
    const autumn = getDayBoundaries('2024-10-27')

    expect((spring.endTime.getTime() - spring.startTime.getTime()) / 3_600_000).toBe(23)
    expect((autumn.endTime.getTime() - autumn.startTime.getTime()) / 3_600_000).toBe(25)
  })

  it('berechnet Überlappungen an lokaler Mitternacht', () => {
    const january8 = getDayBoundaries('2024-01-08')
    const january9 = getDayBoundaries('2024-01-09')
    const start = new Date('2024-01-08T23:30:00+01:00')
    const end = new Date('2024-01-09T00:30:00+01:00')

    expect(calculateOverlapMinutes(start, end, january8.startTime, january8.endTime)).toBe(30)
    expect(calculateOverlapMinutes(start, end, january9.startTime, january9.endTime)).toBe(30)
    expect(getZonedDateParts(january9.startTime)).toMatchObject({
      year: 2024,
      month: 1,
      day: 9,
      hour: 0,
    })
  })
})
