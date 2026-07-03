import { Img, useCurrentFrame, useVideoConfig } from 'remotion'
import type { LyricLine, LyricVideoConfig } from '@lyricpulse/core'
import {
  getAnalysisFrame,
  getCurrentLyricLine,
  getPlaybackTime
} from '../helpers'
import { TemplateShell } from '../components/TemplateShell'
import { isDraftRender, isServerRender } from '../render-mode'
import { getRandomPosterObjectSettings } from './random-lyric-settings'

type RandomTextStyle = 'poster' | 'outline' | 'sticker' | 'terminal' | 'blueprint' | 'neon' | 'paper'

type RandomLyricProfile = {
  label: string
  tag: string
  background: string
  overlay: string
  style: RandomTextStyle
  density: number
  rotate: [number, number]
  activeRotate: [number, number]
  activePosition: 'center' | 'top' | 'bottom' | 'left' | 'right'
  wideFont: [number, number]
  tallFont: [number, number]
  accentMix?: boolean
  showCover?: boolean
  uppercase?: boolean
}

type FieldItem = {
  line: LyricLine
  key: string
  active: boolean
  distance: number
}

function hashString(input: string) {
  let hash = 2166136261

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return hash >>> 0
}

function randomUnit(seed: string) {
  return hashString(seed) / 0xffffffff
}

function randomRange(seed: string, min: number, max: number) {
  return min + randomUnit(seed) * (max - min)
}

function getFieldItems(lyrics: LyricLine[], currentLine: LyricLine | undefined, density: number) {
  const currentIndex = currentLine
    ? lyrics.findIndex((line) => line.id === currentLine.id)
    : 0
  const safeIndex = Math.max(0, currentIndex)
  const spread = Math.floor(density / 2)
  const offsets = Array.from({ length: density }, (_, index) => index - spread)

  return offsets
    .map((offset): FieldItem | undefined => {
      const line = lyrics[safeIndex + offset]

      if (!line) return undefined

      return {
        line,
        key: `${line.id}-${offset}`,
        active: offset === 0,
        distance: Math.abs(offset)
      }
    })
    .filter(Boolean) as FieldItem[]
}

function getTextTreatment(style: RandomTextStyle, active: boolean, accent: string) {
  if (style === 'outline') {
    return {
      color: active ? '#F8FAFC' : 'transparent',
      WebkitTextStroke: active ? `2px ${accent}` : '1px rgba(248,250,252,0.55)',
      background: 'transparent',
      border: undefined
    }
  }

  if (style === 'sticker') {
    return {
      color: active ? '#0F172A' : '#F8FAFC',
      background: active ? '#F8FAFC' : 'rgba(255,255,255,0.14)',
      border: active ? `5px solid ${accent}` : '1px solid rgba(255,255,255,0.18)'
    }
  }

  if (style === 'terminal') {
    return {
      color: active ? '#D9F99D' : 'rgba(163,230,53,0.48)',
      background: active ? 'rgba(2,6,23,0.72)' : 'rgba(2,6,23,0.22)',
      border: `1px solid ${active ? accent : 'rgba(163,230,53,0.2)'}`
    }
  }

  if (style === 'blueprint') {
    return {
      color: active ? '#F8FAFC' : 'rgba(191,219,254,0.58)',
      background: active ? 'rgba(15,23,42,0.58)' : 'rgba(59,130,246,0.08)',
      border: '1px dashed rgba(191,219,254,0.45)'
    }
  }

  if (style === 'neon') {
    return {
      color: active ? '#FFFFFF' : `${accent}AA`,
      background: active ? 'rgba(2,6,23,0.5)' : 'transparent',
      border: active ? `1px solid ${accent}88` : undefined
    }
  }

  if (style === 'paper') {
    return {
      color: active ? '#111827' : 'rgba(17,24,39,0.58)',
      background: active ? 'rgba(255,251,235,0.94)' : 'rgba(255,251,235,0.28)',
      border: '1px solid rgba(120,113,108,0.25)'
    }
  }

  return {
    color: active ? '#F8FAFC' : 'rgba(248,250,252,0.58)',
    background: active ? 'rgba(2,6,23,0.44)' : 'transparent',
    border: active ? `1px solid ${accent}66` : undefined
  }
}

