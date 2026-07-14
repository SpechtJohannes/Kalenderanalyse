import type {
  CalendarEvent,
  CalendarEventStatus,
  CalendarPerson,
} from '../../../shared/types/calendar'

type RawProperty = {
  value: string
  parameters: Record<string, string>
}

type RawCalendarEvent = {
  properties: Map<string, RawProperty[]>
  sourceIndex: number
}

export type CalendarImportIssueCode =
  | 'invalid-calendar'
  | 'missing-start'
  | 'missing-end'
  | 'invalid-start'
  | 'invalid-end'
  | 'non-positive-duration'

export type CalendarImportIssue = {
  code: CalendarImportIssueCode
  message: string
  sourceIndex: number | null
  uid: string | null
}

export type CalendarImportResult = {
  events: CalendarEvent[]
  issues: CalendarImportIssue[]
}

type ParsedDate = {
  date: Date
  isDateOnly: boolean
}

const DATE_PATTERN = /^(\d{4})(\d{2})(\d{2})$/
const DATE_TIME_PATTERN = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/

function unfoldLines(source: string): string[] {
  return source.replace(/\r\n?/g, '\n').split('\n').reduce<string[]>((lines, line) => {
    if (/^[ \t]/.test(line) && lines.length > 0) {
      lines[lines.length - 1] += line.slice(1)
    } else {
      lines.push(line)
    }
    return lines
  }, [])
}

function splitAtUnquoted(value: string, separator: string): [string, string] | null {
  let quoted = false
  for (let index = 0; index < value.length; index += 1) {
    if (value[index] === '"') quoted = !quoted
    if (!quoted && value[index] === separator) {
      return [value.slice(0, index), value.slice(index + 1)]
    }
  }
  return null
}

function parseProperty(line: string): [string, RawProperty] | null {
  const parts = splitAtUnquoted(line, ':')
  if (!parts) return null

  const [definition, value] = parts
  const [rawName, ...rawParameters] = definition.split(';')
  const parameters: Record<string, string> = {}
  for (const rawParameter of rawParameters) {
    const parameter = splitAtUnquoted(rawParameter, '=')
    if (parameter) parameters[parameter[0].toUpperCase()] = parameter[1].replace(/^"|"$/g, '')
  }

  return [rawName.toUpperCase(), { value, parameters }]
}

function parseRawEvents(source: string): RawCalendarEvent[] {
  const events: RawCalendarEvent[] = []
  let current: RawCalendarEvent | null = null

  for (const line of unfoldLines(source)) {
    if (line.toUpperCase() === 'BEGIN:VEVENT') {
      current = { properties: new Map(), sourceIndex: events.length }
      continue
    }
    if (line.toUpperCase() === 'END:VEVENT') {
      if (current) events.push(current)
      current = null
      continue
    }
    if (!current) continue

    const property = parseProperty(line)
    if (!property) continue
    const [name, data] = property
    current.properties.set(name, [...(current.properties.get(name) ?? []), data])
  }

  return events
}

function unescapeText(value: string): string {
  return value
    .replace(/\\[nN]/g, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\')
}

function getFirst(rawEvent: RawCalendarEvent, name: string): RawProperty | null {
  return rawEvent.properties.get(name)?.[0] ?? null
}

function zonedDate(parts: number[], timeZone: string): Date | null {
  try {
    const desiredUtc = Date.UTC(...(parts as [number, number, number, number, number, number]))
    let timestamp = desiredUtc
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    })

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const formatted = Object.fromEntries(
        formatter.formatToParts(new Date(timestamp)).map((part) => [part.type, part.value]),
      )
      const representedUtc = Date.UTC(
        Number(formatted.year),
        Number(formatted.month) - 1,
        Number(formatted.day),
        Number(formatted.hour),
        Number(formatted.minute),
        Number(formatted.second),
      )
      timestamp += desiredUtc - representedUtc
    }

    return new Date(timestamp)
  } catch {
    return null
  }
}

function parseDate(property: RawProperty): ParsedDate | null {
  const dateMatch = DATE_PATTERN.exec(property.value)
  if (dateMatch) {
    const [, year, month, day] = dateMatch
    const date = new Date(Number(year), Number(month) - 1, Number(day))
    if (
      date.getFullYear() !== Number(year) ||
      date.getMonth() !== Number(month) - 1 ||
      date.getDate() !== Number(day)
    ) {
      return null
    }
    return { date, isDateOnly: true }
  }

  const match = DATE_TIME_PATTERN.exec(property.value)
  if (!match) return null
  const [, year, month, day, hour, minute, second, utcMarker] = match
  const parts = [
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
  ]
  const validationDate = new Date(Date.UTC(...(parts as [number, number, number, number, number, number])))
  if (
    validationDate.getUTCFullYear() !== parts[0] ||
    validationDate.getUTCMonth() !== parts[1] ||
    validationDate.getUTCDate() !== parts[2] ||
    validationDate.getUTCHours() !== parts[3] ||
    validationDate.getUTCMinutes() !== parts[4] ||
    validationDate.getUTCSeconds() !== parts[5]
  ) {
    return null
  }
  const timeZone = property.parameters.TZID
  const date = utcMarker
    ? new Date(Date.UTC(...(parts as [number, number, number, number, number, number])))
    : timeZone
      ? zonedDate(parts, timeZone)
      : new Date(...(parts as [number, number, number, number, number, number]))

  return date && Number.isFinite(date.getTime()) ? { date, isDateOnly: false } : null
}

