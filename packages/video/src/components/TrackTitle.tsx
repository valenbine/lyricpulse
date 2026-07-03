import type { LyricVideoConfig } from '@lyricpulse/core'
import { isServerRender } from '../render-mode'
import { getContrastTextColors } from '../templates/visual-utils'

export function TrackTitle({
  config,
  align = 'left',
  position = 'top'
}: {
  config: LyricVideoConfig
  align?: 'left' | 'center'
  position?: 'top' | 'compact'
}) {
  const isWide = config.ratio === '16:9'
  const hasArtist = Boolean(config.artist)
  const fastRender = isServerRender(config)
  const contrast = getContrastTextColors(config)

  return (
    <div
      style={{
        textAlign: align,
        maxWidth: isWide ? 760 : 820,
        padding: position === 'top' ? '24px 30px' : '18px 24px',
        borderRadius: isWide ? 30 : 36,
        background:
          'linear-gradient(135deg, rgba(2,6,23,0.38), rgba(15,23,42,0.18))',
        border: `1px solid ${config.theme.accentColor}42`,
        boxShadow: fastRender
          ? `0 10px 26px rgba(0,0,0,0.24)`
          : `0 18px 60px rgba(0,0,0,0.22), 0 0 34px ${config.theme.accentColor}18`,
        backdropFilter: fastRender ? undefined : 'blur(10px)'
      }}
    >
      <div
        style={{
          fontSize: isWide ? 54 : 72,
          fontWeight: 950,
          letterSpacing: '-0.06em',
          lineHeight: 1,
          color: contrast.titleColor,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          overflowWrap: 'break-word',
          textShadow: fastRender
            ? '0 4px 0 rgba(0,0,0,0.68)'
            : contrast.titleShadow
        }}
      >
        {config.title ?? ' '}
      </div>
      {hasArtist ? (
        <div
          style={{
            marginTop: isWide ? 14 : 18,
            fontSize: isWide ? 30 : 42,
            fontWeight: 850,
            letterSpacing: '-0.025em',
            color: contrast.lyricColor,
            textShadow: '0 3px 0 rgba(0,0,0,0.62)'
          }}
        >
          {config.artist}
        </div>
      ) : null}
    </div>
  )
}
