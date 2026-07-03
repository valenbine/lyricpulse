import { useCurrentFrame, useVideoConfig } from 'remotion'
import type { LyricVideoConfig } from '@lyricpulse/core'
import {
  getAnalysisFrame,
  getCurrentLyricLine,
  getPlaybackTime
} from '../helpers'
import { TemplateShell } from '../components/TemplateShell'
import { CaptionPanel, FloatingCover } from './visual-utils'

export function BlueprintWave({ config }: { config: LyricVideoConfig }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const time = getPlaybackTime(frame, fps)
  const analysisFrame = getAnalysisFrame(config.analysis.frames, time)
  const lyricLine = getCurrentLyricLine(config.lyrics, time)
  const isWide = config.ratio === '16:9'
  const coverSize = isWide ? 360 : 460

  return (
    <TemplateShell config={config} variant="dashboard">
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#061A2D' }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(125,211,252,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(125,211,252,0.18) 1px, transparent 1px)',
            backgroundSize: isWide ? '72px 72px' : '58px 58px'
          }}
        />
        <FloatingCover
          config={config}
          left={isWide ? 170 : (1080 - coverSize) / 2}
          top={isWide ? 300 : 250}
          size={coverSize}
          radius={0}
          scale={1 + analysisFrame.bass * 0.025}
        />
        <svg
          viewBox="0 0 1000 220"
          style={{
            position: 'absolute',
            left: isWide ? 660 : 70,
            right: isWide ? 120 : 70,
            top: isWide ? 255 : 760,
            height: isWide ? 160 : 190,
            color: config.theme.accentColor,
            opacity: 0.8
          }}
        >
          <polyline
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            strokeLinejoin="round"
            points={Array.from({ length: 18 }, (_, index) => {
              const x = index * 58
              const y = 110 + Math.sin(index * 0.8 + frame / 10) * 42 * analysisFrame.mid
              return `${x},${y}`
            }).join(' ')}
          />
        </svg>
        <CaptionPanel
          config={config}
          text={lyricLine?.text}
          left={isWide ? 660 : 76}
          right={isWide ? 120 : 76}
          top={isWide ? 500 : 1040}
          align={isWide ? 'left' : 'center'}
          fontSize={isWide ? 60 : 76}
        />
      </div>
    </TemplateShell>
  )
}
