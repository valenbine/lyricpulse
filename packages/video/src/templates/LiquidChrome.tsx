import { useCurrentFrame, useVideoConfig } from 'remotion'
import type { LyricVideoConfig } from '@lyricpulse/core'
import {
  getAnalysisFrame,
  getCurrentLyricLine,
  getPlaybackTime
} from '../helpers'
import { TemplateShell } from '../components/TemplateShell'
import { CaptionPanel, FloatingCover } from './visual-utils'

export function LiquidChrome({ config }: { config: LyricVideoConfig }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const time = getPlaybackTime(frame, fps)
  const analysisFrame = getAnalysisFrame(config.analysis.frames, time)
  const lyricLine = getCurrentLyricLine(config.lyrics, time)
  const isWide = config.ratio === '16:9'
  const coverSize = isWide ? 420 : 520
  const blobShift = Math.sin(frame / 27) * 44

  return (
    <TemplateShell config={config} variant="neon">
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              left: isWide ? 90 + index * 420 : -80 + index * 260,
              top: isWide ? 130 + index * 150 : 130 + index * 310,
              width: isWide ? 520 : 620,
              height: isWide ? 300 : 400,
              borderRadius: '55% 45% 62% 38%',
              background: `linear-gradient(135deg, rgba(255,255,255,0.9), ${config.theme.accentColor}88, rgba(15,23,42,0.25))`,
              filter: 'blur(12px)',
              opacity: 0.2 + analysisFrame.treble * 0.22,
              transform: `translate(${blobShift * (index + 1)}px, ${-blobShift / 2}px) rotate(${frame * 0.08 + index * 30}deg)`
            }}
          />
        ))}
        <FloatingCover
          config={config}
          left={isWide ? 150 : (1080 - coverSize) / 2}
          top={isWide ? 300 : 260}
          size={coverSize}
          radius={92}
          scale={1 + analysisFrame.bass * 0.045}
        />
        <div
          style={{
            position: 'absolute',
            left: isWide ? 720 : 78,
            right: isWide ? 118 : 78,
            top: isWide ? 190 : 860,
            fontSize: isWide ? 88 : 102,
            fontWeight: 950,
            letterSpacing: '-0.08em',
            lineHeight: 0.9,
            color: '#F8FAFC',
            textShadow: `0 0 42px ${config.theme.accentColor}`
          }}
        >
          {config.title ?? ' '}
        </div>
        <CaptionPanel
          config={config}
          text={lyricLine?.text}
          left={isWide ? 720 : 76}
          right={isWide ? 118 : 76}
          top={isWide ? 500 : 1120}
          align={isWide ? 'left' : 'center'}
          fontSize={isWide ? 72 : 86}
        />
      </div>
    </TemplateShell>
  )
}