function RandomLyricField({
  config,
  profile
}: {
  config: LyricVideoConfig
  profile: RandomLyricProfile
}) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const time = getPlaybackTime(frame, fps)
  const currentLine = getCurrentLyricLine(config.lyrics, time)
  const analysisFrame = getAnalysisFrame(config.analysis.frames, time)
  const isWide = config.ratio === '16:9'
  const fastRender = isServerRender(config)
  const draftRender = isDraftRender(config)
  const items = getFieldItems(config.lyrics, currentLine, profile.density)
  const pulse = 1 + analysisFrame.rms * 0.055 * config.effect.beatImpact
  const customObjects = config.customTemplate?.ratioSettings[config.ratio]?.objects
  const titleSettings = getRandomPosterObjectSettings(config.templateId, config.ratio, 'title', customObjects)
  const titleLayout = titleSettings.layout
  const titleTypography = titleSettings.typography
  const artistSettings = getRandomPosterObjectSettings(config.templateId, config.ratio, 'artist', customObjects)
  const artistLayout = artistSettings.layout
  const artistTypography = artistSettings.typography
  const coverSettings = getRandomPosterObjectSettings(config.templateId, config.ratio, 'cover', customObjects)
  const coverLayout = coverSettings.layout
  const lyricsSettings = getRandomPosterObjectSettings(config.templateId, config.ratio, 'lyrics', customObjects)
  const lyricsLayout = lyricsSettings.layout
  const lyricsTypography = lyricsSettings.typography
  const activeLyricSettings = getRandomPosterObjectSettings(config.templateId, config.ratio, 'activeLyric', customObjects)
  const activeLyricLayout = activeLyricSettings.layout
  const activeLyricTypography = activeLyricSettings.typography
  const inactiveBaseFont = lyricsTypography?.fontSize ?? (isWide ? 56 : 66)
  const activeBaseFont = activeLyricTypography?.fontSize ?? (isWide ? 102 : 126)
  const activeBox = {
    left: activeLyricLayout.x,
    top: activeLyricLayout.y,
    width: activeLyricLayout.width,
    height: activeLyricLayout.height
  }
  const stageLighting = Math.max(0, Math.min(config.effect.stageLighting, 1))
  const fieldEnergy = Math.max(
    0,
    Math.min(1, analysisFrame.rms * 0.45 + analysisFrame.bass * 0.4 + analysisFrame.treble * 0.15)
  )
  const fieldGlowOpacity = (0.18 + fieldEnergy * 0.34) * stageLighting

  return (
    <TemplateShell config={config} variant="dashboard">
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: profile.background }}>
        {config.coverUrl && coverLayout.visible !== false ? (
          <Img
            src={config.coverUrl}
            alt={config.title ?? 'cover artwork'}
            style={{
              position: 'absolute',
              left: coverLayout.x,
              top: coverLayout.y,
              width: coverLayout.width,
              height: coverLayout.height,
              objectFit: 'cover',
              borderRadius: profile.style === 'paper' ? 18 : 42,
              opacity: coverLayout.opacity,
              filter: fastRender ? 'brightness(0.62)' : 'brightness(0.7) saturate(1.1)',
               boxShadow: draftRender ? '0 14px 42px rgba(0,0,0,0.28)' : '0 28px 90px rgba(0,0,0,0.42)',
              transform: coverLayout.scale ? `scale(${coverLayout.scale})` : undefined,
              transformOrigin: 'top left'
            }}
          />
        ) : null}
        <div style={{ position: 'absolute', inset: 0, background: profile.overlay }} />
        <div
          style={{
            position: 'absolute',
            inset: '-12%',
             opacity: draftRender ? fieldGlowOpacity * 0.7 : fieldGlowOpacity,
             background: `radial-gradient(circle at 50% 20%, ${config.theme.accentColor}BB, transparent 30%), radial-gradient(circle at 18% 72%, ${config.theme.primaryColor}88, transparent 34%), radial-gradient(circle at 84% 36%, ${config.theme.accentColor}66, transparent 28%)`,
             filter: draftRender ? 'blur(16px)' : fastRender ? 'blur(28px)' : 'blur(72px)',
             mixBlendMode: draftRender ? 'normal' : 'screen',
             pointerEvents: 'none'
           }}
         />
        <div
          style={{
            position: 'absolute',
            left: isWide ? 82 : 62,
            top: isWide ? 64 : 76,
            right: isWide ? 82 : 62,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'start',
            gap: 24,
            color: profile.style === 'paper' ? '#111827' : '#F8FAFC'
          }}
        >
          <div style={{ minWidth: 0, position: 'relative', width: '100%', height: isWide ? 120 : 148 }}>
            <div style={{
              position: 'absolute',
              left: titleLayout.x - (isWide ? 82 : 62),
              top: titleLayout.y - (isWide ? 64 : 76),
              width: titleLayout.width,
              height: titleLayout.height,
              opacity: titleLayout.opacity,
              display: titleLayout.visible === false ? 'none' : undefined,
              transform: titleLayout.scale ? `scale(${titleLayout.scale})` : undefined,
              transformOrigin: 'top left',
              fontSize: titleTypography?.fontSize ?? (isWide ? 42 : 54),
              fontWeight: titleTypography?.fontWeight ?? 950,
              lineHeight: titleTypography?.lineHeight ?? 0.98,
              letterSpacing: `${titleTypography?.letterSpacing ?? -0.055}em`,
              overflow: 'hidden'
            }}>
              {config.title ?? ' '}
            </div>
            {config.artist ? (
              <div style={{
                position: 'absolute',
                left: artistLayout.x - (isWide ? 82 : 62),
                top: artistLayout.y - (isWide ? 64 : 76),
                width: artistLayout.width,
                height: artistLayout.height,
                opacity: artistLayout.opacity,
                display: artistLayout.visible === false ? 'none' : undefined,
                transform: artistLayout.scale ? `scale(${artistLayout.scale})` : undefined,
                transformOrigin: 'top left',
                fontSize: artistTypography?.fontSize ?? (isWide ? 22 : 28),
                fontWeight: artistTypography?.fontWeight ?? 760,
                lineHeight: artistTypography?.lineHeight ?? 1.08,
                letterSpacing: artistTypography?.letterSpacing ? `${artistTypography.letterSpacing}em` : undefined,
                overflow: 'hidden'
              }}>
                {config.artist}
              </div>
            ) : null}
          </div>
          <div style={{ fontSize: isWide ? 16 : 20, fontWeight: 900, letterSpacing: '0.12em', color: config.theme.accentColor }}>
            {profile.tag}
          </div>
        </div>
        <div style={{
          position: 'absolute',
          left: lyricsLayout.x,
          top: lyricsLayout.y,
          width: lyricsLayout.width,
          height: lyricsLayout.height,
          opacity: lyricsLayout.opacity,
          display: lyricsLayout.visible === false ? 'none' : undefined,
          transform: lyricsLayout.scale ? `scale(${lyricsLayout.scale})` : undefined,
          transformOrigin: 'top left'
        }}>
          {items.map((item) => {
            const seed = `${config.projectId}-${profile.label}-${item.key}`
            const fontRange = isWide ? profile.wideFont : profile.tallFont
            const fontSize = item.active
              ? activeBaseFont
              : randomRange(`${seed}-fs`, Math.max(16, inactiveBaseFont * 0.58), Math.max(inactiveBaseFont, fontRange[1]))
            const width = item.active
              ? activeBox.width
              : randomRange(`${seed}-w`, Math.min(360, lyricsLayout.width * 0.42), Math.min(lyricsLayout.width * 0.78, fontSize * 11))
            const height = fontSize * (item.active ? 2.3 : 1.7)
            const x = item.active
              ? activeBox.left - lyricsLayout.x
              : randomRange(`${seed}-x`, 0, Math.max(0, lyricsLayout.width - width))
            const y = item.active
              ? activeBox.top - lyricsLayout.y
              : randomRange(`${seed}-y`, 0, Math.max(0, lyricsLayout.height - height))
            const rotateRange = item.active ? profile.activeRotate : profile.rotate
            const rotation = randomRange(`${seed}-r`, rotateRange[0], rotateRange[1])
            const treatment = getTextTreatment(profile.style, item.active, config.theme.accentColor)
            const opacity = item.active ? 1 : Math.max(0.12, 0.6 - item.distance * 0.065)
            const text = profile.uppercase ? item.line.text.toUpperCase() : item.line.text

            return (
              <div
                key={item.key}
                style={{
                  position: 'absolute',
                  left: x,
                  top: y,
                  width,
                  minHeight: height,
                  transform: `rotate(${rotation}deg) scale(${item.active ? pulse : 1})`,
                  transformOrigin: 'center',
                  opacity,
                  color: treatment.color,
                  WebkitTextStroke: treatment.WebkitTextStroke,
                  fontFamily: profile.style === 'terminal' ? 'monospace' : config.theme.fontFamily,
                  fontSize,
                  fontWeight: item.active
                    ? (activeLyricTypography?.fontWeight ?? 980)
                    : (lyricsTypography?.fontWeight ?? 820),
                  lineHeight: item.active
                    ? (activeLyricTypography?.lineHeight ?? 0.98)
                    : (lyricsTypography?.lineHeight ?? 1.04),
                  letterSpacing: `${item.active
                    ? (activeLyricTypography?.letterSpacing ?? -0.065)
                    : (lyricsTypography?.letterSpacing ?? -0.035)}em`,
                  textAlign: randomUnit(`${seed}-align`) > 0.5 ? 'center' : 'left',
                  padding: item.active ? (isWide ? '26px 34px' : '32px 38px') : '8px 10px',
                  borderRadius: profile.style === 'sticker' ? 28 : profile.style === 'terminal' ? 4 : 24,
                  background: treatment.background,
                  border: treatment.border,
                   boxShadow: item.active && !fastRender && !draftRender
                     ? `0 30px 130px ${config.theme.accentColor}26, 0 10px 30px rgba(0,0,0,0.3)`
                     : undefined,
                   textShadow: draftRender
                     ? undefined
                     : profile.style === 'neon'
                     ? `0 0 ${item.active ? 42 : 18}px ${config.theme.accentColor}`
                     : item.active && profile.style !== 'paper'
                       ? '0 8px 0 rgba(0,0,0,0.34)'
                      : undefined,
                  overflow: 'hidden'
                }}
              >
                {text}
              </div>
            )
          })}
        </div>
      </div>
    </TemplateShell>
  )
}

