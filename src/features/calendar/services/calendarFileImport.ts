import type { CalendarEvent } from '../../../shared/types/calendar'
import { parseIcs, type CalendarImportIssue, type CalendarImportResult } from './icsParser'

export const ICS_FILE_ACCEPT = '.ics,text/calendar'

export type CalendarFileImportErrorCode =
  | 'invalid-file-type'
  | 'read-error'
  | 'empty-file'
  | 'invalid-calendar'
  | 'no-events'
  | 'unexpected-error'

export type CalendarFileImportResult =
  | {
      ok: true
      events: CalendarEvent[]
      issues: CalendarImportIssue[]
    }
  | {
      ok: false
      code: CalendarFileImportErrorCode
      message: string
    }

type CalendarParser = (source: string) => CalendarImportResult

const ALLOWED_MIME_TYPES = new Set([
  '',
  'text/calendar',
  'text/plain',
  'application/ics',
  'application/octet-stream',
])

function validateFileType(file: File): CalendarFileImportResult | null {
  const hasIcsExtension = file.name.toLocaleLowerCase().endsWith('.ics')
  const hasSupportedMimeType = ALLOWED_MIME_TYPES.has(file.type.toLocaleLowerCase())

  if (!hasIcsExtension || !hasSupportedMimeType) {
    return {
      ok: false,
      code: 'invalid-file-type',
      message: 'Bitte wähle eine ICS-Datei mit der Dateiendung .ics aus.',
    }
  }

  return null
}

export async function importCalendarFile(
  file: File,
  parser: CalendarParser = parseIcs,
): Promise<CalendarFileImportResult> {
  const typeError = validateFileType(file)
  if (typeError) return typeError

  let source: string
  try {
    source = await file.text()
  } catch {
    return {
      ok: false,
      code: 'read-error',
      message: 'Die ausgewählte Datei konnte nicht gelesen werden. Bitte versuche es erneut.',
    }
  }

  if (!source.trim()) {
    return {
      ok: false,
      code: 'empty-file',
      message: 'Die ausgewählte Datei ist leer. Bitte wähle eine andere ICS-Datei aus.',
    }
  }

  try {
    const result = parser(source)
    if (result.events.length > 0) {
      return { ok: true, events: result.events, issues: result.issues }
    }
    if (result.issues.some((issue) => issue.code === 'invalid-calendar')) {
      return {
        ok: false,
        code: 'invalid-calendar',
        message: 'Die Datei scheint kein gültiger ICS-Kalender zu sein.',
      }
    }
    return {
      ok: false,
      code: 'no-events',
      message: 'Die Datei enthält keine auswertbaren Kalendertermine.',
    }
  } catch {
    return {
      ok: false,
      code: 'unexpected-error',
      message: 'Beim Import ist ein unerwarteter Fehler aufgetreten. Bitte versuche es erneut.',
    }
  }
}
