import { Img, interpolate, useCurrentFrame, useVideoConfig } from 'remotion'
import type { LyricVideoConfig } from '@lyricpulse/core'
import {
  getAnalysisFrame,
  getCurrentLyricLine,
  getPlaybackTime
} from '../helpers'
import { LyricDisplay } from '../components/LyricDisplay'
import { TemplateShell } from '../components/TemplateShell'
import { TrackTitle } from '../components/TrackTitle'
import { isServerRender } from '../render-mode'

export function VinylEditorial({ config }: { config: LyricVideoConfig }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const time = getPlaybackTime(frame, fps)
  const analysisFrame = getAnalysisFrame(config.analysis.frames, time)
  const lyricLine = getCurrentLyricLine(config.lyrics, time)
  const isWide = config.ratio === '16:9'
  const fastRender = isServerRender(config)
  const accent = config.theme.accentColor
  const recordSize = isWide ? 560 : 640
  const recordLeft = isWide ? 126 : (1080 - recordSize) / 2
  const recordTop = isWide ? 262 : 220
  const coverSize = recordSize * 0.48
  const recordSpin = fastRender ? 0 : frame * 0.22
  const grooveOpacity = interpolate(analysisFrame.mid, [0, 1], [0.2, 0.46])

  return (
    <TemplateShell config={config} variant="pulse">
      <div
        style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: isWide ? '92px 86px' : '82px 58px',
            borderRadius: isWide ? 38 : 52,
            background:
              'linear-gradient(135deg, rgba(248,250,252,0.08), rgba(248,250,252,0.02))',
            border: '1px solid rgba(248,250,252,0.18)'
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: isWide ? 98 : 62,
            top: isWide ? 126 : 102,
            width: isWide ? 300 : 340,
            height: isWide ? 210 : 230,
            opacity: 0.08,
            backgroundImage:
              'repeating-linear-gradient(0deg, #F8FAFC 0 12px, transparent 12px 28px)'
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: recordLeft,
            top: recordTop,
            width: recordSize,
            height: recordSize,
            borderRadius: '50%',
            background: `repeating-radial-gradient(circle, #020617 0px, #020617 12px, rgba(255,255,255,${grooveOpacity}) 13px, #0F172A 15px), conic-gradient(from ${recordSpin}deg, #020617, ${accent}44, #111827, #020617)`,
            boxShadow: fastRender
              ? '0 26px 58px rgba(0,0,0,0.45)'
              : `0 38px 120px rgba(0,0,0,0.52), 0 0 90px ${accent}24`,
            transform: `scale(${1 + analysisFrame.bass * 0.04}) rotate(${recordSpin}deg)`
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: recordLeft + (recordSize - coverSize) / 2,
            top: recordTop + (recordSize - coverSize) / 2,
            width: coverSize,
            height: coverSize,
            borderRadius: '50%',
            overflow: 'hidden',
            border: '8px solid rgba(248,250,252,0.9)',
            boxShadow: '0 18px 48px rgba(0,0,0,0.46)'
          }}
        >
          {config.coverUrl ? (
            <Img
              src={config.coverUrl}
              alt={config.title ?? 'cover artwork'}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : null}
        </div>
        <div
          style={{
            position: 'absolute',
            left: isWide ? 780 : 82,
            right: isWide ? 110 : 82,
            top: isWide ? 214 : 930,
            display: 'flex',
            flexDirection: 'column',
            alignItems: isWide ? 'flex-start' : 'center',
            gap: isWide ? 42 : 34
          }}
        >
          <TrackTitle config={config} align={isWide ? 'left' : 'center'} />
          <LyricDisplay
            config={config}
            line={lyricLine}
            scale={1 + analysisFrame.rms * 0.04}
            align={isWide ? 'left' : 'center'}
          />
        </div>
      </div>
    </TemplateShell>
  )
}
