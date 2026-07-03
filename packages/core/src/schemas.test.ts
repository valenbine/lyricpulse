import { describe, expect, it } from 'vitest'
import {
  lyricVideoConfigSchema,
  renderJobSchema,
  renderJobRequestSchema,
  uploadMetadataSchema
} from './schemas'

const analysis = {
  duration: 120,
  bpm: 128,
  beats: [0.5, 1.25],
  frames: [
    {
      time: 0,
      rms: 0.2,
      loudness: -16,
      bass: 0.4,
      mid: 0.3,
      treble: 0.2
    }
  ]
}

const config = {
  projectId: 'project-1',
  ratio: '9:16',
  renderQuality: 'standard',
  templateId: 'PulseCover',
  title: 'Song Title',
  artist: 'Artist',
  artistEnglish: 'ARTIST',
  audioAssetId: 'asset-audio',
  audioUrl: 'https://example.com/audio.mp3',
  coverAssetId: 'asset-cover',
  coverUrl: 'https://example.com/cover.jpg',
  lyrics: [
    {
      id: 'line-1',
      startTime: 0,
      text: 'First line'
    }
  ],
  analysis,
  theme: {
    primaryColor: '#ffffff',
    accentColor: '#8b5cf6',
    backgroundIntensity: 0.8,
    fontFamily: 'Inter'
  },
  effect: {
    lyricGlow: 0.7,
    pulseIntensity: 0.8,
    beatImpact: 0.6,
    stageLighting: 0.75
  }
}

describe('schemas', () => {
  it('validates upload metadata', () => {
    expect(
      uploadMetadataSchema.parse({
        kind: 'audio',
        filename: 'song.mp3',
        sizeBytes: 1024,
        mimeType: 'audio/mpeg'
      })
    ).toEqual({
      kind: 'audio',
      filename: 'song.mp3',
      sizeBytes: 1024,
      mimeType: 'audio/mpeg'
    })
  })

  it('validates lyric video config', () => {
    expect(lyricVideoConfigSchema.parse(config)).toEqual(config)
  })

  it('rejects unsupported template ids', () => {
    expect(() =>
      lyricVideoConfigSchema.parse({ ...config, templateId: 'Unknown' })
    ).toThrow()
  })

  it('validates render job requests', () => {
    expect(
      renderJobRequestSchema.parse({ projectId: 'project-1', config })
    ).toEqual({ projectId: 'project-1', config })
  })

  it('fills default stage lighting for legacy configs', () => {
    const parsed = lyricVideoConfigSchema.parse({
      ...config,
      effect: {
        lyricGlow: 0.7,
        pulseIntensity: 0.8,
        beatImpact: 0.6
      }
    })

    expect(parsed.effect.stageLighting).toBe(0.75)
  })

  it('fills default render quality for legacy configs', () => {
    const parsed = lyricVideoConfigSchema.parse({
      ...config,
      renderQuality: undefined
    })

    expect(parsed.renderQuality).toBe('standard')
  })

  it('accepts extended render job lifecycle fields', () => {
    const parsed = renderJobSchema.parse({
      id: 'job-1',
      projectId: 'project-1',
      config,
      status: 'rendering',
      currentStep: 'muxing-audio',
      progress: 0.75,
      createdAt: '2026-06-22T00:00:00.000Z',
      queuedAt: '2026-06-22T00:00:01.000Z',
      startedAt: '2026-06-22T00:00:02.000Z',
      heartbeatAt: '2026-06-22T00:00:03.000Z',
      lastProgressAt: '2026-06-22T00:00:04.000Z',
      updatedAt: '2026-06-22T00:00:05.000Z'
    })

    expect(parsed.currentStep).toBe('muxing-audio')
    expect(parsed.heartbeatAt).toBe('2026-06-22T00:00:03.000Z')
  })
})
