import type { LyricLine, LyricVideoConfig } from '@lyricpulse/core'
import { isServerRender } from '../render-mode'
import { getContrastTextColors } from '../templates/visual-utils'

export function LyricDisplay({
  config,
  line,
  scale = 1,
  align = 'center'
}: {
  config: LyricVideoConfig
  line?: LyricLine
  scale?: number
  align?: 'center' | 'left'
}) {
  const isWide = config.ratio === '16:9'
  const fastRender = isServerRender(config)
  const contrast = getContrastTextColors(config)

  return (
    <div
      style={{
        maxWidth: isWide ? 920 : 1000,
        maxHeight: isWide ? 290 : 340,
        boxSizing: 'border-box',
        textAlign: align,
        transform: `scale(${scale})`,
        transition: 'none',
        color: contrast.lyricColor,
        padding: isWide ? '34px 42px' : '40px 46px',
        borderRadius: isWide ? 34 : 42,
        background:
          'linear-gradient(135deg, rgba(2,6,23,0.76), rgba(15,23,42,0.52))',
        border: `1px solid ${config.theme.accentColor}66`,
        boxShadow: fastRender
          ? `0 18px 38px rgba(0,0,0,0.42)`
          : `0 34px 120px rgba(0,0,0,0.48), 0 0 ${48 * config.effect.lyricGlow}px ${config.theme.accentColor}28`,
        backdropFilter: fastRender ? undefined : 'blur(8px)'
      }}
    >
      <div
        style={{
          fontSize: isWide ? 78 : 92,
          fontWeight: 950,
          letterSpacing: '-0.055em',
          lineHeight: 1.04,
          color: contrast.lyricColor,
          display: '-webkit-box',
          WebkitLineClamp: isWide ? 2 : 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          overflowWrap: 'break-word',
          textShadow: fastRender
            ? '0 3px 0 rgba(0,0,0,0.65)'
            : contrast.lyricShadow
        }}
      >
        {line?.text ?? ' '}
      </div>
      <div
        style={{
          width: align === 'left' ? 180 : 220,
          height: 8,
          marginTop: 26,
          marginLeft: align === 'left' ? 0 : 'auto',
          marginRight: align === 'left' ? 0 : 'auto',
          borderRadius: 999,
          background: `linear-gradient(90deg, ${config.theme.accentColor}, #FFFFFF)`,
          boxShadow: fastRender ? undefined : `0 0 34px ${config.theme.accentColor}`
        }}
      />
    </div>
  )
}
