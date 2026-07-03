import { useCurrentFrame, useVideoConfig } from 'remotion'
import type { LyricVideoConfig } from '@lyricpulse/core'
import { getAnalysisFrame, getCurrentLyricLine, getPlaybackTime } from '../helpers'
import { TemplateShell } from '../components/TemplateShell'
import {
  CaptionPanel,
  FloatingCover,
  getContrastTextColors,
  type CaptionFrame
} from './visual-utils'

type ProfileStyle =
  | 'vaporwave'
  | 'bauhaus'
  | 'academia'
  | 'y2k'
  | 'game'
  | 'sonar'
  | 'alpine'
  | 'kabuki'
  | 'film'
  | 'aero'
  | 'geologic'
  | 'velvet'
  | 'convenience'
  | 'starchart'
  | 'lowpoly'
  | 'tv'
  | 'crystal'
  | 'sports'
  | 'market'
  | 'noise'
  | 'museum'
  | 'puppet'
  | 'greenhouse'
  | 'runway'
  | 'clockwork'
  | 'lava'
  | 'tarot'
  | 'graffiti'
  | 'zen'
  | 'clay'
  | 'hologram'
  | 'neural'
  | 'baroque'
  | 'swiss'
  | 'candy'
  | 'rosePostcard'
  | 'furnace'
  | 'jellyfish'
  | 'radio'
  | 'cloud'
  | 'seal'
  | 'microscope'
  | 'boarding'
  | 'dossier'
  | 'radar'
  | 'section'
  | 'menu'
  | 'manual'
  | 'nightdial'
  | 'embroidery'
  | 'calendar'
  | 'thermal'
  | 'xray'
  | 'planetarium'
  | 'submarine'
  | 'scrapbook'
  | 'signaltower'
  | 'sandbox'
  | 'compass'
  | 'flipboard'
  | 'platformBroadcast'
  | 'silverHalide'
  | 'neonRainveil'
  | 'thermalPulse'
  | 'tapeOverwrite'
  | 'starEchoAtlas'
  | 'botanicalBlueprint'
  | 'pawnshop'
  | 'filmburn'
  | 'velvetRope'
  | 'datarain'
  | 'kiln'
  | 'paperTheater'
  | 'cartridge'
  | 'glacier'
  | 'observatoryNotebook'
  | 'circuitCathedral'
  | 'forensicDarkroom'
  | 'insectCabinet'
  | 'mineElevator'
  | 'origamiSatellite'
  | 'risographPress'
  | 'tidalGreenhouse'
  | 'billiardParlor'
  | 'templeShadowFair'
  | 'cyanotypeHarbor'
  | 'candyWrapperShop'
  | 'laserEngraver'
  | 'volcanicSeismograph'
  | 'velvetPlanetarium'
  | 'circuitKimono'
  | 'rainTaxiMeter'
  | 'sundialCourtyard'
  | 'porcelainXray'
  | 'cloudServerFarm'
  | 'paperFortress'
  | 'mirageGasStation'
  | 'metroCircuit'
  | 'velvetTransit'
  | 'hazeBlueprint'
  | 'auroraLedger'
  | 'monolithPulse'
  | 'lotusNeon'
  | 'quartzForecast'
  | 'motelPostcard'
  | 'signalLantern'
  | 'marbleObservatory'
  | 'chromeLotus'
  | 'nocturneBlueprint'
  | 'orchidSwitchboard'
  | 'copperMonsoon'

type Profile = {
  style: ProfileStyle
  label: string
  variant: 'pulse' | 'neon' | 'waveform' | 'dashboard'
  background: string
  titleColor: string
  coverRadius: number
  coverRotate?: number
  circleCover?: boolean
  coverScale?: number
  titleScale?: number
  artistScale?: number
  lyricScale?: number
  contentInset?: number
  lyricTopOffset?: number
}

export function ProfileTemplate({
  config,
  profile
}: {
  config: LyricVideoConfig
  profile: Profile
}) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const time = getPlaybackTime(frame, fps)
  const analysisFrame = getAnalysisFrame(config.analysis.frames, time)
  const lyricLine = getCurrentLyricLine(config.lyrics, time)
  const isWide = config.ratio === '16:9'
  const coverScale = profile.coverScale ?? 1
  const titleScale = profile.titleScale ?? 1
  const artistScale = profile.artistScale ?? 1
  const lyricScale = profile.lyricScale ?? 1
  const contentInset = profile.contentInset ?? (isWide ? 0 : 0)
  const coverSize = (isWide ? 370 : 480) * coverScale
  const coverLeft = isWide ? 155 : (1080 - coverSize) / 2
  const coverTop = isWide ? 300 : 230
  const contentLeft = (isWide ? 650 : 54) + contentInset
  const contentRight = (isWide ? 110 : 54) + contentInset
  const titleTop = isWide ? 175 : 770
  const lyricTop = (isWide ? 500 : 1190) + (profile.lyricTopOffset ?? 0)
  const captionFrame = getProfileCaptionFrame(profile.style)
  const contrast = getContrastTextColors(config, `${config.templateId}:${profile.style}`)

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
        <ProfileDecorations
          config={config}
          profile={profile}
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
          scale={1 + analysisFrame.bass * 0.035}
        />
        <div
          style={{
            position: 'absolute',
            left: contentLeft,
            right: contentRight,
            top: titleTop,
            color: contrast.titleColor,
            fontSize: (isWide ? 84 : 82) * titleScale,
            fontWeight: 950,
            letterSpacing: profile.style === 'game' ? '-0.03em' : '-0.075em',
            lineHeight: 0.92,
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
            top: titleTop + (isWide ? 108 : 112) * titleScale,
            color: contrast.lyricColor,
            fontSize: (isWide ? 28 : 30) * artistScale,
            fontWeight: 850,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            opacity: 0.82
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
          fontSize={(isWide ? 70 : 72) * lyricScale}
          frame={captionFrame}
        />
      </div>
    </TemplateShell>
  )
}

function getProfileCaptionFrame(style: ProfileStyle): CaptionFrame {
  if (style === 'microscope' || style === 'greenhouse' || style === 'jellyfish') {
    return 'specimen'
  }

  if (style === 'boarding' || style === 'convenience') {
    return 'ticket'
  }

  if (style === 'dossier' || style === 'seal' || style === 'academia' || style === 'forensicDarkroom') {
    return 'stamp'
  }

  if (style === 'radar' || style === 'sonar' || style === 'cloud' || style === 'velvetPlanetarium' || style === 'cloudServerFarm') {
    return 'radar'
  }

  if (style === 'section' || style === 'swiss' || style === 'geologic' || style === 'cyanotypeHarbor' || style === 'volcanicSeismograph' || style === 'hazeBlueprint' || style === 'nocturneBlueprint') {
    return 'blueprint'
  }

  if (style === 'menu' || style === 'market' || style === 'clay' || style === 'candyWrapperShop' || style === 'mirageGasStation') {
    return 'menu'
  }

  if (style === 'manual' || style === 'aero' || style === 'clockwork' || style === 'mineElevator') {
    return 'manual'
  }

  if (style === 'nightdial' || style === 'radio' || style === 'tv' || style === 'rainTaxiMeter' || style === 'quartzForecast' || style === 'orchidSwitchboard') {
    return 'radio'
  }

  if (style === 'embroidery' || style === 'zen' || style === 'circuitKimono') {
    return 'stitched'
  }

  if (style === 'calendar' || style === 'film' || style === 'thermal' || style === 'flipboard' || style === 'platformBroadcast' || style === 'silverHalide' || style === 'tapeOverwrite' || style === 'risographPress' || style === 'auroraLedger' || style === 'motelPostcard') {
    return 'calendar'
  }

  if (style === 'rosePostcard') {
    return 'paper'
  }

  if (style === 'baroque' || style === 'tarot' || style === 'puppet' || style === 'templeShadowFair' || style === 'paperFortress') {
    return 'paper'
  }

  if (style === 'hologram' || style === 'neural' || style === 'vaporwave' || style === 'datarain' || style === 'pawnshop' || style === 'origamiSatellite' || style === 'laserEngraver' || style === 'neonRainveil' || style === 'lotusNeon') {
    return 'neonRail'
  }

  if (style === 'xray' || style === 'submarine' || style === 'glacier' || style === 'insectCabinet' || style === 'porcelainXray') {
    return 'specimen'
  }

  if (style === 'planetarium' || style === 'compass' || style === 'observatoryNotebook' || style === 'sundialCourtyard' || style === 'starEchoAtlas' || style === 'marbleObservatory') {
    return 'radar'
  }

  if (style === 'thermalPulse') {
    return 'manual'
  }

  if (style === 'sandbox' || style === 'botanicalBlueprint' || style === 'circuitCathedral') {
    return 'blueprint'
  }

  if (style === 'scrapbook' || style === 'paperTheater' || style === 'filmburn') {
    return 'paper'
  }

  if (style === 'kiln' || style === 'velvetRope' || style === 'billiardParlor' || style === 'velvetTransit' || style === 'signalLantern' || style === 'copperMonsoon') {
    return 'menu'
  }

  if (style === 'metroCircuit' || style === 'monolithPulse') {
    return 'manual'
  }

  if (style === 'chromeLotus') {
    return 'glass'
  }

  if (style === 'signaltower' || style === 'cartridge') {
    return 'radio'
  }

  return 'glass'
}

function ProfileDecorations({
  config,
  profile,
  frame,
  bass,
  mid,
  treble,
  isWide
}: {
  config: LyricVideoConfig
  profile: Profile
  frame: number
  bass: number
  mid: number
  treble: number
  isWide: boolean
}) {
  const accent = config.theme.accentColor

  if (profile.style === 'vaporwave') {
    return (
      <>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.16) 2px, transparent 2px), linear-gradient(90deg, rgba(255,255,255,0.16) 2px, transparent 2px)', backgroundSize: '72px 72px', transform: 'perspective(500px) rotateX(58deg) translateY(260px)', opacity: 0.36 }} />
        <div style={{ position: 'absolute', left: isWide ? 240 : 180, top: 120, width: isWide ? 420 : 520, height: isWide ? 420 : 520, borderRadius: '50%', background: `linear-gradient(180deg, #F9A8D4, ${accent})`, opacity: 0.72 }} />
      </>
    )
  }

  if (profile.style === 'bauhaus') {
    return <ShapeWall colors={['#EF4444', '#FACC15', '#2563EB', '#F8FAFC']} frame={frame} bass={bass} />
  }

  if (profile.style === 'academia') {
    return <BookLines accent="#D6B15E" />
  }

  if (profile.style === 'y2k') {
    return <BubbleField accent={accent} frame={frame} treble={treble} />
  }

  if (profile.style === 'game') {
    return <PixelHud accent={accent} bass={bass} />
  }

  if (profile.style === 'sonar') {
    return <Rings accent="#67E8F9" frame={frame} bass={bass} />
  }

  if (profile.style === 'alpine') {
    return <MountainLayers />
  }

  if (profile.style === 'kabuki') {
    return <KabukiFans accent="#EF4444" frame={frame} />
  }

  if (profile.style === 'film') {
    return <FilmGrid />
  }

  if (profile.style === 'aero') {
    return <InstrumentDial accent={accent} frame={frame} />
  }

  if (profile.style === 'geologic') {
    return <TopoLines accent="#D97706" frame={frame} />
  }

  if (profile.style === 'velvet') {
    return <CurtainFolds accent="#F59E0B" frame={frame} />
  }

  if (profile.style === 'convenience') {
    return <Signage accent={accent} frame={frame} />
  }

  if (profile.style === 'starchart') {
    return <StarMap accent="#BAE6FD" frame={frame} />
  }

  if (profile.style === 'lowpoly') {
    return <LowPolySea bass={bass} />
  }

  if (profile.style === 'tv') {
    return <Scanlines />
  }

  if (profile.style === 'crystal') {
    return <Crystals accent={accent} frame={frame} />
  }

  if (profile.style === 'sports') {
    return <JerseyStripes accent={accent} mid={mid} />
  }

  if (profile.style === 'market') {
    return <Lanterns accent={accent} frame={frame} />
  }

  if (profile.style === 'museum') {
    return <MuseumPanels accent="#FDE68A" frame={frame} />
  }

  if (profile.style === 'puppet') {
    return <PaperPuppets accent="#92400E" frame={frame} />
  }

  if (profile.style === 'greenhouse') {
    return <GreenhouseVines accent="#86EFAC" frame={frame} treble={treble} />
  }

  if (profile.style === 'runway') {
    return <RunwayLights accent="#F8FAFC" frame={frame} mid={mid} />
  }

  if (profile.style === 'clockwork') {
    return <ClockworkGears accent="#D97706" frame={frame} />
  }

  if (profile.style === 'lava') {
    return <LavaBlobs accent="#FB923C" frame={frame} bass={bass} />
  }

  if (profile.style === 'tarot') {
    return <TarotGlyphs accent="#FACC15" frame={frame} />
  }

  if (profile.style === 'graffiti') {
    return <GraffitiTags accent={accent} frame={frame} />
  }

  if (profile.style === 'zen') {
    return <ZenRakes accent="#A8A29E" frame={frame} />
  }

  if (profile.style === 'clay') {
    return <ClayShapes accent={accent} frame={frame} />
  }

  if (profile.style === 'hologram') {
    return <HologramStage accent="#22D3EE" frame={frame} treble={treble} />
  }

  if (profile.style === 'neural') {
    return <NeuralLinks accent="#C4B5FD" frame={frame} bass={bass} />
  }

  if (profile.style === 'baroque') {
    return <BaroqueOrnaments accent="#F59E0B" frame={frame} />
  }

  if (profile.style === 'swiss') {
    return <SwissRules accent="#EF4444" />
  }

  if (profile.style === 'candy') {
    return <CandyPrisms accent={accent} frame={frame} />
  }

  if (profile.style === 'furnace') {
    return <FurnaceSparks accent="#F97316" frame={frame} bass={bass} />
  }

  if (profile.style === 'jellyfish') {
    return <JellyfishDrift accent="#A5B4FC" frame={frame} />
  }

  if (profile.style === 'radio') {
    return <RadioWaves accent="#FBBF24" frame={frame} />
  }

  if (profile.style === 'cloud') {
    return <CloudBands accent="#BAE6FD" frame={frame} />
  }

  if (profile.style === 'seal') {
    return <SealMarks accent="#B91C1C" frame={frame} />
  }

  if (profile.style === 'microscope') {
    return <SpecimenSlides accent="#22C55E" frame={frame} treble={treble} />
  }

  if (profile.style === 'boarding') {
    return <BoardingPassLines accent="#0F172A" frame={frame} />
  }

  if (profile.style === 'dossier') {
    return <DossierStamps accent="#B45309" frame={frame} />
  }

  if (profile.style === 'radar') {
    return <WeatherRadar accent="#38BDF8" frame={frame} bass={bass} />
  }

  if (profile.style === 'section') {
    return <ArchitectSection accent="#F97316" frame={frame} />
  }

  if (profile.style === 'menu') {
    return <ChefMenu accent="#991B1B" frame={frame} />
  }

  if (profile.style === 'manual') {
    return <ExplodedManual accent="#2563EB" frame={frame} />
  }

  if (profile.style === 'nightdial') {
    return <NightRadioDial accent="#F59E0B" frame={frame} mid={mid} />
  }

  if (profile.style === 'embroidery') {
    return <EmbroideryHoop accent="#DB2777" frame={frame} />
  }

  if (profile.style === 'rosePostcard') {
    return <RosePostcardDecor accent="#F43F5E" frame={frame} bass={bass} />
  }

  if (profile.style === 'calendar') {
    return <CalendarGrid accent="#111827" frame={frame} isWide={isWide} />
  }

  if (profile.style === 'thermal') {
    return <ThermalReceiptPrint accent="#111827" frame={frame} bass={bass} />
  }

  if (profile.style === 'xray') {
    return <XrayCassetteGlow accent="#67E8F9" frame={frame} treble={treble} />
  }

  if (profile.style === 'planetarium') {
    return <PlanetariumConsole accent="#A78BFA" frame={frame} />
  }

  if (profile.style === 'submarine') {
    return <SubmarineScope accent="#22D3EE" frame={frame} bass={bass} />
  }

  if (profile.style === 'scrapbook') {
    return <ScrapbookDesk accent="#F97316" frame={frame} />
  }

  if (profile.style === 'signaltower') {
    return <SignalTowerBeams accent="#FBBF24" frame={frame} mid={mid} />
  }

  if (profile.style === 'sandbox') {
    return <TopographicSandbox accent="#D97706" frame={frame} />
  }

  if (profile.style === 'compass') {
    return <AstralCompassRose accent="#FDE68A" frame={frame} />
  }

  if (profile.style === 'flipboard') {
    return <DepartureFlipboardRows accent="#F8FAFC" frame={frame} />
  }

  if (profile.style === 'platformBroadcast') {
    return <PlatformBroadcastBoard accent="#F8FAFC" frame={frame} bass={bass} />
  }

  if (profile.style === 'silverHalide') {
    return <SilverHalidePrint accent="#FB923C" frame={frame} treble={treble} />
  }

  if (profile.style === 'neonRainveil') {
    return <NeonRainveil accent="#38BDF8" frame={frame} mid={mid} />
  }

  if (profile.style === 'thermalPulse') {
    return <ThermalPulseHeat accent="#F97316" frame={frame} bass={bass} />
  }

  if (profile.style === 'tapeOverwrite') {
    return <TapeOverwriteDeck accent="#FDE68A" frame={frame} bass={bass} />
  }

  if (profile.style === 'starEchoAtlas') {
    return <StarEchoAtlasMap accent="#BAE6FD" frame={frame} treble={treble} />
  }

  if (profile.style === 'metroCircuit') {
    return <MetroCircuitGrid accent="#60A5FA" frame={frame} bass={bass} />
  }

  if (profile.style === 'velvetTransit') {
    return <VelvetTransitArches accent="#F59E0B" frame={frame} mid={mid} />
  }

  if (profile.style === 'hazeBlueprint') {
    return <HazeBlueprintDraft accent="#38BDF8" frame={frame} />
  }

  if (profile.style === 'auroraLedger') {
    return <AuroraLedgerColumns accent="#A78BFA" frame={frame} treble={treble} />
  }

  if (profile.style === 'monolithPulse') {
    return <MonolithPulseBars accent="#FB7185" frame={frame} bass={bass} />
  }

  if (profile.style === 'lotusNeon') {
    return <LotusNeonPetals accent="#F472B6" frame={frame} mid={mid} />
  }

  if (profile.style === 'quartzForecast') {
    return <QuartzForecastSweep accent="#7DD3FC" frame={frame} treble={treble} />
  }

  if (profile.style === 'motelPostcard') {
    return <MotelPostcardStamp accent="#FB923C" frame={frame} />
  }

  if (profile.style === 'signalLantern') {
    return <SignalLanternGlow accent="#FB7185" frame={frame} bass={bass} />
  }

  if (profile.style === 'marbleObservatory') {
    return <MarbleObservatoryOrbits accent="#E5E7EB" frame={frame} />
  }

  if (profile.style === 'chromeLotus') {
    return <ChromeLotusRipples accent="#93C5FD" frame={frame} treble={treble} />
  }

  if (profile.style === 'nocturneBlueprint') {
    return <NocturneBlueprintBeams accent="#60A5FA" frame={frame} />
  }

  if (profile.style === 'orchidSwitchboard') {
    return <OrchidSwitchboardPanel accent="#C084FC" frame={frame} mid={mid} />
  }

  if (profile.style === 'copperMonsoon') {
    return <CopperMonsoonRain accent="#F59E0B" frame={frame} bass={bass} />
  }

  if (profile.style === 'botanicalBlueprint') {
    return <BotanicalBlueprintVines accent="#22C55E" frame={frame} />
  }

  if (profile.style === 'pawnshop') {
    return <NeonPawnshopSigns accent="#F472B6" frame={frame} />
  }

  if (profile.style === 'filmburn') {
    return <FilmBurnStrips accent="#FB923C" frame={frame} treble={treble} />
  }

  if (profile.style === 'velvetRope') {
    return <VelvetRopeLoops accent="#F59E0B" frame={frame} />
  }

  if (profile.style === 'datarain') {
    return <DataRainWall accent="#34D399" frame={frame} bass={bass} />
  }

  if (profile.style === 'kiln') {
    return <CeramicKilnHeat accent="#EA580C" frame={frame} bass={bass} />
  }

  if (profile.style === 'paperTheater') {
    return <PaperTheaterLayers accent="#7C2D12" frame={frame} />
  }

  if (profile.style === 'cartridge') {
    return <ArcadeCartridgeSlots accent="#A3E635" frame={frame} />
  }

  if (profile.style === 'glacier') {
    return <GlacierCoreCracks accent="#BAE6FD" frame={frame} />
  }

  if (profile.style === 'observatoryNotebook') {
    return <ObservatoryNotebookMarks accent="#60A5FA" frame={frame} />
  }

  if (profile.style === 'circuitCathedral') {
    return <CircuitCathedralWindows accent="#C084FC" frame={frame} />
  }

  if (profile.style === 'forensicDarkroom') {
    return <ForensicDarkroom accent="#DC2626" frame={frame} />
  }

  if (profile.style === 'insectCabinet') {
    return <InsectCabinet accent="#A3E635" frame={frame} />
  }

  if (profile.style === 'mineElevator') {
    return <MineElevator accent="#F59E0B" frame={frame} bass={bass} />
  }

  if (profile.style === 'origamiSatellite') {
    return <OrigamiSatellite accent="#A5B4FC" frame={frame} />
  }

  if (profile.style === 'risographPress') {
    return <RisographPress accent="#EF4444" frame={frame} treble={treble} />
  }

  if (profile.style === 'tidalGreenhouse') {
    return <TidalGreenhouse accent="#2DD4BF" frame={frame} mid={mid} />
  }

  if (profile.style === 'billiardParlor') {
    return <BilliardParlor accent="#FDE68A" frame={frame} bass={bass} />
  }

  if (profile.style === 'templeShadowFair') {
    return <TempleShadowFair accent="#F97316" frame={frame} />
  }

  if (profile.style === 'cyanotypeHarbor') {
    return <CyanotypeHarbor accent="#7DD3FC" frame={frame} />
  }

  if (profile.style === 'candyWrapperShop') {
    return <CandyWrapperShop accent="#F472B6" frame={frame} treble={treble} />
  }

  if (profile.style === 'laserEngraver') {
    return <LaserEngraver accent="#22D3EE" frame={frame} bass={bass} />
  }

  if (profile.style === 'volcanicSeismograph') {
    return <VolcanicSeismograph accent="#FB923C" frame={frame} bass={bass} />
  }

  if (profile.style === 'velvetPlanetarium') {
    return <VelvetPlanetarium accent="#C4B5FD" frame={frame} />
  }

  if (profile.style === 'circuitKimono') {
    return <CircuitKimono accent="#F0ABFC" frame={frame} />
  }

  if (profile.style === 'rainTaxiMeter') {
    return <RainTaxiMeter accent="#FACC15" frame={frame} mid={mid} />
  }

  if (profile.style === 'sundialCourtyard') {
    return <SundialCourtyard accent="#92400E" frame={frame} />
  }

  if (profile.style === 'porcelainXray') {
    return <PorcelainXray accent="#BAE6FD" frame={frame} treble={treble} />
  }

  if (profile.style === 'cloudServerFarm') {
    return <CloudServerFarm accent="#93C5FD" frame={frame} bass={bass} />
  }

  if (profile.style === 'paperFortress') {
    return <PaperFortress accent="#B45309" frame={frame} />
  }

  if (profile.style === 'mirageGasStation') {
    return <MirageGasStation accent="#FB7185" frame={frame} />
  }

  return <NoiseBlocks accent={accent} frame={frame} treble={treble} />
}

