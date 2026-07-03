export const audioFormats = ['mp3', 'wav', 'flac', 'm4a'] as const
export const lyricFormats = ['lrc'] as const
export const coverFormats = ['jpg', 'jpeg', 'png', 'webp'] as const
export const videoRatios = ['9:16', '16:9'] as const
export const renderQualities = ['draft', 'standard'] as const
export const templateIds = [
  'PulseCover',
  'NeonLyric',
  'WaveformStage',
  'PulseDashboard',
  'HeroSplit',
  'LyricsCloud',
  'ScatterPoster',
  'OrbitWords',
  'CutoutRansom',
  'NeonGraffiti',
  'MagneticPoetry',
  'BrokenKaraoke',
  'StarfieldWhispers',
  'PolaroidStorm',
  'InkSplashWords',
  'TerminalScatter',
  'VelvetMargins',
  'PrismDrift',
  'StickerBombLyrics',
  'BlueprintAnnotations',
  'RadioStaticText',
  'GlassMosaicWords',
  'CarnivalSigns',
  'ShadowTypeCollage',
  'HeatmapLyrics',
  'NewspaperRain',
  'VinylEditorial',
  'CinemaBeam',
  'GlassTurntable',
  'AuroraRibbon',
  'InkScroll',
  'MetroPoster',
  'MoonRing',
  'PrismGrid',
  'CassetteDream',
  'MinimalHalo',
  'CitySkyline',
  'PaperCutStage',
  'GalaxyKaraoke',
  'TypewriterNoir',
  'LiquidChrome',
  'BotanicalVinyl',
  'OrigamiCinema',
  'BlueprintWave',
  'SunrisePolaroid',
  'CyberTerminal',
  'DesertMirage',
  'RainyWindow',
  'ComicPop',
  'VaporwaveMall',
  'BauhausBlocks',
  'DarkAcademia',
  'Y2KSticker',
  'RetroGameHUD',
  'DeepSeaSonar',
  'AlpineMinimal',
  'CyberKabuki',
  'FilmContactSheet',
  'AeroInstrument',
  'GeologicRings',
  'VelvetCurtain',
  'NeonConvenience',
  'StarChartVoyage',
  'LowPolyIsland',
  'RetroTVScanline',
  'CrystalCave',
  'SportsJersey',
  'FireworkMarket',
  'NoiseLab',
  'MuseumLightbox',
  'ShadowPuppet',
  'SolarGreenhouse',
  'MonochromeRunway',
  'BrassClockwork',
  'LavaLamp',
  'TarotCard',
  'GraffitiWall',
  'ZenGarden',
  'ClayPoster',
  'HologramIdol',
  'NeuralConstellation',
  'BaroqueFrame',
  'SwissGrid',
  'CandyGlass',
  'RosePostcard',
  'IndustrialFurnace',
  'JellyfishGarden',
  'RadioTower',
  'CloudAtlas',
  'RedSealPrint',
  'KineticPoster',
  'NordicNight',
  'MemphisConfetti',
  'CircuitGarden',
  'OceanBlueprint',
  'VelourClub',
  'MountainCabin',
  'NewspaperCollage',
  'LaserWarehouse',
  'PorcelainDiary',
  'MatchboxPop',
  'AstroDome',
  'StainedChoir',
  'WindTunnel',
  'FossilArchive',
  'MarbleLobby',
  'PaperLanternLake',
  'ChromeDiner',
  'TextileLoom',
  'SatelliteWeather',
  'LibraryCard',
  'SnowglobeMemory',
  'CarnivalTicket',
  'BrutalistAtrium',
  'PixelCafe',
  'GoldenWheat',
  'MicrochipBloom',
  'UnderwaterMetro',
  'DragonDancePoster',
  'PearlOpera',
  'KiteFestival',
  'RainforestCanopy',
  'DesertObservatory',
  'CandleChapel',
  'GlassElevator',
  'MonsoonMarket',
  'PolarExpedition',
  'SakuraTram',
  'MoonPress',
  'VelvetAquarium',
  'QuartzDial',
  'SaffronKitchen',
  'PaperPlaneTerminal',
  'StaticMagazine',
  'PrismOrchestra',
  'CopperCircuit',
  'FountainPlaza',
  'SynthVelvet',
  'CoralMicroscope',
  'MidnightBilliards',
  'MicroscopeSlide',
  'BoardingPass',
  'EvidenceDossier',
  'WeatherRadar',
  'ArchitectSection',
  'ChefMenu',
  'ExplodedManual',
  'NightRadioDial',
  'EmbroideryHoop',
  'CalendarMinimal',
  'ThermalReceipt',
  'XrayCassette',
  'PlanetariumConsole',
  'SubmarineScope',
  'ScrapbookDesk',
  'SignalTower',
  'TopographicSandbox',
  'AstralCompass',
  'DepartureFlipboard',
  'BotanicalBlueprint',
  'NeonPawnshop',
  'FilmBurn',
  'VelvetRope',
  'DataRain',
  'CeramicKiln',
  'PaperTheater',
  'ArcadeCartridge',
  'GlacierCore',
  'ObservatoryNotebook',
  'CircuitCathedral',
  'ForensicDarkroom',
  'InsectCabinet',
  'MineElevator',
  'OrigamiSatellite',
  'RisographPress',
  'TidalGreenhouse',
  'BilliardParlor',
  'TempleShadowFair',
  'CyanotypeHarbor',
  'CandyWrapperShop',
  'LaserEngraver',
  'VolcanicSeismograph',
  'VelvetPlanetarium',
  'CircuitKimono',
  'RainTaxiMeter',
  'SundialCourtyard',
  'PorcelainXray',
  'CloudServerFarm',
  'PaperFortress',
  'MirageGasStation',
  'PlatformBroadcast',
  'SilverHalide',
  'NeonRainveil',
  'ThermalPulse',
  'TapeOverwrite',
  'StarEchoAtlas',
  'MetroCircuit',
  'VelvetTransit',
  'HazeBlueprint',
  'AuroraLedger',
  'MonolithPulse',
  'LotusNeon',
  'QuartzForecast',
  'MotelPostcard',
  'SignalLantern',
  'MarbleObservatory',
  'ChromeLotus',
  'NocturneBlueprint',
  'OrchidSwitchboard',
  'CopperMonsoon'
] as const
export const renderJobStatuses = [
  'created',
  'analyzing',
  'rendering',
  'succeeded',
  'failed'
] as const

