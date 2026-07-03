import { Img } from 'remotion'
import type { LyricVideoConfig } from '@lyricpulse/core'

export type CaptionFrame =
  | 'glass'
  | 'ticket'
  | 'specimen'
  | 'radar'
  | 'blueprint'
  | 'menu'
  | 'manual'
  | 'radio'
  | 'stitched'
  | 'calendar'
  | 'stamp'
  | 'paper'
  | 'neonRail'

export function getContrastTextColors(config: LyricVideoConfig, seed: string = config.templateId) {
  const colors = [
    '#FDE047',
    '#22D3EE',
    '#F472B6',
    '#A3E635',
    '#FB7185',
    '#C084FC',
    '#FDBA74',
    '#67E8F9',
    '#F0ABFC',
    '#BEF264',
    '#FCA5A5',
    '#93C5FD'
  ]
  const start = getSeedIndex(seed, colors.length)
  const palette = colors.slice(start).concat(colors.slice(0, start))
  const themeColors = [config.theme.primaryColor, config.theme.accentColor]
  const [titleColor, lyricColor] = palette
    .filter((color) => themeColors.every((themeColor) => colorDistance(color, themeColor) > 150))
    .concat(palette)

  return {
    titleColor,
    lyricColor: lyricColor === titleColor ? '#22D3EE' : lyricColor,
    titleShadow: `0 4px 0 rgba(0,0,0,0.72), 0 0 34px ${titleColor}66`,
    lyricShadow: `0 4px 0 rgba(0,0,0,0.72), 0 0 30px ${lyricColor === titleColor ? '#22D3EE' : lyricColor}66`
  }
}

function getSeedIndex(seed: string, size: number) {
  let hash = 0

  for (const character of seed) {
    hash = (hash * 31 + character.charCodeAt(0)) % 2147483647
  }

  return hash % size
}

function colorDistance(first: string, second: string) {
  const a = hexToRgb(first)
  const b = hexToRgb(second)

  if (!a || !b) {
    return 255
  }

  return Math.abs(a.r - b.r) + Math.abs(a.g - b.g) + Math.abs(a.b - b.b)
}

function hexToRgb(color: string) {
  const normalized = color.trim().replace('#', '')
  const value =
    normalized.length === 3
      ? normalized.split('').map((part) => part + part).join('')
      : normalized

  if (!/^[0-9a-fA-F]{6}$/.test(value)) {
    return undefined
  }

  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16)
  }
}

export function FloatingCover({
  config,
  left,
  top,
  size,
  radius = 42,
  rotate = 0,
  scale = 1,
  shadowColor,
  circle = false
}: {
  config: LyricVideoConfig
  left: number
  top: number
  size: number
  radius?: number
  rotate?: number
  scale?: number
  shadowColor?: string
  circle?: boolean
}) {
  const borderRadius = circle ? '50%' : radius

  return (
    <div
      style={{
        position: 'absolute',
        left,
        top,
        width: size,
        height: size,
        borderRadius,
        overflow: 'hidden',
        border: '1px solid rgba(248,250,252,0.28)',
        boxShadow: `0 28px 86px rgba(0,0,0,0.46), 0 0 60px ${shadowColor ?? config.theme.accentColor}24`,
        transform: `rotate(${rotate}deg) scale(${scale})`
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
            filter: 'brightness(0.88) saturate(1.08)'
          }}
        />
      ) : null}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.08), rgba(2,6,23,0.2))'
        }}
      />
    </div>
  )
}

export function CaptionPanel({
  config,
  text,
  left,
  right,
  top,
  align = 'left',
  accentLine = true,
  fontSize,
  frame = 'glass'
}: {
  config: LyricVideoConfig
  text?: string
  left: number
  right: number
  top: number
  align?: 'left' | 'center'
  accentLine?: boolean
  fontSize: number
  frame?: CaptionFrame
}) {
  const frameStyle = getCaptionFrameStyle(config, frame)
  const textStyle = getCaptionTextStyle(config, frame, fontSize)
  const lineStyle = getCaptionLineStyle(config, frame, align)
  const safeLeft = config.ratio === '9:16' ? Math.min(left, 40) : left
  const safeRight = config.ratio === '9:16' ? Math.min(right, 40) : right

  return (
    <div
      style={{
        position: 'absolute',
        left: safeLeft,
        right: safeRight,
        top,
        boxSizing: 'border-box',
        padding: config.ratio === '16:9' ? '38px 44px' : '46px 48px',
        maxHeight: config.ratio === '16:9' ? 270 : 330,
        overflow: 'hidden',
        textAlign: align,
        ...frameStyle
      }}
    >
      <CaptionFrameDecoration config={config} frame={frame} />
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: '-webkit-box',
          WebkitLineClamp: config.ratio === '16:9' ? 2 : 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          overflowWrap: 'break-word',
          ...textStyle
        }}
      >
        {text ?? ' '}
      </div>
      {accentLine ? (
        <div
          style={{
            width: align === 'center' ? 220 : 180,
            height: 7,
            marginTop: 24,
            marginLeft: align === 'center' ? 'auto' : 0,
            marginRight: align === 'center' ? 'auto' : 0,
            ...lineStyle
          }}
        />
      ) : null}
    </div>
  )
}