function ShapeWall({ colors, frame, bass }: { colors: string[]; frame: number; bass: number }) {
  return (
    <>
      {colors.map((color, index) => (
        <div key={color} style={{ position: 'absolute', left: `${8 + index * 21}%`, top: `${8 + (index % 2) * 42}%`, width: 210 + index * 38, height: 210 + index * 20, borderRadius: index % 2 ? '50%' : 0, background: color, opacity: 0.72, transform: `rotate(${frame * 0.05 + index * 14}deg) scale(${1 + bass * 0.05})` }} />
      ))}
    </>
  )
}

function BookLines({ accent }: { accent: string }) {
  return <div style={{ position: 'absolute', inset: '90px 70px', border: `1px solid ${accent}66`, backgroundImage: 'repeating-linear-gradient(0deg, rgba(214,177,94,0.18) 0px, rgba(214,177,94,0.18) 2px, transparent 2px, transparent 34px)' }} />
}

function BubbleField({ accent, frame, treble }: { accent: string; frame: number; treble: number }) {
  return <>{Array.from({ length: 18 }).map((_, index) => <div key={index} style={{ position: 'absolute', left: `${(index * 31) % 94}%`, top: `${(index * 47 + frame * 0.5) % 92}%`, width: 44 + (index % 5) * 24, height: 44 + (index % 5) * 24, borderRadius: '50%', border: `3px solid ${accent}`, background: 'rgba(255,255,255,0.18)', opacity: 0.28 + treble * 0.32 }} />)}</>
}

function PixelHud({ accent, bass }: { accent: string; bass: number }) {
  return <div style={{ position: 'absolute', inset: 70, border: `8px solid ${accent}`, boxShadow: `0 0 ${30 + bass * 60}px ${accent}`, imageRendering: 'pixelated' }} />
}

function Rings({ accent, frame, bass }: { accent: string; frame: number; bass: number }) {
  return <>{[0, 1, 2, 3].map((index) => <div key={index} style={{ position: 'absolute', left: '50%', top: '40%', width: 260 + index * 180, height: 260 + index * 180, borderRadius: '50%', border: `3px solid ${accent}`, opacity: 0.18 + bass * 0.2, transform: `translate(-50%, -50%) scale(${1 + Math.sin(frame / 24 + index) * 0.04})` }} />)}</>
}

function MountainLayers() {
  return <>{[0, 1, 2].map((index) => <div key={index} style={{ position: 'absolute', left: -80, right: -80, bottom: index * 130, height: 360, clipPath: 'polygon(0 100%, 18% 32%, 36% 74%, 52% 18%, 70% 68%, 86% 38%, 100% 100%)', background: ['#F8FAFC', '#CBD5E1', '#64748B'][index], opacity: 0.75 }} />)}</>
}

function KabukiFans({ accent, frame }: { accent: string; frame: number }) {
  return <>{[0, 1].map((index) => <div key={index} style={{ position: 'absolute', left: index ? '58%' : '-8%', top: '8%', width: 620, height: 620, borderRadius: '50%', background: `conic-gradient(from ${frame * 0.2}deg, ${accent}, #020617, #F8FAFC, ${accent})`, opacity: 0.36 }} />)}</>
}

function FilmGrid() {
  return <div style={{ position: 'absolute', inset: 62, border: '16px solid rgba(15,23,42,0.88)', backgroundImage: 'linear-gradient(90deg, transparent 48%, rgba(255,255,255,0.2) 49%, transparent 50%), linear-gradient(rgba(255,255,255,0.18) 1px, transparent 1px)', backgroundSize: '160px 100%, 100% 120px' }} />
}

function InstrumentDial({ accent, frame }: { accent: string; frame: number }) {
  return <div style={{ position: 'absolute', left: '10%', top: '8%', width: 720, height: 720, borderRadius: '50%', border: `4px solid ${accent}`, background: `conic-gradient(from ${frame * 0.4}deg, transparent, ${accent}44, transparent)` }} />
}

function TopoLines({ accent, frame }: { accent: string; frame: number }) {
  return <>{[0, 1, 2, 3, 4].map((index) => <div key={index} style={{ position: 'absolute', left: 80 + index * 90, top: 90 + index * 70, width: 760 - index * 80, height: 520 - index * 42, borderRadius: '50%', border: `3px solid ${accent}66`, transform: `rotate(${frame * 0.03 + index * 8}deg)` }} />)}</>
}

function CurtainFolds({ accent, frame }: { accent: string; frame: number }) {
  return <div style={{ position: 'absolute', inset: 0, backgroundImage: `repeating-linear-gradient(90deg, rgba(127,29,29,0.88) 0px, rgba(127,29,29,0.88) 70px, ${accent}55 105px, rgba(69,10,10,0.9) 150px)`, transform: `translateX(${Math.sin(frame / 50) * 18}px)` }} />
}

function Signage({ accent, frame }: { accent: string; frame: number }) {
  return <>{[0, 1, 2].map((index) => <div key={index} style={{ position: 'absolute', left: 100 + index * 260, top: 100 + index * 120, width: 360, height: 90, borderRadius: 18, background: '#F8FAFC', color: '#020617', boxShadow: `0 0 ${30 + index * 10}px ${accent}`, transform: `rotate(${Math.sin(frame / 40 + index) * 4}deg)` }} />)}</>
}

function StarMap({ accent, frame }: { accent: string; frame: number }) {
  return <>{Array.from({ length: 28 }).map((_, index) => <div key={index} style={{ position: 'absolute', left: `${(index * 37) % 96}%`, top: `${(index * 53 + frame * 0.1) % 92}%`, width: 7, height: 7, borderRadius: '50%', background: accent, boxShadow: `0 0 18px ${accent}` }} />)}</>
}

function LowPolySea({ bass }: { bass: number }) {
  return <>{[0, 1, 2, 3, 4].map((index) => <div key={index} style={{ position: 'absolute', left: -120 + index * 260, bottom: 80 + index * 25, width: 460, height: 320, clipPath: 'polygon(50% 0, 100% 100%, 0 100%)', background: ['#22D3EE', '#38BDF8', '#0EA5E9', '#34D399', '#FDE68A'][index], opacity: 0.42 + bass * 0.18 }} />)}</>
}

function Scanlines() {
  return <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.16) 0px, rgba(255,255,255,0.16) 2px, transparent 2px, transparent 7px)', borderRadius: 60, boxShadow: 'inset 0 0 160px rgba(0,0,0,0.65)' }} />
}

function Crystals({ accent, frame }: { accent: string; frame: number }) {
  return <>{[0, 1, 2, 3, 4, 5].map((index) => <div key={index} style={{ position: 'absolute', left: 80 + index * 190, top: 120 + (index % 3) * 230, width: 190, height: 360, clipPath: 'polygon(50% 0, 100% 30%, 75% 100%, 25% 100%, 0 30%)', background: `linear-gradient(135deg, ${accent}66, rgba(255,255,255,0.28))`, transform: `rotate(${index * 18 + frame * 0.05}deg)` }} />)}</>
}

function JerseyStripes({ accent, mid }: { accent: string; mid: number }) {
  return <div style={{ position: 'absolute', inset: 0, backgroundImage: `repeating-linear-gradient(90deg, ${accent}66 0px, ${accent}66 ${80 + mid * 30}px, transparent ${80 + mid * 30}px, transparent 180px)` }} />
}

function Lanterns({ accent, frame }: { accent: string; frame: number }) {
  return <>{Array.from({ length: 16 }).map((_, index) => <div key={index} style={{ position: 'absolute', left: `${(index * 19) % 96}%`, top: `${8 + (index % 4) * 16}%`, width: 70, height: 92, borderRadius: '50% 50% 44% 44%', background: index % 2 ? accent : '#F97316', boxShadow: `0 0 ${30 + Math.sin(frame / 20 + index) * 8}px ${accent}` }} />)}</>
}

function NoiseBlocks({ accent, frame, treble }: { accent: string; frame: number; treble: number }) {
  return <>{Array.from({ length: 22 }).map((_, index) => <div key={index} style={{ position: 'absolute', left: `${(index * 23 + Math.floor(frame / 4)) % 100}%`, top: `${(index * 41) % 96}%`, width: 60 + (index % 4) * 42, height: 18 + (index % 5) * 18, background: index % 2 ? accent : '#F8FAFC', opacity: 0.18 + treble * 0.26 }} />)}</>
}

function MuseumPanels({ accent, frame }: { accent: string; frame: number }) {
  return <>{[0, 1, 2].map((index) => <div key={index} style={{ position: 'absolute', left: 120 + index * 390, top: 92 + index * 60, width: 280, height: 500, border: `2px solid ${accent}55`, background: 'rgba(255,255,255,0.07)', boxShadow: `0 0 ${70 + Math.sin(frame / 32 + index) * 18}px ${accent}22` }} />)}</>
}

function PaperPuppets({ accent, frame }: { accent: string; frame: number }) {
  return <>{[0, 1, 2, 3].map((index) => <div key={index} style={{ position: 'absolute', left: `${8 + index * 24}%`, bottom: `${8 + (index % 2) * 10}%`, width: 170, height: 300, clipPath: 'polygon(50% 0, 72% 32%, 100% 42%, 70% 58%, 82% 100%, 50% 78%, 18% 100%, 30% 58%, 0 42%, 28% 32%)', background: accent, opacity: 0.34, transform: `rotate(${Math.sin(frame / 45 + index) * 5}deg)` }} />)}</>
}

function GreenhouseVines({ accent, frame, treble }: { accent: string; frame: number; treble: number }) {
  return <>{Array.from({ length: 18 }).map((_, index) => <div key={index} style={{ position: 'absolute', left: `${(index * 17) % 96}%`, top: `${(index * 23 + frame * 0.15) % 88}%`, width: 80, height: 160, borderRadius: '50%', border: `3px solid ${accent}`, opacity: 0.18 + treble * 0.24 }} />)}</>
}

