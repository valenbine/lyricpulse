import { useCurrentFrame, useVideoConfig } from 'remotion'
import type { LyricVideoConfig } from '@lyricpulse/core'
import {
  getAnalysisFrame,
  getCurrentLyricLine,
  getPlaybackTime
} from '../helpers'
import { TemplateShell } from '../components/TemplateShell'
import { TrackTitle } from '../components/TrackTitle'
import { FloatingCover } from './visual-utils'

export function GalaxyKaraoke({ config }: { config: LyricVideoConfig }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const time = getPlaybackTime(frame, fps)
  const analysisFrame = getAnalysisFrame(config.analysis.frames, time)
  const lyricLine = getCurrentLyricLine(config.lyrics, time)
  const isWide = config.ratio === '16:9'
  const coverSize = isWide ? 330 : 420
  const progress = Math.min(1, Math.max(0.08, analysisFrame.rms + 0.25))

  return (
    <TemplateShell config={config} variant="neon">
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {Array.from({ length: 34 }).map((_, index) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              left: `${(index * 37) % 100}%`,
              top: `${(index * 53 + frame * 0.2) % 100}%`,
              width: 4 + (index % 4) * 2,
              height: 4 + (index % 4) * 2,
              borderRadius: '50%',
              background: index % 2 === 0 ? '#FFFFFF' : config.theme.accentColor,
              opacity: 0.32 + analysisFrame.treble * 0.4,
              boxShadow: `0 0 18px ${config.theme.accentColor}`
            }}
          />
        ))}
        <FloatingCover
          config={config}
          left={isWide ? 160 : (1080 - coverSize) / 2}
          top={isWide ? 300 : 230}
          size={coverSize}
          radius={44}
          scale={1 + analysisFrame.bass * 0.04}
        />
        <div style={{ position: 'absolute', left: isWide ? 620 : 82, right: isWide ? 110 : 82, top: isWide ? 220 : 790 }}>
          <TrackTitle config={config} align={isWide ? 'left' : 'center'} />
        </div>
        <div
          style={{
            position: 'absolute',
            left: isWide ? 620 : 40,
            right: isWide ? 110 : 40,
            top: isWide ? 510 : 1190,
            boxSizing: 'border-box',
            padding: isWide ? '42px 46px' : '48px 42px',
            borderRadius: 999,
            background: 'rgba(2,6,23,0.38)',
            border: `2px solid ${config.theme.accentColor}55`,
            boxShadow: `0 18px 58px rgba(0,0,0,0.22), 0 0 36px ${config.theme.accentColor}20`,
            overflow: 'hidden',
            textAlign: 'center'
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: `${progress * 100}%`,
              background: `linear-gradient(90deg, ${config.theme.accentColor}55, transparent)`,
              opacity: 0.8
            }}
          />
          <div
            style={{
              position: 'relative',
              fontSize: isWide ? 76 : 72,
              display: '-webkit-box',
              WebkitLineClamp: isWide ? 2 : 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              overflowWrap: 'break-word',
              fontWeight: 950,
              letterSpacing: '-0.055em',
              color: '#F8FAFC',
              textShadow: `0 0 ${28 + analysisFrame.treble * 40}px ${config.theme.accentColor}`
            }}
          >
            {lyricLine?.text ?? ' '}
          </div>
        </div>
      </div>
    </TemplateShell>
  )
}
