import { useCurrentFrame, useVideoConfig } from 'remotion'
import type { LyricVideoConfig } from '@lyricpulse/core'
import {
  getAnalysisFrame,
  getCurrentLyricLine,
  getPlaybackTime
} from '../helpers'
import { TemplateShell } from '../components/TemplateShell'
import { FloatingCover } from './visual-utils'

export function ComicPop({ config }: { config: LyricVideoConfig }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const time = getPlaybackTime(frame, fps)
  const analysisFrame = getAnalysisFrame(config.analysis.frames, time)
  const lyricLine = getCurrentLyricLine(config.lyrics, time)
  const isWide = config.ratio === '16:9'
  const coverSize = isWide ? 390 : 500

  return (
    <TemplateShell config={config} variant="pulse">
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: `linear-gradient(135deg, ${config.theme.accentColor}, #FACC15 48%, #EF4444)` }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(#020617 2px, transparent 2px)', backgroundSize: isWide ? '24px 24px' : '28px 28px', opacity: 0.22 }} />
        <div style={{ position: 'absolute', left: isWide ? 95 : 52, top: isWide ? 115 : 120, width: isWide ? 640 : 900, height: isWide ? 500 : 700, clipPath: 'polygon(50% 0, 60% 28%, 100% 18%, 72% 48%, 96% 78%, 60% 68%, 48% 100%, 38% 68%, 0 80%, 26% 48%, 0 18%, 38% 28%)', background: '#F8FAFC', transform: `rotate(${Math.sin(frame / 30) * 3}deg) scale(${1 + analysisFrame.bass * 0.04})`, boxShadow: '0 30px 90px rgba(0,0,0,0.32)' }} />
        <FloatingCover config={config} left={isWide ? 190 : (1080 - coverSize) / 2} top={isWide ? 285 : 250} size={coverSize} radius={26} rotate={-6} scale={1 + analysisFrame.bass * 0.04} />
        <div style={{ position: 'absolute', left: isWide ? 680 : 70, right: isWide ? 105 : 70, top: isWide ? 180 : 790, color: '#020617', fontSize: isWide ? 88 : 92, fontWeight: 950, letterSpacing: '-0.08em', lineHeight: 0.88, textShadow: '5px 5px 0 #F8FAFC' }}>
          {config.title ?? ' '}
        </div>
        <div style={{ position: 'absolute', left: isWide ? 680 : 40, right: isWide ? 105 : 40, top: isWide ? 500 : 1190, boxSizing: 'border-box', maxHeight: isWide ? 250 : 320, overflow: 'hidden', padding: isWide ? '34px 42px' : '42px 44px', border: '6px solid rgba(2,6,23,0.55)', borderRadius: 32, background: 'rgba(248,250,252,0.68)', color: '#020617', fontSize: isWide ? 70 : 72, fontWeight: 950, lineHeight: 1, boxShadow: isWide ? '10px 10px 0 rgba(2,6,23,0.2)' : '6px 6px 0 rgba(2,6,23,0.16)' }}>
          {lyricLine?.text ?? ' '}
        </div>
      </div>
    </TemplateShell>
  )
}