function RunwayLights({ accent, frame, mid }: { accent: string; frame: number; mid: number }) {
  return <>{[0, 1].map((side) => <div key={side} style={{ position: 'absolute', left: side ? '52%' : '8%', top: -120, width: 420, height: 1200, background: `linear-gradient(${side ? 155 : 205}deg, ${accent}00, ${accent}${Math.floor(28 + mid * 80).toString(16)}, ${accent}00)`, transform: `skewX(${side ? -14 : 14}deg) translateY(${Math.sin(frame / 32) * 20}px)` }} />)}</>
}

function ClockworkGears({ accent, frame }: { accent: string; frame: number }) {
  return <>{[0, 1, 2].map((index) => <div key={index} style={{ position: 'absolute', right: 70 + index * 240, top: 70 + index * 190, width: 260 + index * 120, height: 260 + index * 120, borderRadius: '50%', border: `18px dashed ${accent}77`, transform: `rotate(${frame * (index % 2 ? -0.28 : 0.22)}deg)` }} />)}</>
}

function LavaBlobs({ accent, frame, bass }: { accent: string; frame: number; bass: number }) {
  return <>{Array.from({ length: 8 }).map((_, index) => <div key={index} style={{ position: 'absolute', left: `${(index * 21) % 86}%`, top: `${(index * 29 + frame * 0.22) % 90}%`, width: 150 + index * 18, height: 230 + index * 20, borderRadius: '54% 46% 62% 38%', background: `radial-gradient(circle, ${accent}, #7C2D12)`, opacity: 0.36 + bass * 0.2, filter: 'blur(1px)' }} />)}</>
}

function TarotGlyphs({ accent, frame }: { accent: string; frame: number }) {
  return <>{Array.from({ length: 5 }).map((_, index) => <div key={index} style={{ position: 'absolute', left: `${12 + index * 17}%`, top: `${12 + (index % 3) * 24}%`, width: 70 + index * 8, height: 70 + index * 8, border: `6px double ${accent}`, borderRadius: index % 2 ? '50%' : 10, opacity: 0.26, transform: `rotate(${frame * 0.05 + index * 18}deg)` }} />)}</>
}

function GraffitiTags({ accent, frame }: { accent: string; frame: number }) {
  return <>{Array.from({ length: 4 }).map((_, index) => <div key={index} style={{ position: 'absolute', left: `${6 + index * 23}%`, top: `${12 + (index % 2) * 42}%`, width: 210, height: 78, borderRadius: 999, border: `14px solid ${index % 2 ? '#F8FAFC' : accent}`, transform: `rotate(${-12 + index * 9 + Math.sin(frame / 24) * 2}deg)`, opacity: 0.24 }} />)}</>
}

function ZenRakes({ accent, frame }: { accent: string; frame: number }) {
  return <div style={{ position: 'absolute', inset: 80, backgroundImage: `repeating-radial-gradient(circle at ${45 + Math.sin(frame / 60) * 8}% 46%, transparent 0px, transparent 28px, ${accent}66 30px, transparent 34px)` }} />
}

function ClayShapes({ accent, frame }: { accent: string; frame: number }) {
  return <>{['#F9A8D4', '#FDE68A', '#A7F3D0', accent].map((color, index) => <div key={color} style={{ position: 'absolute', left: `${10 + index * 22}%`, top: `${16 + (index % 2) * 48}%`, width: 250, height: 210, borderRadius: '45% 55% 58% 42%', background: color, boxShadow: '18px 24px 0 rgba(15,23,42,0.14)', transform: `rotate(${Math.sin(frame / 40 + index) * 7}deg)`, opacity: 0.78 }} />)}</>
}

function HologramStage({ accent, frame, treble }: { accent: string; frame: number; treble: number }) {
  return <>{[0, 1, 2, 3].map((index) => <div key={index} style={{ position: 'absolute', left: `${20 + index * 13}%`, bottom: 140 + index * 58, width: 520 - index * 70, height: 140, border: `2px solid ${accent}88`, transform: `perspective(600px) rotateX(62deg) translateY(${Math.sin(frame / 26 + index) * 10}px)`, opacity: 0.28 + treble * 0.22 }} />)}</>
}

function NeuralLinks({ accent, frame, bass }: { accent: string; frame: number; bass: number }) {
  return <>{Array.from({ length: 34 }).map((_, index) => <div key={index} style={{ position: 'absolute', left: `${(index * 31) % 96}%`, top: `${(index * 43) % 90}%`, width: 10 + bass * 12, height: 10 + bass * 12, borderRadius: '50%', background: accent, boxShadow: `0 0 ${18 + bass * 30}px ${accent}`, transform: `translateY(${Math.sin(frame / 20 + index) * 12}px)` }} />)}</>
}

function BaroqueOrnaments({ accent, frame }: { accent: string; frame: number }) {
  return <div style={{ position: 'absolute', inset: 52, border: `24px double ${accent}AA`, borderRadius: 46, boxShadow: `inset 0 0 90px ${accent}33`, transform: `scale(${1 + Math.sin(frame / 70) * 0.01})` }} />
}

function SwissRules({ accent }: { accent: string }) {
  return <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(90deg, ${accent} 0 10px, transparent 10px), linear-gradient(rgba(15,23,42,0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.14) 1px, transparent 1px)`, backgroundSize: '240px 100%, 120px 120px, 120px 120px' }} />
}

function CandyPrisms({ accent, frame }: { accent: string; frame: number }) {
  return <>{['#F9A8D4', '#BAE6FD', '#FDE68A', accent].map((color, index) => <div key={color} style={{ position: 'absolute', left: `${8 + index * 24}%`, top: `${10 + (index % 2) * 38}%`, width: 300, height: 420, borderRadius: 56, background: `linear-gradient(135deg, ${color}99, rgba(255,255,255,0.32))`, border: '1px solid rgba(255,255,255,0.42)', transform: `rotate(${index * 12 + Math.sin(frame / 45) * 4}deg)`, backdropFilter: 'blur(8px)' }} />)}</>
}

function FurnaceSparks({ accent, frame, bass }: { accent: string; frame: number; bass: number }) {
  return <>{Array.from({ length: 30 }).map((_, index) => <div key={index} style={{ position: 'absolute', left: `${(index * 29) % 98}%`, top: `${(index * 61 - frame * 0.8 + 200) % 94}%`, width: 6 + (index % 4) * 5, height: 38 + bass * 38, background: accent, boxShadow: `0 0 22px ${accent}`, transform: `rotate(${index * 23}deg)` }} />)}</>
}

function JellyfishDrift({ accent, frame }: { accent: string; frame: number }) {
  return <>{Array.from({ length: 7 }).map((_, index) => <div key={index} style={{ position: 'absolute', left: `${8 + index * 13}%`, top: `${10 + ((index * 17 + frame * 0.14) % 70)}%`, width: 170, height: 230, borderRadius: '50% 50% 42% 42%', background: `linear-gradient(180deg, ${accent}66, transparent)`, boxShadow: `0 0 45px ${accent}55` }} />)}</>
}

function RadioWaves({ accent, frame }: { accent: string; frame: number }) {
  return <>{[0, 1, 2, 3, 4].map((index) => <div key={index} style={{ position: 'absolute', left: '50%', top: '44%', width: 220 + index * 210, height: 220 + index * 210, borderRadius: '50%', border: `3px solid ${accent}`, opacity: 0.42 - index * 0.055, transform: `translate(-50%, -50%) scale(${1 + Math.sin(frame / 28 + index) * 0.035})` }} />)}<div style={{ position: 'absolute', left: '50%', top: '18%', width: 8, height: 680, background: accent, transform: 'translateX(-50%)' }} /></>
}

function CloudBands({ accent, frame }: { accent: string; frame: number }) {
  return <>{[0, 1, 2, 3].map((index) => <div key={index} style={{ position: 'absolute', left: -180 + index * 180 + Math.sin(frame / 70 + index) * 28, top: 80 + index * 170, width: 900, height: 220, borderRadius: 999, background: `linear-gradient(90deg, transparent, ${accent}77, transparent)`, filter: 'blur(18px)' }} />)}</>
}

function SealMarks({ accent, frame }: { accent: string; frame: number }) {
  return <>{Array.from({ length: 9 }).map((_, index) => <div key={index} style={{ position: 'absolute', right: `${6 + (index % 3) * 18}%`, top: `${10 + Math.floor(index / 3) * 24}%`, width: 120, height: 120, border: `12px double ${accent}`, borderRadius: '50%', opacity: 0.2, transform: `rotate(${index * 13 + Math.sin(frame / 50) * 4}deg)` }} />)}</>
}

function SpecimenSlides({ accent, frame, treble }: { accent: string; frame: number; treble: number }) {
  return <>{Array.from({ length: 14 }).map((_, index) => <div key={index} style={{ position: 'absolute', left: `${(index * 23) % 92}%`, top: `${(index * 37) % 86}%`, width: 84 + (index % 4) * 38, height: 84 + (index % 4) * 38, borderRadius: '52% 48% 43% 57%', border: `2px solid ${accent}AA`, background: `radial-gradient(circle at 35% 30%, ${accent}66, rgba(255,255,255,0.08) 44%, transparent 70%)`, opacity: 0.28 + treble * 0.24, transform: `rotate(${frame * 0.04 + index * 17}deg)` }} />)}<div style={{ position: 'absolute', inset: 72, border: `1px solid ${accent}55`, backgroundImage: `linear-gradient(${accent}22 1px, transparent 1px), linear-gradient(90deg, ${accent}22 1px, transparent 1px)`, backgroundSize: '54px 54px' }} /></>
}

function BoardingPassLines({ accent, frame }: { accent: string; frame: number }) {
  return <><div style={{ position: 'absolute', inset: '90px 70px', borderRadius: 38, background: '#F8FAFC', boxShadow: '0 36px 120px rgba(15,23,42,0.28)' }} /><div style={{ position: 'absolute', left: '11%', right: '11%', top: '17%', height: 8, backgroundImage: `repeating-linear-gradient(90deg, ${accent} 0 24px, transparent 24px 40px)` }} />{Array.from({ length: 4 }).map((_, index) => <div key={index} style={{ position: 'absolute', left: `${12 + index * 19}%`, top: `${26 + (index % 2) * 12}%`, width: 150, height: 18, background: accent, opacity: 0.16, transform: `translateY(${Math.sin(frame / 36 + index) * 6}px)` }} />)}</>
}

function DossierStamps({ accent, frame }: { accent: string; frame: number }) {
  return <><div style={{ position: 'absolute', inset: 70, backgroundImage: 'repeating-linear-gradient(0deg, rgba(69,26,3,0.18) 0px, rgba(69,26,3,0.18) 2px, transparent 2px, transparent 42px)', border: '2px solid rgba(69,26,3,0.28)' }} />{Array.from({ length: 4 }).map((_, index) => <div key={index} style={{ position: 'absolute', left: `${10 + index * 19}%`, top: `${16 + (index % 3) * 22}%`, width: 170, height: 92, border: `9px solid ${accent}`, opacity: 0.2, transform: `rotate(${-18 + index * 13 + Math.sin(frame / 48) * 2}deg)` }} />)}</>
}

function WeatherRadar({ accent, frame, bass }: { accent: string; frame: number; bass: number }) {
  return <><div style={{ position: 'absolute', left: '50%', top: '42%', width: 920, height: 920, borderRadius: '50%', transform: 'translate(-50%, -50%)', background: `repeating-radial-gradient(circle, transparent 0 72px, ${accent}44 74px 78px), conic-gradient(from ${frame * 0.8}deg, transparent, ${accent}66, transparent 90deg)` }} />{['#22C55E', '#FACC15', '#EF4444'].map((color, index) => <div key={color} style={{ position: 'absolute', left: `${30 + index * 12}%`, top: `${24 + index * 9}%`, width: 210 + bass * 120, height: 150 + bass * 80, borderRadius: '48% 52% 60% 40%', background: color, opacity: 0.28, filter: 'blur(3px)' }} />)}</>
}

function ArchitectSection({ accent, frame }: { accent: string; frame: number }) {
  return <><div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(15,23,42,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,0.12) 1px, transparent 1px)', backgroundSize: '64px 64px' }} />{[0, 1, 2, 3].map((index) => <div key={index} style={{ position: 'absolute', left: 90 + index * 210, bottom: 150 + index * 42, width: 170, height: 480 - index * 52, border: `6px solid ${accent}`, background: 'rgba(255,255,255,0.06)', transform: `skewY(${-8 + Math.sin(frame / 60 + index) * 1.5}deg)` }} />)}</>
}

function ChefMenu({ accent, frame }: { accent: string; frame: number }) {
  return <><div style={{ position: 'absolute', inset: 78, border: `3px double ${accent}88`, background: 'rgba(255,247,237,0.76)' }} />{Array.from({ length: 10 }).map((_, index) => <div key={index} style={{ position: 'absolute', left: `${12 + (index % 2) * 50}%`, top: `${16 + index * 7}%`, width: 260, height: 4, background: accent, opacity: 0.18 + (index % 3) * 0.04, transform: `translateX(${Math.sin(frame / 50 + index) * 8}px)` }} />)}<div style={{ position: 'absolute', right: '10%', top: '12%', width: 180, height: 180, borderRadius: '50%', border: `14px solid ${accent}44` }} /></>
}

function ExplodedManual({ accent, frame }: { accent: string; frame: number }) {
  return <>{[0, 1, 2, 3, 4].map((index) => <div key={index} style={{ position: 'absolute', left: `${14 + index * 15}%`, top: `${18 + (index % 2) * 34}%`, width: 150 + index * 20, height: 120 + index * 14, border: `4px solid ${accent}`, background: 'rgba(219,234,254,0.16)', transform: `rotate(${index * 8 + Math.sin(frame / 38 + index) * 3}deg)` }} />)}{[0, 1, 2, 3].map((index) => <div key={`line-${index}`} style={{ position: 'absolute', left: `${28 + index * 13}%`, top: `${32 + index * 8}%`, width: 240, height: 3, background: accent, transform: `rotate(${-18 + index * 10}deg)`, opacity: 0.38 }} />)}</>
}

function NightRadioDial({ accent, frame, mid }: { accent: string; frame: number; mid: number }) {
  return <><div style={{ position: 'absolute', left: '50%', top: '40%', width: 760, height: 760, borderRadius: '50%', border: `24px solid ${accent}44`, transform: 'translate(-50%, -50%)' }} />{Array.from({ length: 36 }).map((_, index) => <div key={index} style={{ position: 'absolute', left: '50%', top: '40%', width: 4, height: index % 5 ? 42 : 86, background: accent, opacity: 0.22 + mid * 0.18, transformOrigin: `2px ${isNaN(index) ? 0 : 380}px`, transform: `rotate(${index * 10 + frame * 0.04}deg) translateY(-380px)` }} />)}<div style={{ position: 'absolute', left: '50%', top: '40%', width: 5, height: 360, background: accent, transformOrigin: '50% 100%', transform: `translate(-50%, -100%) rotate(${-50 + Math.sin(frame / 48) * 28}deg)` }} /></>
}

function EmbroideryHoop({ accent, frame }: { accent: string; frame: number }) {
  return <><div style={{ position: 'absolute', left: '50%', top: '42%', width: 780, height: 780, borderRadius: '50%', border: '34px solid #92400E', transform: 'translate(-50%, -50%)', backgroundImage: 'repeating-linear-gradient(45deg, rgba(120,53,15,0.12) 0 2px, transparent 2px 12px)' }} />{Array.from({ length: 18 }).map((_, index) => <div key={index} style={{ position: 'absolute', left: `${18 + (index * 17) % 64}%`, top: `${15 + (index * 29) % 58}%`, width: 100, height: 38, borderRadius: '50%', border: `6px solid ${index % 2 ? accent : '#16A34A'}`, transform: `rotate(${index * 23 + Math.sin(frame / 55) * 4}deg)`, opacity: 0.42 }} />)}</>
}

function CalendarGrid({ accent, frame, isWide }: { accent: string; frame: number; isWide: boolean }) {
  const paperInset = isWide ? '86px' : '74px 36px'
  const paperLeft = isWide ? 86 : 36
  const paperRight = isWide ? 86 : 36
  const paperTop = isWide ? 86 : 74
  const dayLeft = isWide ? 10 : 6.8
  const dayTop = isWide ? 18 : 16
  const dayStepX = isWide ? 11.6 : 12.6

  return <><div style={{ position: 'absolute', inset: paperInset, background: '#F8FAFC', border: `4px solid ${accent}`, boxShadow: isWide ? '24px 24px 0 rgba(15,23,42,0.16)' : '14px 16px 0 rgba(15,23,42,0.12)' }} /><div style={{ position: 'absolute', left: paperLeft, right: paperRight, top: paperTop, height: isWide ? 118 : 108, background: accent }} />{Array.from({ length: 35 }).map((_, index) => <div key={index} style={{ position: 'absolute', left: `${dayLeft + (index % 7) * dayStepX}%`, top: `${dayTop + Math.floor(index / 7) * 10.5}%`, width: isWide ? 62 : 70, height: isWide ? 62 : 70, border: `2px solid ${accent}33`, color: accent, fontSize: isWide ? 22 : 24, fontWeight: 900, display: 'grid', placeItems: 'center', opacity: 0.18 + (index === Math.floor((frame / 12) % 35) ? 0.5 : 0) }}>{index + 1}</div>)}</>
}

function ThermalReceiptPrint({ accent, frame, bass }: { accent: string; frame: number; bass: number }) {
  return <><div style={{ position: 'absolute', inset: '70px 54px', background: '#F8FAFC', borderRadius: 22, boxShadow: '0 28px 90px rgba(15,23,42,0.24)' }} />{Array.from({ length: 20 }).map((_, index) => <div key={index} style={{ position: 'absolute', left: `${10 + (index % 3) * 27}%`, top: `${10 + index * 4.5}%`, width: 180 + (index % 5) * 42, height: 3 + bass * 5, background: accent, opacity: 0.12 + (index % 4) * 0.04, transform: `translateY(${Math.sin(frame / 32 + index) * 3}px)` }} />)}<div style={{ position: 'absolute', left: '12%', right: '12%', bottom: 120, height: 60, backgroundImage: `repeating-linear-gradient(90deg, ${accent} 0 5px, transparent 5px 11px)`, opacity: 0.16 }} /></>
}

function XrayCassetteGlow({ accent, frame, treble }: { accent: string; frame: number; treble: number }) {
  return <><div style={{ position: 'absolute', inset: 70, borderRadius: 34, border: `4px solid ${accent}88`, background: `radial-gradient(circle at 44% 38%, ${accent}55, transparent 36%), rgba(2,6,23,0.38)`, boxShadow: `inset 0 0 ${90 + treble * 80}px ${accent}33` }} />{Array.from({ length: 11 }).map((_, index) => <div key={index} style={{ position: 'absolute', left: `${18 + index * 6}%`, top: `${14 + Math.sin(frame / 36 + index) * 5}%`, width: 18, height: 720, borderRadius: 999, background: accent, opacity: 0.08 + treble * 0.08, transform: `rotate(${-18 + index * 4}deg)` }} />)}</>
}

function PlanetariumConsole({ accent, frame }: { accent: string; frame: number }) {
  return <><div style={{ position: 'absolute', left: '50%', top: '36%', width: 860, height: 860, borderRadius: '50%', transform: 'translate(-50%, -50%)', background: `repeating-radial-gradient(circle, transparent 0 68px, ${accent}44 70px 72px)` }} />{Array.from({ length: 24 }).map((_, index) => <div key={index} style={{ position: 'absolute', left: `${(index * 41) % 94}%`, top: `${(index * 59 + frame * 0.08) % 74}%`, width: 8, height: 8, borderRadius: '50%', background: accent, boxShadow: `0 0 20px ${accent}` }} />)}</>
}

function SubmarineScope({ accent, frame, bass }: { accent: string; frame: number; bass: number }) {
  return <><div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(${accent}1F 1px, transparent 1px), linear-gradient(90deg, ${accent}1F 1px, transparent 1px)`, backgroundSize: '72px 72px' }} />{[0, 1, 2, 3].map((index) => <div key={index} style={{ position: 'absolute', left: '50%', top: '38%', width: 260 + index * 170, height: 260 + index * 170, borderRadius: '50%', border: `3px solid ${accent}`, opacity: 0.34 - index * 0.05 + bass * 0.08, transform: `translate(-50%, -50%) rotate(${frame * 0.08}deg)` }} />)}<div style={{ position: 'absolute', left: '50%', top: 120, width: 5, height: 650, background: accent, transform: `rotate(${Math.sin(frame / 46) * 22}deg)`, transformOrigin: '50% 100%' }} /></>
}

