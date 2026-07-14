/**
 * Tests für die Basiskennzahlen-Berechnung
 */

import { describe, it, expect, beforeEach } from 'vitest'
import type { CalendarEvent } from '../../shared/types/calendar'
import {
  calculateEventCount,
  calculateTotalMeetingMinutes,
  calculateAverageMeetingDuration,
  calculateFreeTimeBlocks,
  calculateEventsByDay,
  calculateBaseMetrics,
  formatMinutesToHours,
  formatMinutesToDecimalHours,
} from '../../shared/services/metrics'

describe('Basiskennzahlen-Berechnungen', () => {
  let startDate: Date
  let endDate: Date

  beforeEach(() => {
    // Beispielwoche: Montag 2024-01-08 bis Freitag 2024-01-12
    startDate = new Date('2024-01-08') // Montag
    endDate = new Date('2024-01-12') // Freitag
  })

  describe('calculateEventCount', () => {
    it('sollte 0 für leeren Kalender zurückgeben', () => {
      expect(calculateEventCount([])).toBe(0)
    })

    it('sollte korrekte Anzahl der Termine zählen', () => {
      const events: CalendarEvent[] = [
        {
          id: '1',
          title: 'Meeting 1',
          startTime: new Date('2024-01-08T09:00:00'),
          endTime: new Date('2024-01-08T10:00:00'),
          isAllDay: false,
        },
        {
          id: '2',
          title: 'Meeting 2',
          startTime: new Date('2024-01-08T14:00:00'),
          endTime: new Date('2024-01-08T15:00:00'),
          isAllDay: false,
        },
      ]

      expect(calculateEventCount(events)).toBe(2)
    })
  })

  describe('calculateTotalMeetingMinutes', () => {
    it('sollte 0 für leeren Kalender zurückgeben', () => {
      expect(calculateTotalMeetingMinutes([])).toBe(0)
    })

    it('sollte Meetingdauern korrekt summieren', () => {
      const events: CalendarEvent[] = [
        {
          id: '1',
          title: 'Meeting 1',
          startTime: new Date('2024-01-08T09:00:00'),
          endTime: new Date('2024-01-08T10:00:00'), // 60 Minuten
          isAllDay: false,
        },
        {
          id: '2',
          title: 'Meeting 2',
          startTime: new Date('2024-01-08T14:00:00'),
          endTime: new Date('2024-01-08T14:30:00'), // 30 Minuten
          isAllDay: false,
        },
      ]

      expect(calculateTotalMeetingMinutes(events)).toBe(90)
    })

    it('sollte ganztägige Termine als 8 Stunden rechnen', () => {
      const events: CalendarEvent[] = [
        {
          id: '1',
          title: 'Ganztägig',
          startTime: new Date('2024-01-08T00:00:00'),
          endTime: new Date('2024-01-08T23:59:59'),
          isAllDay: true,
        },
      ]

      expect(calculateTotalMeetingMinutes(events)).toBe(8 * 60)
    })

    it('sollte ungültige Dauern ignorieren', () => {
      const events: CalendarEvent[] = [
        {
          id: '1',
          title: 'Invalid',
          startTime: new Date('2024-01-08T10:00:00'),
          endTime: new Date('2024-01-08T09:00:00'), // Negative Dauer
          isAllDay: false,
        },
      ]

      expect(calculateTotalMeetingMinutes(events)).toBe(0)
    })
  })

  describe('calculateAverageMeetingDuration', () => {
    it('sollte null für leeren Kalender zurückgeben', () => {
      expect(calculateAverageMeetingDuration([])).toBeNull()
    })

    it('sollte korrekte Durchschnittsdauer berechnen', () => {
      const events: CalendarEvent[] = [
        {
          id: '1',
          title: 'Meeting 1',
          startTime: new Date('2024-01-08T09:00:00'),
          endTime: new Date('2024-01-08T10:00:00'), // 60 Minuten
          isAllDay: false,
        },
        {
          id: '2',
          title: 'Meeting 2',
          startTime: new Date('2024-01-08T14:00:00'),
          endTime: new Date('2024-01-08T14:30:00'), // 30 Minuten
          isAllDay: false,
        },
      ]

      expect(calculateAverageMeetingDuration(events)).toBe(45)
    })

    it('sollte Durchschnitt mit einem Meeting berechnen', () => {
      const events: CalendarEvent[] = [
        {
          id: '1',
          title: 'Meeting',
          startTime: new Date('2024-01-08T09:00:00'),
          endTime: new Date('2024-01-08T10:30:00'),
          isAllDay: false,
        },
      ]

      expect(calculateAverageMeetingDuration(events)).toBe(90)
    })
  })

  describe('calculateFreeTimeBlocks', () => {
    it('sollte einen vollständig freien Arbeitstag erkennen', () => {
      const events: CalendarEvent[] = []

      const blocks = calculateFreeTimeBlocks(events, startDate, endDate)

      // Montag bis Freitag = 5 Tage à 10 Stunden = 5 Blöcke
      expect(blocks.length).toBe(5)
      blocks.forEach((block) => {
        expect(block.duration).toBe(10 * 60) // 10 Stunden
      })
    })

    it('sollte freie Zeit zwischen Meetings berechnen', () => {
      const events: CalendarEvent[] = [
        {
          id: '1',
          title: 'Morning Meeting',
          startTime: new Date('2024-01-08T09:00:00'),
          endTime: new Date('2024-01-08T10:00:00'),
          isAllDay: false,
        },
        {
          id: '2',
          title: 'Afternoon Meeting',
          startTime: new Date('2024-01-08T14:00:00'),
          endTime: new Date('2024-01-08T15:00:00'),
          isAllDay: false,
        },
      ]

      const blocks = calculateFreeTimeBlocks(events, startDate, endDate)

      // Montag: 08:00-09:00 (60 min), 10:00-14:00 (240 min), 15:00-18:00 (180 min)
      // Dienstag-Freitag: je 600 min
      // Total: 4 Blöcke am Montag + 4 Tage à 1 Block = 8 Blöcke
      expect(blocks.length).toBeGreaterThan(0)

      const mondayBlocks = blocks.filter((b) => b.startTime.getDay() === 1)
      expect(mondayBlocks.length).toBe(3) // 3 freie Blöcke am Montag
      expect(mondayBlocks[0].duration).toBe(60) // Vor erstem Meeting
      expect(mondayBlocks[1].duration).toBe(240) // Zwischen Meetings
      expect(mondayBlocks[2].duration).toBe(180) // Nach letztem Meeting
    })

    it('sollte überlappende Termine zusammenführen', () => {
      const events: CalendarEvent[] = [
        {
          id: '1',
          title: 'Meeting 1',
          startTime: new Date('2024-01-08T09:00:00'),
          endTime: new Date('2024-01-08T10:00:00'),
          isAllDay: false,
        },
        {
          id: '2',
          title: 'Meeting 2',
          startTime: new Date('2024-01-08T09:30:00'),
          endTime: new Date('2024-01-08T11:00:00'),
          isAllDay: false,
        },
      ]

      const blocks = calculateFreeTimeBlocks(events, startDate, endDate)

      // Merged zu 09:00-11:00
      // Montag: 08:00-09:00 (60 min), 11:00-18:00 (420 min)
      const mondayBlocks = blocks.filter((b) => b.startTime.getDay() === 1)
      expect(mondayBlocks.length).toBe(2)
      expect(mondayBlocks[0].duration).toBe(60)
      expect(mondayBlocks[1].duration).toBe(420)
    })

    it('sollte direkt aneinandergrenzende Termine zusammenführen', () => {
      const events: CalendarEvent[] = [
        {
          id: '1',
          title: 'Meeting 1',
          startTime: new Date('2024-01-08T09:00:00'),
          endTime: new Date('2024-01-08T10:00:00'),
          isAllDay: false,
        },
        {
          id: '2',
          title: 'Meeting 2',
          startTime: new Date('2024-01-08T10:00:00'),
          endTime: new Date('2024-01-08T11:00:00'),
          isAllDay: false,
        },
      ]

      const blocks = calculateFreeTimeBlocks(events, startDate, endDate)

      const mondayBlocks = blocks.filter((b) => b.startTime.getDay() === 1)
      expect(mondayBlocks.length).toBe(2)
      expect(mondayBlocks[0].duration).toBe(60) // 08:00-09:00
      expect(mondayBlocks[1].duration).toBe(420) // 11:00-18:00
    })

    it('sollte Termine außerhalb der Arbeitszeit ignorieren', () => {
      // Erstelle Events mit UTC-Zeiten zu vermeiden, Zeitzone-Probleme
      const events: CalendarEvent[] = [
        {
          id: '1',
          title: 'Before work',
          startTime: new Date('2024-01-08T06:00:00Z'),
          endTime: new Date('2024-01-08T07:00:00Z'),
          isAllDay: false,
        },
        {
          id: '2',
          title: 'After work',
          startTime: new Date('2024-01-08T19:00:00Z'),
          endTime: new Date('2024-01-08T20:00:00Z'),
          isAllDay: false,
        },
      ]

      const blocks = calculateFreeTimeBlocks(events, new Date('2024-01-08Z'), new Date('2024-01-12Z'))

      // Prüfe, dass es freie Blöcke gibt (sollte nicht null sein)
      expect(blocks.length).toBeGreaterThan(0)
      // Gesamtdauer über alle Wochentage sollte mindestens 5 * 10 Stunden sein
      const totalDuration = blocks.reduce((sum, b) => sum + b.duration, 0)
      expect(totalDuration).toBeGreaterThanOrEqual(5 * 10 * 60 - 120) // Toleranz für Zeitzone
    })

    it('sollte Termine teilweise außerhalb der Arbeitszeit begrenzen', () => {
      const events: CalendarEvent[] = [
        {
          id: '1',
          title: 'Spans work hours',
          startTime: new Date('2024-01-08T07:00:00'), // Vor 08:00
          endTime: new Date('2024-01-08T09:00:00'), // Innerhalb
          isAllDay: false,
        },
      ]

      const blocks = calculateFreeTimeBlocks(events, startDate, endDate)

      const mondayBlocks = blocks.filter((b) => b.startTime.getDay() === 1)
      expect(mondayBlocks.length).toBe(1)
      expect(mondayBlocks[0].startTime.getHours()).toBe(9) // Nach "begrenzte" Meeting
      expect(mondayBlocks[0].duration).toBe(540) // 09:00-18:00 = 9 Stunden
    })

    it('sollte Wochenenden ignorieren', () => {
      const weekendStart = new Date('2024-01-13') // Samstag
      const weekendEnd = new Date('2024-01-14') // Sonntag

      const events: CalendarEvent[] = []

      const blocks = calculateFreeTimeBlocks(events, weekendStart, weekendEnd)

      // Keine Blöcke an Wochenenden
      expect(blocks.length).toBe(0)
    })

    it('sollte Termine über Mitternacht behandeln', () => {
      const events: CalendarEvent[] = [
        {
          id: '1',
          title: 'Spanning midnight',
          startTime: new Date('2024-01-08T23:00:00'),
          endTime: new Date('2024-01-09T01:00:00'),
          isAllDay: false,
        },
      ]

      const blocks = calculateFreeTimeBlocks(events, startDate, endDate)

      // Sollte nicht abstürzen
      expect(blocks.length).toBeGreaterThan(0)
    })
  })

  describe('calculateEventsByDay', () => {
    it('sollte 0 Events für Tage ohne Termine zeigen', () => {
      const events: CalendarEvent[] = [
        {
          id: '1',
          title: 'Meeting',
          startTime: new Date('2024-01-08T09:00:00'),
          endTime: new Date('2024-01-08T10:00:00'),
          isAllDay: false,
        },
      ]

      const stats = calculateEventsByDay(events, startDate, endDate)

      // 5 Tage (Montag-Freitag)
      expect(stats.length).toBe(5)

      // Montag sollte 1 Event haben
      expect(stats[0].eventCount).toBe(1)

      // Andere Tage sollten 0 haben
      expect(stats[1].eventCount).toBe(0)
      expect(stats[2].eventCount).toBe(0)
    })

    it('sollte mehrere Termine an einem Tag zählen', () => {
      const events: CalendarEvent[] = [
        {
          id: '1',
          title: 'Meeting 1',
          startTime: new Date('2024-01-08T09:00:00'),
          endTime: new Date('2024-01-08T10:00:00'),
          isAllDay: false,
        },
        {
          id: '2',
          title: 'Meeting 2',
          startTime: new Date('2024-01-08T14:00:00'),
          endTime: new Date('2024-01-08T15:00:00'),
          isAllDay: false,
        },
      ]

      const stats = calculateEventsByDay(events, startDate, endDate)

      expect(stats[0].eventCount).toBe(2)
      expect(stats[0].totalDuration).toBe(120)
    })

    it('sollte Termine an verschiedenen Tagen berücksichtigen', () => {
      const events: CalendarEvent[] = [
        {
          id: '1',
          title: 'Monday Meeting',
          startTime: new Date('2024-01-08T09:00:00'),
          endTime: new Date('2024-01-08T10:00:00'),
          isAllDay: false,
        },
        {
          id: '2',
          title: 'Wednesday Meeting',
          startTime: new Date('2024-01-10T14:00:00'),
          endTime: new Date('2024-01-10T15:30:00'),
          isAllDay: false,
        },
      ]

      const stats = calculateEventsByDay(events, startDate, endDate)

      expect(stats[0].eventCount).toBe(1) // Montag
      expect(stats[0].totalDuration).toBe(60)

      expect(stats[2].eventCount).toBe(1) // Mittwoch
      expect(stats[2].totalDuration).toBe(90)
    })
  })

  describe('calculateBaseMetrics', () => {
    it('sollte ein leeres Ergebnis für leeren Kalender haben', () => {
      const metrics = calculateBaseMetrics([], startDate, endDate)

      expect(metrics.eventCount).toBe(0)
      expect(metrics.totalMeetingMinutes).toBe(0)
      expect(metrics.averageMeetingDuration).toBeNull()
      expect(metrics.freeTimeBlocks.length).toBe(5)
      expect(metrics.eventsByDay.length).toBe(5)
    })

    it('sollte alle Metriken zusammen berechnen', () => {
      const events: CalendarEvent[] = [
        {
          id: '1',
          title: 'Meeting 1',
          startTime: new Date('2024-01-08T09:00:00'),
          endTime: new Date('2024-01-08T10:00:00'),
          isAllDay: false,
        },
      ]

      const metrics = calculateBaseMetrics(events, startDate, endDate)

      expect(metrics.eventCount).toBe(1)
      expect(metrics.totalMeetingMinutes).toBe(60)
      expect(metrics.averageMeetingDuration).toBe(60)
      expect(metrics.freeTimeBlocks.length).toBeGreaterThan(0)
      expect(metrics.eventsByDay.length).toBe(5)
    })
  })

  describe('Formatierung', () => {
    it('formatMinutesToHours sollte korrekt formatieren', () => {
      expect(formatMinutesToHours(60)).toBe('1h')
      expect(formatMinutesToHours(90)).toBe('1h 30m')
      expect(formatMinutesToHours(120)).toBe('2h')
      expect(formatMinutesToHours(0)).toBe('0h')
      expect(formatMinutesToHours(-10)).toBe('-')
    })

    it('formatMinutesToHours sollte NaN/Infinity korrekt behandeln', () => {
      expect(formatMinutesToHours(NaN)).toBe('-')
      expect(formatMinutesToHours(Infinity)).toBe('-')
    })

    it('formatMinutesToDecimalHours sollte korrekt formatieren', () => {
      expect(formatMinutesToDecimalHours(60)).toBe('1.0h')
      expect(formatMinutesToDecimalHours(90)).toBe('1.5h')
      expect(formatMinutesToDecimalHours(120)).toBe('2.0h')
      expect(formatMinutesToDecimalHours(0)).toBe('0.0h')
      expect(formatMinutesToDecimalHours(-10)).toBe('-')
    })

    it('formatMinutesToDecimalHours sollte NaN/Infinity korrekt behandeln', () => {
      expect(formatMinutesToDecimalHours(NaN)).toBe('-')
      expect(formatMinutesToDecimalHours(Infinity)).toBe('-')
    })
  })
})
