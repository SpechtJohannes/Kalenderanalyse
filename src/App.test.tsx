import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'

const validCalendar = [
  'BEGIN:VCALENDAR',
  'VERSION:2.0',
  'BEGIN:VEVENT',
  'UID:dashboard-event',
  'SUMMARY:Planung',
  'DTSTART:20240108T090000Z',
  'DTEND:20240108T103000Z',
  'END:VEVENT',
  'END:VCALENDAR',
].join('\n')

function file(name: string, content: string): File {
  return {
    name,
    type: 'text/calendar',
    text: vi.fn().mockResolvedValue(content),
  } as unknown as File
}

async function select(calendarFile: File) {
  await act(async () => {
    fireEvent.change(screen.getByLabelText('ICS-Datei auswählen'), {
      target: { files: [calendarFile] },
    })
  })
}

function metricCard(name: string): HTMLElement {
  const result = screen.getByRole('heading', { name }).closest('article')
  if (!result) throw new Error(`Kennzahlenkarte „${name}“ wurde nicht gefunden.`)
  return result
}

describe('App', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-08T12:00:00+01:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('zeigt die Anwendung und das Dashboard', () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: /kalenderanalyse/i })).toBeInTheDocument()
    expect(
      screen.getByText('Importiere zuerst einen Kalender, um Diagramme und Kennzahlen anzuzeigen.'),
    ).toBeInTheDocument()
  })

  it('aktualisiert die Dashboard-Karten nach einem erfolgreichen Import', async () => {
    render(<App />)

    await select(file('dashboard.ics', validCalendar))
    expect(screen.getByText('1 Termin erfolgreich importiert.')).toBeInTheDocument()

    expect(within(metricCard('Termine')).getByText('1')).toBeInTheDocument()
    expect(metricCard('Meetingzeit')).toHaveTextContent('1 Std. 30 Min.')
    expect(metricCard('Durchschnittliche Meetingdauer')).toHaveTextContent('1 Std. 30 Min.')
  })

  it('entfernt veraltete Dashboard-Werte nach einem fehlgeschlagenen Neuimport', async () => {
    render(<App />)

    await select(file('gültig.ics', validCalendar))
    expect(screen.getByText('1 Termin erfolgreich importiert.')).toBeInTheDocument()
    expect(within(metricCard('Termine')).getByText('1')).toBeInTheDocument()

    await select(file('defekt.ics', 'kein Kalender'))
    expect(screen.getByRole('alert')).toBeInTheDocument()

    expect(screen.queryByRole('heading', { name: 'Termine' })).not.toBeInTheDocument()
    expect(
      screen.getByText('Importiere zuerst einen Kalender, um Diagramme und Kennzahlen anzuzeigen.'),
    ).toBeInTheDocument()
  })
})