function ScrapbookDesk({ accent, frame }: { accent: string; frame: number }) {
  return <>{['#FEF3C7', '#FBCFE8', '#DBEAFE', '#DCFCE7'].map((color, index) => <div key={color} style={{ position: 'absolute', left: `${7 + index * 21}%`, top: `${10 + (index % 2) * 34}%`, width: 310, height: 410, borderRadius: 18, background: color, boxShadow: '12px 18px 0 rgba(15,23,42,0.12)', transform: `rotate(${-8 + index * 7 + Math.sin(frame / 42 + index) * 2}deg)` }} />)}<div style={{ position: 'absolute', left: '12%', right: '12%', top: '18%', height: 8, backgroundImage: `repeating-linear-gradient(90deg, ${accent} 0 18px, transparent 18px 32px)`, opacity: 0.4 }} /></>
}

function SignalTowerBeams({ accent, frame, mid }: { accent: string; frame: number; mid: number }) {
  return <><div style={{ position: 'absolute', left: '50%', top: 130, width: 10, height: 760, background: accent, transform: 'translateX(-50%)' }} />{[0, 1, 2, 3, 4].map((index) => <div key={index} style={{ position: 'absolute', left: '50%', top: 185, width: 220 + index * 160, height: 220 + index * 160, borderRadius: '50%', border: `3px solid ${accent}`, opacity: 0.36 - index * 0.045 + mid * 0.1, transform: `translate(-50%, -50%) scale(${1 + Math.sin(frame / 28 + index) * 0.04})` }} />)}</>
}

function TopographicSandbox({ accent, frame }: { accent: string; frame: number }) {
  return <><div style={{ position: 'absolute', inset: 70, borderRadius: 44, background: 'linear-gradient(135deg, #FDE68A, #FDBA74)', boxShadow: 'inset 0 0 80px rgba(120,53,15,0.18)' }} />{Array.from({ length: 8 }).map((_, index) => <div key={index} style={{ position: 'absolute', left: 80 + index * 88, top: 120 + (index % 4) * 90, width: 660 - index * 42, height: 320 - index * 18, borderRadius: '50%', border: `4px solid ${accent}77`, transform: `rotate(${index * 9 + Math.sin(frame / 50) * 2}deg)` }} />)}</>
}

function AstralCompassRose({ accent, frame }: { accent: string; frame: number }) {
  return <><div style={{ position: 'absolute', left: '50%', top: '38%', width: 780, height: 780, transform: `translate(-50%, -50%) rotate(${frame * 0.05}deg)`, background: `conic-gradient(from 0deg, ${accent}66 0 8deg, transparent 8deg 22deg, ${accent}33 22deg 30deg, transparent 30deg 45deg)`, borderRadius: '50%' }} />{[0, 1, 2, 3].map((index) => <div key={index} style={{ position: 'absolute', left: `${50 + Math.cos((index * Math.PI) / 2) * 32}%`, top: `${38 + Math.sin((index * Math.PI) / 2) * 24}%`, width: 34, height: 34, borderRadius: '50%', background: accent }} />)}</>
}

function DepartureFlipboardRows({ accent, frame }: { accent: string; frame: number }) {
  return <>{Array.from({ length: 9 }).map((_, index) => <div key={index} style={{ position: 'absolute', left: '8%', right: '8%', top: `${10 + index * 8}%`, height: 54, borderRadius: 8, background: '#111827', border: '1px solid rgba(248,250,252,0.16)', boxShadow: '0 8px 0 rgba(0,0,0,0.22)', transform: `translateX(${Math.sin(frame / 34 + index) * 5}px)` }}><div style={{ position: 'absolute', left: 28, right: 28, top: 18, height: 8, backgroundImage: `repeating-linear-gradient(90deg, ${accent} 0 18px, transparent 18px 32px)`, opacity: 0.22 }} /></div>)}</>
}

function PlatformBroadcastBoard({ accent, frame, bass }: { accent: string; frame: number; bass: number }) {
  return <><div style={{ position: 'absolute', inset: '72px 64px', borderRadius: 28, background: 'rgba(3,7,18,0.86)', border: '1px solid rgba(148,163,184,0.26)', boxShadow: '0 30px 90px rgba(0,0,0,0.42)' }} />{Array.from({ length: 10 }).map((_, index) => <div key={index} style={{ position: 'absolute', left: '10%', right: '10%', top: `${12 + index * 7.2}%`, height: 48, borderRadius: 6, background: index === Math.floor(frame / 18) % 10 ? 'rgba(245,158,11,0.16)' : 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(148,163,184,0.18)' }}><div style={{ position: 'absolute', left: 22, top: 19, width: 240, height: 8, background: accent, opacity: 0.2 + (index % 3) * 0.08 }} /><div style={{ position: 'absolute', right: 22, top: 16, width: 86, height: 14, background: '#FCD34D', opacity: 0.38 + bass * 0.18 }} /></div>)}<div style={{ position: 'absolute', left: '10%', right: '10%', top: '10.5%', height: 10, backgroundImage: `repeating-linear-gradient(90deg, ${accent} 0 18px, transparent 18px 36px)`, opacity: 0.26 }} /></>
}

function SilverHalidePrint({ accent, frame, treble }: { accent: string; frame: number; treble: number }) {
  return <><div style={{ position: 'absolute', inset: '74px 72px', background: '#F8F5EF', borderRadius: 24, boxShadow: '0 32px 100px rgba(15,23,42,0.24)' }} /><div style={{ position: 'absolute', left: '11%', right: '11%', top: '13%', bottom: '20%', borderRadius: 12, background: `radial-gradient(circle at ${36 + Math.sin(frame / 44) * 8}% 32%, rgba(251,146,60,0.3), transparent 28%), linear-gradient(135deg, rgba(15,23,42,0.78), rgba(68,64,60,0.25))` }} />{Array.from({ length: 7 }).map((_, index) => <div key={index} style={{ position: 'absolute', left: `${10 + index * 12}%`, top: '11%', width: 10, height: 18, borderRadius: 999, background: '#D6D3D1', opacity: 0.9 }} />)}{Array.from({ length: 18 }).map((_, index) => <div key={index} style={{ position: 'absolute', left: `${12 + (index * 17) % 76}%`, top: `${16 + (index * 27) % 62}%`, width: 160 + (index % 4) * 28, height: 2, background: accent, opacity: 0.05 + treble * 0.1, transform: `rotate(${-8 + index * 3.5}deg)` }} />)}</>
}

function NeonRainveil({ accent, frame, mid }: { accent: string; frame: number; mid: number }) {
  return <><div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 28% 22%, rgba(244,114,182,0.28), transparent 24%), radial-gradient(circle at 74% 18%, rgba(56,189,248,0.2), transparent 26%), linear-gradient(180deg, rgba(15,23,42,0.1), rgba(2,6,23,0.52))' }} />{Array.from({ length: 34 }).map((_, index) => <div key={index} style={{ position: 'absolute', left: `${(index * 13) % 100}%`, top: `${(index * 19 + frame * (1.1 + mid * 0.3)) % 100}%`, width: 2, height: 90 + (index % 5) * 28, borderRadius: 999, background: index % 2 ? 'rgba(56,189,248,0.38)' : 'rgba(244,114,182,0.24)', filter: 'blur(0.4px)' }} />)}{[0, 1, 2].map((index) => <div key={index} style={{ position: 'absolute', right: `${8 + index * 18}%`, top: `${10 + index * 16}%`, width: 320, height: 100, borderRadius: 999, border: `5px solid ${index % 2 ? accent : '#F472B6'}`, boxShadow: `0 0 ${28 + index * 10}px ${index % 2 ? accent : '#F472B6'}`, opacity: 0.24, transform: `rotate(${-9 + index * 7}deg)` }} />)}</>
}

function ThermalPulseHeat({ accent, frame, bass }: { accent: string; frame: number; bass: number }) {
  return <><div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 52%, rgba(249,115,22,0.2), transparent 30%), linear-gradient(135deg, #020617, #1E293B 45%, #7F1D1D)' }} />{['#FB7185', '#F97316', '#FACC15', '#38BDF8'].map((color, index) => <div key={color} style={{ position: 'absolute', left: `${14 + index * 14}%`, top: `${16 + (index % 2) * 26}%`, width: 250 + index * 42, height: 220 + index * 58, borderRadius: '54% 46% 62% 38%', background: `radial-gradient(circle, ${color}, transparent 68%)`, opacity: 0.22 + bass * 0.16, filter: 'blur(8px)', transform: `translateY(${Math.sin(frame / 28 + index) * 12}px)` }} />)}{Array.from({ length: 28 }).map((_, index) => <div key={index} style={{ position: 'absolute', left: `${6 + index * 3.2}%`, top: `${54 + Math.sin(index * 0.75 + frame / 10) * (8 + bass * 26)}%`, width: 22, height: 5, background: accent, opacity: 0.3, transform: `rotate(${Math.sin(index + frame / 14) * 16}deg)` }} />)}</>
}

function TapeOverwriteDeck({ accent, frame, bass }: { accent: string; frame: number; bass: number }) {
  return <><div style={{ position: 'absolute', inset: '76px 68px', borderRadius: 26, background: 'linear-gradient(135deg, rgba(28,25,23,0.82), rgba(68,64,60,0.92))', border: '2px solid rgba(245,158,11,0.28)', boxShadow: '0 28px 100px rgba(0,0,0,0.4)' }} /><div style={{ position: 'absolute', left: '14%', right: '14%', top: '24%', height: 260, borderRadius: 18, background: '#F5F5F4', boxShadow: 'inset 0 0 0 2px rgba(120,53,15,0.15)' }} /><div style={{ position: 'absolute', left: '20%', top: '32%', width: 150, height: 150, borderRadius: '50%', border: `10px solid ${accent}`, background: '#111827', transform: `rotate(${frame * 0.5}deg)` }} /><div style={{ position: 'absolute', right: '20%', top: '32%', width: 150, height: 150, borderRadius: '50%', border: `10px solid ${accent}`, background: '#111827', transform: `rotate(${-frame * 0.5}deg)` }} />{Array.from({ length: 14 }).map((_, index) => <div key={index} style={{ position: 'absolute', left: `${18 + (index % 2) * 38}%`, top: `${27 + index * 3.2}%`, width: 220 + (index % 5) * 28, height: 3 + bass * 4, background: index % 3 ? '#78716C' : '#D97706', opacity: 0.18 + (index % 4) * 0.05, transform: `translateX(${Math.sin(frame / 24 + index) * 6}px)` }} />)}</>
}

function StarEchoAtlasMap({ accent, frame, treble }: { accent: string; frame: number; treble: number }) {
  return <><div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 26%, rgba(125,211,252,0.16), transparent 24%), linear-gradient(180deg, rgba(2,6,23,0.24), rgba(2,6,23,0.62))' }} />{Array.from({ length: 34 }).map((_, index) => <div key={index} style={{ position: 'absolute', left: `${(index * 29) % 95}%`, top: `${(index * 47 + frame * 0.08) % 88}%`, width: 6 + (index % 3), height: 6 + (index % 3), borderRadius: '50%', background: accent, boxShadow: `0 0 ${14 + treble * 18}px ${accent}`, opacity: 0.35 + (index % 4) * 0.08 }} />)}{Array.from({ length: 9 }).map((_, index) => <div key={`line-${index}`} style={{ position: 'absolute', left: `${14 + index * 8}%`, top: `${22 + (index % 3) * 16}%`, width: 180 + index * 22, height: 2, background: `${accent}66`, transform: `rotate(${-22 + index * 6 + Math.sin(frame / 50) * 2}deg)`, opacity: 0.24 }} />)}<div style={{ position: 'absolute', left: '50%', top: '38%', width: 760, height: 760, borderRadius: '50%', border: `1px dashed ${accent}55`, transform: 'translate(-50%, -50%)' }} /></>
}

function MetroCircuitGrid({ accent, frame, bass }: { accent: string; frame: number; bass: number }) {
  return <><div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(${accent}18 1px, transparent 1px), linear-gradient(90deg, ${accent}18 1px, transparent 1px)`, backgroundSize: '78px 78px' }} />{[0, 1, 2, 3].map((index) => <div key={index} style={{ position: 'absolute', left: `${6 + index * 18}%`, top: `${16 + (index % 2) * 18}%`, width: 820 - index * 70, height: 14, borderRadius: 999, background: index % 2 ? '#F59E0B' : accent, boxShadow: `0 0 ${18 + bass * 28}px ${index % 2 ? '#F59E0B' : accent}`, transform: `rotate(${-18 + index * 12 + Math.sin(frame / 48) * 2}deg)` }} />)}{Array.from({ length: 18 }).map((_, index) => <div key={index} style={{ position: 'absolute', left: `${8 + (index * 11) % 84}%`, top: `${14 + (index * 17) % 66}%`, width: 28, height: 28, borderRadius: '50%', background: '#F8FAFC', border: `5px solid ${accent}`, boxShadow: `0 0 20px ${accent}55` }} />)}</>
}

function VelvetTransitArches({ accent, frame, mid }: { accent: string; frame: number; mid: number }) {
  return <>{[0, 1, 2, 3].map((index) => <div key={index} style={{ position: 'absolute', left: `${6 + index * 23}%`, top: '10%', width: 210, height: 700, borderRadius: '999px 999px 24px 24px', border: `5px solid ${accent}`, background: `linear-gradient(180deg, rgba(255,255,255,0.08), rgba(127,29,29,0.18))`, boxShadow: `inset 0 0 ${28 + mid * 36}px rgba(255,255,255,0.08)` }} />)}<div style={{ position: 'absolute', left: '10%', right: '10%', bottom: 130, height: 120, borderRadius: 999, background: `linear-gradient(90deg, transparent, ${accent}55, transparent)` , transform: `translateX(${Math.sin(frame / 44) * 16}px)` }} /></>
}

function HazeBlueprintDraft({ accent, frame }: { accent: string; frame: number }) {
  return <><div style={{ position: 'absolute', inset: 72, border: `3px solid ${accent}66`, background: 'rgba(224,242,254,0.08)' }} />{Array.from({ length: 9 }).map((_, index) => <div key={index} style={{ position: 'absolute', left: `${12 + index * 7}%`, top: `${14 + (index % 3) * 20}%`, width: 220 + index * 28, height: 120 + index * 22, borderRadius: '48% 52% 58% 42%', border: `2px solid ${accent}`, opacity: 0.16, filter: 'blur(1px)', transform: `translate(${Math.sin(frame / 52 + index) * 10}px, ${Math.cos(frame / 58 + index) * 8}px)` }} />)}<div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(${accent}10 1px, transparent 1px), linear-gradient(90deg, ${accent}10 1px, transparent 1px)`, backgroundSize: '62px 62px' }} /></>
}

