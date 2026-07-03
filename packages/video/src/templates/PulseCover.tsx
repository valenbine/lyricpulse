import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion'
import type { LyricVideoConfig } from '@lyricpulse/core'
import {
  getAnalysisFrame,
  getCurrentLyricLine,
  getPlaybackTime
} from '../helpers'
import { CoverArtwork } from '../components/CoverArtwork'
import { TemplateShell } from '../components/TemplateShell'
import { isServerRender } from '../render-mode'
import { getPulseCoverObjectSettings } from './pulse-cover-settings'
import { getContrastTextColors } from './visual-utils'

export function PulseCover({ config }: { config: LyricVideoConfig }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const time = getPlaybackTime(frame, fps)
  const analysisFrame = getAnalysisFrame(config.analysis.frames, time)
  const lyricLine = getCurrentLyricLine(config.lyrics, time)
  const isWide = config.ratio === '16:9'
  const fastRender = isServerRender(config)
  const contrast = getContrastTextColors(config)
  const coverScale =
    1 + analysisFrame.bass * 0.08 * config.effect.pulseIntensity
  const lyricScale = 1 + analysisFrame.rms * 0.035 * config.effect.beatImpact
  const halo = interpolate(analysisFrame.bass, [0, 1], [0.18, 0.52])
  const contentLeft = isWide ? 660 : 86
  const contentRight = isWide ? 132 : 86
  const contentTop = isWide ? 260 : 940
  const contentBottom = isWide ? 236 : 180
  const customObjects = config.customTemplate?.ratioSettings[config.ratio]?.objects
  const coverSettings = getPulseCoverObjectSettings(config.ratio, 'cover', customObjects)
  const coverLayout = coverSettings.layout
  const titleSettings = getPulseCoverObjectSettings(config.ratio, 'title', customObjects)
  const titleLayout = titleSettings.layout
  const titleTypography = titleSettings.typography
  const artistSettings = getPulseCoverObjectSettings(config.ratio, 'artist', customObjects)
  const artistLayout = artistSettings.layout
  const artistTypography = artistSettings.typography
  const lyricsSettings = getPulseCoverObjectSettings(config.ratio, 'lyrics', customObjects)
  const lyricsLayout = lyricsSettings.layout
  const lyricsTypography = lyricsSettings.typography

  return (
    <TemplateShell config={config} variant="pulse">
      <div
        style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: coverLayout.x,
            top: coverLayout.y,
            width: coverLayout.width,
            height: coverLayout.height,
            borderRadius: 48,
            transform: `scale(${coverScale * (coverLayout.scale ?? 1)})`,
            opacity: coverLayout.opacity,
            display: coverLayout.visible === false ? 'none' : 'grid',
            background: `linear-gradient(135deg, #F8FAFC 0%, ${config.theme.accentColor} 46%, #0F172A 100%)`,
            border: '10px solid rgba(255,255,255,0.9)',
            boxShadow: fastRender
              ? `0 18px 36px rgba(0,0,0,0.42), 0 0 ${24 * halo}px ${config.theme.accentColor}`
              : `0 32px 100px rgba(0,0,0,0.45), 0 0 ${100 * halo}px ${config.theme.accentColor}`,
            placeItems: 'center',
            fontSize: isWide ? 84 : 110,
            fontWeight: 900,
            letterSpacing: '-0.08em',
            color: '#020617',
            textShadow: '0 2px 0 rgba(255,255,255,0.55)',
            overflow: 'hidden'
          }}
        >
          <CoverArtwork
            src={config.coverUrl}
            alt={config.title ?? 'cover artwork'}
            borderRadius={38}
            overlayOpacity={0.18}
          />
        </div>
        {titleLayout.visible === false && artistLayout.visible === false && lyricsLayout.visible === false ? null : (
          <div
          style={{
            position: 'absolute',
            left: contentLeft,
            right: contentRight,
            top: contentTop,
            bottom: contentBottom,
            display: 'flex',
            flexDirection: 'column',
            alignItems: isWide ? 'flex-start' : 'center',
            justifyContent: 'center',
            gap: isWide ? 40 : 44
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: titleLayout.x - contentLeft,
              top: titleLayout.y - contentTop,
              width: titleLayout.width,
              height: titleLayout.height,
              opacity: titleLayout.opacity,
              display: titleLayout.visible === false ? 'none' : undefined,
              textAlign: isWide ? 'left' : 'center',
              fontSize: titleTypography?.fontSize,
              fontWeight: titleTypography?.fontWeight,
              lineHeight: titleTypography?.lineHeight,
              letterSpacing: titleTypography?.letterSpacing ? `${titleTypography.letterSpacing}em` : undefined,
              transform: titleLayout.scale ? `scale(${titleLayout.scale})` : undefined,
              transformOrigin: 'top left',
              color: contrast.titleColor,
              overflow: 'hidden',
              overflowWrap: 'break-word',
              textShadow: fastRender ? '0 4px 0 rgba(0,0,0,0.68)' : contrast.titleShadow
            }}
          >
            {config.title ?? ' '}
          </div>
          <div
            style={{
              position: 'absolute',
              left: artistLayout.x - contentLeft,
              top: artistLayout.y - contentTop,
              width: artistLayout.width,
              height: artistLayout.height,
              opacity: artistLayout.opacity,
              display: artistLayout.visible === false ? 'none' : undefined,
              textAlign: isWide ? 'left' : 'center',
              fontSize: artistTypography?.fontSize,
              fontWeight: artistTypography?.fontWeight,
              lineHeight: artistTypography?.lineHeight,
              letterSpacing: artistTypography?.letterSpacing ? `${artistTypography.letterSpacing}em` : undefined,
              transform: artistLayout.scale ? `scale(${artistLayout.scale})` : undefined,
              transformOrigin: 'top left'
            }}
          >
            <div
              style={{
                fontSize: artistTypography?.fontSize ?? (isWide ? 30 : 42),
                fontWeight: artistTypography?.fontWeight ?? 850,
                letterSpacing: artistTypography?.letterSpacing ? `${artistTypography.letterSpacing}em` : '-0.025em',
                color: contrast.lyricColor,
                textShadow: '0 3px 0 rgba(0,0,0,0.62)'
              }}
            >
              {config.artist}
            </div>
          </div>
          <div
            style={{
              position: 'absolute',
              left: lyricsLayout.x - contentLeft,
              top: lyricsLayout.y - contentTop,
              width: lyricsLayout.width,
              height: lyricsLayout.height,
              opacity: lyricsLayout.opacity,
              display: lyricsLayout.visible === false ? 'none' : undefined,
              transform: lyricsLayout.scale ? `scale(${lyricsLayout.scale})` : undefined,
              transformOrigin: 'top left'
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                boxSizing: 'border-box',
                textAlign: isWide ? 'left' : 'center',
                transform: `scale(${lyricScale})`,
                color: contrast.lyricColor,
                padding: isWide ? '34px 42px' : '40px 46px',
                borderRadius: isWide ? 34 : 42,
                background: 'linear-gradient(135deg, rgba(2,6,23,0.76), rgba(15,23,42,0.52))',
                border: `1px solid ${config.theme.accentColor}66`,
                boxShadow: fastRender
                  ? `0 18px 38px rgba(0,0,0,0.42)`
                  : `0 34px 120px rgba(0,0,0,0.48), 0 0 ${48 * config.effect.lyricGlow}px ${config.theme.accentColor}28`,
                backdropFilter: fastRender ? undefined : 'blur(8px)'
              }}
            >
              <div
                style={{
                  fontSize: lyricsTypography?.fontSize,
                  fontWeight: lyricsTypography?.fontWeight,
                  letterSpacing: lyricsTypography?.letterSpacing ? `${lyricsTypography.letterSpacing}em` : undefined,
                  lineHeight: lyricsTypography?.lineHeight,
                  color: contrast.lyricColor,
                  display: '-webkit-box',
                  WebkitLineClamp: isWide ? 2 : 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  overflowWrap: 'break-word',
                  textShadow: fastRender ? '0 3px 0 rgba(0,0,0,0.65)' : contrast.lyricShadow
                }}
              >
                {lyricLine?.text ?? ' '}
              </div>
              <div
                style={{
                  width: isWide ? 180 : 220,
                  height: 8,
                  marginTop: 26,
                  marginLeft: isWide ? 0 : 'auto',
                  marginRight: isWide ? 0 : 'auto',
                  borderRadius: 999,
                  background: `linear-gradient(90deg, ${config.theme.accentColor}, #FFFFFF)`,
                  boxShadow: fastRender ? undefined : `0 0 34px ${config.theme.accentColor}`
                }}
              />
            </div>
          </div>
        </div>
        )}
      </div>
    </TemplateShell>
  )
}
