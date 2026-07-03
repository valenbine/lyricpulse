import type { LrcParseIssue, LrcParseResult, LyricLine } from './types'

const timestampPattern = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/g
const anyBracketedTimestampPattern = /\[[^\]]*\d+:[^\]]*\]/
const artistSeparatorPattern = /(?:feat\.?|ft\.?|with|and| x | × |\/|\\|,|，|、|&|\+)/gi
const sectionLabelPattern = /^(?:(?:主歌|副歌|导歌|预副歌|桥段|间奏|前奏|尾奏|结尾|verse|chorus|pre\s*-?\s*chorus|bridge|intro|outro|interlude)\s*[一二三四五六七八九十\d]*)$/iu

export function parseLrc(input: string): LrcParseResult {
  const issues: LrcParseIssue[] = []
  const parsedLines: Array<LyricLine & { sourceIndex: number }> = []
  const sourceLines = input.split(/\r?\n/)

  sourceLines.forEach((sourceLine, sourceIndex) => {
    const lineNumber = sourceIndex + 1
    const matches = [...sourceLine.matchAll(timestampPattern)]

    if (matches.length === 0) {
      const trimmed = sourceLine.trim()

      if (trimmed.length > 0 && anyBracketedTimestampPattern.test(trimmed)) {
        issues.push({
          lineNumber,
          content: sourceLine,
          message: 'Malformed LRC timestamp'
        })
      }

      return
    }

    const lyricText = normalizeLyricText(
      sourceLine.replace(timestampPattern, '').trim()
    )

    matches.forEach((match, matchIndex) => {
      const startTime = timestampToSeconds(match)

      if (startTime === undefined) {
        issues.push({
          lineNumber,
          content: sourceLine,
          message: 'Malformed LRC timestamp'
        })
        return
      }

      parsedLines.push({
        id: `lrc-${lineNumber}-${matchIndex + 1}`,
        startTime,
        text: lyricText,
        sourceIndex
      })
    })
  })

  const sortedLines = [...parsedLines]
    .sort((left, right) => {
      if (left.startTime !== right.startTime) {
        return left.startTime - right.startTime
      }

      return left.sourceIndex - right.sourceIndex
    })
    .map((line, index, lines) => {
      const { sourceIndex, ...lyricLine } = line
      void sourceIndex

      return {
        ...lyricLine,
        endTime: lines[index + 1]?.startTime
      }
    })

  return {
    lines: sortedLines,
    issues
  }
}

function normalizeLyricText(value: string) {
  const normalized = value.replace(/[【\[（(]\s*|\s*[】\]）)]/g, '').trim()

  return sectionLabelPattern.test(normalized) ? '' : value
}

export function filterLyricsByArtistName(
  lyrics: LyricLine[],
  artistName?: string
) {
  const aliases = buildArtistAliases(artistName)

  if (aliases.length === 0) {
    return lyrics
  }

  return lyrics.filter((line) => {
    const normalizedLyric = normalizeArtistToken(line.text)

    return aliases.every((alias) => !normalizedLyric.includes(alias))
  })
}

export function formatArtistDisplay(artistName?: string, artistEnglish?: string) {
  const primary = artistName?.trim()
  const secondary = artistEnglish?.trim()

  if (primary && secondary) {
    return `${primary}${secondary}`
  }

  return primary || secondary || undefined
}

export function syncLyricLineTimings(lines: LyricLine[]) {
  return lines.map((line, index) => ({
    ...line,
    endTime: lines[index + 1]?.startTime
  }))
}

export function shiftLyricLineStartTime(
  lines: LyricLine[],
  index: number,
  delta: number,
  options: {
    minGap: number
    maxTime?: number
  }
) {
  const target = lines[index]

  if (!target) {
    return lines
  }

  const previousLine = lines[index - 1]
  const nextLine = lines[index + 1]
  const minimumStart = previousLine ? previousLine.startTime + options.minGap : 0
  const maximumStart = nextLine
    ? nextLine.startTime - options.minGap
    : options.maxTime ?? Number.POSITIVE_INFINITY
  const nextStartTime = clamp(target.startTime + delta, minimumStart, maximumStart)

  if (nextStartTime === target.startTime) {
    return lines
  }

  return syncLyricLineTimings(
    lines.map((line, lineIndex) =>
      lineIndex === index
        ? { ...line, startTime: roundToMilliseconds(nextStartTime) }
        : line
    )
  )
}

function timestampToSeconds(match: RegExpMatchArray): number | undefined {
  const minutes = Number(match[1])
  const seconds = Number(match[2])
  const fraction = match[3] ?? '0'

  if (
    !Number.isInteger(minutes) ||
    !Number.isInteger(seconds) ||
    seconds > 59
  ) {
    return undefined
  }

  const milliseconds = Number(fraction.padEnd(3, '0'))

  return minutes * 60 + seconds + milliseconds / 1000
}

function buildArtistAliases(artistName?: string) {
  if (!artistName) {
    return []
  }

  const rawTokens = [artistName, ...artistName.split(artistSeparatorPattern)]
  const aliases = rawTokens
    .map(normalizeArtistToken)
    .filter((token) => token.length >= 2)

  return [...new Set(aliases)]
}

function normalizeArtistToken(value: string) {
  return value.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '')
}

function clamp(value: number, minimum: number, maximum: number) {
  if (maximum < minimum) {
    return minimum
  }

  return Math.max(minimum, Math.min(maximum, value))
}

function roundToMilliseconds(value: number) {
  return Math.round(value * 1000) / 1000
}