function AuroraLedgerColumns({ accent, frame, treble }: { accent: string; frame: number; treble: number }) {
  return <><div style={{ position: 'absolute', inset: '72px 62px', background: 'rgba(248,250,252,0.78)', borderRadius: 24, boxShadow: '0 24px 80px rgba(15,23,42,0.18)' }} />{Array.from({ length: 12 }).map((_, index) => <div key={index} style={{ position: 'absolute', left: `${10 + index * 6.7}%`, top: '12%', bottom: '14%', width: 3, background: '#94A3B8', opacity: 0.18 + (index % 4) * 0.05 }} />)}{[0, 1, 2].map((index) => <div key={index} style={{ position: 'absolute', left: `${8 + index * 26}%`, top: `${16 + index * 10}%`, width: 380, height: 160, borderRadius: 999, background: `linear-gradient(90deg, transparent, ${accent}66, transparent)`, filter: 'blur(6px)', opacity: 0.32 + treble * 0.12, transform: `rotate(${-8 + index * 6 + Math.sin(frame / 40) * 2}deg)` }} />)}</>
}

function MonolithPulseBars({ accent, frame, bass }: { accent: string; frame: number; bass: number }) {
  return <>{[0, 1, 2, 3].map((index) => <div key={index} style={{ position: 'absolute', left: `${8 + index * 19}%`, bottom: `${10 + (index % 2) * 8}%`, width: 180, height: 420 + index * 70, borderRadius: 24, background: `linear-gradient(180deg, rgba(15,23,42,0.1), ${accent})`, boxShadow: `0 ${22 + bass * 34}px 60px rgba(0,0,0,0.24)`, transform: `translateY(${Math.sin(frame / 24 + index) * 12}px)` }} />)}<div style={{ position: 'absolute', left: '8%', right: '8%', bottom: 90, height: 6, backgroundImage: `repeating-linear-gradient(90deg, ${accent} 0 24px, transparent 24px 40px)`, opacity: 0.3 }} /></>
}

function LotusNeonPetals({ accent, frame, mid }: { accent: string; frame: number; mid: number }) {
  return <>{Array.from({ length: 10 }).map((_, index) => <div key={index} style={{ position: 'absolute', left: '50%', top: '42%', width: 190 + (index % 3) * 80, height: 360 + (index % 4) * 24, borderRadius: '50% 50% 8% 8%', border: `4px solid ${index % 2 ? accent : '#22D3EE'}`, boxShadow: `0 0 ${28 + mid * 30}px ${index % 2 ? accent : '#22D3EE'}`, opacity: 0.2, transform: `translate(-50%, -50%) rotate(${index * 36 + frame * 0.08}deg)` }} />)}<div style={{ position: 'absolute', left: '50%', top: '42%', width: 220, height: 220, borderRadius: '50%', background: `radial-gradient(circle, ${accent}88, transparent 68%)`, transform: 'translate(-50%, -50%)' }} /></>
}

function QuartzForecastSweep({ accent, frame, treble }: { accent: string; frame: number; treble: number }) {
  return <><div style={{ position: 'absolute', left: '50%', top: '38%', width: 820, height: 820, borderRadius: '50%', transform: 'translate(-50%, -50%)', background: `conic-gradient(from ${frame * 0.35}deg, transparent 0 40deg, ${accent}55 40deg 86deg, transparent 86deg 140deg, rgba(255,255,255,0.2) 140deg 180deg, transparent 180deg 360deg)` }} />{Array.from({ length: 4 }).map((_, index) => <div key={index} style={{ position: 'absolute', left: `${10 + index * 22}%`, top: `${14 + (index % 2) * 18}%`, width: 240, height: 120, borderRadius: 20, background: 'rgba(15,23,42,0.38)', border: `2px solid ${accent}`, boxShadow: `0 0 ${14 + treble * 16}px ${accent}44` }} />)}</>
}

function MotelPostcardStamp({ accent, frame }: { accent: string; frame: number }) {
  return <><div style={{ position: 'absolute', inset: '74px 62px', background: '#FFF7ED', borderRadius: 18, boxShadow: '0 22px 80px rgba(120,53,15,0.16)' }} />{['#FED7AA', '#BFDBFE', '#FBCFE8'].map((color, index) => <div key={color} style={{ position: 'absolute', left: `${10 + index * 24}%`, top: `${16 + (index % 2) * 26}%`, width: 300, height: 220, borderRadius: 10, background: color, border: `3px dashed ${accent}`, transform: `rotate(${-6 + index * 5 + Math.sin(frame / 42) * 1.5}deg)` }} />)}<div style={{ position: 'absolute', right: '12%', top: '16%', width: 180, height: 180, borderRadius: 20, border: `8px double ${accent}`, opacity: 0.42 }} /></>
}

function SignalLanternGlow({ accent, frame, bass }: { accent: string; frame: number; bass: number }) {
  return <>{Array.from({ length: 12 }).map((_, index) => <div key={index} style={{ position: 'absolute', left: `${8 + (index % 4) * 22}%`, top: `${10 + Math.floor(index / 4) * 22}%`, width: 88, height: 124, borderRadius: '50% 50% 42% 42%', background: accent, boxShadow: `0 0 ${22 + bass * 32}px ${accent}`, opacity: 0.3, transform: `translateY(${Math.sin(frame / 30 + index) * 12}px)` }} />)}{[0, 1, 2, 3].map((index) => <div key={`wire-${index}`} style={{ position: 'absolute', left: `${18 + index * 22}%`, top: 0, width: 4, height: 280, background: 'rgba(255,255,255,0.24)' }} />)}</>
}

function MarbleObservatoryOrbits({ accent, frame }: { accent: string; frame: number }) {
  return <><div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 32% 26%, rgba(255,255,255,0.16), transparent 24%), linear-gradient(135deg, rgba(255,255,255,0.08), rgba(15,23,42,0.22))' }} />{[0, 1, 2, 3].map((index) => <div key={index} style={{ position: 'absolute', left: '50%', top: '38%', width: 300 + index * 130, height: 300 + index * 130, borderRadius: '50%', border: `3px solid ${accent}66`, transform: `translate(-50%, -50%) rotate(${frame * 0.06 + index * 14}deg)` }} />)}<div style={{ position: 'absolute', left: '50%', top: '38%', width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.18)', boxShadow: 'inset 0 0 40px rgba(255,255,255,0.18)', transform: 'translate(-50%, -50%)' }} /></>
}

function ChromeLotusRipples({ accent, frame, treble }: { accent: string; frame: number; treble: number }) {
  return <>{Array.from({ length: 7 }).map((_, index) => <div key={index} style={{ position: 'absolute', left: '50%', top: '42%', width: 280 + index * 90, height: 280 + index * 90, borderRadius: '50%', border: `2px solid ${accent}`, boxShadow: `0 0 ${18 + treble * 22}px ${accent}55`, opacity: 0.3 - index * 0.03, transform: `translate(-50%, -50%) scale(${1 + Math.sin(frame / 40 + index) * 0.03})` }} />)}{Array.from({ length: 8 }).map((_, index) => <div key={`petal-${index}`} style={{ position: 'absolute', left: '50%', top: '42%', width: 180, height: 360, borderRadius: '50% 50% 10% 10%', background: 'linear-gradient(180deg, rgba(255,255,255,0.4), rgba(147,197,253,0.18))', border: `2px solid ${accent}88`, transform: `translate(-50%, -50%) rotate(${index * 45 + frame * 0.03}deg)` }} />)}</>
}

function NocturneBlueprintBeams({ accent, frame }: { accent: string; frame: number }) {
  return <><div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(${accent}1A 1px, transparent 1px), linear-gradient(90deg, ${accent}1A 1px, transparent 1px)`, backgroundSize: '68px 68px' }} />{[0, 1, 2, 3, 4].map((index) => <div key={index} style={{ position: 'absolute', left: `${-20 + index * 18}%`, top: `${12 + index * 9}%`, width: 540, height: 10, background: `linear-gradient(90deg, transparent, ${accent}, transparent)`, transform: `rotate(${-28 + index * 8 + Math.sin(frame / 46) * 2}deg)`, opacity: 0.28 }} />)}<div style={{ position: 'absolute', inset: 70, border: `2px solid ${accent}44` }} /></>
}

function OrchidSwitchboardPanel({ accent, frame, mid }: { accent: string; frame: number; mid: number }) {
  return <><div style={{ position: 'absolute', inset: '76px 64px', borderRadius: 26, background: 'rgba(17,24,39,0.76)', border: `2px solid ${accent}55` }} />{Array.from({ length: 16 }).map((_, index) => <div key={index} style={{ position: 'absolute', left: `${12 + (index % 4) * 18}%`, top: `${16 + Math.floor(index / 4) * 16}%`, width: 42, height: 42, borderRadius: '50%', background: index % 2 ? accent : '#F9A8D4', boxShadow: `0 0 ${16 + mid * 20}px ${index % 2 ? accent : '#F9A8D4'}`, opacity: 0.3 }} />)}{[0, 1, 2, 3, 4, 5].map((index) => <div key={`wire-${index}`} style={{ position: 'absolute', left: `${18 + index * 11}%`, top: `${18 + (index % 3) * 12}%`, width: 320, height: 3, background: accent, transform: `rotate(${-20 + index * 8 + Math.sin(frame / 38 + index) * 2}deg)`, opacity: 0.26 }} />)}</>
}

function CopperMonsoonRain({ accent, frame, bass }: { accent: string; frame: number; bass: number }) {
  return <><div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 70% 18%, rgba(251,146,60,0.24), transparent 24%), linear-gradient(180deg, rgba(120,53,15,0.18), rgba(15,23,42,0.52))' }} />{Array.from({ length: 38 }).map((_, index) => <div key={index} style={{ position: 'absolute', left: `${(index * 9) % 100}%`, top: `${(index * 13 + frame * (1.1 + bass * 0.4)) % 100}%`, width: 3, height: 120 + (index % 4) * 34, borderRadius: 999, background: index % 3 ? `${accent}88` : 'rgba(255,255,255,0.28)' }} />)}{[0, 1, 2].map((index) => <div key={`cloud-${index}`} style={{ position: 'absolute', left: `${10 + index * 24}%`, top: `${10 + index * 7}%`, width: 260, height: 90, borderRadius: 999, background: `${accent}33`, filter: 'blur(10px)' }} />)}</>
}

function BotanicalBlueprintVines({ accent, frame }: { accent: string; frame: number }) {
  return <><div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(${accent}22 1px, transparent 1px), linear-gradient(90deg, ${accent}22 1px, transparent 1px)`, backgroundSize: '64px 64px' }} />{Array.from({ length: 16 }).map((_, index) => <div key={index} style={{ position: 'absolute', left: `${12 + (index * 19) % 76}%`, top: `${12 + (index * 31) % 64}%`, width: 90, height: 170, borderRadius: '50% 10% 50% 10%', border: `4px solid ${accent}`, opacity: 0.22, transform: `rotate(${index * 23 + Math.sin(frame / 46) * 4}deg)` }} />)}</>
}

function NeonPawnshopSigns({ accent, frame }: { accent: string; frame: number }) {
  return <>{[0, 1, 2, 3].map((index) => <div key={index} style={{ position: 'absolute', left: `${7 + index * 22}%`, top: `${12 + (index % 2) * 28}%`, width: 280, height: 132, borderRadius: 999, border: `8px solid ${accent}`, boxShadow: `0 0 ${30 + Math.sin(frame / 30 + index) * 10}px ${accent}`, background: 'rgba(15,23,42,0.28)', transform: `rotate(${-8 + index * 6}deg)` }} />)}</>
}

function FilmBurnStrips({ accent, frame, treble }: { accent: string; frame: number; treble: number }) {
  return <><div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at ${30 + Math.sin(frame / 40) * 14}% 32%, ${accent}88, transparent 28%)` }} />{Array.from({ length: 5 }).map((_, index) => <div key={index} style={{ position: 'absolute', left: `${6 + index * 20}%`, top: 0, bottom: 0, width: 82, backgroundImage: 'repeating-linear-gradient(0deg, rgba(15,23,42,0.65) 0 26px, transparent 26px 46px)', opacity: 0.18 + treble * 0.12 }} />)}</>
}

function VelvetRopeLoops({ accent, frame }: { accent: string; frame: number }) {
  return <>{[0, 1, 2].map((index) => <div key={index} style={{ position: 'absolute', left: `${4 + index * 32}%`, top: `${18 + index * 12}%`, width: 440, height: 180, borderBottom: `26px solid ${accent}`, borderRadius: '0 0 999px 999px', transform: `rotate(${-5 + index * 5 + Math.sin(frame / 44) * 1.5}deg)`, opacity: 0.42 }} />)}{Array.from({ length: 5 }).map((_, index) => <div key={`post-${index}`} style={{ position: 'absolute', left: `${10 + index * 20}%`, top: '16%', width: 24, height: 560, borderRadius: 999, background: accent, opacity: 0.28 }} />)}</>
}

function DataRainWall({ accent, frame, bass }: { accent: string; frame: number; bass: number }) {
  return <>{Array.from({ length: 34 }).map((_, index) => <div key={index} style={{ position: 'absolute', left: `${index * 3}%`, top: `${(index * 19 + frame * (0.7 + bass)) % 100}%`, width: 5 + (index % 3) * 3, height: 90 + (index % 4) * 24, background: accent, opacity: 0.16 + bass * 0.2 }} />)}</>
}

function CeramicKilnHeat({ accent, frame, bass }: { accent: string; frame: number; bass: number }) {
  return <><div style={{ position: 'absolute', inset: 68, borderRadius: '48% 52% 44% 56%', background: `radial-gradient(circle, ${accent}88, #7C2D12 48%, transparent 72%)`, filter: 'blur(8px)', transform: `scale(${1 + bass * 0.04}) rotate(${Math.sin(frame / 60) * 2}deg)` }} />{Array.from({ length: 12 }).map((_, index) => <div key={index} style={{ position: 'absolute', left: `${8 + (index * 17) % 82}%`, bottom: `${8 + (index % 4) * 9}%`, width: 44, height: 190 + bass * 80, borderRadius: 999, background: accent, opacity: 0.2, filter: 'blur(3px)' }} />)}</>
}

function PaperTheaterLayers({ accent, frame }: { accent: string; frame: number }) {
  return <>{[0, 1, 2, 3].map((index) => <div key={index} style={{ position: 'absolute', left: -80 + index * 90, right: -80 + index * 70, bottom: 70 + index * 115, height: 330, clipPath: 'polygon(0 100%, 10% 50%, 22% 80%, 34% 38%, 48% 72%, 60% 30%, 76% 76%, 90% 44%, 100% 100%)', background: index % 2 ? accent : '#FEF3C7', opacity: 0.22 + index * 0.08, transform: `translateY(${Math.sin(frame / 42 + index) * 8}px)` }} />)}</>
}

function ArcadeCartridgeSlots({ accent, frame }: { accent: string; frame: number }) {
  return <>{Array.from({ length: 7 }).map((_, index) => <div key={index} style={{ position: 'absolute', left: `${8 + (index % 3) * 28}%`, top: `${12 + Math.floor(index / 3) * 24}%`, width: 250, height: 160, borderRadius: 16, background: '#111827', border: `6px solid ${accent}`, boxShadow: `8px 10px 0 rgba(0,0,0,0.28)`, transform: `rotate(${-6 + index * 3 + Math.sin(frame / 44) * 1.5}deg)` }} />)}</>
}