function getCaptionFrameStyle(config: LyricVideoConfig, frame: CaptionFrame) {
  const accent = config.theme.accentColor

  if (frame === 'ticket') {
    return {
      borderRadius: 18,
      background: 'rgba(248,250,252,0.72)',
      color: '#0F172A',
      border: '3px dashed rgba(15,23,42,0.32)',
      boxShadow: '18px 22px 0 rgba(15,23,42,0.12)',
      backdropFilter: 'none'
    }
  }

  if (frame === 'specimen') {
    return {
      borderRadius: 16,
      background: 'linear-gradient(135deg, rgba(236,253,245,0.5), rgba(6,78,59,0.2))',
      border: `2px solid ${accent}66`,
      boxShadow: `0 0 54px ${accent}20, inset 0 0 32px rgba(255,255,255,0.16)`,
      backdropFilter: 'blur(4px)'
    }
  }

  if (frame === 'radar') {
    return {
      borderRadius: '50px 14px 50px 14px',
      background: 'rgba(8,47,73,0.34)',
      border: `3px solid ${accent}70`,
      boxShadow: `0 0 48px ${accent}28, inset 0 0 36px rgba(56,189,248,0.12)`,
      backdropFilter: 'blur(6px)'
    }
  }

  if (frame === 'blueprint') {
    return {
      borderRadius: 0,
      background: 'rgba(219,234,254,0.58)',
      border: `4px double ${accent}66`,
      boxShadow: `14px 14px 0 ${accent}1F`,
      backdropFilter: 'none'
    }
  }

  if (frame === 'menu') {
    return {
      borderRadius: 28,
      background: 'rgba(255,247,237,0.62)',
      border: `8px double ${accent}55`,
      boxShadow: '0 18px 48px rgba(127,29,29,0.12)',
      backdropFilter: 'none'
    }
  }

  if (frame === 'manual') {
    return {
      borderRadius: 8,
      background: 'rgba(239,246,255,0.58)',
      border: `3px solid ${accent}66`,
      boxShadow: `16px 16px 0 rgba(37,99,235,0.1)`,
      backdropFilter: 'none'
    }
  }

  if (frame === 'radio') {
    return {
      borderRadius: 999,
      background: 'radial-gradient(circle, rgba(30,27,75,0.45), rgba(2,6,23,0.38))',
      border: `2px solid ${accent}66`,
      boxShadow: `0 0 58px ${accent}28, inset 0 0 44px rgba(245,158,11,0.1)`,
      backdropFilter: 'blur(6px)'
    }
  }

  if (frame === 'stitched') {
    return {
      borderRadius: 44,
      background: 'linear-gradient(135deg, rgba(255,241,242,0.58), rgba(252,231,243,0.44))',
      border: `4px dashed ${accent}66`,
      boxShadow: '0 18px 52px rgba(131,24,67,0.12)',
      backdropFilter: 'none'
    }
  }

  if (frame === 'calendar') {
    return {
      borderRadius: 4,
      background: 'rgba(248,250,252,0.66)',
      border: '4px solid rgba(17,24,39,0.48)',
      boxShadow: '18px 18px 0 rgba(17,24,39,0.1)',
      backdropFilter: 'none'
    }
  }

  if (frame === 'stamp') {
    return {
      borderRadius: 6,
      background: 'rgba(254,243,199,0.56)',
      border: `7px solid ${accent}55`,
      boxShadow: '14px 18px 0 rgba(69,26,3,0.1)',
      transform: 'rotate(-1deg)',
      backdropFilter: 'none'
    }
  }

  if (frame === 'paper') {
    return {
      borderRadius: 20,
      background: 'rgba(250,250,249,0.58)',
      border: '1px solid rgba(87,83,78,0.2)',
      boxShadow: '0 18px 54px rgba(68,64,60,0.12)',
      backdropFilter: 'none'
    }
  }

  if (frame === 'neonRail') {
    return {
      borderRadius: '18px 70px 18px 70px',
      background: 'linear-gradient(135deg, rgba(2,6,23,0.5), rgba(49,46,129,0.28))',
      border: `2px solid ${accent}70`,
      boxShadow: `0 0 58px ${accent}2B, inset 0 0 28px ${accent}14`,
      backdropFilter: 'blur(8px)'
    }
  }

  return {
    borderRadius: config.ratio === '16:9' ? 32 : 42,
    background: 'linear-gradient(135deg, rgba(2,6,23,0.44), rgba(15,23,42,0.24))',
    border: `1px solid ${accent}52`,
    boxShadow: `0 18px 58px rgba(0,0,0,0.24), 0 0 32px ${accent}18`,
    backdropFilter: 'blur(8px)'
  }
}

