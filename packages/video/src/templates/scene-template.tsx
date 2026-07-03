import { useCurrentFrame, useVideoConfig } from 'remotion'
import type { LyricVideoConfig } from '@lyricpulse/core'
import {
  getAnalysisFrame,
  getCurrentLyricLine,
  getPlaybackTime
} from '../helpers'
import { TemplateShell } from '../components/TemplateShell'
import {
  CaptionPanel,
  FloatingCover,
  getContrastTextColors,
  type CaptionFrame
} from './visual-utils'

type ScenePattern =
  | 'kineticType'
  | 'polarNight'
  | 'confetti'
  | 'circuit'
  | 'blueprint'
  | 'velour'
  | 'cabin'
  | 'collage'
  | 'laser'
  | 'porcelain'

type SceneProfile = {
  pattern: ScenePattern
  label: string
  variant: 'pulse' | 'neon' | 'waveform' | 'dashboard'
  background: string
  titleColor: string
  accent: string
  coverRadius: number
  coverRotate?: number
  circleCover?: boolean
}

export function SceneTemplate({
  config,
  profile
}: {
  config: LyricVideoConfig
  profile: SceneProfile
}) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const time = getPlaybackTime(frame, fps)
  const analysisFrame = getAnalysisFrame(config.analysis.frames, time)
  const lyricLine = getCurrentLyricLine(config.lyrics, time)
  const isWide = config.ratio === '16:9'
  const coverSize = isWide ? 340 : 455
  const coverLeft = isWide ? 128 : (1080 - coverSize) / 2
  const coverTop = isWide ? 312 : 225
  const contentLeft = isWide ? 620 : 54
  const contentRight = isWide ? 92 : 54
  const titleTop = isWide ? 150 : 765
  const lyricTop = isWide ? 510 : 1190
  const captionFrame = getSceneCaptionFrame(profile.pattern)
  const contrast = getContrastTextColors(config, `${config.templateId}:${profile.pattern}`)

  return (
    <TemplateShell config={config} variant={profile.variant}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          background: profile.background
        }}
      >
        <SceneDecorations
          pattern={profile.pattern}
          accent={profile.accent}
          frame={frame}
          bass={analysisFrame.bass}
          mid={analysisFrame.mid}
          treble={analysisFrame.treble}
          isWide={isWide}
        />
        <FloatingCover
          config={config}
          left={coverLeft}
          top={coverTop}
          size={coverSize}
          radius={profile.coverRadius}
          rotate={profile.coverRotate ?? 0}
          circle={profile.circleCover}
          scale={1 + analysisFrame.bass * 0.032}
        />
        <div
          style={{
            position: 'absolute',
            left: contentLeft,
            right: contentRight,
            top: titleTop,
            color: contrast.titleColor,
            fontSize: isWide ? 80 : 82,
            fontWeight: 950,
            letterSpacing: '-0.07em',
            lineHeight: 0.9,
            textShadow: contrast.titleShadow
          }}
        >
          {config.title ?? ' '}
        </div>
        <div
          style={{
            position: 'absolute',
            left: contentLeft,
            right: contentRight,
            top: titleTop + (isWide ? 104 : 108),
            color: contrast.lyricColor,
            fontSize: isWide ? 25 : 28,
            fontWeight: 850,
            letterSpacing: '0.15em',
            opacity: 0.78,
            textTransform: 'uppercase'
          }}
        >
          {config.artist ?? ' '}
        </div>
        <CaptionPanel
          config={config}
          text={lyricLine?.text}
          left={contentLeft}
          right={contentRight}
          top={lyricTop}
          align={isWide ? 'left' : 'center'}
          fontSize={isWide ? 66 : 72}
          frame={captionFrame}
        />
      </div>
    </TemplateShell>
  )
}

function getSceneCaptionFrame(pattern: ScenePattern): CaptionFrame {
  if (pattern === 'blueprint') {
    return 'blueprint'
  }

  if (pattern === 'collage' || pattern === 'cabin') {
    return 'paper'
  }

  if (pattern === 'circuit') {
    return 'manual'
  }

  if (pattern === 'porcelain') {
    return 'stamp'
  }

  if (pattern === 'laser') {
    return 'neonRail'
  }

  if (pattern === 'confetti') {
    return 'ticket'
  }

  if (pattern === 'polarNight') {
    return 'radar'
  }

  if (pattern === 'velour') {
    return 'radio'
  }

  return 'glass'
}

