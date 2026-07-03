import { useCurrentFrame, useVideoConfig } from 'remotion'
import type { LyricVideoConfig } from '@lyricpulse/core'
import {
  getAnalysisFrame,
  getCurrentLyricLine,
  getPlaybackTime
} from '../helpers'
import { TemplateShell } from '../components/TemplateShell'
import { CaptionPanel, FloatingCover } from './visual-utils'

export function OrigamiCinema({ config }: { config: LyricVideoConfig }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const time = getPlaybackTime(frame, fps)
  const analysisFrame = getAnalysisFrame(config.analysis.frames, time)
  const lyricLine = getCurrentLyricLine(config.lyrics, time)
  const isWide = config.ratio === '16:9'
  const coverSize = isWide ? 400 : 520

  return (
    <TemplateShell config={config} variant="waveform">
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {[0, 1, 2, 3, 4].map((index) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              left: isWide ? index * 360 - 80 : -120 + (index % 2) * 600,
              top: isWide ? 120 + (index % 2) * 290 : 100 + index * 310,
              width: isWide ? 520 : 620,
              height: isWide ? 340 : 420,
              clipPath: 'polygon(50% 0, 100% 100%, 0 72%)',
              background: index % 2 === 0 ? `${config.theme.accentColor}42` : 'rgba(248,250,252,0.16)',
              transform: `rotate(${index * 18 + Math.sin(frame / 40) * 4}deg)`,
              boxShadow: '0 24px 60px rgba(0,0,0,0.18)'
            }}
          />
        ))}
        <FloatingCover
          config={config}
          left={isWide ? 170 : (1080 - coverSize) / 2}
          top={isWide ? 300 : 250}
          size={coverSize}
          radius={18}
          rotate={isWide ? 8 : -3}
          scale={1 + analysisFrame.bass * 0.035}
        />
        <div
          style={{
            position: 'absolute',
            left: isWide ? 690 : 80,
            right: isWide ? 110 : 80,
            top: isWide ? 180 : 830,
            fontSize: isWide ? 86 : 100,
            fontWeight: 950,
            lineHeight: 0.9,
            letterSpacing: '-0.075em',
            color: '#F8FAFC'
          }}
        >
          {config.title ?? ' '}
        </div>
        <CaptionPanel
          config={config}
          text={lyricLine?.text}
          left={isWide ? 690 : 76}
          right={isWide ? 110 : 76}
          top={isWide ? 500 : 1095}
          align={isWide ? 'left' : 'center'}
          fontSize={isWide ? 72 : 86}
        />
      </div>
    </TemplateShell>
  )
}
