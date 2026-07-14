import { useRef, useState, type ChangeEvent } from 'react'
import { SectionCard } from '../../shared/components/SectionCard'
import type { CalendarEvent } from '../../shared/types/calendar'
import './CalendarFeature.css'
import { ICS_FILE_ACCEPT, importCalendarFile } from './services/calendarFileImport'

type CalendarFeatureProps = {
  onImport: (events: CalendarEvent[]) => void
}

type ImportStatus =
  | { kind: 'idle' }
  | { kind: 'loading'; message: string }
  | { kind: 'success' | 'warning' | 'error'; message: string }

export function CalendarFeature({ onImport }: CalendarFeatureProps) {
  const [fileName, setFileName] = useState<string | null>(null)
  const [status, setStatus] = useState<ImportStatus>({ kind: 'idle' })
  const importSequence = useRef(0)

  async function handleFileSelection(event: ChangeEvent<HTMLInputElement>) {
    const sequence = importSequence.current + 1
    importSequence.current = sequence
    const file = event.target.files?.[0]

    onImport([])
    if (!file) {
      setFileName(null)
      setStatus({ kind: 'error', message: 'Bitte wähle eine ICS-Datei aus.' })
      return
    }

    setFileName(file.name)
    setStatus({ kind: 'loading', message: `${file.name} wird importiert …` })
    const result = await importCalendarFile(file)
    if (sequence !== importSequence.current) return

    if (!result.ok) {
      setStatus({ kind: 'error', message: result.message })
      return
    }

    onImport(result.events)
    const eventLabel = result.events.length === 1 ? 'Termin' : 'Termine'
    if (result.issues.length > 0) {
      const issueMessage =
        result.issues.length === 1
          ? 'Ein Eintrag konnte nicht verarbeitet werden.'
          : `${result.issues.length} Einträge konnten nicht verarbeitet werden.`
      setStatus({
        kind: 'warning',
        message: `${result.events.length} ${eventLabel} importiert. ${issueMessage}`,
      })
      return
    }
    setStatus({
      kind: 'success',
      message: `${result.events.length} ${eventLabel} erfolgreich importiert.`,
    })
  }

  return (
    <SectionCard
      title="Kalender importieren"
      description="Wähle eine lokale ICS-Datei aus. Sie wird ausschließlich in deinem Browser verarbeitet und nicht hochgeladen."
      status="Verfügbar"
    >
      <div className="calendar-import">
        <label htmlFor="calendar-file">ICS-Datei auswählen</label>
        <input
          id="calendar-file"
          name="calendar-file"
          type="file"
          accept={ICS_FILE_ACCEPT}
          onChange={(event) => void handleFileSelection(event)}
        />
        {fileName && <p className="calendar-import__file">Ausgewählte Datei: {fileName}</p>}
        {status.kind !== 'idle' && (
          <p
            className={`calendar-import__status calendar-import__status--${status.kind}`}
            role={status.kind === 'error' ? 'alert' : 'status'}
            aria-live="polite"
          >
            {status.message}
          </p>
        )}
      </div>
    </SectionCard>
  )
}
