import { useCurrentFrame, useVideoConfig } from 'remotion'
import type { LyricVideoConfig } from '@lyricpulse/core'
import {
  getAnalysisFrame,
  getCurrentLyricLine,
  getPlaybackTime
} from '../helpers'
import { TemplateShell } from '../components/TemplateShell'
import { FloatingCover } from './visual-utils'

export function TypewriterNoir({ config }: { config: LyricVideoConfig }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const time = getPlaybackTime(frame, fps)
  const analysisFrame = getAnalysisFrame(config.analysis.frames, time)
  const lyricLine = getCurrentLyricLine(config.lyrics, time)
  const isWide = config.ratio === '16:9'
  const frameInset = isWide ? '82px 100px' : '96px 86px'
  const coverSize = isWide ? 320 : 340
  const coverTop = isWide ? 300 : 230
  const contentLeft = isWide ? 620 : 122
  const contentRight = isWide ? 130 : 122
  const contentTop = isWide ? 185 : 660
  const cursorVisible = Math.floor(frame / 12) % 2 === 0
  const clampedTextStyle = {
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical' as const,
    overflow: 'hidden',
    overflowWrap: 'break-word' as const,
    wordBreak: 'break-word' as const
  }

  return (
    <TemplateShell config={config} variant="dashboard">
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <div
          style={{
            position: 'absolute',
            inset: frameInset,
            borderRadius: 18,
            background: 'linear-gradient(135deg, #F8FAFC, #CBD5E1)',
            boxShadow: '0 38px 120px rgba(0,0,0,0.5)'
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.08,
            backgroundImage:
              'repeating-linear-gradient(0deg, #020617 0px, #020617 1px, transparent 1px, transparent 8px)'
          }}
        />
        <FloatingCover
          config={config}
          left={isWide ? 150 : (1080 - coverSize) / 2}
          top={coverTop}
          size={coverSize}
          radius={8}
          rotate={isWide ? -2 : 0}
          scale={1 + analysisFrame.bass * 0.02}
        />
        <div
          style={{
            position: 'absolute',
            left: contentLeft,
            right: contentRight,
            top: contentTop,
            color: '#020617',
            fontFamily: 'Georgia, serif'
          }}
        >
          <div style={{ fontSize: isWide ? 28 : 30, fontWeight: 800, letterSpacing: '0.18em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {config.artist ?? ''}
          </div>
          <div style={{ marginTop: isWide ? 20 : 18, fontSize: isWide ? 74 : 76, fontWeight: 950, letterSpacing: '-0.06em', lineHeight: 0.94, WebkitLineClamp: 2, ...clampedTextStyle }}>
            {config.title ?? ' '}
          </div>
          <div
            style={{
              marginTop: isWide ? 48 : 42,
              padding: isWide ? '30px 34px' : '30px 28px',
              borderTop: '5px solid #020617',
              borderBottom: '1px solid #020617',
              fontSize: isWide ? 56 : 58,
              fontWeight: 900,
              lineHeight: 1.05,
              letterSpacing: '-0.045em'
            }}
          >
            <div style={{ WebkitLineClamp: isWide ? 2 : 3, ...clampedTextStyle }}>
              {lyricLine?.text ?? ' '}
              <span style={{ opacity: cursorVisible ? 1 : 0 }}>_</span>
            </div>
          </div>
        </div>
      </div>
    </TemplateShell>
  )
}
