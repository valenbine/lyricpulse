import { Img, useCurrentFrame, useVideoConfig } from 'remotion'
import type { LyricLine, LyricVideoConfig } from '@lyricpulse/core'
import {
  getAnalysisFrame,
  getCurrentLyricLine,
  getPlaybackTime
} from '../helpers'
import { TemplateShell } from '../components/TemplateShell'
import { isServerRender } from '../render-mode'

function getAdjacentLyrics(
  lyrics: LyricLine[],
  current?: LyricLine
): { previous?: LyricLine; current?: LyricLine; next?: LyricLine } {
  const index = current ? lyrics.findIndex((line) => line.id === current.id) : -1

  if (index < 0) {
    return {
      previous: lyrics[0],
      current: lyrics[1] ?? lyrics[0],
      next: lyrics[2] ?? lyrics[1] ?? lyrics[0]
    }
  }

  return {
    previous: lyrics[index - 1],
    current,
    next: lyrics[index + 1]
  }
}

function LyricRow({
  line,
  active,
  isWide
}: {
  line?: LyricLine
  active?: boolean
  isWide: boolean
}) {
  return (
    <div
      style={{
        width: '100%',
        borderRadius: isWide ? 24 : 28,
        padding: active
          ? isWide
            ? '22px 30px'
            : '28px 34px'
          : isWide
            ? '20px 28px'
            : '24px 30px',
        background: active
          ? 'linear-gradient(135deg, rgba(248,250,252,0.96), rgba(226,232,240,0.86))'
          : 'rgba(15,23,42,0.68)',
        border: active
          ? '1px solid rgba(255,255,255,0.86)'
          : '1px solid rgba(148,163,184,0.22)',
        color: active ? '#020617' : 'rgba(226,232,240,0.62)',
        fontSize: active ? (isWide ? 82 : 106) : isWide ? 60 : 78,
        fontWeight: active ? 950 : 760,
        lineHeight: 1.12,
        letterSpacing: active ? '-0.055em' : '-0.035em',
        boxShadow: active ? '0 20px 55px rgba(0,0,0,0.34)' : undefined
      }}
    >
      {line?.text ?? ''}
    </div>
  )
}

