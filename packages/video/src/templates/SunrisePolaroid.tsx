import { useCurrentFrame, useVideoConfig } from 'remotion'
import type { LyricVideoConfig } from '@lyricpulse/core'
import {
  getAnalysisFrame,
  getCurrentLyricLine,
  getPlaybackTime
} from '../helpers'
import { TemplateShell } from '../components/TemplateShell'
import { CaptionPanel, FloatingCover } from './visual-utils'

export function SunrisePolaroid({ config }: { config: LyricVideoConfig }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const time = getPlaybackTime(frame, fps)
  const analysisFrame = getAnalysisFrame(config.analysis.frames, time)
  const lyricLine = getCurrentLyricLine(config.lyrics, time)
  const isWide = config.ratio === '16:9'
  const photoSize = isWide ? 410 : 460

  return (
    <TemplateShell config={config} variant="pulse">
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #FB923C, #FDE68A 45%, #0F172A 100%)' }} />
        <div
          style={{
            position: 'absolute',
            left: isWide ? 160 : 230,
            top: isWide ? 145 : 170,
            width: isWide ? 520 : 620,
            height: isWide ? 520 : 620,
            borderRadius: '50%',
            background: `radial-gradient(circle, #FFF7ED 0%, ${config.theme.accentColor}88 38%, transparent 68%)`,
            opacity: 0.68 + analysisFrame.treble * 0.18,
            transform: `translateY(${Math.sin(frame / 36) * 18}px)`
          }}
        />
        <div style={{ position: 'absolute', left: isWide ? 150 : (1080 - photoSize) / 2, top: isWide ? 285 : 220, width: photoSize, height: photoSize + 80, borderRadius: 22, background: '#FFF7ED', boxShadow: '0 34px 100px rgba(0,0,0,0.42)', transform: `rotate(${isWide ? -5 : -2}deg)` }} />
        <FloatingCover
          config={config}
          left={isWide ? 180 : (1080 - photoSize) / 2 + 30}
          top={isWide ? 315 : 250}
          size={photoSize - 60}
          radius={12}
          rotate={isWide ? -5 : -2}
          scale={1 + analysisFrame.bass * 0.025}
        />
        <div style={{ position: 'absolute', left: isWide ? 690 : 78, right: isWide ? 120 : 78, top: isWide ? 200 : 830, color: '#FFF7ED', fontSize: isWide ? 82 : 92, fontWeight: 950, letterSpacing: '-0.075em', lineHeight: 0.92, textShadow: '0 8px 30px rgba(0,0,0,0.42)' }}>
          {config.title ?? ' '}
        </div>
        <CaptionPanel config={config} text={lyricLine?.text} left={isWide ? 690 : 76} right={isWide ? 120 : 76} top={isWide ? 500 : 1090} align={isWide ? 'left' : 'center'} fontSize={isWide ? 72 : 84} />
      </div>
    </TemplateShell>
  )
}
