import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { CalendarEvent } from '../../shared/types/calendar'
import { CalendarFeature } from './CalendarFeature'

const validCalendar = [
  'BEGIN:VCALENDAR',
  'VERSION:2.0',
  'BEGIN:VEVENT',
  'UID:test-event',
  'SUMMARY:Planung',
  'DTSTART:20240108T090000Z',
  'DTEND:20240108T100000Z',
  'END:VEVENT',
  'END:VCALENDAR',
].join('\n')

function file(name: string, content: string, type = 'text/calendar'): File {
  return { name, type, text: vi.fn().mockResolvedValue(content) } as unknown as File
}

function select(calendarFile?: File) {
  fireEvent.change(screen.getByLabelText('ICS-Datei auswählen'), {
    target: { files: calendarFile ? [calendarFile] : [] },
  })
}

describe('CalendarFeature', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('zeigt eine beschriftete, auf eine ICS-Datei begrenzte Dateiauswahl', () => {
    render(<CalendarFeature onImport={vi.fn()} />)

    const input = screen.getByLabelText('ICS-Datei auswählen')
    expect(input).toHaveAttribute('type', 'file')
    expect(input).toHaveAttribute('accept', '.ics,text/calendar')
    expect(input).not.toHaveAttribute('multiple')
    expect(screen.getByText(/nicht hochgeladen/i)).toBeInTheDocument()
  })

  it('importiert eine gültige Datei und gibt normalisierte Termine weiter', async () => {
    const onImport = vi.fn<(events: CalendarEvent[]) => void>()
    render(<CalendarFeature onImport={onImport} />)

    select(file('arbeit.ics', validCalendar))

    expect(screen.getByText('Ausgewählte Datei: arbeit.ics')).toBeInTheDocument()
    expect(await screen.findByRole('status')).toHaveTextContent('1 Termin erfolgreich importiert.')
    expect(onImport).toHaveBeenNthCalledWith(1, [])
    expect(onImport).toHaveBeenLastCalledWith([
      expect.objectContaining({ id: 'test-event', title: 'Planung', durationMinutes: 60 }),
    ])
  })

  it.each([
    ['falscher Dateiendung', file('arbeit.txt', validCalendar), /Dateiendung \.ics/],
    ['leerer Datei', file('leer.ics', '  '), /Datei ist leer/],
    ['ungültigem ICS-Inhalt', file('defekt.ics', 'kein Kalender'), /kein gültiger ICS-Kalender/],
    [
      'einem Kalender ohne Termine',
      file('ohne-termine.ics', 'BEGIN:VCALENDAR\nVERSION:2.0\nEND:VCALENDAR'),
      /keine auswertbaren Kalendertermine/,
    ],
  ])('zeigt einen verständlichen Fehler bei %s', async (_case, calendarFile, message) => {
    const onImport = vi.fn()
    render(<CalendarFeature onImport={onImport} />)

    select(calendarFile)

    expect(await screen.findByRole('alert')).toHaveTextContent(message)
    expect(onImport).toHaveBeenCalledWith([])
  })

  it('zeigt eine fehlende Auswahl und einen Lesefehler verständlich an', async () => {
    const onImport = vi.fn()
    const { rerender } = render(<CalendarFeature onImport={onImport} />)

    select()
    expect(screen.getByRole('alert')).toHaveTextContent('Bitte wähle eine ICS-Datei aus.')

    const unreadable = {
      name: 'arbeit.ics',
      type: 'text/calendar',
      text: vi.fn().mockRejectedValue(new Error('technischer Fehler')),
    } as unknown as File
    rerender(<CalendarFeature onImport={onImport} />)
    select(unreadable)
    expect(await screen.findByRole('alert')).toHaveTextContent('konnte nicht gelesen werden')
  })

  it('entfernt einen vorherigen Fehler nach einem erfolgreichen Import', async () => {
    render(<CalendarFeature onImport={vi.fn()} />)

    select(file('falsch.txt', validCalendar))
    expect(await screen.findByRole('alert')).toBeInTheDocument()

    select(file('richtig.ics', validCalendar))
    expect(await screen.findByRole('status')).toHaveTextContent('erfolgreich importiert')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('ersetzt bei erneutem Import die vorherigen Daten und verwendet kein Netzwerk', async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    const onImport = vi.fn<(events: CalendarEvent[]) => void>()
    render(<CalendarFeature onImport={onImport} />)

    select(file('erster.ics', validCalendar))
    await screen.findByText('1 Termin erfolgreich importiert.')

    const secondCalendar = validCalendar
      .replace('UID:test-event', 'UID:second-event')
      .replace('SUMMARY:Planung', 'SUMMARY:Retrospektive')
    select(file('zweiter.ics', secondCalendar))

    await waitFor(() =>
      expect(onImport).toHaveBeenLastCalledWith([
        expect.objectContaining({ id: 'second-event', title: 'Retrospektive' }),
      ]),
    )
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('entfernt vorherige Daten, wenn ein neuer Import fehlschlägt', async () => {
    const onImport = vi.fn<(events: CalendarEvent[]) => void>()
    render(<CalendarFeature onImport={onImport} />)

    select(file('gültig.ics', validCalendar))
    await screen.findByText('1 Termin erfolgreich importiert.')

    select(file('defekt.ics', 'kein Kalender'))

    expect(await screen.findByRole('alert')).toHaveTextContent('kein gültiger ICS-Kalender')
    expect(onImport).toHaveBeenLastCalledWith([])
  })

  it('behält gültige Termine und weist auf nicht verarbeitbare Einträge hin', async () => {
    const onImport = vi.fn()
    const partiallyInvalid = validCalendar.replace(
      'END:VCALENDAR',
      [
        'BEGIN:VEVENT',
        'UID:invalid-event',
        'DTSTART:kein-datum',
        'DTEND:20240108T120000Z',
        'END:VEVENT',
        'END:VCALENDAR',
      ].join('\n'),
    )
    render(<CalendarFeature onImport={onImport} />)

    select(file('teilweise.ics', partiallyInvalid))

    expect(await screen.findByRole('status')).toHaveTextContent(
      '1 Termin importiert. Ein Eintrag konnte nicht verarbeitet werden.',
    )
    expect(onImport).toHaveBeenLastCalledWith([expect.objectContaining({ id: 'test-event' })])
  })
})
