import { useCurrentFrame, useVideoConfig } from 'remotion'
import type { LyricVideoConfig } from '@lyricpulse/core'
import {
  getAnalysisFrame,
  getCurrentLyricLine,
  getPlaybackTime
} from '../helpers'
import { TemplateShell } from '../components/TemplateShell'
import { CaptionPanel, FloatingCover } from './visual-utils'

export function PaperCutStage({ config }: { config: LyricVideoConfig }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const time = getPlaybackTime(frame, fps)
  const analysisFrame = getAnalysisFrame(config.analysis.frames, time)
  const lyricLine = getCurrentLyricLine(config.lyrics, time)
  const isWide = config.ratio === '16:9'
  const coverSize = isWide ? 380 : 500

  return (
    <TemplateShell config={config} variant="pulse">
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              left: isWide ? -80 + index * 280 : -160 + index * 250,
              bottom: isWide ? -80 + index * 32 : 120 + index * 110,
              width: isWide ? 700 : 780,
              height: isWide ? 320 : 380,
              borderRadius: '50% 50% 0 0',
              background: index % 2 === 0 ? config.theme.accentColor : '#38BDF8',
              opacity: 0.22 + index * 0.06,
              transform: `rotate(${index * 7 + Math.sin(frame / 38) * 2}deg)`
            }}
          />
        ))}
        <FloatingCover
          config={config}
          left={isWide ? 170 : (1080 - coverSize) / 2}
          top={isWide ? 285 : 250}
          size={coverSize}
          radius={54}
          rotate={-5}
          scale={1 + analysisFrame.bass * 0.04}
        />
        <div
          style={{
            position: 'absolute',
            left: isWide ? 690 : 78,
            right: isWide ? 120 : 78,
            top: isWide ? 190 : 830,
            color: '#F8FAFC',
            fontSize: isWide ? 82 : 96,
            fontWeight: 950,
            letterSpacing: '-0.075em',
            lineHeight: 0.92,
            textAlign: isWide ? 'left' : 'center'
          }}
        >
          {config.title ?? ' '}
        </div>
        <CaptionPanel
          config={config}
          text={lyricLine?.text}
          left={isWide ? 690 : 76}
          right={isWide ? 120 : 76}
          top={isWide ? 500 : 1090}
          align={isWide ? 'left' : 'center'}
          fontSize={isWide ? 72 : 86}
        />
      </div>
    </TemplateShell>
  )
}
