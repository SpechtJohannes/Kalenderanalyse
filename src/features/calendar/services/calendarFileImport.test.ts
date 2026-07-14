import { describe, expect, it, vi } from 'vitest'
import type { CalendarEvent } from '../../../shared/types/calendar'
import { importCalendarFile } from './calendarFileImport'

function file(name: string, content: string, type = 'text/calendar'): File {
  return { name, type, text: vi.fn().mockResolvedValue(content) } as unknown as File
}

const normalizedEvent: CalendarEvent = {
  id: 'event-1',
  title: 'Planung',
  description: null,
  startTime: new Date('2024-01-08T09:00:00Z'),
  endTime: new Date('2024-01-08T10:00:00Z'),
  durationMinutes: 60,
  isAllDay: false,
  location: null,
  status: 'confirmed',
  organizer: null,
  attendees: [],
}

describe('importCalendarFile', () => {
  it('liest eine ICS-Datei und übergibt ihren Inhalt genau einmal an den Parser', async () => {
    const parser = vi.fn().mockReturnValue({ events: [normalizedEvent], issues: [] })
    const calendarFile = file('kalender.ics', 'BEGIN:VCALENDAR\nEND:VCALENDAR')

    await expect(importCalendarFile(calendarFile, parser)).resolves.toMatchObject({
      ok: true,
      events: [normalizedEvent],
    })
    expect(calendarFile.text).toHaveBeenCalledOnce()
    expect(parser).toHaveBeenCalledOnce()
    expect(parser).toHaveBeenCalledWith('BEGIN:VCALENDAR\nEND:VCALENDAR')
  })

  it.each([
    ['kalender.txt', 'text/calendar'],
    ['kalender.ics', 'application/pdf'],
  ])('weist einen falschen Dateityp zurück: %s (%s)', async (name, type) => {
    await expect(importCalendarFile(file(name, 'Inhalt', type))).resolves.toMatchObject({
      ok: false,
      code: 'invalid-file-type',
    })
  })

  it.each(['', 'text/plain', 'application/octet-stream'])(
    'akzeptiert den browserabhängigen MIME-Typ %j bei einer .ics-Datei',
    async (type) => {
      const parser = vi.fn().mockReturnValue({ events: [normalizedEvent], issues: [] })
      await expect(
        importCalendarFile(file('kalender.ICS', 'Inhalt', type), parser),
      ).resolves.toMatchObject({ ok: true })
    },
  )

  it('meldet eine leere Datei, ohne den Parser aufzurufen', async () => {
    const parser = vi.fn()
    await expect(importCalendarFile(file('leer.ics', '  \n'), parser)).resolves.toMatchObject({
      ok: false,
      code: 'empty-file',
    })
    expect(parser).not.toHaveBeenCalled()
  })

  it('unterscheidet ungültige Kalender von gültigen Kalendern ohne Termine', async () => {
    await expect(importCalendarFile(file('defekt.ics', 'kein Kalender'))).resolves.toMatchObject({
      ok: false,
      code: 'invalid-calendar',
    })
    await expect(
      importCalendarFile(file('leer.ics', 'BEGIN:VCALENDAR\nVERSION:2.0\nEND:VCALENDAR')),
    ).resolves.toMatchObject({ ok: false, code: 'no-events' })
  })

  it('meldet nicht verarbeitbare Termine als fehlende auswertbare Termine', async () => {
    const source = [
      'BEGIN:VCALENDAR',
      'BEGIN:VEVENT',
      'UID:defekt',
      'DTSTART:kein-datum',
      'DTEND:20240108T100000Z',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\n')
    await expect(importCalendarFile(file('defekt.ics', source))).resolves.toMatchObject({
      ok: false,
      code: 'no-events',
    })
  })

  it('übersetzt Lese- und unerwartete Parserfehler in verständliche Ergebnisse', async () => {
    const unreadable = {
      name: 'kalender.ics',
      type: 'text/calendar',
      text: vi.fn().mockRejectedValue(new Error('technischer Lesefehler')),
    } as unknown as File
    await expect(importCalendarFile(unreadable)).resolves.toMatchObject({
      ok: false,
      code: 'read-error',
    })

    const parser = vi.fn(() => {
      throw new Error('technischer Parserfehler')
    })
    await expect(importCalendarFile(file('kalender.ics', 'Inhalt'), parser)).resolves.toMatchObject(
      {
        ok: false,
        code: 'unexpected-error',
      },
    )
  })
})
