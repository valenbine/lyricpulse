import { describe, expect, it } from 'vitest'
import {
  filterLyricsByArtistName,
  formatArtistDisplay,
  parseLrc,
  shiftLyricLineStartTime,
  syncLyricLineTimings
} from './lrc'

describe('parseLrc', () => {
  it('parses timestamped lyric lines in chronological order', () => {
    const result = parseLrc('[00:10.50]Second line\n[00:01.00]First line')

    expect(result.issues).toEqual([])
    expect(result.lines).toEqual([
      {
        id: 'lrc-2-1',
        startTime: 1,
        endTime: 10.5,
        text: 'First line'
      },
      {
        id: 'lrc-1-1',
        startTime: 10.5,
        endTime: undefined,
        text: 'Second line'
      }
    ])
  })

  it('preserves source order for duplicate timestamps', () => {
    const result = parseLrc('[00:05.00]Alpha\n[00:05.00]Beta')

    expect(result.lines.map((line) => line.text)).toEqual(['Alpha', 'Beta'])
  })

  it('expands multiple timestamps on one lyric line', () => {
    const result = parseLrc('[00:01.00][00:03.00]Repeated line')

    expect(result.lines).toHaveLength(2)
    expect(result.lines.map((line) => line.startTime)).toEqual([1, 3])
    expect(result.lines.map((line) => line.text)).toEqual([
      'Repeated line',
      'Repeated line'
    ])
  })

  it('renders section labels as empty lyric text', () => {
    const result = parseLrc('[00:01.00]主歌一\n[00:05.00][副歌]\n[00:09.00]真正歌词')

    expect(result.lines.map((line) => line.text)).toEqual(['', '', '真正歌词'])
  })

  it('reports malformed timestamp line numbers', () => {
    const result = parseLrc('[00:99.00]Bad seconds\n[bad:line]Ignored tag')

    expect(result.lines).toEqual([])
    expect(result.issues).toEqual([
      {
        lineNumber: 1,
        content: '[00:99.00]Bad seconds',
        message: 'Malformed LRC timestamp'
      }
    ])
  })

  it('returns no lines and no issues for empty input', () => {
    expect(parseLrc('')).toEqual({ lines: [], issues: [] })
  })

  it('filters lyric lines that contain the artist name', () => {
    const lines = [
      { id: '1', startTime: 1, text: '今夜只想听周杰伦' },
      { id: '2', startTime: 2, text: '副歌继续往前走' },
      { id: '3', startTime: 3, text: 'Jay Chou on the mic' },
      { id: '4', startTime: 4, text: '最后一行保留' }
    ]

    expect(filterLyricsByArtistName(lines, '周杰伦')).toEqual([
      { id: '2', startTime: 2, text: '副歌继续往前走' },
      { id: '3', startTime: 3, text: 'Jay Chou on the mic' },
      { id: '4', startTime: 4, text: '最后一行保留' }
    ])
  })

  it('returns the original lyric list when artist name is empty', () => {
    const lines = [{ id: '1', startTime: 1, text: '普通歌词' }]

    expect(filterLyricsByArtistName(lines)).toBe(lines)
  })

  it('formats artist display with chinese name first and english name second', () => {
    expect(formatArtistDisplay('周杰伦', 'JAY CHOU')).toBe('周杰伦JAY CHOU')
    expect(formatArtistDisplay('周杰伦')).toBe('周杰伦')
    expect(formatArtistDisplay(undefined, 'JAY CHOU')).toBe('JAY CHOU')
  })

  it('synchronizes lyric end times from the next start time', () => {
    expect(
      syncLyricLineTimings([
        { id: '1', startTime: 1, endTime: 99, text: '第一句' },
        { id: '2', startTime: 2.5, endTime: 99, text: '第二句' }
      ])
    ).toEqual([
      { id: '1', startTime: 1, endTime: 2.5, text: '第一句' },
      { id: '2', startTime: 2.5, endTime: undefined, text: '第二句' }
    ])
  })

  it('shifts a lyric line within adjacent line bounds', () => {
    const lines = [
      { id: '1', startTime: 1, endTime: 3, text: '第一句' },
      { id: '2', startTime: 3, endTime: 5, text: '第二句' },
      { id: '3', startTime: 5, endTime: undefined, text: '第三句' }
    ]

    expect(
      shiftLyricLineStartTime(lines, 1, -0.5, { minGap: 0.3, maxTime: 8 })
    ).toEqual([
      { id: '1', startTime: 1, endTime: 2.5, text: '第一句' },
      { id: '2', startTime: 2.5, endTime: 5, text: '第二句' },
      { id: '3', startTime: 5, endTime: undefined, text: '第三句' }
    ])
  })

  it('clamps a lyric line when the next gap would be squeezed', () => {
    const lines = [
      { id: '1', startTime: 1, endTime: 1.6, text: '第一句' },
      { id: '2', startTime: 1.6, endTime: 2, text: '第二句' },
      { id: '3', startTime: 2, endTime: undefined, text: '第三句' }
    ]

    expect(
      shiftLyricLineStartTime(lines, 1, 0.5, { minGap: 0.3, maxTime: 8 })
    ).toEqual([
      { id: '1', startTime: 1, endTime: 1.7, text: '第一句' },
      { id: '2', startTime: 1.7, endTime: 2, text: '第二句' },
      { id: '3', startTime: 2, endTime: undefined, text: '第三句' }
    ])
  })
})