const profiles = {
  ScatterPoster: {
    label: 'ScatterPoster', tag: 'SCATTER', style: 'poster', density: 11, rotate: [-26, 26], activeRotate: [-5, 5], activePosition: 'center', wideFont: [34, 76], tallFont: [42, 92], showCover: true,
    background: 'linear-gradient(135deg, #111827, #312E81 52%, #020617)', overlay: 'radial-gradient(circle at 18% 22%, rgba(251,191,36,0.32), transparent 30%)'
  },
  OrbitWords: {
    label: 'OrbitWords', tag: 'ORBIT', style: 'outline', density: 13, rotate: [-34, 34], activeRotate: [-8, 8], activePosition: 'center', wideFont: [36, 78], tallFont: [40, 96],
    background: 'radial-gradient(circle at center, #172554, #020617 70%)', overlay: 'repeating-radial-gradient(circle at center, rgba(147,197,253,0.22) 0 2px, transparent 2px 86px)'
  },
  CutoutRansom: {
    label: 'CutoutRansom', tag: 'CUTOUT', style: 'paper', density: 12, rotate: [-18, 18], activeRotate: [-4, 4], activePosition: 'bottom', wideFont: [32, 70], tallFont: [38, 86], showCover: true,
    background: 'linear-gradient(135deg, #F5F5F4, #D6D3D1)', overlay: 'repeating-linear-gradient(90deg, rgba(120,113,108,0.12) 0 1px, transparent 1px 36px)'
  },
  NeonGraffiti: {
    label: 'NeonGraffiti', tag: 'GRAFFITI', style: 'neon', density: 14, rotate: [-28, 28], activeRotate: [-7, 7], activePosition: 'left', wideFont: [38, 84], tallFont: [44, 98],
    background: 'linear-gradient(135deg, #020617, #3B0764 54%, #111827)', overlay: 'radial-gradient(circle at 78% 26%, rgba(236,72,153,0.34), transparent 32%)'
  },
  MagneticPoetry: {
    label: 'MagneticPoetry', tag: 'MAGNET', style: 'sticker', density: 10, rotate: [-12, 12], activeRotate: [-3, 3], activePosition: 'top', wideFont: [30, 66], tallFont: [38, 82], showCover: true,
    background: 'linear-gradient(135deg, #334155, #0F172A)', overlay: 'linear-gradient(180deg, rgba(255,255,255,0.12), transparent)'
  },
  BrokenKaraoke: {
    label: 'BrokenKaraoke', tag: 'KARAOKE', style: 'poster', density: 15, rotate: [-8, 8], activeRotate: [-2, 2], activePosition: 'bottom', wideFont: [34, 80], tallFont: [42, 100],
    background: 'linear-gradient(180deg, #7F1D1D, #020617)', overlay: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.08) 0 2px, transparent 2px 8px)'
  },
  StarfieldWhispers: {
    label: 'StarfieldWhispers', tag: 'STARFIELD', style: 'outline', density: 16, rotate: [-40, 40], activeRotate: [-6, 6], activePosition: 'center', wideFont: [28, 64], tallFont: [34, 80],
    background: 'radial-gradient(circle at 40% 20%, #1E1B4B, #020617 68%)', overlay: 'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.28) 0 1px, transparent 2px)'
  },
  PolaroidStorm: {
    label: 'PolaroidStorm', tag: 'POLAROID', style: 'paper', density: 11, rotate: [-22, 22], activeRotate: [-5, 5], activePosition: 'right', wideFont: [32, 72], tallFont: [38, 86], showCover: true,
    background: 'linear-gradient(135deg, #FEF3C7, #FDBA74 58%, #7C2D12)', overlay: 'radial-gradient(circle at 74% 16%, rgba(255,255,255,0.32), transparent 34%)'
  },
  InkSplashWords: {
    label: 'InkSplashWords', tag: 'INK', style: 'paper', density: 12, rotate: [-32, 32], activeRotate: [-8, 8], activePosition: 'center', wideFont: [34, 82], tallFont: [42, 100],
    background: 'linear-gradient(135deg, #F8FAFC, #CBD5E1)', overlay: 'radial-gradient(circle at 22% 72%, rgba(15,23,42,0.28), transparent 28%)'
  },
  TerminalScatter: {
    label: 'TerminalScatter', tag: 'TERMINAL', style: 'terminal', density: 13, rotate: [-4, 4], activeRotate: [-1, 1], activePosition: 'left', wideFont: [28, 62], tallFont: [34, 76], uppercase: true,
    background: 'linear-gradient(135deg, #020617, #052E16)', overlay: 'repeating-linear-gradient(0deg, rgba(132,204,22,0.08) 0 1px, transparent 1px 7px)'
  },
  VelvetMargins: {
    label: 'VelvetMargins', tag: 'VELVET', style: 'neon', density: 10, rotate: [-18, 18], activeRotate: [-4, 4], activePosition: 'right', wideFont: [36, 82], tallFont: [42, 96], showCover: true,
    background: 'linear-gradient(135deg, #170724, #4C0519 60%, #020617)', overlay: 'radial-gradient(circle at 18% 74%, rgba(244,114,182,0.32), transparent 34%)'
  },
  PrismDrift: {
    label: 'PrismDrift', tag: 'PRISM', style: 'outline', density: 14, rotate: [-30, 30], activeRotate: [-6, 6], activePosition: 'center', wideFont: [34, 78], tallFont: [40, 92],
    background: 'linear-gradient(135deg, #020617, #0F766E 52%, #312E81)', overlay: 'linear-gradient(60deg, rgba(255,255,255,0.22), transparent 26%, rgba(255,255,255,0.16) 56%, transparent)'
  },
  StickerBombLyrics: {
    label: 'StickerBombLyrics', tag: 'STICKER', style: 'sticker', density: 17, rotate: [-28, 28], activeRotate: [-7, 7], activePosition: 'center', wideFont: [28, 62], tallFont: [34, 76],
    background: 'linear-gradient(135deg, #F97316, #06B6D4 55%, #A855F7)', overlay: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.3), transparent 42%)'
  },
  BlueprintAnnotations: {
    label: 'BlueprintAnnotations', tag: 'BLUEPRINT', style: 'blueprint', density: 12, rotate: [-10, 10], activeRotate: [-2, 2], activePosition: 'top', wideFont: [30, 68], tallFont: [36, 84],
    background: 'linear-gradient(135deg, #0C4A6E, #082F49)', overlay: 'repeating-linear-gradient(90deg, rgba(191,219,254,0.16) 0 1px, transparent 1px 42px), repeating-linear-gradient(0deg, rgba(191,219,254,0.12) 0 1px, transparent 1px 42px)'
  },
  RadioStaticText: {
    label: 'RadioStaticText', tag: 'STATIC', style: 'terminal', density: 15, rotate: [-18, 18], activeRotate: [-4, 4], activePosition: 'bottom', wideFont: [30, 70], tallFont: [36, 84], uppercase: true,
    background: 'linear-gradient(135deg, #111827, #030712)', overlay: 'repeating-linear-gradient(120deg, rgba(255,255,255,0.09) 0 1px, transparent 1px 5px)'
  },
  GlassMosaicWords: {
    label: 'GlassMosaicWords', tag: 'MOSAIC', style: 'poster', density: 13, rotate: [-20, 20], activeRotate: [-5, 5], activePosition: 'right', wideFont: [34, 78], tallFont: [40, 92], showCover: true,
    background: 'linear-gradient(135deg, #E0F2FE, #0F172A 58%)', overlay: 'linear-gradient(45deg, rgba(255,255,255,0.22), transparent 32%)'
  },
  CarnivalSigns: {
    label: 'CarnivalSigns', tag: 'CARNIVAL', style: 'sticker', density: 12, rotate: [-16, 16], activeRotate: [-4, 4], activePosition: 'center', wideFont: [36, 82], tallFont: [44, 100],
    background: 'linear-gradient(135deg, #7C2D12, #FBBF24 48%, #BE123C)', overlay: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.18) 0 18px, transparent 18px 42px)'
  },
  ShadowTypeCollage: {
    label: 'ShadowTypeCollage', tag: 'SHADOW', style: 'poster', density: 16, rotate: [-36, 36], activeRotate: [-6, 6], activePosition: 'left', wideFont: [30, 72], tallFont: [36, 88],
    background: 'linear-gradient(135deg, #0F172A, #1F2937)', overlay: 'radial-gradient(circle at 70% 22%, rgba(148,163,184,0.22), transparent 30%)'
  },
  HeatmapLyrics: {
    label: 'HeatmapLyrics', tag: 'HEATMAP', style: 'neon', density: 14, rotate: [-14, 14], activeRotate: [-3, 3], activePosition: 'bottom', wideFont: [34, 80], tallFont: [40, 96],
    background: 'linear-gradient(135deg, #450A0A, #7F1D1D 45%, #111827)', overlay: 'radial-gradient(circle at 28% 35%, rgba(249,115,22,0.4), transparent 34%)'
  },
  NewspaperRain: {
    label: 'NewspaperRain', tag: 'NEWSPRINT', style: 'paper', density: 18, rotate: [-24, 24], activeRotate: [-5, 5], activePosition: 'top', wideFont: [28, 66], tallFont: [34, 78],
    background: 'linear-gradient(135deg, #FAFAF9, #A8A29E)', overlay: 'repeating-linear-gradient(0deg, rgba(28,25,23,0.08) 0 1px, transparent 1px 18px)'
  }
} satisfies Record<string, RandomLyricProfile>

