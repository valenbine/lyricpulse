import { Img, useCurrentFrame, useVideoConfig } from 'remotion'
import type { LyricVideoConfig } from '@lyricpulse/core'
import {
  getAnalysisFrame,
  getCurrentLyricLine,
  getPlaybackTime
} from '../helpers'
import { TemplateShell } from '../components/TemplateShell'
import { isServerRender } from '../render-mode'
import {
  getHeroSplitObjectSettings,
  heroSplitFrameInsets
} from './hero-split-settings'

function getVisibleLyrics(
  lyrics: LyricVideoConfig['lyrics'],
  currentLine: LyricVideoConfig['lyrics'][number] | undefined
) {
  const currentIndex = currentLine
    ? lyrics.findIndex((line) => line.id === currentLine.id)
    : -1
  const safeIndex = Math.max(0, currentIndex)

  return [lyrics[safeIndex - 1], lyrics[safeIndex], lyrics[safeIndex + 1]].filter(
    Boolean
  )
}

export function HeroSplit({ config }: { config: LyricVideoConfig }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const time = getPlaybackTime(frame, fps)
  const currentLine = getCurrentLyricLine(config.lyrics, time)
  const analysisFrame = getAnalysisFrame(config.analysis.frames, time)
  const isWide = config.ratio === '16:9'
  const fastRender = isServerRender(config)
  const accent = config.theme.accentColor
  const customObjects = config.customTemplate?.ratioSettings[config.ratio]?.objects
  const frameInsets = heroSplitFrameInsets[config.ratio]
  const titleSettings = getHeroSplitObjectSettings(config.ratio, 'title', customObjects)
  const titleLayout = titleSettings.layout
  const titleTypography = titleSettings.typography
  const artistSettings = getHeroSplitObjectSettings(config.ratio, 'artist', customObjects)
  const artistLayout = artistSettings.layout
  const artistTypography = artistSettings.typography
  const coverSettings = getHeroSplitObjectSettings(config.ratio, 'cover', customObjects)
  const coverLayout = coverSettings.layout
  const lyricsSettings = getHeroSplitObjectSettings(config.ratio, 'lyrics', customObjects)
  const lyricsLayout = lyricsSettings.layout
  const lyricsTypography = lyricsSettings.typography
  const lyricFontFamily =
    lyricsTypography?.fontFamily ??
    'FangSong, STFangsong, FZYaoti, Noto Serif CJK SC, SimSun, serif'
  const activeLyricFontSize =
    lyricsTypography?.fontSize ?? (isWide ? 66 : 82)
  const inactiveLyricFontSize = Math.max(12, activeLyricFontSize * 0.74)
  const rows = getVisibleLyrics(config.lyrics, currentLine)
  const fallbackRows = rows.length > 0 ? rows : [{ id: 'fallback', text: '' }]
  const meterBars = Array.from({ length: fastRender ? 18 : isWide ? 32 : 24 }, (_, index) => {
    const pulse = Math.sin(frame / 5 + index * 0.8) * 0.42 + Math.sin(frame / 11 + index) * 0.3
    const energy = Math.max(0, pulse + analysisFrame.rms * 1.1)

    return 18 + energy * (isWide ? 92 : 118) + (index % 4) * 8
  })

  return (
    <TemplateShell config={config} variant="dashboard">
      <div
        style={{
          position: 'absolute',
            top: frameInsets.top,
            right: frameInsets.right,
            bottom: frameInsets.bottom,
            left: frameInsets.left,
          overflow: 'hidden',
          borderRadius: isWide ? 46 : 58,
          background: 'linear-gradient(145deg, #080816, #171733)',
          border: `1px solid ${accent}4D`,
          boxShadow: fastRender
            ? '0 22px 56px rgba(0,0,0,0.36)'
            : `0 34px 120px rgba(0,0,0,0.55), 0 0 110px ${accent}24 inset`
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(circle at 28% 18%, ${config.theme.primaryColor}55, transparent 34%), radial-gradient(circle at 74% 70%, ${accent}55, transparent 36%)`,
            opacity: 0.82
          }}
        />
        {config.coverUrl ? (
          <div
            style={{
              position: 'absolute',
              left: coverLayout?.x,
              top: coverLayout?.y,
              width: coverLayout?.width,
              height: coverLayout?.height,
              opacity: coverLayout?.opacity,
              display: coverLayout?.visible === false ? 'none' : undefined,
              overflow: 'hidden',
              borderRadius: isWide ? 0 : 42,
              border: isWide ? undefined : '1px solid rgba(255,255,255,0.24)',
              boxShadow: isWide
                ? undefined
                : fastRender
                  ? '0 18px 46px rgba(0,0,0,0.34)'
                  : `0 28px 86px rgba(0,0,0,0.42), 0 0 70px ${accent}22`,
              zIndex: isWide ? undefined : 3,
              transform: coverLayout?.scale ? `scale(${coverLayout.scale})` : undefined,
              transformOrigin: 'top left'
            }}
          >
            <Img
              src={config.coverUrl}
              alt={config.title ?? 'cover artwork'}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: fastRender
                  ? 'brightness(0.62) saturate(1.04)'
                  : isWide
                    ? 'brightness(0.66) saturate(1.16)'
                    : 'brightness(0.86) saturate(1.08)',
                transform: `scale(${1.04 + analysisFrame.bass * 0.025})`
              }}
            />
          </div>
        ) : null}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: isWide
              ? 'linear-gradient(90deg, rgba(8,8,22,0.98) 0%, rgba(8,8,22,0.88) 43%, rgba(8,8,22,0.36) 68%, rgba(8,8,22,0.68) 100%)'
              : 'linear-gradient(180deg, rgba(8,8,22,0.98) 0%, rgba(8,8,22,0.88) 36%, rgba(8,8,22,0.72) 100%)'
          }}
        />
        <div
          style={{
            position: 'absolute',
              left: artistLayout?.x,
              top: artistLayout?.y,
              width: artistLayout?.width,
              height: artistLayout?.height,
              opacity: artistLayout?.opacity,
            display: artistLayout?.visible === false ? 'none' : undefined,
            color: 'rgba(255,255,255,0.62)',
            fontFamily: artistTypography?.fontFamily,
              fontSize: artistTypography?.fontSize,
              fontWeight: artistTypography?.fontWeight,
              lineHeight: artistTypography?.lineHeight,
            transform: artistLayout?.scale ? `scale(${artistLayout.scale})` : undefined,
            transformOrigin: 'top left'
          }}
        >
          {config.artist ?? ' '}
        </div>
        <div
          style={{
            position: 'absolute',
              left: titleLayout?.x,
              top: titleLayout?.y,
              width: titleLayout?.width,
              height: titleLayout?.height,
              opacity: titleLayout?.opacity,
            display: titleLayout?.visible === false ? 'none' : undefined,
            color: '#F8FAFC',
            fontFamily: titleTypography?.fontFamily,
              fontSize: titleTypography?.fontSize,
              lineHeight: titleTypography?.lineHeight,
              fontWeight: titleTypography?.fontWeight,
              letterSpacing: titleTypography?.letterSpacing ? `${titleTypography.letterSpacing}em` : undefined,
            textShadow: fastRender ? undefined : `0 0 48px ${accent}33`,
            overflow: 'hidden',
            transform: titleLayout?.scale ? `scale(${titleLayout.scale})` : undefined,
            transformOrigin: 'top left'
          }}
        >
          {config.title ?? ' '}
        </div>
        <div
          style={{
            position: 'absolute',
            left: lyricsLayout?.x,
            bottom: undefined,
            top: lyricsLayout?.y,
            width: lyricsLayout?.width,
            height: lyricsLayout?.height,
            opacity: lyricsLayout?.opacity,
            display: lyricsLayout?.visible === false ? 'none' : 'flex',
            transform: lyricsLayout?.scale ? `scale(${lyricsLayout.scale})` : undefined,
            transformOrigin: 'top left',
            flexDirection: 'column',
            gap: isWide ? 16 : 20
          }}
        >
          {fallbackRows.slice(0, 3).map((line) => {
            const active = line.id === currentLine?.id || fallbackRows.length === 1

            return (
              <div
                key={line.id}
                style={{
                  borderRadius: isWide ? 24 : 28,
                  padding: isWide ? '20px 26px' : '26px 30px',
                  background: active
                    ? 'rgba(255,255,255,0.94)'
                    : 'rgba(255,255,255,0.1)',
                  border: active
                    ? '1px solid rgba(255,255,255,0.92)'
                    : '1px solid rgba(255,255,255,0.12)',
                  color: active ? '#080816' : 'rgba(255,255,255,0.72)',
                  fontSize: active ? activeLyricFontSize : inactiveLyricFontSize,
                  fontFamily: lyricFontFamily,
                  lineHeight: 1.12,
                  fontWeight: active ? 920 : 760,
                  letterSpacing: active ? '-0.052em' : '-0.035em',
                  boxShadow: active
                    ? '0 24px 60px rgba(0,0,0,0.34)'
                    : undefined
                }}
              >
                {line.text}
              </div>
            )
          })}
        </div>
        <div
          style={{
            position: 'absolute',
            left: isWide ? 40 : 34,
            right: isWide ? 40 : 34,
            bottom: 0,
            height: isWide ? 102 : 144,
            display: 'flex',
            alignItems: 'end',
            gap: isWide ? 8 : 7,
            opacity: 0.7
          }}
        >
          {meterBars.map((height, index) => (
            <div
              key={index}
              style={{
                flex: 1,
                height,
                borderRadius: 999,
                background: `linear-gradient(180deg, #F8FAFC 0%, ${accent} 58%, #22C55E 100%)`,
                boxShadow: fastRender ? undefined : `0 0 18px ${accent}55`
              }}
            />
          ))}
        </div>
      </div>
    </TemplateShell>
  )
}
