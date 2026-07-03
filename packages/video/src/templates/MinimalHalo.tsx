import { useCurrentFrame, useVideoConfig } from 'remotion'
import type { LyricVideoConfig } from '@lyricpulse/core'
import {
  getAnalysisFrame,
  getCurrentLyricLine,
  getPlaybackTime
} from '../helpers'
import { TemplateShell } from '../components/TemplateShell'
import { CaptionPanel, FloatingCover } from './visual-utils'

export function MinimalHalo({ config }: { config: LyricVideoConfig }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const time = getPlaybackTime(frame, fps)
  const analysisFrame = getAnalysisFrame(config.analysis.frames, time)
  const lyricLine = getCurrentLyricLine(config.lyrics, time)
  const isWide = config.ratio === '16:9'
  const coverSize = isWide ? 360 : 430
  const coverLeft = isWide ? 240 : (1080 - coverSize) / 2
  const coverTop = isWide ? 330 : 300

  return (
    <TemplateShell config={config} variant="pulse">
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(135deg, #F8FAFC, #E2E8F0 54%, #CBD5E1)',
            opacity: 0.96
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: coverLeft - 80,
            top: coverTop - 80,
            width: coverSize + 160,
            height: coverSize + 160,
            borderRadius: '50%',
            border: `2px solid ${config.theme.accentColor}88`,
            transform: `rotate(${frame * 0.08}deg) scale(${1 + analysisFrame.mid * 0.03})`
          }}
        />
        <FloatingCover
          config={config}
          left={coverLeft}
          top={coverTop}
          size={coverSize}
          radius={999}
          circle
          scale={1 + analysisFrame.bass * 0.025}
        />
        <div
          style={{
            position: 'absolute',
            left: isWide ? 760 : 82,
            right: isWide ? 130 : 82,
            top: isWide ? 250 : 870,
            color: '#0F172A',
            textAlign: isWide ? 'left' : 'center'
          }}
        >
          <div style={{ fontSize: isWide ? 74 : 86, fontWeight: 950, letterSpacing: '-0.07em', lineHeight: 0.96 }}>
            {config.title ?? ' '}
          </div>
          {config.artist ? <div style={{ marginTop: 22, fontSize: isWide ? 32 : 40, fontWeight: 760 }}>{config.artist}</div> : null}
        </div>
        <CaptionPanel
          config={{ ...config, theme: { ...config.theme, primaryColor: '#0F172A' } }}
          text={lyricLine?.text}
          left={isWide ? 760 : 76}
          right={isWide ? 130 : 76}
          top={isWide ? 520 : 1110}
          align={isWide ? 'left' : 'center'}
          fontSize={isWide ? 68 : 82}
        />
      </div>
    </TemplateShell>
  )
}
