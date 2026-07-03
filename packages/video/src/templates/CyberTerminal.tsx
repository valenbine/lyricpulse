import { useCurrentFrame, useVideoConfig } from 'remotion'
import type { LyricVideoConfig } from '@lyricpulse/core'
import {
  getAnalysisFrame,
  getCurrentLyricLine,
  getPlaybackTime
} from '../helpers'
import { TemplateShell } from '../components/TemplateShell'
import { FloatingCover } from './visual-utils'

export function CyberTerminal({ config }: { config: LyricVideoConfig }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const time = getPlaybackTime(frame, fps)
  const analysisFrame = getAnalysisFrame(config.analysis.frames, time)
  const lyricLine = getCurrentLyricLine(config.lyrics, time)
  const isWide = config.ratio === '16:9'
  const coverSize = isWide ? 360 : 460
  const scanTop = `${(frame * 0.7) % 100}%`

  return (
    <TemplateShell config={config} variant="dashboard">
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#020617' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(0deg, rgba(34,197,94,0.15) 0px, rgba(34,197,94,0.15) 1px, transparent 1px, transparent 5px)' }} />
        <div style={{ position: 'absolute', left: 0, right: 0, top: scanTop, height: 4, background: config.theme.accentColor, boxShadow: `0 0 30px ${config.theme.accentColor}` }} />
        <FloatingCover config={config} left={isWide ? 150 : (1080 - coverSize) / 2} top={isWide ? 305 : 250} size={coverSize} radius={10} scale={1 + analysisFrame.bass * 0.04} />
        <div style={{ position: 'absolute', left: isWide ? 650 : 76, right: isWide ? 110 : 76, top: isWide ? 170 : 780, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', color: '#BBF7D0' }}>
          <div style={{ fontSize: isWide ? 72 : 88, fontWeight: 900, letterSpacing: '-0.06em', lineHeight: 1 }}>
            {config.title ?? ' '}
          </div>
          <div style={{ marginTop: isWide ? 60 : 76, padding: '36px 38px', border: `1px solid ${config.theme.accentColor}88`, background: 'rgba(2,6,23,0.78)', fontSize: isWide ? 60 : 76, fontWeight: 900, boxShadow: `0 0 ${30 + analysisFrame.treble * 50}px ${config.theme.accentColor}28` }}>
            &gt; {lyricLine?.text ?? ' '}
          </div>
        </div>
      </div>
    </TemplateShell>
  )
}
