import { describe, expect, it } from 'vitest'
import { parseIcs } from './icsParser'

function calendar(...events: string[]): string {
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', ...events, 'END:VCALENDAR'].join('\r\n')
}

function vevent(...properties: string[]): string {
  return ['BEGIN:VEVENT', ...properties, 'END:VEVENT'].join('\r\n')
}

describe('parseIcs', () => {
  it('normalisiert einen üblichen Termin vollständig in das interne Modell', () => {
    const result = parseIcs(
      calendar(
        vevent(
          'UID:meeting-1',
          'SUMMARY:Planung',
          'DESCRIPTION:Quartalsplanung\\nMit Team',
          'LOCATION:Raum 1',
          'DTSTART:20240108T090000Z',
          'DTEND:20240108T103000Z',
          'STATUS:CONFIRMED',
          'ORGANIZER;CN=Erika Muster:mailto:erika@example.com',
          'ATTENDEE;CN=Max:mailto:max@example.com',
          'ATTENDEE:mailto:lisa@example.com',
        ),
      ),
    )

    expect(result.issues).toEqual([])
    expect(result.events).toEqual([
      {
        id: 'meeting-1',
        title: 'Planung',
        description: 'Quartalsplanung\nMit Team',
        location: 'Raum 1',
        startTime: new Date('2024-01-08T09:00:00Z'),
        endTime: new Date('2024-01-08T10:30:00Z'),
        durationMinutes: 90,
        isAllDay: false,
        status: 'confirmed',
        organizer: { name: 'Erika Muster', email: 'erika@example.com' },
        attendees: [
          { name: 'Max', email: 'max@example.com' },
          { name: null, email: 'lisa@example.com' },
        ],
      },
    ])
  })

  it('setzt fehlende Textfelder und Personen konsistent auf Fallback beziehungsweise null', () => {
    const result = parseIcs(
      calendar(vevent('UID:minimal', 'DTSTART:20240108T090000Z', 'DTEND:20240108T100000Z')),
    )

    expect(result.events[0]).toMatchObject({
      title: 'Ohne Titel',
      description: null,
      location: null,
      organizer: null,
      attendees: [],
      status: 'unknown',
    })
  })

  it('erkennt ganztägige und über Mitternacht laufende Termine', () => {
    const result = parseIcs(
      calendar(
        vevent('UID:all-day', 'DTSTART;VALUE=DATE:20240108', 'DTEND;VALUE=DATE:20240109'),
        vevent(
          'UID:overnight',
          'DTSTART:20240108T230000Z',
          'DTEND:20240109T010000Z',
        ),
      ),
    )

    expect(result.events.map(({ id, isAllDay, durationMinutes }) => ({ id, isAllDay, durationMinutes }))).toEqual([
      { id: 'all-day', isAllDay: true, durationMinutes: 1440 },
      { id: 'overnight', isAllDay: false, durationMinutes: 120 },
    ])
  })

  it('erhält absolute Zeitpunkte bei unterschiedlichen Zeitzonen', () => {
    const result = parseIcs(
      calendar(
        vevent(
          'UID:timezone',
          'DTSTART;TZID=Europe/Berlin:20240108T100000',
          'DTEND;TZID=America/New_York:20240108T100000',
        ),
      ),
    )

    expect(result.events[0].startTime.toISOString()).toBe('2024-01-08T09:00:00.000Z')
    expect(result.events[0].endTime.toISOString()).toBe('2024-01-08T15:00:00.000Z')
    expect(result.events[0].durationMinutes).toBe(360)
  })

  it('berechnet einen Termin über den Sommerzeitwechsel als absolute Dauer', () => {
    const result = parseIcs(
      calendar(
        vevent(
          'UID:dst',
          'DTSTART;TZID=Europe/Berlin:20240331T013000',
          'DTEND;TZID=Europe/Berlin:20240331T033000',
        ),
      ),
    )

    expect(result.events[0].durationMinutes).toBe(60)
  })

  it('übernimmt abgesagte Termine, Organisatoren ohne Namen und Teilnehmer ohne E-Mail', () => {
    const result = parseIcs(
      calendar(
        vevent(
          'UID:cancelled',
          'DTSTART:20240108T090000Z',
          'DTEND:20240108T100000Z',
          'STATUS:CANCELLED',
          'ORGANIZER:mailto:orga@example.com',
          'ATTENDEE;CN=Nur Name:urn:uuid:123',
        ),
      ),
    )

    expect(result.events[0]).toMatchObject({
      status: 'cancelled',
      organizer: { name: null, email: 'orga@example.com' },
      attendees: [{ name: 'Nur Name', email: null }],
    })
  })

  it.each([
    {
      name: 'fehlender Start',
      properties: ['UID:no-start', 'DTEND:20240108T100000Z'],
      code: 'missing-start',
    },
    {
      name: 'fehlendes Ende',
      properties: ['UID:no-end', 'DTSTART:20240108T090000Z'],
      code: 'missing-end',
    },
    {
      name: 'ungültiges Datum',
      properties: ['UID:invalid', 'DTSTART:20240230T090000Z', 'DTEND:20240230T100000Z'],
      code: 'invalid-start',
    },
    {
      name: 'Ende vor Start',
      properties: ['UID:negative', 'DTSTART:20240108T100000Z', 'DTEND:20240108T090000Z'],
      code: 'non-positive-duration',
    },
  ])('verwirft $name kontrolliert', ({ properties, code }) => {
    const result = parseIcs(calendar(vevent(...properties)))

    expect(result.events).toEqual([])
    expect(result.issues).toHaveLength(1)
    expect(result.issues[0].code).toBe(code)
  })

  it('normalisiert mehrere Termine und macht doppelte Kennungen deterministisch eindeutig', () => {
    const result = parseIcs(
      calendar(
        vevent('UID:duplicate', 'DTSTART:20240108T090000Z', 'DTEND:20240108T100000Z'),
        vevent('UID:duplicate', 'DTSTART:20240109T090000Z', 'DTEND:20240109T100000Z'),
      ),
    )

    expect(result.events.map((event) => event.id)).toEqual(['duplicate', 'duplicate#2'])
  })

  it('liefert ausschließlich interne Modellfelder und keine Parserstrukturen', () => {
    const result = parseIcs(
      calendar(vevent('UID:model', 'DTSTART:20240108T090000Z', 'DTEND:20240108T100000Z')),
    )

    expect(Object.keys(result.events[0]).sort()).toEqual(
      [
        'attendees',
        'description',
        'durationMinutes',
        'endTime',
        'id',
        'isAllDay',
        'location',
        'organizer',
        'startTime',
        'status',
        'title',
      ].sort(),
    )
  })

  it('meldet Dateien ohne vollständigen Kalenderblock', () => {
    expect(parseIcs('BEGIN:VEVENT\nEND:VEVENT')).toMatchObject({
      events: [],
      issues: [{ code: 'invalid-calendar', sourceIndex: null }],
    })
  })
})