function GlacierCoreCracks({ accent, frame }: { accent: string; frame: number }) {
  return <><div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #E0F2FE, #0F172A)' }} />{Array.from({ length: 12 }).map((_, index) => <div key={index} style={{ position: 'absolute', left: `${(index * 13) % 92}%`, top: `${(index * 29) % 82}%`, width: 4, height: 260 + (index % 4) * 70, background: accent, boxShadow: `0 0 18px ${accent}`, transform: `rotate(${-40 + index * 13 + Math.sin(frame / 54) * 3}deg)`, opacity: 0.34 }} />)}</>
}

function ObservatoryNotebookMarks({ accent, frame }: { accent: string; frame: number }) {
  return <><div style={{ position: 'absolute', inset: '80px 64px', background: 'rgba(248,250,252,0.78)', borderRadius: 20, backgroundImage: `linear-gradient(${accent}22 1px, transparent 1px)`, backgroundSize: '100% 38px' }} />{Array.from({ length: 9 }).map((_, index) => <div key={index} style={{ position: 'absolute', left: `${12 + index * 8}%`, top: `${14 + (index % 3) * 19}%`, width: 120 + index * 18, height: 120 + index * 18, borderRadius: '50%', border: `2px solid ${accent}`, opacity: 0.22, transform: `rotate(${frame * 0.04 + index * 12}deg)` }} />)}</>
}

function CircuitCathedralWindows({ accent, frame }: { accent: string; frame: number }) {
  return <>{[0, 1, 2, 3].map((index) => <div key={index} style={{ position: 'absolute', left: `${8 + index * 22}%`, top: '9%', width: 210, height: 620, borderRadius: '999px 999px 24px 24px', border: `4px solid ${accent}`, background: `linear-gradient(180deg, ${accent}44, transparent)`, boxShadow: `0 0 ${30 + Math.sin(frame / 34 + index) * 8}px ${accent}55` }} />)}<div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(90deg, transparent 49%, ${accent}33 50%, transparent 51%)`, backgroundSize: '90px 90px' }} /></>
}

function ForensicDarkroom({ accent, frame }: { accent: string; frame: number }) {
  return <><div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 32% 28%, ${accent}55, transparent 26%), repeating-linear-gradient(90deg, rgba(248,250,252,0.08) 0 2px, transparent 2px 44px)` }} />{Array.from({ length: 4 }).map((_, index) => <div key={index} style={{ position: 'absolute', left: `${10 + index * 20}%`, top: `${14 + (index % 2) * 34}%`, width: 180, height: 92, border: `8px solid ${accent}`, opacity: 0.18, transform: `rotate(${-16 + index * 11 + Math.sin(frame / 42) * 2}deg)` }} />)}</>
}

function InsectCabinet({ accent, frame }: { accent: string; frame: number }) {
  return <>{Array.from({ length: 18 }).map((_, index) => <div key={index} style={{ position: 'absolute', left: `${8 + (index % 6) * 14}%`, top: `${10 + Math.floor(index / 6) * 23}%`, width: 96, height: 150, borderRadius: '50% 50% 42% 42%', border: `3px solid ${accent}AA`, background: `radial-gradient(circle at 50% 34%, ${accent}66, transparent 54%)`, boxShadow: `0 0 ${18 + Math.sin(frame / 35 + index) * 6}px ${accent}33`, transform: `rotate(${-10 + (index % 5) * 5}deg)` }} />)}<div style={{ position: 'absolute', inset: 72, border: `2px solid ${accent}55`, backgroundImage: `linear-gradient(${accent}18 1px, transparent 1px), linear-gradient(90deg, ${accent}18 1px, transparent 1px)`, backgroundSize: '120px 120px' }} /></>
}

function MineElevator({ accent, frame, bass }: { accent: string; frame: number; bass: number }) {
  return <><div style={{ position: 'absolute', inset: 0, backgroundImage: `repeating-linear-gradient(90deg, rgba(0,0,0,0.22) 0 32px, transparent 32px 96px)` }} />{[0, 1, 2].map((index) => <div key={index} style={{ position: 'absolute', left: `${14 + index * 28}%`, top: 70 + index * 68 + Math.sin(frame / 28 + index) * 22, width: 210, height: 720, border: `10px solid ${accent}`, background: 'rgba(15,23,42,0.32)', boxShadow: `0 ${28 + bass * 40}px 0 rgba(0,0,0,0.22)` }} />)}</>
}

function OrigamiSatellite({ accent, frame }: { accent: string; frame: number }) {
  return <>{Array.from({ length: 12 }).map((_, index) => <div key={index} style={{ position: 'absolute', left: `${8 + (index * 23) % 82}%`, top: `${10 + (index * 31) % 70}%`, width: 180, height: 150, clipPath: 'polygon(0 0, 100% 32%, 72% 100%, 22% 66%)', background: `linear-gradient(135deg, ${accent}88, rgba(255,255,255,0.18))`, border: `2px solid ${accent}`, transform: `rotate(${frame * 0.04 + index * 21}deg)`, opacity: 0.36 }} />)}<div style={{ position: 'absolute', left: '50%', top: '34%', width: 820, height: 820, borderRadius: '50%', border: `2px dashed ${accent}66`, transform: `translate(-50%, -50%) rotate(${frame * 0.08}deg)` }} /></>
}

function RisographPress({ accent, frame, treble }: { accent: string; frame: number; treble: number }) {
  return <>{['#EF4444', '#2563EB', '#FACC15'].map((color, index) => <div key={color} style={{ position: 'absolute', inset: `${80 + index * 24}px ${60 + index * 34}px`, background: `repeating-linear-gradient(${index * 28}deg, ${color}44 0 18px, transparent 18px 42px)`, mixBlendMode: 'multiply', opacity: 0.52 + treble * 0.12, transform: `translate(${Math.sin(frame / 32 + index) * 8}px, ${Math.cos(frame / 40 + index) * 8}px)` }} />)}<div style={{ position: 'absolute', left: '9%', right: '9%', bottom: 110, height: 46, backgroundImage: `repeating-linear-gradient(90deg, ${accent} 0 12px, transparent 12px 24px)`, opacity: 0.2 }} /></>
}

function TidalGreenhouse({ accent, frame, mid }: { accent: string; frame: number; mid: number }) {
  return <><div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(90deg, ${accent}22 1px, transparent 1px)`, backgroundSize: '86px 100%' }} />{[0, 1, 2, 3].map((index) => <div key={index} style={{ position: 'absolute', left: -140, right: -140, top: `${18 + index * 15}%`, height: 170, borderRadius: '50%', borderTop: `12px solid ${accent}`, opacity: 0.2 + mid * 0.18, transform: `translateX(${Math.sin(frame / 36 + index) * 38}px)` }} />)}{Array.from({ length: 14 }).map((_, index) => <div key={`leaf-${index}`} style={{ position: 'absolute', left: `${10 + (index * 17) % 78}%`, top: `${12 + (index * 29) % 58}%`, width: 84, height: 150, borderRadius: '50% 6% 50% 6%', border: `3px solid ${accent}`, transform: `rotate(${index * 18}deg)`, opacity: 0.28 }} />)}</>
}

function BilliardParlor({ accent, frame, bass }: { accent: string; frame: number; bass: number }) {
  return <><div style={{ position: 'absolute', inset: 74, borderRadius: 52, background: '#064E3B', border: '18px solid #451A03', boxShadow: 'inset 0 0 80px rgba(0,0,0,0.42)' }} />{Array.from({ length: 9 }).map((_, index) => <div key={index} style={{ position: 'absolute', left: `${18 + (index * 19) % 68}%`, top: `${14 + (index * 23 + frame * 0.06) % 56}%`, width: 74 + bass * 22, height: 74 + bass * 22, borderRadius: '50%', background: index % 2 ? accent : '#F8FAFC', boxShadow: '0 14px 28px rgba(0,0,0,0.3)' }} />)}</>
}

function TempleShadowFair({ accent, frame }: { accent: string; frame: number }) {
  return <>{[0, 1, 2].map((index) => <div key={index} style={{ position: 'absolute', left: -80 + index * 260, bottom: 100 + index * 70, width: 520, height: 330, clipPath: 'polygon(0 100%, 16% 42%, 28% 68%, 44% 28%, 62% 64%, 76% 38%, 100% 100%)', background: index % 2 ? '#7C2D12' : accent, opacity: 0.34, transform: `translateY(${Math.sin(frame / 40 + index) * 8}px)` }} />)}{Array.from({ length: 10 }).map((_, index) => <div key={`lantern-${index}`} style={{ position: 'absolute', left: `${8 + index * 9}%`, top: `${8 + (index % 2) * 8}%`, width: 56, height: 78, borderRadius: '50% 50% 44% 44%', background: accent, boxShadow: `0 0 30px ${accent}88` }} />)}</>
}

function CyanotypeHarbor({ accent, frame }: { accent: string; frame: number }) {
  return <><div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(${accent}22 1px, transparent 1px), linear-gradient(90deg, ${accent}22 1px, transparent 1px)`, backgroundSize: '58px 58px' }} />{Array.from({ length: 7 }).map((_, index) => <div key={index} style={{ position: 'absolute', left: `${8 + index * 13}%`, top: `${18 + (index % 3) * 14}%`, width: 170, height: 340, border: `4px solid ${accent}`, clipPath: 'polygon(50% 0, 100% 78%, 50% 100%, 0 78%)', opacity: 0.28, transform: `rotate(${Math.sin(frame / 50 + index) * 5}deg)` }} />)}<div style={{ position: 'absolute', left: -80, right: -80, bottom: 110, height: 170, background: `repeating-linear-gradient(0deg, ${accent}44 0 8px, transparent 8px 28px)`, transform: `translateY(${Math.sin(frame / 35) * 12}px)` }} /></>
}

function CandyWrapperShop({ accent, frame, treble }: { accent: string; frame: number; treble: number }) {
  return <>{['#F9A8D4', '#FDE68A', '#A7F3D0', accent].map((color, index) => <div key={color} style={{ position: 'absolute', left: `${5 + index * 24}%`, top: `${10 + (index % 2) * 36}%`, width: 330, height: 180, borderRadius: 28, background: `repeating-linear-gradient(45deg, ${color} 0 18px, rgba(255,255,255,0.55) 18px 34px)`, boxShadow: '14px 18px 0 rgba(15,23,42,0.12)', transform: `rotate(${-8 + index * 6 + Math.sin(frame / 36) * 2}deg)`, opacity: 0.74 + treble * 0.12 }} />)}</>
}

function RosePostcardDecor({ accent, frame, bass }: { accent: string; frame: number; bass: number }) {
  return <><div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 18% 16%, rgba(255,255,255,0.85), transparent 18%), radial-gradient(circle at 82% 22%, rgba(251,113,133,0.22), transparent 18%), linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0))' }} /><div style={{ position: 'absolute', inset: 72, borderRadius: 36, border: '2px solid rgba(190,24,93,0.16)', backgroundImage: 'linear-gradient(rgba(255,255,255,0.55) 1px, transparent 1px), linear-gradient(90deg, rgba(251,113,133,0.08) 1px, transparent 1px)', backgroundSize: '100% 44px, 44px 100%', boxShadow: 'inset 0 0 80px rgba(255,255,255,0.22)' }} />{Array.from({ length: 7 }).map((_, index) => { const left = 8 + ((index * 13) % 78); const top = 10 + ((index * 17) % 66); const drift = Math.sin(frame / 28 + index) * 10; const scale = 0.8 + (index % 3) * 0.16 + bass * 0.08; return <div key={index} style={{ position: 'absolute', left: `${left}%`, top: `${top}%`, width: 78, height: 70, opacity: 0.18 + (index % 2) * 0.08, transform: `translate(${drift}px, ${Math.cos(frame / 34 + index) * 6}px) rotate(${-12 + index * 5}deg) scale(${scale})` }}><div style={{ position: 'absolute', left: 8, top: 0, width: 30, height: 48, borderRadius: '30px 30px 0 0', background: index % 2 ? accent : '#FB7185', transform: 'rotate(-45deg)', transformOrigin: '100% 100%' }} /><div style={{ position: 'absolute', left: 38, top: 0, width: 30, height: 48, borderRadius: '30px 30px 0 0', background: index % 2 ? accent : '#FB7185', transform: 'rotate(45deg)', transformOrigin: '0 100%' }} /></div> })}{Array.from({ length: 3 }).map((_, index) => <div key={`stamp-${index}`} style={{ position: 'absolute', right: 72 + index * 86, top: 96 + (index % 2) * 32, width: 56, height: 56, borderRadius: '50%', border: `3px dashed ${index === 1 ? accent : '#FB7185'}`, opacity: 0.35, transform: `rotate(${frame * 0.4 + index * 18}deg)` }} />)}</>
}