function getCaptionTextStyle(
  config: LyricVideoConfig,
  frame: CaptionFrame,
  fontSize: number
) {
  const contrast = getContrastTextColors(config)
  const darkTextFrames: CaptionFrame[] = [
    'ticket',
    'blueprint',
    'menu',
    'manual',
    'stitched',
    'calendar',
    'stamp',
    'paper'
  ]
  const color = darkTextFrames.includes(frame) ? '#111827' : contrast.lyricColor
  const letterSpacing = frame === 'calendar' || frame === 'ticket' ? '-0.035em' : '-0.055em'
  const textShadow = darkTextFrames.includes(frame)
    ? `0 2px 0 rgba(255,255,255,0.65), 0 0 22px ${config.theme.accentColor}22`
    : contrast.lyricShadow

  return {
    fontSize,
    fontWeight: 950,
    letterSpacing,
    lineHeight: 1.02,
    color,
    textShadow
  }
}

function getCaptionLineStyle(
  config: LyricVideoConfig,
  frame: CaptionFrame,
  align: 'left' | 'center'
) {
  if (frame === 'ticket') {
    return {
      borderRadius: 0,
      backgroundImage: 'repeating-linear-gradient(90deg, #111827 0 18px, transparent 18px 30px)'
    }
  }

  if (frame === 'calendar') {
    return { borderRadius: 0, background: '#EF4444' }
  }

  if (frame === 'blueprint' || frame === 'manual') {
    return { borderRadius: 0, background: config.theme.accentColor }
  }

  if (frame === 'stitched') {
    return {
      borderRadius: 999,
      backgroundImage: `repeating-linear-gradient(90deg, ${config.theme.accentColor} 0 12px, transparent 12px 22px)`
    }
  }

  if (frame === 'stamp') {
    return {
      width: align === 'center' ? 260 : 210,
      height: 4,
      borderRadius: 0,
      background: '#92400E'
    }
  }

  return {
    borderRadius: 999,
    background: `linear-gradient(90deg, ${config.theme.accentColor}, #FFFFFF)`
  }
}

function CaptionFrameDecoration({
  config,
  frame
}: {
  config: LyricVideoConfig
  frame: CaptionFrame
}) {
  const accent = config.theme.accentColor

  if (frame === 'specimen') {
    return <div style={{ position: 'absolute', inset: 16, border: `1px solid ${accent}55`, backgroundImage: `linear-gradient(${accent}22 1px, transparent 1px), linear-gradient(90deg, ${accent}22 1px, transparent 1px)`, backgroundSize: '28px 28px' }} />
  }

  if (frame === 'radar') {
    return <div style={{ position: 'absolute', right: 24, top: 22, width: 96, height: 96, borderRadius: '50%', border: `2px solid ${accent}99`, background: `conic-gradient(from 20deg, ${accent}66, transparent 72deg)` }} />
  }

  if (frame === 'ticket') {
    return <><div style={{ position: 'absolute', left: 18, top: 0, bottom: 0, width: 2, backgroundImage: 'repeating-linear-gradient(0deg, rgba(15,23,42,0.6) 0 12px, transparent 12px 22px)' }} /><div style={{ position: 'absolute', right: 22, top: 18, bottom: 18, width: 80, backgroundImage: 'repeating-linear-gradient(90deg, #111827 0 5px, transparent 5px 10px)', opacity: 0.18 }} /></>
  }

  if (frame === 'menu') {
    return <div style={{ position: 'absolute', inset: 18, border: `1px solid ${accent}66`, borderRadius: 18 }} />
  }

  if (frame === 'radio') {
    return <div style={{ position: 'absolute', inset: 18, borderRadius: 999, backgroundImage: `repeating-radial-gradient(circle, transparent 0 24px, ${accent}33 26px 28px)` }} />
  }

  if (frame === 'calendar') {
    return <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 24, background: '#111827' }} />
  }

  return null
}