export function ScatterPoster({ config }: { config: LyricVideoConfig }) { return <RandomLyricField config={config} profile={profiles.ScatterPoster} /> }
export function OrbitWords({ config }: { config: LyricVideoConfig }) { return <RandomLyricField config={config} profile={profiles.OrbitWords} /> }
export function CutoutRansom({ config }: { config: LyricVideoConfig }) { return <RandomLyricField config={config} profile={profiles.CutoutRansom} /> }
export function NeonGraffiti({ config }: { config: LyricVideoConfig }) { return <RandomLyricField config={config} profile={profiles.NeonGraffiti} /> }
export function MagneticPoetry({ config }: { config: LyricVideoConfig }) { return <RandomLyricField config={config} profile={profiles.MagneticPoetry} /> }
export function BrokenKaraoke({ config }: { config: LyricVideoConfig }) { return <RandomLyricField config={config} profile={profiles.BrokenKaraoke} /> }
export function StarfieldWhispers({ config }: { config: LyricVideoConfig }) { return <RandomLyricField config={config} profile={profiles.StarfieldWhispers} /> }
export function PolaroidStorm({ config }: { config: LyricVideoConfig }) { return <RandomLyricField config={config} profile={profiles.PolaroidStorm} /> }
export function InkSplashWords({ config }: { config: LyricVideoConfig }) { return <RandomLyricField config={config} profile={profiles.InkSplashWords} /> }
export function TerminalScatter({ config }: { config: LyricVideoConfig }) { return <RandomLyricField config={config} profile={profiles.TerminalScatter} /> }
export function VelvetMargins({ config }: { config: LyricVideoConfig }) { return <RandomLyricField config={config} profile={profiles.VelvetMargins} /> }
export function PrismDrift({ config }: { config: LyricVideoConfig }) { return <RandomLyricField config={config} profile={profiles.PrismDrift} /> }
export function StickerBombLyrics({ config }: { config: LyricVideoConfig }) { return <RandomLyricField config={config} profile={profiles.StickerBombLyrics} /> }
export function BlueprintAnnotations({ config }: { config: LyricVideoConfig }) { return <RandomLyricField config={config} profile={profiles.BlueprintAnnotations} /> }
export function RadioStaticText({ config }: { config: LyricVideoConfig }) { return <RandomLyricField config={config} profile={profiles.RadioStaticText} /> }
export function GlassMosaicWords({ config }: { config: LyricVideoConfig }) { return <RandomLyricField config={config} profile={profiles.GlassMosaicWords} /> }
export function CarnivalSigns({ config }: { config: LyricVideoConfig }) { return <RandomLyricField config={config} profile={profiles.CarnivalSigns} /> }
export function ShadowTypeCollage({ config }: { config: LyricVideoConfig }) { return <RandomLyricField config={config} profile={profiles.ShadowTypeCollage} /> }
export function HeatmapLyrics({ config }: { config: LyricVideoConfig }) { return <RandomLyricField config={config} profile={profiles.HeatmapLyrics} /> }
export function NewspaperRain({ config }: { config: LyricVideoConfig }) { return <RandomLyricField config={config} profile={profiles.NewspaperRain} /> }