export function PulseDashboard({ config }: { config: LyricVideoConfig }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const time = getPlaybackTime(frame, fps)
  const analysisFrame = getAnalysisFrame(config.analysis.frames, time)
  const currentLine = getCurrentLyricLine(config.lyrics, time)
  const lyrics = getAdjacentLyrics(config.lyrics, currentLine)
  const isWide = config.ratio === '16:9'
  const fastRender = isServerRender(config)
  const accent = config.theme.accentColor
  const meterBars = Array.from({ length: fastRender ? 18 : isWide ? 36 : 24 }, (_, index) => {
    const seed = Math.sin(index * 12.9898) * 43758.5453
    const randomWeight = 0.72 + (seed - Math.floor(seed)) * 0.62
    const fastPulse = Math.sin(frame / 4.2 + index * 1.73)
    const slowPulse = Math.sin(frame / 11 + index * 0.37)
    const steppedPulse = Math.sin(Math.floor(frame / 5) * 0.9 + index * 2.41)
    const energy = Math.max(
      0,
      fastPulse * 0.42 + slowPulse * 0.28 + steppedPulse * 0.3
    )
    const bandBoost =
      index % 5 === 0 ? analysisFrame.bass : index % 3 === 0 ? analysisFrame.mid : analysisFrame.treble

    return 16 + (26 + energy * 96) * (0.38 + bandBoost * 0.9) * randomWeight
  })

  return (
    <TemplateShell config={config} variant="dashboard">
      <div
        style={{
          position: 'absolute',
          inset: isWide ? '56px 82px' : '82px 42px',
          borderRadius: isWide ? 46 : 58,
          padding: isWide ? 40 : 48,
          background:
            'linear-gradient(145deg, rgba(2,6,23,0.78), rgba(15,23,42,0.58))',
          border: `1px solid ${accent}44`,
          boxShadow: fastRender
            ? '0 20px 48px rgba(0,0,0,0.36)'
            : `0 34px 120px rgba(0,0,0,0.46), 0 0 80px ${accent}20 inset`,
          backdropFilter: fastRender ? undefined : 'blur(10px)',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            position: 'absolute',
            right: isWide ? -80 : -150,
            top: isWide ? -120 : 40,
            width: isWide ? 440 : 520,
            height: isWide ? 440 : 520,
            borderRadius: '50%',
            border: `2px solid ${accent}44`,
            boxShadow: fastRender ? undefined : `0 0 70px ${accent}22`,
            opacity: 0.62,
            transform: `scale(${1 + analysisFrame.rms * 0.08})`
          }}
        />
        {config.coverUrl ? (
          <div
            style={{
              position: 'absolute',
              top: isWide ? 0 : 310,
              right: isWide ? 0 : 333,
              bottom: isWide ? 0 : undefined,
              width: isWide ? '54%' : 330,
              height: isWide ? undefined : 330,
              overflow: 'hidden',
              opacity: isWide ? (fastRender ? 0.34 : 0.42) : 0.9,
              borderRadius: isWide ? 0 : 38,
              border: isWide ? undefined : '1px solid rgba(255,255,255,0.2)',
              boxShadow: isWide
                ? undefined
                : fastRender
                  ? '0 16px 38px rgba(0,0,0,0.34)'
                  : `0 26px 72px rgba(0,0,0,0.42), 0 0 56px ${accent}20`,
              zIndex: isWide ? undefined : 3
            }}
          >
            <Img
              src={config.coverUrl}
              alt={config.title ?? 'cover artwork'}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: isWide
                  ? fastRender
                    ? 'brightness(0.62)'
                    : 'brightness(0.62) saturate(1.12)'
                  : fastRender
                    ? 'brightness(0.82)'
                    : 'brightness(0.88) saturate(1.08)',
                transform: `scale(${1.04 + analysisFrame.bass * 0.018})`
              }}
            />
          </div>
        ) : null}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: isWide
              ? 'linear-gradient(90deg, rgba(2,6,23,0.96) 0%, rgba(2,6,23,0.88) 42%, rgba(2,6,23,0.46) 68%, rgba(2,6,23,0.76) 100%)'
              : 'linear-gradient(180deg, rgba(2,6,23,0.97) 0%, rgba(2,6,23,0.9) 34%, rgba(2,6,23,0.76) 100%)',
            pointerEvents: 'none'
          }}
        />
        <div
          style={{
            position: 'relative',
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'flex-start',
            gap: 32
          }}
        >
          <div>
            <div
              style={{
                fontSize: isWide ? 24 : 28,
                fontWeight: 780,
                color: 'rgba(226,232,240,0.72)'
              }}
            >
              {config.artist ?? ' '}
            </div>
            <div
              style={{
                marginTop: 8,
                maxWidth: isWide ? 820 : 760,
                fontSize: isWide ? 62 : 74,
                fontWeight: 980,
                lineHeight: 0.96,
                letterSpacing: '-0.075em',
                color: '#F8FAFC'
              }}
            >
              {config.title ?? ' '}
            </div>
          </div>
        </div>
        <div
          style={{
            position: 'absolute',
            left: isWide ? 34 : 42,
            right: isWide ? 34 : 42,
            top: isWide ? 270 : 710,
            bottom: isWide ? 200 : 230,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: isWide ? 18 : 22
          }}
        >
          <LyricRow line={lyrics.previous} isWide={isWide} />
          <LyricRow line={lyrics.current} active isWide={isWide} />
          <LyricRow line={lyrics.next} isWide={isWide} />
        </div>
        <div
          style={{
            position: 'absolute',
            left: isWide ? 34 : 42,
            right: isWide ? 34 : 42,
            bottom: 0,
            display: 'flex',
            alignItems: 'end',
            gap: isWide ? 8 : 7,
            height: isWide ? 142 : 172,
            opacity: 0.92,
            zIndex: 0
          }}
        >
          {meterBars.map((height, index) => (
            <div
              key={index}
              style={{
                flex: 1,
                height,
                borderRadius: 999,
                background: `linear-gradient(180deg, #F8FAFC 0%, ${accent} 45%, #22C55E 100%)`,
                opacity: 0.72 + Math.min(analysisFrame.rms, 0.28),
                boxShadow: fastRender ? undefined : `0 0 18px ${accent}66`
              }}
            />
          ))}
        </div>
      </div>
    </TemplateShell>
  )
}
