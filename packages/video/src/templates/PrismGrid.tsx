import { useCurrentFrame, useVideoConfig } from 'remotion'
import type { LyricVideoConfig } from '@lyricpulse/core'
import {
  getAnalysisFrame,
  getCurrentLyricLine,
  getPlaybackTime
} from '../helpers'
import { TemplateShell } from '../components/TemplateShell'
import { CaptionPanel, FloatingCover } from './visual-utils'

export function PrismGrid({ config }: { config: LyricVideoConfig }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const time = getPlaybackTime(frame, fps)
  const analysisFrame = getAnalysisFrame(config.analysis.frames, time)
  const lyricLine = getCurrentLyricLine(config.lyrics, time)
  const isWide = config.ratio === '16:9'
  const coverSize = isWide ? 390 : 500

  return (
    <TemplateShell config={config} variant="dashboard">
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {[0, 1, 2, 3, 4].map((index) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              left: isWide ? 160 + index * 270 : 60 + (index % 2) * 500,
              top: isWide ? 120 + (index % 2) * 250 : 120 + index * 230,
              width: isWide ? 320 : 420,
              height: isWide ? 240 : 320,
              clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)',
              background: `linear-gradient(135deg, ${config.theme.accentColor}50, #38BDF844, transparent)`,
              opacity: 0.28 + analysisFrame.treble * 0.18,
              transform: `rotate(${index * 22 + frame * 0.08}deg)`,
              filter: 'blur(0.4px)'
            }}
          />
        ))}
        <FloatingCover
          config={config}
          left={isWide ? 170 : (1080 - coverSize) / 2}
          top={isWide ? 310 : 260}
          size={coverSize}
          radius={36}
          rotate={isWide ? 6 : 0}
          scale={1 + analysisFrame.bass * 0.04}
        />
        <div
          style={{
            position: 'absolute',
            left: isWide ? 660 : 78,
            right: isWide ? 110 : 78,
            top: isWide ? 175 : 840,
            color: '#F8FAFC',
            fontSize: isWide ? 86 : 96,
            fontWeight: 950,
            letterSpacing: '-0.08em',
            lineHeight: 0.92,
            textTransform: 'uppercase'
          }}
        >
          {config.title ?? ' '}
        </div>
        <CaptionPanel
          config={config}
          text={lyricLine?.text}
          left={isWide ? 660 : 76}
          right={isWide ? 110 : 76}
          top={isWide ? 500 : 1100}
          align={isWide ? 'left' : 'center'}
          fontSize={isWide ? 72 : 86}
        />
      </div>
    </TemplateShell>
  )
}
