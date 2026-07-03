import { Img, interpolate, useCurrentFrame, useVideoConfig } from 'remotion'
import type { LyricVideoConfig } from '@lyricpulse/core'
import {
  getAnalysisFrame,
  getCurrentLyricLine,
  getPlaybackTime
} from '../helpers'
import { TemplateShell } from '../components/TemplateShell'
import { isServerRender } from '../render-mode'

export function CinemaBeam({ config }: { config: LyricVideoConfig }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const time = getPlaybackTime(frame, fps)
  const analysisFrame = getAnalysisFrame(config.analysis.frames, time)
  const lyricLine = getCurrentLyricLine(config.lyrics, time)
  const isWide = config.ratio === '16:9'
  const fastRender = isServerRender(config)
  const accent = config.theme.accentColor
  const posterWidth = isWide ? 460 : 590
  const posterHeight = isWide ? 650 : 590
  const posterLeft = isWide ? 116 : (1080 - posterWidth) / 2
  const posterTop = isWide ? 214 : 214
  const beamShift = Math.sin(frame / 34) * 34

  return (
    <TemplateShell config={config} variant="waveform">
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        <div
          style={{
            position: 'absolute',
            left: isWide ? 420 : -130,
            top: isWide ? -90 : 420,
            width: isWide ? 1180 : 1340,
            height: isWide ? 470 : 520,
            background: `linear-gradient(95deg, transparent, ${accent}22, rgba(248,250,252,0.18), transparent)`,
            filter: fastRender ? undefined : 'blur(26px)',
            transform: `rotate(${isWide ? -11 : -22}deg) translateX(${beamShift}px)`,
            opacity: 0.9 * config.theme.backgroundIntensity
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: posterLeft,
            top: posterTop,
            width: posterWidth,
            height: posterHeight,
            borderRadius: 34,
            overflow: 'hidden',
            border: '1px solid rgba(248,250,252,0.28)',
            boxShadow: fastRender
              ? '0 20px 50px rgba(0,0,0,0.44)'
              : `0 34px 110px rgba(0,0,0,0.5), 0 0 70px ${accent}20`
          }}
        >
          {config.coverUrl ? (
            <Img
              src={config.coverUrl}
              alt={config.title ?? 'cover artwork'}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: 'brightness(0.78) saturate(1.08)',
                transform: `scale(${1.03 + analysisFrame.bass * 0.025})`
              }}
            />
          ) : null}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(180deg, rgba(2,6,23,0.08), rgba(2,6,23,0.64))'
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 34,
              right: 34,
              bottom: 34,
              color: '#F8FAFC'
            }}
          >
            <div
              style={{
                fontSize: isWide ? 50 : 62,
                fontWeight: 950,
                letterSpacing: '-0.06em',
                lineHeight: 0.95,
                textShadow: '0 4px 18px rgba(0,0,0,0.68)'
              }}
            >
              {config.title ?? ' '}
            </div>
            {config.artist ? (
              <div
                style={{
                  marginTop: 16,
                  fontSize: isWide ? 26 : 34,
                  fontWeight: 800,
                  color: '#CBD5E1',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase'
                }}
              >
                {config.artist}
              </div>
            ) : null}
          </div>
        </div>
        <div
          style={{
            position: 'absolute',
            left: isWide ? 690 : 40,
            right: isWide ? 116 : 40,
            top: isWide ? 360 : 1190,
            boxSizing: 'border-box',
            padding: isWide ? '48px 54px' : '50px 48px',
            borderTop: `5px solid ${accent}`,
            borderBottom: `1px solid ${accent}80`,
            background:
              'linear-gradient(135deg, rgba(2,6,23,0.76), rgba(15,23,42,0.42))',
            boxShadow: fastRender
              ? '0 18px 44px rgba(0,0,0,0.38)'
              : `0 24px 92px rgba(0,0,0,0.46), 0 0 48px ${accent}22`,
            backdropFilter: fastRender ? undefined : 'blur(9px)'
          }}
        >
          <div
            style={{
              fontSize: isWide ? 78 : 72,
              display: '-webkit-box',
              WebkitLineClamp: isWide ? 2 : 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              overflowWrap: 'break-word',
              fontWeight: 950,
              letterSpacing: '-0.055em',
              lineHeight: 1.02,
              color: '#F8FAFC',
              textShadow: `0 0 ${interpolate(analysisFrame.treble, [0, 1], [16, 38])}px ${accent}66`
            }}
          >
            {lyricLine?.text ?? ' '}
          </div>
        </div>
      </div>
    </TemplateShell>
  )
}