function LaserEngraver({ accent, frame, bass }: { accent: string; frame: number; bass: number }) {
  return <><div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(${accent}18 1px, transparent 1px)`, backgroundSize: '100% 48px' }} />{Array.from({ length: 8 }).map((_, index) => <div key={index} style={{ position: 'absolute', left: `${10 + index * 10}%`, top: `${16 + (index % 4) * 15}%`, width: 3 + bass * 5, height: 720, background: accent, boxShadow: `0 0 ${34 + bass * 48}px ${accent}`, transform: `rotate(${-36 + index * 10 + Math.sin(frame / 36) * 3}deg)`, opacity: 0.35 }} />)}<div style={{ position: 'absolute', left: `${20 + (frame % 90) * 0.7}%`, top: '12%', width: 180, height: 180, borderRadius: '50%', border: `5px solid ${accent}`, boxShadow: `0 0 80px ${accent}` }} /></>
}

function VolcanicSeismograph({ accent, frame, bass }: { accent: string; frame: number; bass: number }) {
  return <><div style={{ position: 'absolute', inset: 80, border: `2px solid ${accent}55`, backgroundImage: `linear-gradient(${accent}22 1px, transparent 1px)`, backgroundSize: '100% 46px' }} />{Array.from({ length: 44 }).map((_, index) => <div key={index} style={{ position: 'absolute', left: `${6 + index * 2.1}%`, top: `${38 + Math.sin(index * 1.4 + frame / 10) * (8 + bass * 30)}%`, width: 22, height: 5, background: accent, boxShadow: `0 0 18px ${accent}`, transform: `rotate(${Math.sin(index + frame / 12) * 14}deg)` }} />)}</>
}

function VelvetPlanetarium({ accent, frame }: { accent: string; frame: number }) {
  return <><div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-radial-gradient(circle at 50% 35%, rgba(255,255,255,0.1) 0 2px, transparent 2px 70px)' }} />{Array.from({ length: 26 }).map((_, index) => <div key={index} style={{ position: 'absolute', left: `${(index * 37) % 94}%`, top: `${(index * 61 + frame * 0.08) % 76}%`, width: 8, height: 8, borderRadius: '50%', background: accent, boxShadow: `0 0 24px ${accent}` }} />)}<div style={{ position: 'absolute', left: '50%', top: '38%', width: 760, height: 760, borderRadius: '50%', border: `18px double ${accent}55`, transform: 'translate(-50%, -50%)' }} /></>
}

function CircuitKimono({ accent, frame }: { accent: string; frame: number }) {
  return <><div style={{ position: 'absolute', inset: 64, borderRadius: '46% 46% 8% 8%', background: `linear-gradient(135deg, ${accent}22, rgba(15,23,42,0.32))`, border: `5px solid ${accent}66` }} />{Array.from({ length: 18 }).map((_, index) => <div key={index} style={{ position: 'absolute', left: `${12 + (index * 17) % 72}%`, top: `${12 + (index * 23) % 66}%`, width: 120, height: 4, background: accent, transform: `rotate(${index % 2 ? 90 : 0}deg) translateX(${Math.sin(frame / 44 + index) * 8}px)`, opacity: 0.28 }} />)}</>
}

function RainTaxiMeter({ accent, frame, mid }: { accent: string; frame: number; mid: number }) {
  return <><div style={{ position: 'absolute', inset: 0, backgroundImage: `repeating-linear-gradient(115deg, rgba(255,255,255,0.18) 0 3px, transparent 3px 38px)`, transform: `translateY(${frame % 38}px)` }} />{Array.from({ length: 8 }).map((_, index) => <div key={index} style={{ position: 'absolute', left: `${8 + (index % 4) * 21}%`, top: `${16 + Math.floor(index / 4) * 20}%`, width: 170, height: 84, borderRadius: 12, background: '#111827', border: `4px solid ${accent}`, color: accent, fontSize: 34, fontWeight: 950, display: 'grid', placeItems: 'center', opacity: 0.24 + mid * 0.16 }}>{`${(index + Math.floor(frame / 12)) % 10}${(index * 3) % 10}.${(index * 7) % 10}`}</div>)}</>
}

function SundialCourtyard({ accent, frame }: { accent: string; frame: number }) {
  return <><div style={{ position: 'absolute', left: '50%', top: '39%', width: 760, height: 760, borderRadius: '50%', border: `14px solid ${accent}55`, transform: 'translate(-50%, -50%)' }} />{Array.from({ length: 24 }).map((_, index) => <div key={index} style={{ position: 'absolute', left: '50%', top: '39%', width: 5, height: index % 3 ? 70 : 120, background: accent, transformOrigin: '2px 380px', transform: `rotate(${index * 15}deg) translateY(-380px)`, opacity: 0.36 }} />)}<div style={{ position: 'absolute', left: '50%', top: '39%', width: 14, height: 350, background: accent, transformOrigin: '50% 100%', transform: `translate(-50%, -100%) rotate(${-45 + Math.sin(frame / 80) * 36}deg)` }} /></>
}

function PorcelainXray({ accent, frame, treble }: { accent: string; frame: number; treble: number }) {
  return <>{Array.from({ length: 9 }).map((_, index) => <div key={index} style={{ position: 'absolute', left: `${10 + (index % 3) * 26}%`, top: `${10 + Math.floor(index / 3) * 21}%`, width: 220, height: 220, borderRadius: '50%', border: `8px double ${accent}`, background: `radial-gradient(circle, ${accent}44, transparent 58%)`, boxShadow: `inset 0 0 ${30 + treble * 50}px ${accent}44`, transform: `rotate(${frame * 0.04 + index * 12}deg)` }} />)}<div style={{ position: 'absolute', inset: 68, backgroundImage: `repeating-linear-gradient(45deg, ${accent}18 0 2px, transparent 2px 18px)` }} /></>
}

function CloudServerFarm({ accent, frame, bass }: { accent: string; frame: number; bass: number }) {
  return <>{Array.from({ length: 6 }).map((_, index) => <div key={index} style={{ position: 'absolute', left: `${8 + (index % 3) * 28}%`, top: `${10 + Math.floor(index / 3) * 28}%`, width: 250, height: 390, borderRadius: 24, background: 'rgba(15,23,42,0.58)', border: `3px solid ${accent}66`, boxShadow: `0 0 ${22 + bass * 46}px ${accent}33` }}><div style={{ position: 'absolute', left: 24, right: 24, top: 34, height: 220, backgroundImage: `repeating-linear-gradient(0deg, ${accent}55 0 8px, transparent 8px 28px)` }} /></div>)}{Array.from({ length: 10 }).map((_, index) => <div key={`cloud-${index}`} style={{ position: 'absolute', left: `${-10 + index * 12 + Math.sin(frame / 50 + index) * 5}%`, bottom: `${18 + (index % 3) * 8}%`, width: 220, height: 88, borderRadius: 999, background: `${accent}33`, filter: 'blur(8px)' }} />)}</>
}

function PaperFortress({ accent, frame }: { accent: string; frame: number }) {
  return <>{[0, 1, 2, 3].map((index) => <div key={index} style={{ position: 'absolute', left: -80 + index * 110, right: -80 + index * 82, bottom: 90 + index * 120, height: 280, clipPath: 'polygon(0 100%, 0 48%, 8% 48%, 8% 34%, 16% 34%, 16% 48%, 24% 48%, 24% 34%, 32% 34%, 32% 48%, 100% 48%, 100% 100%)', background: index % 2 ? '#FDE68A' : accent, opacity: 0.26 + index * 0.06, transform: `translateY(${Math.sin(frame / 44 + index) * 8}px)` }} />)}</>
}

function MirageGasStation({ accent, frame }: { accent: string; frame: number }) {
  return <><div style={{ position: 'absolute', left: '8%', right: '8%', top: '18%', height: 170, borderRadius: 24, background: `linear-gradient(90deg, ${accent}, #FDE68A)`, boxShadow: `0 0 80px ${accent}66`, transform: `translateY(${Math.sin(frame / 40) * 8}px)` }} />{Array.from({ length: 7 }).map((_, index) => <div key={index} style={{ position: 'absolute', left: `${6 + index * 14}%`, bottom: `${12 + (index % 3) * 8}%`, width: 240, height: 170, borderRadius: '50%', borderTop: `8px solid ${accent}88`, transform: `scaleY(${0.35 + Math.sin(frame / 32 + index) * 0.06})`, opacity: 0.28 }} />)}<div style={{ position: 'absolute', left: '18%', top: '16%', width: 28, height: 620, background: accent }} /><div style={{ position: 'absolute', right: '18%', top: '16%', width: 28, height: 620, background: accent }} /></>
}

export const vaporwaveMallProfile: Profile = { style: 'vaporwave', label: 'VAPORWAVE MALL', variant: 'neon', background: 'linear-gradient(180deg, #312E81, #A21CAF 48%, #0F172A)', titleColor: '#FDF4FF', coverRadius: 42, coverRotate: -4 }
export const bauhausBlocksProfile: Profile = { style: 'bauhaus', label: 'BAUHAUS BLOCKS', variant: 'pulse', background: '#F8FAFC', titleColor: '#020617', coverRadius: 0, coverRotate: 3 }
export const darkAcademiaProfile: Profile = { style: 'academia', label: 'DARK ACADEMIA', variant: 'dashboard', background: 'linear-gradient(135deg, #1C1208, #0F172A)', titleColor: '#FDE68A', coverRadius: 18, coverRotate: -3 }
export const y2kStickerProfile: Profile = { style: 'y2k', label: 'Y2K STICKER', variant: 'neon', background: 'linear-gradient(135deg, #F9A8D4, #BAE6FD 52%, #F8FAFC)', titleColor: '#0F172A', coverRadius: 80, coverRotate: 5 }
export const retroGameHudProfile: Profile = { style: 'game', label: 'RETRO GAME HUD', variant: 'dashboard', background: '#050505', titleColor: '#BBF7D0', coverRadius: 4 }
export const deepSeaSonarProfile: Profile = { style: 'sonar', label: 'DEEP SEA SONAR', variant: 'waveform', background: 'linear-gradient(180deg, #031A2A, #020617)', titleColor: '#BAE6FD', coverRadius: 999, circleCover: true }
export const alpineMinimalProfile: Profile = { style: 'alpine', label: 'ALPINE MINIMAL', variant: 'pulse', background: 'linear-gradient(180deg, #F8FAFC, #CBD5E1)', titleColor: '#0F172A', coverRadius: 28 }
export const cyberKabukiProfile: Profile = { style: 'kabuki', label: 'CYBER KABUKI', variant: 'neon', background: 'linear-gradient(135deg, #020617, #450A0A)', titleColor: '#F8FAFC', coverRadius: 999, circleCover: true }
export const filmContactSheetProfile: Profile = { style: 'film', label: 'CONTACT SHEET', variant: 'dashboard', background: '#0A0A0A', titleColor: '#F8FAFC', coverRadius: 8 }
export const aeroInstrumentProfile: Profile = { style: 'aero', label: 'AERO INSTRUMENT', variant: 'waveform', background: 'linear-gradient(135deg, #0C4A6E, #020617)', titleColor: '#E0F2FE', coverRadius: 999, circleCover: true }
export const geologicRingsProfile: Profile = { style: 'geologic', label: 'GEOLOGIC RINGS', variant: 'pulse', background: 'linear-gradient(135deg, #451A03, #A16207)', titleColor: '#FEF3C7', coverRadius: 30 }
export const velvetCurtainProfile: Profile = { style: 'velvet', label: 'VELVET CURTAIN', variant: 'dashboard', background: '#450A0A', titleColor: '#FEF3C7', coverRadius: 26 }
export const neonConvenienceProfile: Profile = { style: 'convenience', label: 'NEON CONVENIENCE', variant: 'neon', background: 'linear-gradient(135deg, #111827, #312E81)', titleColor: '#F8FAFC', coverRadius: 24, coverRotate: -2 }
export const starChartVoyageProfile: Profile = { style: 'starchart', label: 'STAR CHART VOYAGE', variant: 'waveform', background: 'linear-gradient(135deg, #020617, #172554)', titleColor: '#DBEAFE', coverRadius: 999, circleCover: true }
export const lowPolyIslandProfile: Profile = { style: 'lowpoly', label: 'LOW POLY ISLAND', variant: 'pulse', background: 'linear-gradient(180deg, #7DD3FC, #FDE68A)', titleColor: '#083344', coverRadius: 18 }
export const retroTvScanlineProfile: Profile = { style: 'tv', label: 'RETRO TV', variant: 'dashboard', background: 'radial-gradient(circle, #1F2937, #020617)', titleColor: '#F8FAFC', coverRadius: 60 }
export const crystalCaveProfile: Profile = { style: 'crystal', label: 'CRYSTAL CAVE', variant: 'neon', background: 'linear-gradient(135deg, #1E1B4B, #020617)', titleColor: '#E0E7FF', coverRadius: 36 }
export const sportsJerseyProfile: Profile = { style: 'sports', label: 'SPORTS JERSEY', variant: 'pulse', background: 'linear-gradient(135deg, #111827, #1E3A8A)', titleColor: '#F8FAFC', coverRadius: 22 }
export const fireworkMarketProfile: Profile = { style: 'market', label: 'FIREWORK MARKET', variant: 'neon', background: 'linear-gradient(180deg, #111827, #7C2D12)', titleColor: '#FFF7ED', coverRadius: 30 }
export const noiseLabProfile: Profile = { style: 'noise', label: 'NOISE LAB', variant: 'dashboard', background: '#020617', titleColor: '#F8FAFC', coverRadius: 6, coverRotate: 4 }
export const museumLightboxProfile: Profile = { style: 'museum', label: 'MUSEUM LIGHTBOX', variant: 'dashboard', background: 'linear-gradient(135deg, #1C1917, #44403C)', titleColor: '#FEF3C7', coverRadius: 12 }
export const shadowPuppetProfile: Profile = { style: 'puppet', label: 'SHADOW PUPPET', variant: 'pulse', background: 'linear-gradient(135deg, #FEF3C7, #92400E)', titleColor: '#422006', coverRadius: 24 }
export const solarGreenhouseProfile: Profile = { style: 'greenhouse', label: 'SOLAR GREENHOUSE', variant: 'waveform', background: 'linear-gradient(135deg, #DCFCE7, #FDE68A)', titleColor: '#14532D', coverRadius: 34 }
export const monochromeRunwayProfile: Profile = { style: 'runway', label: 'MONOCHROME RUNWAY', variant: 'dashboard', background: 'linear-gradient(135deg, #030712, #525252)', titleColor: '#FAFAFA', coverRadius: 2 }
export const brassClockworkProfile: Profile = { style: 'clockwork', label: 'BRASS CLOCKWORK', variant: 'pulse', background: 'linear-gradient(135deg, #451A03, #78350F)', titleColor: '#FEF3C7', coverRadius: 999, circleCover: true }
export const lavaLampProfile: Profile = { style: 'lava', label: 'LAVA LAMP', variant: 'neon', background: 'linear-gradient(180deg, #431407, #7C2D12 52%, #1E1B4B)', titleColor: '#FED7AA', coverRadius: 80 }
export const tarotCardProfile: Profile = { style: 'tarot', label: 'TAROT CARD', variant: 'dashboard', background: 'linear-gradient(135deg, #1E1B4B, #111827)', titleColor: '#FDE68A', coverRadius: 16 }
export const graffitiWallProfile: Profile = { style: 'graffiti', label: 'GRAFFITI WALL', variant: 'neon', background: 'linear-gradient(135deg, #27272A, #0F172A)', titleColor: '#F8FAFC', coverRadius: 0, coverRotate: -5 }
export const zenGardenProfile: Profile = { style: 'zen', label: 'ZEN GARDEN', variant: 'pulse', background: 'linear-gradient(135deg, #F5F5F4, #D6D3D1)', titleColor: '#292524', coverRadius: 999, circleCover: true }
export const clayPosterProfile: Profile = { style: 'clay', label: 'CLAY POSTER', variant: 'pulse', background: 'linear-gradient(135deg, #FEF3C7, #FBCFE8)', titleColor: '#7C2D12', coverRadius: 48, coverRotate: 3 }
export const hologramIdolProfile: Profile = { style: 'hologram', label: 'HOLOGRAM IDOL', variant: 'neon', background: 'linear-gradient(135deg, #020617, #581C87)', titleColor: '#E0F2FE', coverRadius: 999, circleCover: true }
export const neuralConstellationProfile: Profile = { style: 'neural', label: 'NEURAL CONSTELLATION', variant: 'waveform', background: 'linear-gradient(135deg, #0F172A, #312E81)', titleColor: '#EDE9FE', coverRadius: 26 }
export const baroqueFrameProfile: Profile = { style: 'baroque', label: 'BAROQUE FRAME', variant: 'dashboard', background: 'linear-gradient(135deg, #1C1917, #450A0A)', titleColor: '#FEF3C7', coverRadius: 18 }
export const swissGridProfile: Profile = { style: 'swiss', label: 'SWISS GRID', variant: 'pulse', background: '#F8FAFC', titleColor: '#020617', coverRadius: 0 }
export const candyGlassProfile: Profile = { style: 'candy', label: 'CANDY GLASS', variant: 'neon', background: 'linear-gradient(135deg, #FDF2F8, #CFFAFE)', titleColor: '#701A75', coverRadius: 64, coverRotate: -3 }
export const rosePostcardProfile: Profile = { style: 'rosePostcard', label: 'ROSE POSTCARD', variant: 'pulse', background: 'linear-gradient(180deg, #FFF1F2, #FDF2F8 48%, #FEF3C7)', titleColor: '#9D174D', coverRadius: 36, coverRotate: -4, coverScale: 0.82, titleScale: 0.84, artistScale: 0.92, lyricScale: 0.82, contentInset: 34, lyricTopOffset: 36 }
export const industrialFurnaceProfile: Profile = { style: 'furnace', label: 'INDUSTRIAL FURNACE', variant: 'dashboard', background: 'linear-gradient(135deg, #111827, #431407)', titleColor: '#FFF7ED', coverRadius: 8 }
export const jellyfishGardenProfile: Profile = { style: 'jellyfish', label: 'JELLYFISH GARDEN', variant: 'waveform', background: 'linear-gradient(180deg, #172554, #020617)', titleColor: '#DBEAFE', coverRadius: 999, circleCover: true }
export const radioTowerProfile: Profile = { style: 'radio', label: 'RADIO TOWER', variant: 'dashboard', background: 'linear-gradient(135deg, #111827, #312E81)', titleColor: '#FEF3C7', coverRadius: 20 }
export const cloudAtlasProfile: Profile = { style: 'cloud', label: 'CLOUD ATLAS', variant: 'pulse', background: 'linear-gradient(180deg, #BAE6FD, #F8FAFC)', titleColor: '#0C4A6E', coverRadius: 36 }
export const redSealPrintProfile: Profile = { style: 'seal', label: 'RED SEAL PRINT', variant: 'pulse', background: 'linear-gradient(135deg, #FEF2F2, #F5F5F4)', titleColor: '#7F1D1D', coverRadius: 12 }
export const microscopeSlideProfile: Profile = { style: 'microscope', label: 'MICROSCOPE SLIDE', variant: 'waveform', background: 'linear-gradient(135deg, #ECFDF5, #064E3B)', titleColor: '#DCFCE7', coverRadius: 18 }
export const boardingPassProfile: Profile = { style: 'boarding', label: 'BOARDING PASS', variant: 'pulse', background: 'linear-gradient(135deg, #CBD5E1, #F8FAFC)', titleColor: '#0F172A', coverRadius: 14, coverRotate: -2 }
export const evidenceDossierProfile: Profile = { style: 'dossier', label: 'EVIDENCE DOSSIER', variant: 'dashboard', background: 'linear-gradient(135deg, #78350F, #FEF3C7)', titleColor: '#451A03', coverRadius: 4, coverRotate: 3 }
export const weatherRadarProfile: Profile = { style: 'radar', label: 'WEATHER RADAR', variant: 'waveform', background: 'linear-gradient(135deg, #082F49, #020617)', titleColor: '#E0F2FE', coverRadius: 999, circleCover: true }
export const architectSectionProfile: Profile = { style: 'section', label: 'ARCHITECT SECTION', variant: 'pulse', background: 'linear-gradient(135deg, #F8FAFC, #E2E8F0)', titleColor: '#0F172A', coverRadius: 0 }
export const chefMenuProfile: Profile = { style: 'menu', label: 'CHEF MENU', variant: 'pulse', background: 'linear-gradient(135deg, #FFF7ED, #FED7AA)', titleColor: '#7F1D1D', coverRadius: 24 }
export const explodedManualProfile: Profile = { style: 'manual', label: 'EXPLODED MANUAL', variant: 'dashboard', background: 'linear-gradient(135deg, #DBEAFE, #F8FAFC)', titleColor: '#1E3A8A', coverRadius: 8 }
export const nightRadioDialProfile: Profile = { style: 'nightdial', label: 'NIGHT RADIO DIAL', variant: 'dashboard', background: 'radial-gradient(circle, #1E1B4B, #020617)', titleColor: '#FEF3C7', coverRadius: 999, circleCover: true }
export const embroideryHoopProfile: Profile = { style: 'embroidery', label: 'EMBROIDERY HOOP', variant: 'pulse', background: 'linear-gradient(135deg, #FFF1F2, #FCE7F3)', titleColor: '#831843', coverRadius: 999, circleCover: true }
export const calendarMinimalProfile: Profile = { style: 'calendar', label: 'CALENDAR MINIMAL', variant: 'pulse', background: 'linear-gradient(135deg, #F8FAFC, #E5E7EB)', titleColor: '#111827', coverRadius: 2 }
export const thermalReceiptProfile: Profile = { style: 'thermal', label: 'THERMAL RECEIPT', variant: 'pulse', background: 'linear-gradient(135deg, #F5F5F4, #D6D3D1)', titleColor: '#111827', coverRadius: 8, coverRotate: -2 }
export const xrayCassetteProfile: Profile = { style: 'xray', label: 'XRAY CASSETTE', variant: 'waveform', background: 'linear-gradient(135deg, #020617, #164E63)', titleColor: '#CFFAFE', coverRadius: 14 }
export const planetariumConsoleProfile: Profile = { style: 'planetarium', label: 'PLANETARIUM CONSOLE', variant: 'neon', background: 'radial-gradient(circle, #1E1B4B, #020617)', titleColor: '#EDE9FE', coverRadius: 999, circleCover: true }
export const submarineScopeProfile: Profile = { style: 'submarine', label: 'SUBMARINE SCOPE', variant: 'dashboard', background: 'linear-gradient(135deg, #022C22, #020617)', titleColor: '#CCFBF1', coverRadius: 999, circleCover: true }
export const scrapbookDeskProfile: Profile = { style: 'scrapbook', label: 'SCRAPBOOK DESK', variant: 'pulse', background: 'linear-gradient(135deg, #FEF3C7, #F8FAFC)', titleColor: '#78350F', coverRadius: 18, coverRotate: 4 }
export const signalTowerProfile: Profile = { style: 'signaltower', label: 'SIGNAL TOWER', variant: 'dashboard', background: 'linear-gradient(135deg, #111827, #312E81)', titleColor: '#FEF3C7', coverRadius: 22 }
export const topographicSandboxProfile: Profile = { style: 'sandbox', label: 'TOPOGRAPHIC SANDBOX', variant: 'pulse', background: 'linear-gradient(135deg, #92400E, #FDE68A)', titleColor: '#422006', coverRadius: 36 }
export const astralCompassProfile: Profile = { style: 'compass', label: 'ASTRAL COMPASS', variant: 'neon', background: 'linear-gradient(135deg, #111827, #451A03)', titleColor: '#FEF3C7', coverRadius: 999, circleCover: true }
export const departureFlipboardProfile: Profile = { style: 'flipboard', label: 'DEPARTURE FLIPBOARD', variant: 'dashboard', background: 'linear-gradient(135deg, #030712, #1F2937)', titleColor: '#F8FAFC', coverRadius: 4 }
export const platformBroadcastProfile: Profile = { style: 'platformBroadcast', label: 'PLATFORM BROADCAST', variant: 'dashboard', background: 'linear-gradient(135deg, #020617, #1E293B)', titleColor: '#F8FAFC', coverRadius: 8 }
export const silverHalideProfile: Profile = { style: 'silverHalide', label: 'SILVER HALIDE', variant: 'pulse', background: 'linear-gradient(135deg, #F5F5F4, #E7E5E4)', titleColor: '#292524', coverRadius: 14, coverRotate: -2 }
export const neonRainveilProfile: Profile = { style: 'neonRainveil', label: 'NEON RAINVEIL', variant: 'neon', background: 'linear-gradient(135deg, #020617, #1E1B4B)', titleColor: '#F8FAFC', coverRadius: 34 }
export const thermalPulseProfile: Profile = { style: 'thermalPulse', label: 'THERMAL PULSE', variant: 'waveform', background: 'linear-gradient(135deg, #020617, #7F1D1D)', titleColor: '#FFF7ED', coverRadius: 22 }
export const tapeOverwriteProfile: Profile = { style: 'tapeOverwrite', label: 'TAPE OVERWRITE', variant: 'pulse', background: 'linear-gradient(135deg, #292524, #0F172A)', titleColor: '#FEF3C7', coverRadius: 10, coverRotate: -3 }
export const starEchoAtlasProfile: Profile = { style: 'starEchoAtlas', label: 'STAR ECHO ATLAS', variant: 'waveform', background: 'linear-gradient(135deg, #020617, #172554)', titleColor: '#DBEAFE', coverRadius: 999, circleCover: true }
export const botanicalBlueprintProfile: Profile = { style: 'botanicalBlueprint', label: 'BOTANICAL BLUEPRINT', variant: 'waveform', background: 'linear-gradient(135deg, #0F172A, #064E3B)', titleColor: '#DCFCE7', coverRadius: 20 }
export const neonPawnshopProfile: Profile = { style: 'pawnshop', label: 'NEON PAWNSHOP', variant: 'neon', background: 'linear-gradient(135deg, #111827, #581C87)', titleColor: '#FCE7F3', coverRadius: 30, coverRotate: -4 }
export const filmBurnProfile: Profile = { style: 'filmburn', label: 'FILM BURN', variant: 'pulse', background: 'linear-gradient(135deg, #431407, #020617)', titleColor: '#FED7AA', coverRadius: 6 }
export const velvetRopeProfile: Profile = { style: 'velvetRope', label: 'VELVET ROPE', variant: 'dashboard', background: 'linear-gradient(135deg, #450A0A, #111827)', titleColor: '#FEF3C7', coverRadius: 24 }
export const dataRainProfile: Profile = { style: 'datarain', label: 'DATA RAIN', variant: 'neon', background: 'linear-gradient(135deg, #001B12, #020617)', titleColor: '#BBF7D0', coverRadius: 8 }
export const ceramicKilnProfile: Profile = { style: 'kiln', label: 'CERAMIC KILN', variant: 'pulse', background: 'linear-gradient(135deg, #7C2D12, #1C1917)', titleColor: '#FED7AA', coverRadius: 44 }
export const paperTheaterProfile: Profile = { style: 'paperTheater', label: 'PAPER THEATER', variant: 'pulse', background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)', titleColor: '#7C2D12', coverRadius: 20 }
export const arcadeCartridgeProfile: Profile = { style: 'cartridge', label: 'ARCADE CARTRIDGE', variant: 'dashboard', background: 'linear-gradient(135deg, #020617, #3F6212)', titleColor: '#D9F99D', coverRadius: 10 }
export const glacierCoreProfile: Profile = { style: 'glacier', label: 'GLACIER CORE', variant: 'waveform', background: 'linear-gradient(135deg, #E0F2FE, #172554)', titleColor: '#EFF6FF', coverRadius: 999, circleCover: true }
export const observatoryNotebookProfile: Profile = { style: 'observatoryNotebook', label: 'OBSERVATORY NOTEBOOK', variant: 'pulse', background: 'linear-gradient(135deg, #DBEAFE, #F8FAFC)', titleColor: '#1E3A8A', coverRadius: 16 }
export const circuitCathedralProfile: Profile = { style: 'circuitCathedral', label: 'CIRCUIT CATHEDRAL', variant: 'neon', background: 'linear-gradient(135deg, #111827, #312E81)', titleColor: '#F3E8FF', coverRadius: 30 }
export const forensicDarkroomProfile: Profile = { style: 'forensicDarkroom', label: 'FORENSIC DARKROOM', variant: 'dashboard', background: 'linear-gradient(135deg, #111827, #450A0A)', titleColor: '#FEE2E2', coverRadius: 8, coverRotate: -2 }
export const insectCabinetProfile: Profile = { style: 'insectCabinet', label: 'INSECT CABINET', variant: 'waveform', background: 'linear-gradient(135deg, #1C1917, #365314)', titleColor: '#ECFCCB', coverRadius: 18 }
export const mineElevatorProfile: Profile = { style: 'mineElevator', label: 'MINE ELEVATOR', variant: 'dashboard', background: 'linear-gradient(135deg, #111827, #292524)', titleColor: '#FEF3C7', coverRadius: 4 }
export const origamiSatelliteProfile: Profile = { style: 'origamiSatellite', label: 'ORIGAMI SATELLITE', variant: 'neon', background: 'linear-gradient(135deg, #0F172A, #312E81)', titleColor: '#E0E7FF', coverRadius: 28, coverRotate: 3 }
export const risographPressProfile: Profile = { style: 'risographPress', label: 'RISOGRAPH PRESS', variant: 'pulse', background: 'linear-gradient(135deg, #FEF3C7, #F8FAFC)', titleColor: '#7F1D1D', coverRadius: 2 }
export const tidalGreenhouseProfile: Profile = { style: 'tidalGreenhouse', label: 'TIDAL GREENHOUSE', variant: 'waveform', background: 'linear-gradient(135deg, #042F2E, #064E3B)', titleColor: '#CCFBF1', coverRadius: 999, circleCover: true }
export const billiardParlorProfile: Profile = { style: 'billiardParlor', label: 'BILLIARD PARLOR', variant: 'dashboard', background: 'linear-gradient(135deg, #022C22, #451A03)', titleColor: '#FEF3C7', coverRadius: 999, circleCover: true }
export const templeShadowFairProfile: Profile = { style: 'templeShadowFair', label: 'TEMPLE SHADOW FAIR', variant: 'pulse', background: 'linear-gradient(135deg, #431407, #111827)', titleColor: '#FFEDD5', coverRadius: 24 }
export const cyanotypeHarborProfile: Profile = { style: 'cyanotypeHarbor', label: 'CYANOTYPE HARBOR', variant: 'waveform', background: 'linear-gradient(135deg, #082F49, #0F172A)', titleColor: '#E0F2FE', coverRadius: 12 }
export const candyWrapperShopProfile: Profile = { style: 'candyWrapperShop', label: 'CANDY WRAPPER SHOP', variant: 'neon', background: 'linear-gradient(135deg, #FCE7F3, #FEF3C7)', titleColor: '#831843', coverRadius: 54, coverRotate: -4 }
export const laserEngraverProfile: Profile = { style: 'laserEngraver', label: 'LASER ENGRAVER', variant: 'neon', background: 'linear-gradient(135deg, #020617, #164E63)', titleColor: '#CFFAFE', coverRadius: 6 }
export const volcanicSeismographProfile: Profile = { style: 'volcanicSeismograph', label: 'VOLCANIC SEISMOGRAPH', variant: 'dashboard', background: 'linear-gradient(135deg, #431407, #0F172A)', titleColor: '#FED7AA', coverRadius: 20 }
export const velvetPlanetariumProfile: Profile = { style: 'velvetPlanetarium', label: 'VELVET PLANETARIUM', variant: 'neon', background: 'radial-gradient(circle, #312E81, #020617)', titleColor: '#EDE9FE', coverRadius: 999, circleCover: true }
export const circuitKimonoProfile: Profile = { style: 'circuitKimono', label: 'CIRCUIT KIMONO', variant: 'waveform', background: 'linear-gradient(135deg, #111827, #4A044E)', titleColor: '#FAE8FF', coverRadius: 34 }
export const rainTaxiMeterProfile: Profile = { style: 'rainTaxiMeter', label: 'RAIN TAXI METER', variant: 'dashboard', background: 'linear-gradient(135deg, #111827, #1E293B)', titleColor: '#FEF08A', coverRadius: 14, coverRotate: -3 }
export const sundialCourtyardProfile: Profile = { style: 'sundialCourtyard', label: 'SUNDIAL COURTYARD', variant: 'pulse', background: 'linear-gradient(135deg, #FEF3C7, #FDBA74)', titleColor: '#78350F', coverRadius: 999, circleCover: true }
export const porcelainXrayProfile: Profile = { style: 'porcelainXray', label: 'PORCELAIN XRAY', variant: 'waveform', background: 'linear-gradient(135deg, #E0F2FE, #1E3A8A)', titleColor: '#EFF6FF', coverRadius: 999, circleCover: true }
export const cloudServerFarmProfile: Profile = { style: 'cloudServerFarm', label: 'CLOUD SERVER FARM', variant: 'dashboard', background: 'linear-gradient(135deg, #0F172A, #1E3A8A)', titleColor: '#DBEAFE', coverRadius: 18 }
export const paperFortressProfile: Profile = { style: 'paperFortress', label: 'PAPER FORTRESS', variant: 'pulse', background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)', titleColor: '#7C2D12', coverRadius: 20 }
export const mirageGasStationProfile: Profile = { style: 'mirageGasStation', label: 'MIRAGE GAS STATION', variant: 'neon', background: 'linear-gradient(135deg, #7C2D12, #312E81)', titleColor: '#FFE4E6', coverRadius: 16 }
export const metroCircuitProfile: Profile = { style: 'metroCircuit', label: 'METRO CIRCUIT', variant: 'dashboard', background: 'linear-gradient(135deg, #0F172A, #1E3A8A)', titleColor: '#DBEAFE', coverRadius: 10 }
export const velvetTransitProfile: Profile = { style: 'velvetTransit', label: 'VELVET TRANSIT', variant: 'pulse', background: 'linear-gradient(135deg, #450A0A, #1F2937)', titleColor: '#FEF3C7', coverRadius: 26 }
export const hazeBlueprintProfile: Profile = { style: 'hazeBlueprint', label: 'HAZE BLUEPRINT', variant: 'waveform', background: 'linear-gradient(135deg, #082F49, #0F172A)', titleColor: '#E0F2FE', coverRadius: 18 }
export const auroraLedgerProfile: Profile = { style: 'auroraLedger', label: 'AURORA LEDGER', variant: 'pulse', background: 'linear-gradient(135deg, #EEF2FF, #DBEAFE)', titleColor: '#312E81', coverRadius: 14, coverRotate: -2 }
export const monolithPulseProfile: Profile = { style: 'monolithPulse', label: 'MONOLITH PULSE', variant: 'dashboard', background: 'linear-gradient(135deg, #111827, #450A0A)', titleColor: '#FFE4E6', coverRadius: 18 }
export const lotusNeonProfile: Profile = { style: 'lotusNeon', label: 'LOTUS NEON', variant: 'neon', background: 'linear-gradient(135deg, #0F172A, #4A044E)', titleColor: '#FDF2F8', coverRadius: 999, circleCover: true }
export const quartzForecastProfile: Profile = { style: 'quartzForecast', label: 'QUARTZ FORECAST', variant: 'waveform', background: 'linear-gradient(135deg, #082F49, #1E293B)', titleColor: '#E0F2FE', coverRadius: 999, circleCover: true }
export const motelPostcardProfile: Profile = { style: 'motelPostcard', label: 'MOTEL POSTCARD', variant: 'pulse', background: 'linear-gradient(135deg, #FFF7ED, #FED7AA)', titleColor: '#7C2D12', coverRadius: 12, coverRotate: -3 }
export const signalLanternProfile: Profile = { style: 'signalLantern', label: 'SIGNAL LANTERN', variant: 'neon', background: 'linear-gradient(135deg, #431407, #111827)', titleColor: '#FFE4E6', coverRadius: 30 }
export const marbleObservatoryProfile: Profile = { style: 'marbleObservatory', label: 'MARBLE OBSERVATORY', variant: 'waveform', background: 'linear-gradient(135deg, #E5E7EB, #94A3B8)', titleColor: '#111827', coverRadius: 999, circleCover: true }
export const chromeLotusProfile: Profile = { style: 'chromeLotus', label: 'CHROME LOTUS', variant: 'neon', background: 'linear-gradient(135deg, #0F172A, #475569)', titleColor: '#E0F2FE', coverRadius: 999, circleCover: true }
export const nocturneBlueprintProfile: Profile = { style: 'nocturneBlueprint', label: 'NOCTURNE BLUEPRINT', variant: 'dashboard', background: 'linear-gradient(135deg, #020617, #172554)', titleColor: '#DBEAFE', coverRadius: 8 }
export const orchidSwitchboardProfile: Profile = { style: 'orchidSwitchboard', label: 'ORCHID SWITCHBOARD', variant: 'dashboard', background: 'linear-gradient(135deg, #111827, #581C87)', titleColor: '#FAE8FF', coverRadius: 16 }
export const copperMonsoonProfile: Profile = { style: 'copperMonsoon', label: 'COPPER MONSOON', variant: 'waveform', background: 'linear-gradient(135deg, #7C2D12, #1E293B)', titleColor: '#FED7AA', coverRadius: 24 }