export const renderJobSteps = [
  'queued',
  'rendering-video',
  'muxing-audio',
  'completed',
  'failed'
] as const

export type AudioFormat = (typeof audioFormats)[number]
export type LyricFormat = (typeof lyricFormats)[number]
export type CoverFormat = (typeof coverFormats)[number]
export type VideoRatio = (typeof videoRatios)[number]
export type RenderQuality = (typeof renderQualities)[number]
export type TemplateId = (typeof templateIds)[number]
export type RenderJobStatus = (typeof renderJobStatuses)[number]
export type RenderJobStep = (typeof renderJobSteps)[number]

export type AssetKind = 'audio' | 'lyrics' | 'cover'
export type StorageProvider = 'local'
export type RenderProvider = 'local'

export type AssetMetadata = {
  id: string
  kind: AssetKind
  filename: string
  format: AudioFormat | LyricFormat | CoverFormat
  mimeType?: string
  sizeBytes: number
  storagePath: string
  createdAt: string
}

export type LyricLine = {
  id: string
  startTime: number
  endTime?: number
  text: string
}

export type LrcParseIssue = {
  lineNumber: number
  content: string
  message: string
}

export type LrcParseResult = {
  lines: LyricLine[]
  issues: LrcParseIssue[]
}

export type AudioAnalysisFrame = {
  time: number
  rms: number
  loudness: number
  bass: number
  mid: number
  treble: number
}

export type AudioAnalysis = {
  duration: number
  bpm?: number
  beats: number[]
  frames: AudioAnalysisFrame[]
  unavailableFields?: Array<'bpm' | 'beats' | 'loudness' | 'frequencyBands'>
}

export type LyricVideoTheme = {
  primaryColor: string
  accentColor: string
  backgroundIntensity: number
  fontFamily: string
}

export type LyricVideoEffect = {
  lyricGlow: number
  pulseIntensity: number
  beatImpact: number
  stageLighting: number
}

export type EditableObjectId =
  | 'title'
  | 'artist'
  | 'lyrics'
  | 'activeLyric'
  | 'cover'
  | 'background'
  | 'spectrum'

export type TemplateLayoutBox = {
  x: number
  y: number
  width: number
  height: number
  scale?: number
  rotation?: number
  opacity?: number
  visible?: boolean
}

export type TemplateTypography = {
  fontFamily?: string
  fontSize?: number
  fontWeight?: number
  lineHeight?: number
  letterSpacing?: number
  color?: string
}

export type TemplateObjectSettings = {
  id: EditableObjectId
  layout?: TemplateLayoutBox
  typography?: TemplateTypography
  style?: Record<string, string | number | boolean>
}

export type TemplateRatioSettings = {
  objects: TemplateObjectSettings[]
}

export type TemplateDefinition = {
  id: string
  name: string
  description?: string
  schemaVersion: '1.0'
  baseTemplateId: TemplateId
  sourceType?: 'custom' | 'built-in-override'
  ratioSettings: Partial<Record<VideoRatio, TemplateRatioSettings>>
  theme?: Partial<LyricVideoTheme>
  effect?: Partial<LyricVideoEffect>
  createdAt: string
  updatedAt: string
  publishedAt?: string
  unpublishedAt?: string
  deletedAt?: string
  archivedAt?: string
}

export type LyricVideoConfig = {
  projectId: string
  ratio: VideoRatio
  renderQuality?: RenderQuality
  templateId: TemplateId
  title?: string
  artist?: string
  artistEnglish?: string
  audioAssetId: string
  audioUrl?: string
  coverAssetId: string
  coverUrl?: string
  lyrics: LyricLine[]
  analysis: AudioAnalysis
  theme: LyricVideoTheme
  effect: LyricVideoEffect
  customTemplate?: TemplateDefinition
}

export type Project = {
  id: string
  title?: string
  artist?: string
  artistEnglish?: string
  assets: AssetMetadata[]
  lyrics: LyricLine[]
  analysis?: AudioAnalysis
  config?: LyricVideoConfig
  storageProvider: StorageProvider
  renderProvider: RenderProvider
  createdAt: string
  updatedAt: string
}

export type RenderJob = {
  id: string
  projectId: string
  config: LyricVideoConfig
  status: RenderJobStatus
  currentStep?: RenderJobStep
  progress: number
  outputPath?: string
  failureReason?: string
  failureCode?: string
  createdAt: string
  queuedAt?: string
  startedAt?: string
  heartbeatAt?: string
  lastProgressAt?: string
  finishedAt?: string
  updatedAt: string
}
