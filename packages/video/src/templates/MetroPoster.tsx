import { useCurrentFrame, useVideoConfig } from 'remotion'
import type { LyricVideoConfig } from '@lyricpulse/core'
import {
  getAnalysisFrame,
  getCurrentLyricLine,
  getPlaybackTime
} from '../helpers'
import { TemplateShell } from '../components/TemplateShell'
import { CaptionPanel, FloatingCover } from './visual-utils'

export function MetroPoster({ config }: { config: LyricVideoConfig }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const time = getPlaybackTime(frame, fps)
  const analysisFrame = getAnalysisFrame(config.analysis.frames, time)
  const lyricLine = getCurrentLyricLine(config.lyrics, time)
  const isWide = config.ratio === '16:9'
  const coverSize = isWide ? 430 : 520

  return (
    <TemplateShell config={config} variant="dashboard">
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.12) 2px, transparent 2px), linear-gradient(90deg, rgba(255,255,255,0.12) 2px, transparent 2px)',
            backgroundSize: isWide ? '120px 120px' : '96px 96px',
            opacity: 0.32
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: isWide ? 112 : 72,
            top: isWide ? 90 : 92,
            fontSize: isWide ? 112 : 118,
            fontWeight: 950,
            letterSpacing: '-0.08em',
            color: config.theme.accentColor,
            lineHeight: 0.86
          }}
        >
          M{Math.floor(frame / 24) % 9}
        </div>
        <FloatingCover
          config={config}
          left={isWide ? 150 : (1080 - coverSize) / 2}
          top={isWide ? 285 : 270}
          size={coverSize}
          radius={18}
          rotate={isWide ? -2 : 0}
          scale={1 + analysisFrame.bass * 0.03}
        />
        <div
          style={{
            position: 'absolute',
            left: isWide ? 660 : 76,
            right: isWide ? 100 : 76,
            top: isWide ? 180 : 860,
            color: '#F8FAFC'
          }}
        >
          <div
            style={{
              fontSize: isWide ? 78 : 92,
              fontWeight: 950,
              letterSpacing: '-0.075em',
              lineHeight: 0.92
            }}
          >
            {config.title ?? ' '}
          </div>
          {config.artist ? (
            <div style={{ marginTop: 24, fontSize: isWide ? 32 : 42, fontWeight: 850 }}>
              {config.artist}
            </div>
          ) : null}
        </div>
        <CaptionPanel
          config={config}
          text={lyricLine?.text}
          left={isWide ? 660 : 76}
          right={isWide ? 100 : 76}
          top={isWide ? 500 : 1110}
          align={isWide ? 'left' : 'center'}
          fontSize={isWide ? 72 : 86}
        />
      </div>
    </TemplateShell>
  )
}