function normalizeStatus(value: string | undefined): CalendarEventStatus {
  switch (value?.toUpperCase()) {
    case 'CONFIRMED':
      return 'confirmed'
    case 'TENTATIVE':
      return 'tentative'
    case 'CANCELLED':
      return 'cancelled'
    default:
      return 'unknown'
  }
}

function normalizePerson(property: RawProperty | null): CalendarPerson | null {
  if (!property) return null
  const rawEmail = property.value.replace(/^mailto:/i, '').trim()
  const name = property.parameters.CN?.trim() || null
  const email = rawEmail && rawEmail.includes('@') ? rawEmail : null
  return name || email ? { name, email } : null
}

function stableFallbackId(rawEvent: RawCalendarEvent): string {
  const source = ['DTSTART', 'DTEND', 'SUMMARY']
    .map((name) => getFirst(rawEvent, name)?.value ?? '')
    .join('|')
  let hash = 2166136261
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return `generated-${(hash >>> 0).toString(16)}`
}

function issue(
  rawEvent: RawCalendarEvent,
  code: CalendarImportIssueCode,
  message: string,
): CalendarImportIssue {
  return {
    code,
    message,
    sourceIndex: rawEvent.sourceIndex,
    uid: getFirst(rawEvent, 'UID')?.value.trim() || null,
  }
}

function normalizeCalendarEvent(
  rawEvent: RawCalendarEvent,
): { event: CalendarEvent | null; issue: CalendarImportIssue | null } {
  const rawStart = getFirst(rawEvent, 'DTSTART')
  const rawEnd = getFirst(rawEvent, 'DTEND')
  if (!rawStart) return { event: null, issue: issue(rawEvent, 'missing-start', 'Startzeit fehlt.') }
  if (!rawEnd) return { event: null, issue: issue(rawEvent, 'missing-end', 'Endzeit fehlt.') }

  const start = parseDate(rawStart)
  const end = parseDate(rawEnd)
  if (!start) return { event: null, issue: issue(rawEvent, 'invalid-start', 'Startzeit ist ungültig.') }
  if (!end) return { event: null, issue: issue(rawEvent, 'invalid-end', 'Endzeit ist ungültig.') }
  if (end.date <= start.date) {
    return {
      event: null,
      issue: issue(rawEvent, 'non-positive-duration', 'Endzeit liegt nicht nach der Startzeit.'),
    }
  }

  const summary = getFirst(rawEvent, 'SUMMARY')?.value
  const description = getFirst(rawEvent, 'DESCRIPTION')?.value
  const location = getFirst(rawEvent, 'LOCATION')?.value
  const uid = getFirst(rawEvent, 'UID')?.value.trim()

  return {
    event: {
      id: uid || stableFallbackId(rawEvent),
      title: summary?.trim() ? unescapeText(summary).trim() : 'Ohne Titel',
      description: description ? unescapeText(description) : null,
      location: location ? unescapeText(location) : null,
      startTime: start.date,
      endTime: end.date,
      durationMinutes: (end.date.getTime() - start.date.getTime()) / 60_000,
      isAllDay: start.isDateOnly,
      status: normalizeStatus(getFirst(rawEvent, 'STATUS')?.value),
      organizer: normalizePerson(getFirst(rawEvent, 'ORGANIZER')),
      attendees: (rawEvent.properties.get('ATTENDEE') ?? [])
        .map((attendee) => normalizePerson(attendee))
        .filter((attendee): attendee is CalendarPerson => attendee !== null),
    },
    issue: null,
  }
}

function ensureUniqueIds(events: CalendarEvent[]): CalendarEvent[] {
  const occurrences = new Map<string, number>()
  return events.map((event) => {
    const occurrence = (occurrences.get(event.id) ?? 0) + 1
    occurrences.set(event.id, occurrence)
    return occurrence === 1 ? event : { ...event, id: `${event.id}#${occurrence}` }
  })
}

export function parseIcs(source: string): CalendarImportResult {
  if (!/BEGIN:VCALENDAR/i.test(source) || !/END:VCALENDAR/i.test(source)) {
    return {
      events: [],
      issues: [
        {
          code: 'invalid-calendar',
          message: 'Die Datei enthält keinen vollständigen VCALENDAR-Block.',
          sourceIndex: null,
          uid: null,
        },
      ],
    }
  }

  const normalized = parseRawEvents(source).map(normalizeCalendarEvent)
  return {
    events: ensureUniqueIds(
      normalized.flatMap((result) => (result.event ? [result.event] : [])),
    ),
    issues: normalized.flatMap((result) => (result.issue ? [result.issue] : [])),
  }
}