function SceneDecorations({
  pattern,
  accent,
  frame,
  bass,
  mid,
  treble,
  isWide
}: {
  pattern: ScenePattern
  accent: string
  frame: number
  bass: number
  mid: number
  treble: number
  isWide: boolean
}) {
  if (pattern === 'kineticType') {
    return <KineticType accent={accent} frame={frame} treble={treble} />
  }

  if (pattern === 'polarNight') {
    return <PolarNight accent={accent} frame={frame} bass={bass} />
  }

  if (pattern === 'confetti') {
    return <ConfettiGrid accent={accent} frame={frame} mid={mid} />
  }

  if (pattern === 'circuit') {
    return <SceneCircuitGarden accent={accent} frame={frame} bass={bass} />
  }

  if (pattern === 'blueprint') {
    return <BlueprintField accent={accent} frame={frame} isWide={isWide} />
  }

  if (pattern === 'velour') {
    return <VelourRopes accent={accent} frame={frame} />
  }

  if (pattern === 'cabin') {
    return <CabinPlanks accent={accent} frame={frame} />
  }

  if (pattern === 'collage') {
    return <CollageTiles accent={accent} frame={frame} bass={bass} />
  }

  if (pattern === 'laser') {
    return <SceneLaserWarehouse accent={accent} frame={frame} treble={treble} />
  }

  return <PorcelainMarks accent={accent} frame={frame} />
}

function KineticType({ accent, frame, treble }: { accent: string; frame: number; treble: number }) {
  return <>{Array.from({ length: 4 }).map((_, index) => <div key={index} style={{ position: 'absolute', left: `${4 + index * 24}%`, top: `${8 + (index % 2) * 46}%`, width: 250, height: 88, borderRadius: 999, border: `16px solid ${accent}`, opacity: 0.2 + treble * 0.2, transform: `rotate(${-10 + index * 7 + Math.sin(frame / 22 + index) * 4}deg)` }} />)}</>
}

function PolarNight({ accent, frame, bass }: { accent: string; frame: number; bass: number }) {
  return <>{[0, 1, 2].map((index) => <div key={index} style={{ position: 'absolute', left: -120 + index * 300, bottom: 80 + index * 90, width: 720, height: 480, clipPath: 'polygon(0 100%, 18% 45%, 36% 72%, 54% 22%, 78% 70%, 100% 100%)', background: index % 2 ? accent : '#F8FAFC', opacity: 0.22 + bass * 0.12, transform: `translateY(${Math.sin(frame / 38 + index) * 14}px)` }} />)}</>
}

function ConfettiGrid({ accent, frame, mid }: { accent: string; frame: number; mid: number }) {
  return <>{Array.from({ length: 26 }).map((_, index) => <div key={index} style={{ position: 'absolute', left: `${(index * 17) % 96}%`, top: `${(index * 29 + frame * 0.24) % 92}%`, width: 44 + (index % 4) * 26, height: 24 + (index % 3) * 18, borderRadius: index % 2 ? 999 : 6, background: index % 3 ? accent : '#F8FAFC', opacity: 0.24 + mid * 0.24, transform: `rotate(${index * 19 + frame * 0.07}deg)` }} />)}</>
}

