import { useCurrentFrame, useVideoConfig } from 'remotion'
import type { LyricVideoConfig } from '@lyricpulse/core'
import {
  getAnalysisFrame,
  getCurrentLyricLine,
  getPlaybackTime
} from '../helpers'
import { TemplateShell } from '../components/TemplateShell'
import { CaptionPanel, FloatingCover } from './visual-utils'

export function DesertMirage({ config }: { config: LyricVideoConfig }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const time = getPlaybackTime(frame, fps)
  const analysisFrame = getAnalysisFrame(config.analysis.frames, time)
  const lyricLine = getCurrentLyricLine(config.lyrics, time)
  const isWide = config.ratio === '16:9'
  const coverSize = isWide ? 380 : 500

  return (
    <TemplateShell config={config} variant="pulse">
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: 'linear-gradient(180deg, #FCD34D, #FB923C 48%, #7C2D12)' }}>
        {[0, 1, 2, 3].map((index) => (
          <div key={index} style={{ position: 'absolute', left: -120, right: -120, bottom: isWide ? -80 + index * 115 : 170 + index * 150, height: isWide ? 210 : 260, borderRadius: '50% 50% 0 0', background: index % 2 === 0 ? 'rgba(120,53,15,0.72)' : 'rgba(253,186,116,0.46)', transform: `translateX(${Math.sin(frame / 50 + index) * 36}px)` }} />
        ))}
        <FloatingCover config={config} left={isWide ? 170 : (1080 - coverSize) / 2} top={isWide ? 265 : 240} size={coverSize} radius={999} circle scale={1 + analysisFrame.bass * 0.025} />
        <div style={{ position: 'absolute', left: isWide ? 700 : 82, right: isWide ? 120 : 82, top: isWide ? 190 : 800, color: '#FFF7ED', fontSize: isWide ? 86 : 100, fontWeight: 950, letterSpacing: '-0.08em', lineHeight: 0.9, textShadow: '0 8px 26px rgba(0,0,0,0.42)' }}>
          {config.title ?? ' '}
        </div>
        <CaptionPanel config={config} text={lyricLine?.text} left={isWide ? 700 : 76} right={isWide ? 120 : 76} top={isWide ? 500 : 1080} align={isWide ? 'left' : 'center'} fontSize={isWide ? 72 : 86} />
      </div>
    </TemplateShell>
  )
}