function SceneCircuitGarden({ accent, frame, bass }: { accent: string; frame: number; bass: number }) {
  return <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(90deg, ${accent}44 2px, transparent 2px), linear-gradient(${accent}33 2px, transparent 2px), radial-gradient(circle at ${40 + Math.sin(frame / 50) * 10}% 45%, ${accent}${Math.floor(55 + bass * 80).toString(16)}, transparent 34%)`, backgroundSize: '120px 120px, 120px 120px, 100% 100%' }} />
}

function BlueprintField({ accent, frame, isWide }: { accent: string; frame: number; isWide: boolean }) {
  return <>{[0, 1, 2, 3, 4].map((index) => <div key={index} style={{ position: 'absolute', right: 80 + index * (isWide ? 190 : 120), top: 70 + index * 120, width: 300 + index * 80, height: 120 + index * 44, border: `3px solid ${accent}66`, transform: `rotate(${Math.sin(frame / 55 + index) * 4}deg)` }} />)}</>
}

function VelourRopes({ accent, frame }: { accent: string; frame: number }) {
  return <>{[0, 1, 2, 3].map((index) => <div key={index} style={{ position: 'absolute', left: -140, right: -140, top: 130 + index * 160, height: 28, borderRadius: 999, background: `linear-gradient(90deg, transparent, ${accent}, transparent)`, transform: `rotate(${-7 + index * 5}deg) translateX(${Math.sin(frame / 38 + index) * 24}px)`, boxShadow: `0 0 32px ${accent}66` }} />)}</>
}

function CabinPlanks({ accent, frame }: { accent: string; frame: number }) {
  return <div style={{ position: 'absolute', inset: 0, backgroundImage: `repeating-linear-gradient(90deg, rgba(120,53,15,0.5) 0px, rgba(120,53,15,0.5) 76px, ${accent}33 78px, transparent 120px)`, transform: `translateX(${Math.sin(frame / 60) * 18}px)` }} />
}

function CollageTiles({ accent, frame, bass }: { accent: string; frame: number; bass: number }) {
  return <>{Array.from({ length: 12 }).map((_, index) => <div key={index} style={{ position: 'absolute', left: `${(index * 23) % 86}%`, top: `${(index * 31) % 82}%`, width: 180 + (index % 3) * 70, height: 110 + (index % 4) * 52, background: index % 2 ? accent : 'rgba(255,255,255,0.22)', border: '3px solid rgba(255,255,255,0.36)', opacity: 0.18 + bass * 0.22, transform: `rotate(${-8 + index * 5 + Math.sin(frame / 34) * 2}deg)` }} />)}</>
}

function SceneLaserWarehouse({ accent, frame, treble }: { accent: string; frame: number; treble: number }) {
  return <>{[0, 1, 2, 3, 4].map((index) => <div key={index} style={{ position: 'absolute', left: `${index * 18}%`, top: -120, width: 8, height: 1300, background: accent, boxShadow: `0 0 ${36 + treble * 70}px ${accent}`, opacity: 0.2 + treble * 0.18, transform: `rotate(${-28 + index * 14 + Math.sin(frame / 30) * 4}deg)` }} />)}</>
}

function PorcelainMarks({ accent, frame }: { accent: string; frame: number }) {
  return <>{[0, 1, 2, 3, 4, 5].map((index) => <div key={index} style={{ position: 'absolute', left: `${8 + index * 15}%`, top: `${10 + (index % 3) * 24}%`, width: 220 + index * 20, height: 220 + index * 20, borderRadius: '50%', border: `5px solid ${accent}55`, opacity: 0.32, transform: `rotate(${frame * 0.04 + index * 22}deg)` }} />)}</>
}

export const kineticPosterProfile: SceneProfile = { pattern: 'kineticType', label: 'KINETIC POSTER', variant: 'pulse', background: 'linear-gradient(135deg, #F8FAFC, #FECACA)', titleColor: '#111827', accent: '#EF4444', coverRadius: 0 }
export const nordicNightProfile: SceneProfile = { pattern: 'polarNight', label: 'NORDIC NIGHT', variant: 'waveform', background: 'linear-gradient(180deg, #020617, #1E3A8A)', titleColor: '#E0F2FE', accent: '#7DD3FC', coverRadius: 28 }
export const memphisConfettiProfile: SceneProfile = { pattern: 'confetti', label: 'MEMPHIS CONFETTI', variant: 'pulse', background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)', titleColor: '#111827', accent: '#EC4899', coverRadius: 22, coverRotate: -4 }
export const circuitGardenProfile: SceneProfile = { pattern: 'circuit', label: 'CIRCUIT GARDEN', variant: 'neon', background: 'linear-gradient(135deg, #052E16, #020617)', titleColor: '#DCFCE7', accent: '#22C55E', coverRadius: 30 }
export const oceanBlueprintProfile: SceneProfile = { pattern: 'blueprint', label: 'OCEAN BLUEPRINT', variant: 'dashboard', background: 'linear-gradient(135deg, #082F49, #0C4A6E)', titleColor: '#E0F2FE', accent: '#38BDF8', coverRadius: 18 }
export const velourClubProfile: SceneProfile = { pattern: 'velour', label: 'VELOUR CLUB', variant: 'neon', background: 'linear-gradient(135deg, #4A044E, #111827)', titleColor: '#FCE7F3', accent: '#DB2777', coverRadius: 999, circleCover: true }
export const mountainCabinProfile: SceneProfile = { pattern: 'cabin', label: 'MOUNTAIN CABIN', variant: 'pulse', background: 'linear-gradient(135deg, #431407, #14532D)', titleColor: '#FEF3C7', accent: '#D97706', coverRadius: 26 }
export const newspaperCollageProfile: SceneProfile = { pattern: 'collage', label: 'NEWSPAPER COLLAGE', variant: 'dashboard', background: 'linear-gradient(135deg, #E7E5E4, #A8A29E)', titleColor: '#1C1917', accent: '#78716C', coverRadius: 6, coverRotate: 4 }
export const laserWarehouseProfile: SceneProfile = { pattern: 'laser', label: 'LASER WAREHOUSE', variant: 'neon', background: 'linear-gradient(135deg, #020617, #111827)', titleColor: '#F8FAFC', accent: '#22D3EE', coverRadius: 8 }
export const porcelainDiaryProfile: SceneProfile = { pattern: 'porcelain', label: 'PORCELAIN DIARY', variant: 'pulse', background: 'linear-gradient(135deg, #F8FAFC, #DBEAFE)', titleColor: '#172554', accent: '#2563EB', coverRadius: 999, circleCover: true }
export const matchboxPopProfile: SceneProfile = { pattern: 'kineticType', label: 'MATCHBOX POP', variant: 'pulse', background: 'linear-gradient(135deg, #FEF2F2, #FDBA74)', titleColor: '#7F1D1D', accent: '#F97316', coverRadius: 4 }
export const astroDomeProfile: SceneProfile = { pattern: 'polarNight', label: 'ASTRO DOME', variant: 'waveform', background: 'radial-gradient(circle at 50% 18%, #4338CA, #020617 62%)', titleColor: '#EEF2FF', accent: '#A5B4FC', coverRadius: 999, circleCover: true }
export const stainedChoirProfile: SceneProfile = { pattern: 'confetti', label: 'STAINED CHOIR', variant: 'dashboard', background: 'linear-gradient(135deg, #111827, #581C87)', titleColor: '#FAF5FF', accent: '#F59E0B', coverRadius: 18 }
export const windTunnelProfile: SceneProfile = { pattern: 'blueprint', label: 'WIND TUNNEL', variant: 'waveform', background: 'linear-gradient(135deg, #E0F2FE, #F8FAFC)', titleColor: '#0F172A', accent: '#0EA5E9', coverRadius: 999, circleCover: true }
export const fossilArchiveProfile: SceneProfile = { pattern: 'porcelain', label: 'FOSSIL ARCHIVE', variant: 'dashboard', background: 'linear-gradient(135deg, #292524, #A16207)', titleColor: '#FEF3C7', accent: '#D6D3D1', coverRadius: 18 }
export const marbleLobbyProfile: SceneProfile = { pattern: 'velour', label: 'MARBLE LOBBY', variant: 'pulse', background: 'linear-gradient(135deg, #F8FAFC, #D1D5DB)', titleColor: '#111827', accent: '#94A3B8', coverRadius: 20 }
export const paperLanternLakeProfile: SceneProfile = { pattern: 'confetti', label: 'PAPER LANTERN LAKE', variant: 'neon', background: 'linear-gradient(180deg, #0F172A, #1E3A8A)', titleColor: '#FEF3C7', accent: '#F97316', coverRadius: 34 }
export const chromeDinerProfile: SceneProfile = { pattern: 'laser', label: 'CHROME DINER', variant: 'neon', background: 'linear-gradient(135deg, #0F172A, #881337)', titleColor: '#F8FAFC', accent: '#F9A8D4', coverRadius: 999, circleCover: true }
export const textileLoomProfile: SceneProfile = { pattern: 'cabin', label: 'TEXTILE LOOM', variant: 'pulse', background: 'linear-gradient(135deg, #FEF3C7, #9A3412)', titleColor: '#431407', accent: '#F59E0B', coverRadius: 12 }
export const satelliteWeatherProfile: SceneProfile = { pattern: 'blueprint', label: 'SATELLITE WEATHER', variant: 'dashboard', background: 'linear-gradient(135deg, #0F172A, #475569)', titleColor: '#E2E8F0', accent: '#BAE6FD', coverRadius: 999, circleCover: true }
export const libraryCardProfile: SceneProfile = { pattern: 'collage', label: 'LIBRARY CARD', variant: 'pulse', background: 'linear-gradient(135deg, #FFFBEB, #F5F5F4)', titleColor: '#44403C', accent: '#B45309', coverRadius: 10 }
export const snowglobeMemoryProfile: SceneProfile = { pattern: 'polarNight', label: 'SNOWGLOBE MEMORY', variant: 'waveform', background: 'linear-gradient(180deg, #E0F2FE, #FFFFFF)', titleColor: '#0C4A6E', accent: '#38BDF8', coverRadius: 999, circleCover: true }
export const carnivalTicketProfile: SceneProfile = { pattern: 'kineticType', label: 'CARNIVAL TICKET', variant: 'pulse', background: 'linear-gradient(135deg, #FDE68A, #FCA5A5)', titleColor: '#7C2D12', accent: '#DC2626', coverRadius: 18, coverRotate: -3 }
export const brutalistAtriumProfile: SceneProfile = { pattern: 'blueprint', label: 'BRUTALIST ATRIUM', variant: 'dashboard', background: 'linear-gradient(135deg, #18181B, #71717A)', titleColor: '#FAFAFA', accent: '#A1A1AA', coverRadius: 0 }
export const pixelCafeProfile: SceneProfile = { pattern: 'confetti', label: 'PIXEL CAFE', variant: 'dashboard', background: 'linear-gradient(135deg, #422006, #FDE68A)', titleColor: '#FEF3C7', accent: '#84CC16', coverRadius: 6 }
export const goldenWheatProfile: SceneProfile = { pattern: 'cabin', label: 'GOLDEN WHEAT', variant: 'pulse', background: 'linear-gradient(180deg, #FDE68A, #92400E)', titleColor: '#422006', accent: '#FACC15', coverRadius: 34 }
export const microchipBloomProfile: SceneProfile = { pattern: 'circuit', label: 'MICROCHIP BLOOM', variant: 'neon', background: 'linear-gradient(135deg, #111827, #064E3B)', titleColor: '#D1FAE5', accent: '#34D399', coverRadius: 12 }
export const underwaterMetroProfile: SceneProfile = { pattern: 'blueprint', label: 'UNDERWATER METRO', variant: 'waveform', background: 'linear-gradient(135deg, #083344, #0F172A)', titleColor: '#CFFAFE', accent: '#06B6D4', coverRadius: 22 }
export const dragonDancePosterProfile: SceneProfile = { pattern: 'kineticType', label: 'DRAGON DANCE POSTER', variant: 'neon', background: 'linear-gradient(135deg, #450A0A, #111827)', titleColor: '#FEF3C7', accent: '#EF4444', coverRadius: 16 }
export const pearlOperaProfile: SceneProfile = { pattern: 'velour', label: 'PEARL OPERA', variant: 'dashboard', background: 'linear-gradient(135deg, #FDF2F8, #581C87)', titleColor: '#FDF4FF', accent: '#F0ABFC', coverRadius: 999, circleCover: true }
export const kiteFestivalProfile: SceneProfile = { pattern: 'confetti', label: 'KITE FESTIVAL', variant: 'pulse', background: 'linear-gradient(135deg, #BAE6FD, #FEF3C7)', titleColor: '#0F172A', accent: '#F43F5E', coverRadius: 20 }
export const rainforestCanopyProfile: SceneProfile = { pattern: 'circuit', label: 'RAINFOREST CANOPY', variant: 'waveform', background: 'linear-gradient(135deg, #14532D, #052E16)', titleColor: '#DCFCE7', accent: '#84CC16', coverRadius: 36 }
export const desertObservatoryProfile: SceneProfile = { pattern: 'polarNight', label: 'DESERT OBSERVATORY', variant: 'dashboard', background: 'linear-gradient(135deg, #451A03, #1E1B4B)', titleColor: '#FEF3C7', accent: '#F59E0B', coverRadius: 999, circleCover: true }
export const candleChapelProfile: SceneProfile = { pattern: 'velour', label: 'CANDLE CHAPEL', variant: 'pulse', background: 'linear-gradient(135deg, #1C1917, #7C2D12)', titleColor: '#FED7AA', accent: '#FDBA74', coverRadius: 22 }
export const glassElevatorProfile: SceneProfile = { pattern: 'laser', label: 'GLASS ELEVATOR', variant: 'neon', background: 'linear-gradient(135deg, #E0F2FE, #1E3A8A)', titleColor: '#F8FAFC', accent: '#7DD3FC', coverRadius: 44 }
export const monsoonMarketProfile: SceneProfile = { pattern: 'confetti', label: 'MONSOON MARKET', variant: 'neon', background: 'linear-gradient(180deg, #0F172A, #166534)', titleColor: '#F0FDF4', accent: '#22C55E', coverRadius: 30 }
export const polarExpeditionProfile: SceneProfile = { pattern: 'polarNight', label: 'POLAR EXPEDITION', variant: 'dashboard', background: 'linear-gradient(180deg, #F8FAFC, #94A3B8)', titleColor: '#0F172A', accent: '#38BDF8', coverRadius: 14 }
export const sakuraTramProfile: SceneProfile = { pattern: 'confetti', label: 'SAKURA TRAM', variant: 'pulse', background: 'linear-gradient(135deg, #FCE7F3, #BAE6FD)', titleColor: '#831843', accent: '#F472B6', coverRadius: 26, coverRotate: 3 }
export const moonPressProfile: SceneProfile = { pattern: 'collage', label: 'MOON PRESS', variant: 'dashboard', background: 'linear-gradient(135deg, #111827, #E5E7EB)', titleColor: '#F9FAFB', accent: '#9CA3AF', coverRadius: 8 }
export const velvetAquariumProfile: SceneProfile = { pattern: 'velour', label: 'VELVET AQUARIUM', variant: 'waveform', background: 'linear-gradient(135deg, #1E1B4B, #0E7490)', titleColor: '#CFFAFE', accent: '#67E8F9', coverRadius: 999, circleCover: true }
export const quartzDialProfile: SceneProfile = { pattern: 'porcelain', label: 'QUARTZ DIAL', variant: 'dashboard', background: 'linear-gradient(135deg, #F8FAFC, #CBD5E1)', titleColor: '#111827', accent: '#64748B', coverRadius: 999, circleCover: true }
export const saffronKitchenProfile: SceneProfile = { pattern: 'cabin', label: 'SAFFRON KITCHEN', variant: 'pulse', background: 'linear-gradient(135deg, #FFF7ED, #C2410C)', titleColor: '#7C2D12', accent: '#F97316', coverRadius: 28 }
export const paperPlaneTerminalProfile: SceneProfile = { pattern: 'blueprint', label: 'PAPER PLANE TERMINAL', variant: 'waveform', background: 'linear-gradient(135deg, #F8FAFC, #BFDBFE)', titleColor: '#1E3A8A', accent: '#2563EB', coverRadius: 12 }
export const staticMagazineProfile: SceneProfile = { pattern: 'collage', label: 'STATIC MAGAZINE', variant: 'dashboard', background: 'linear-gradient(135deg, #020617, #525252)', titleColor: '#F8FAFC', accent: '#E5E7EB', coverRadius: 2, coverRotate: -4 }
export const prismOrchestraProfile: SceneProfile = { pattern: 'laser', label: 'PRISM ORCHESTRA', variant: 'neon', background: 'linear-gradient(135deg, #312E81, #020617)', titleColor: '#EEF2FF', accent: '#C084FC', coverRadius: 999, circleCover: true }
export const copperCircuitProfile: SceneProfile = { pattern: 'circuit', label: 'COPPER CIRCUIT', variant: 'dashboard', background: 'linear-gradient(135deg, #431407, #111827)', titleColor: '#FED7AA', accent: '#EA580C', coverRadius: 18 }
export const fountainPlazaProfile: SceneProfile = { pattern: 'porcelain', label: 'FOUNTAIN PLAZA', variant: 'pulse', background: 'linear-gradient(135deg, #DBEAFE, #F8FAFC)', titleColor: '#1D4ED8', accent: '#60A5FA', coverRadius: 24 }
export const synthVelvetProfile: SceneProfile = { pattern: 'velour', label: 'SYNTH VELVET', variant: 'neon', background: 'linear-gradient(135deg, #581C87, #020617)', titleColor: '#FAE8FF', accent: '#D946EF', coverRadius: 32 }
export const coralMicroscopeProfile: SceneProfile = { pattern: 'circuit', label: 'CORAL MICROSCOPE', variant: 'waveform', background: 'linear-gradient(135deg, #042F2E, #FB7185)', titleColor: '#FFF1F2', accent: '#FDA4AF', coverRadius: 999, circleCover: true }
export const midnightBilliardsProfile: SceneProfile = { pattern: 'porcelain', label: 'MIDNIGHT BILLIARDS', variant: 'dashboard', background: 'linear-gradient(135deg, #052E16, #020617)', titleColor: '#F0FDF4', accent: '#22C55E', coverRadius: 999, circleCover: true }

export function KineticPoster({ config }: { config: LyricVideoConfig }) { return <SceneTemplate config={config} profile={kineticPosterProfile} /> }
export function NordicNight({ config }: { config: LyricVideoConfig }) { return <SceneTemplate config={config} profile={nordicNightProfile} /> }
export function MemphisConfetti({ config }: { config: LyricVideoConfig }) { return <SceneTemplate config={config} profile={memphisConfettiProfile} /> }
export function CircuitGarden({ config }: { config: LyricVideoConfig }) { return <SceneTemplate config={config} profile={circuitGardenProfile} /> }
export function OceanBlueprint({ config }: { config: LyricVideoConfig }) { return <SceneTemplate config={config} profile={oceanBlueprintProfile} /> }
export function VelourClub({ config }: { config: LyricVideoConfig }) { return <SceneTemplate config={config} profile={velourClubProfile} /> }
export function MountainCabin({ config }: { config: LyricVideoConfig }) { return <SceneTemplate config={config} profile={mountainCabinProfile} /> }
export function NewspaperCollage({ config }: { config: LyricVideoConfig }) { return <SceneTemplate config={config} profile={newspaperCollageProfile} /> }
export function LaserWarehouse({ config }: { config: LyricVideoConfig }) { return <SceneTemplate config={config} profile={laserWarehouseProfile} /> }
export function PorcelainDiary({ config }: { config: LyricVideoConfig }) { return <SceneTemplate config={config} profile={porcelainDiaryProfile} /> }
export function MatchboxPop({ config }: { config: LyricVideoConfig }) { return <SceneTemplate config={config} profile={matchboxPopProfile} /> }
export function AstroDome({ config }: { config: LyricVideoConfig }) { return <SceneTemplate config={config} profile={astroDomeProfile} /> }
export function StainedChoir({ config }: { config: LyricVideoConfig }) { return <SceneTemplate config={config} profile={stainedChoirProfile} /> }
export function WindTunnel({ config }: { config: LyricVideoConfig }) { return <SceneTemplate config={config} profile={windTunnelProfile} /> }
export function FossilArchive({ config }: { config: LyricVideoConfig }) { return <SceneTemplate config={config} profile={fossilArchiveProfile} /> }
export function MarbleLobby({ config }: { config: LyricVideoConfig }) { return <SceneTemplate config={config} profile={marbleLobbyProfile} /> }
export function PaperLanternLake({ config }: { config: LyricVideoConfig }) { return <SceneTemplate config={config} profile={paperLanternLakeProfile} /> }
export function ChromeDiner({ config }: { config: LyricVideoConfig }) { return <SceneTemplate config={config} profile={chromeDinerProfile} /> }
export function TextileLoom({ config }: { config: LyricVideoConfig }) { return <SceneTemplate config={config} profile={textileLoomProfile} /> }
export function SatelliteWeather({ config }: { config: LyricVideoConfig }) { return <SceneTemplate config={config} profile={satelliteWeatherProfile} /> }
export function LibraryCard({ config }: { config: LyricVideoConfig }) { return <SceneTemplate config={config} profile={libraryCardProfile} /> }
export function SnowglobeMemory({ config }: { config: LyricVideoConfig }) { return <SceneTemplate config={config} profile={snowglobeMemoryProfile} /> }
export function CarnivalTicket({ config }: { config: LyricVideoConfig }) { return <SceneTemplate config={config} profile={carnivalTicketProfile} /> }
export function BrutalistAtrium({ config }: { config: LyricVideoConfig }) { return <SceneTemplate config={config} profile={brutalistAtriumProfile} /> }
export function PixelCafe({ config }: { config: LyricVideoConfig }) { return <SceneTemplate config={config} profile={pixelCafeProfile} /> }
export function GoldenWheat({ config }: { config: LyricVideoConfig }) { return <SceneTemplate config={config} profile={goldenWheatProfile} /> }
export function MicrochipBloom({ config }: { config: LyricVideoConfig }) { return <SceneTemplate config={config} profile={microchipBloomProfile} /> }
export function UnderwaterMetro({ config }: { config: LyricVideoConfig }) { return <SceneTemplate config={config} profile={underwaterMetroProfile} /> }
export function DragonDancePoster({ config }: { config: LyricVideoConfig }) { return <SceneTemplate config={config} profile={dragonDancePosterProfile} /> }
export function PearlOpera({ config }: { config: LyricVideoConfig }) { return <SceneTemplate config={config} profile={pearlOperaProfile} /> }
export function KiteFestival({ config }: { config: LyricVideoConfig }) { return <SceneTemplate config={config} profile={kiteFestivalProfile} /> }
export function RainforestCanopy({ config }: { config: LyricVideoConfig }) { return <SceneTemplate config={config} profile={rainforestCanopyProfile} /> }
export function DesertObservatory({ config }: { config: LyricVideoConfig }) { return <SceneTemplate config={config} profile={desertObservatoryProfile} /> }
export function CandleChapel({ config }: { config: LyricVideoConfig }) { return <SceneTemplate config={config} profile={candleChapelProfile} /> }
export function GlassElevator({ config }: { config: LyricVideoConfig }) { return <SceneTemplate config={config} profile={glassElevatorProfile} /> }
export function MonsoonMarket({ config }: { config: LyricVideoConfig }) { return <SceneTemplate config={config} profile={monsoonMarketProfile} /> }
export function PolarExpedition({ config }: { config: LyricVideoConfig }) { return <SceneTemplate config={config} profile={polarExpeditionProfile} /> }
export function SakuraTram({ config }: { config: LyricVideoConfig }) { return <SceneTemplate config={config} profile={sakuraTramProfile} /> }
export function MoonPress({ config }: { config: LyricVideoConfig }) { return <SceneTemplate config={config} profile={moonPressProfile} /> }
export function VelvetAquarium({ config }: { config: LyricVideoConfig }) { return <SceneTemplate config={config} profile={velvetAquariumProfile} /> }
export function QuartzDial({ config }: { config: LyricVideoConfig }) { return <SceneTemplate config={config} profile={quartzDialProfile} /> }
export function SaffronKitchen({ config }: { config: LyricVideoConfig }) { return <SceneTemplate config={config} profile={saffronKitchenProfile} /> }
export function PaperPlaneTerminal({ config }: { config: LyricVideoConfig }) { return <SceneTemplate config={config} profile={paperPlaneTerminalProfile} /> }
export function StaticMagazine({ config }: { config: LyricVideoConfig }) { return <SceneTemplate config={config} profile={staticMagazineProfile} /> }
export function PrismOrchestra({ config }: { config: LyricVideoConfig }) { return <SceneTemplate config={config} profile={prismOrchestraProfile} /> }
export function CopperCircuit({ config }: { config: LyricVideoConfig }) { return <SceneTemplate config={config} profile={copperCircuitProfile} /> }
export function FountainPlaza({ config }: { config: LyricVideoConfig }) { return <SceneTemplate config={config} profile={fountainPlazaProfile} /> }
export function SynthVelvet({ config }: { config: LyricVideoConfig }) { return <SceneTemplate config={config} profile={synthVelvetProfile} /> }
export function CoralMicroscope({ config }: { config: LyricVideoConfig }) { return <SceneTemplate config={config} profile={coralMicroscopeProfile} /> }
export function MidnightBilliards({ config }: { config: LyricVideoConfig }) { return <SceneTemplate config={config} profile={midnightBilliardsProfile} /> }
