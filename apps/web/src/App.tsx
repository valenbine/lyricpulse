import {
  Activity,
  AudioLines,
  BadgeCheck,
  Clapperboard,
  Download,
  Film,
  Image,
  Loader2,
  Minus,
  Music2,
  Play,
  Plus,
  RotateCcw,
  Save,
  Sparkles,
  Trash2,
  UploadCloud,
  Wand2
} from 'lucide-react'
import {
  Suspense,
  useEffect,
  useId,
  lazy,
  useState,
  type ChangeEvent,
  type ReactNode
} from 'react'
import {
  audioFormats,
  coverFormats,
  filterLyricsByArtistName,
  formatArtistDisplay,
  lyricFormats,
  shiftLyricLineStartTime,
  syncLyricLineTimings,
  type AssetKind,
  type AudioAnalysis,
  type LyricLine,
  type Project,
  type RenderJob,
  type LyricVideoConfig,
  type TemplateDefinition,
  type TemplateId,
  type VideoRatio
} from '@lyricpulse/core'
import {
  analyzeProject,
  createProject,
  createRenderJob,
  deleteProject,
  getProject,
  getRenderJob,
  listTemplates,
  listProjects,
  listRenderJobs,
  updateProjectLyrics,
  uploadAsset
} from './api'
import { Button } from './components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from './components/ui/card'
import { Input } from './components/ui/input'
import { Label } from './components/ui/label'
import { cn } from './lib/utils'
import { buildPreviewConfig } from './features/studio/preview-config'

const RemotionPreview = lazy(() =>
  import('./components/remotion-preview').then((module) => ({
    default: module.RemotionPreview
  }))
)

const AdminPanel = lazy(() => import('./features/admin/admin-panel'))

const StudioEditorPanel = lazy(() => import('./features/studio/editor-panel'))

type UploadState = Record<AssetKind, File | undefined>

type AppPage = 'studio' | 'admin'

const acceptedFormats: Record<AssetKind, readonly string[]> = {
  audio: audioFormats,
  lyrics: lyricFormats,
  cover: coverFormats
}

const acceptedMimeTypes: Record<AssetKind, readonly string[]> = {
  audio: ['audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/flac', 'audio/mp4'],
  lyrics: [],
  cover: ['image/jpeg', 'image/png', 'image/webp']
}

const templateCopy: Record<TemplateId, { label: string; description: string }> =
  {
    PulseCover: {
      label: 'Pulse Cover',
      description: '封面随节拍呼吸，主歌大字突出，适合强副歌。'
    },
    NeonLyric: {
      label: 'Neon Lyric',
      description: '霓虹发光文字和流动渐变，适合电子、流行和夜店氛围。'
    },
    WaveformStage: {
      label: 'Waveform Stage',
      description: '波形舞台、封面虚化背景和歌词推进，适合叙事型歌曲。'
    },
    PulseDashboard: {
      label: 'Pulse Dashboard',
      description: '暗黑玻璃拟态、三行歌词聚焦和底部频谱，适合科技感展示。'
    },
    HeroSplit: {
      label: '首屏分栏',
      description: '首屏分栏视觉，左侧歌名和歌词，右半边使用封面图片作背景。'
    },
    LyricsCloud: {
      label: '歌词云散落',
      description: '歌词以稳定随机的位置、大小和角度散落，当前句突出显示。'
    },
    ScatterPoster: {
      label: '散点海报',
      description: '大字歌词像海报碎片随机铺开，当前句在中央高亮跳动。'
    },
    OrbitWords: {
      label: '轨道字群',
      description: '描边歌词围绕中心漂浮，形成星轨般的随机文字场。'
    },
    CutoutRansom: {
      label: '剪报拼贴',
      description: '纸片质感歌词随机错落，像手工剪报拼出的副歌版面。'
    },
    NeonGraffiti: {
      label: '霓虹涂鸦',
      description: '高饱和霓虹文字斜向散布，适合说唱、电子和夜色氛围。'
    },
    MagneticPoetry: {
      label: '冰箱诗磁贴',
      description: '歌词像磁贴一样散落排列，主句以贴纸块强烈突出。'
    },
    BrokenKaraoke: {
      label: '断裂 K 歌屏',
      description: '扫描线和碎片歌词制造失真卡拉 OK 视觉，当前句靠下爆发。'
    },
    StarfieldWhispers: {
      label: '星野低语',
      description: '细描边歌词像星尘散在画面里，当前句保持清晰聚焦。'
    },
    PolaroidStorm: {
      label: '拍立得风暴',
      description: '暖色相纸质感和随机文字块混合，适合旅行感和回忆感歌曲。'
    },
    InkSplashWords: {
      label: '墨迹字浪',
      description: '浅色纸面上文字被墨迹牵引散开，主句有手写拼贴感。'
    },
    TerminalScatter: {
      label: '终端散码',
      description: '歌词以命令行碎片随机出现，适合赛博、电子和实验风格。'
    },
    VelvetMargins: {
      label: '丝绒边注',
      description: '深色丝绒背景配霓虹歌词边注，右侧主句形成舞台聚焦。'
    },
    PrismDrift: {
      label: '棱镜漂字',
      description: '描边歌词在棱镜色背景里漂移，形成冷感电子海报。'
    },
    StickerBombLyrics: {
      label: '贴纸轰炸',
      description: '大量歌词贴纸覆盖画面，当前句像主贴纸一样弹出。'
    },
    BlueprintAnnotations: {
      label: '蓝图批注',
      description: '工程网格和虚线标注式歌词，适合理性、科技和器乐氛围。'
    },
    RadioStaticText: {
      label: '电台噪文字',
      description: '绿色终端字和静电纹理叠加，像被电台信号打散的歌词。'
    },
    GlassMosaicWords: {
      label: '玻璃马赛克',
      description: '歌词块漂在玻璃反光背景上，右侧主句和封面形成冷艳层次。'
    },
    CarnivalSigns: {
      label: '嘉年华招牌',
      description: '彩色招牌式歌词随机排列，适合活泼、热闹和强节奏歌曲。'
    },
    ShadowTypeCollage: {
      label: '暗影字拼贴',
      description: '深灰文字拼贴制造重影和压迫感，左侧主句强势展开。'
    },
    HeatmapLyrics: {
      label: '热力歌词图',
      description: '暖色热力背景和发光文字叠加，副歌在底部区域爆亮。'
    },
    NewspaperRain: {
      label: '报纸字雨',
      description: '报纸纹理上的歌词像标题雨落下，主句保持头版标题感。'
    },
    VinylEditorial: {
      label: '黑胶杂志',
      description: '黑胶唱片、杂志版式和大标题排版，适合复古流行与氛围歌。'
    },
    CinemaBeam: {
      label: '影院光束',
      description: '电影海报式光束、字幕感歌词和宽幅构图，适合叙事与抒情歌曲。'
    },
    GlassTurntable: {
      label: '玻璃唱机',
      description: '玻璃唱片机、柔和反射和中央封面，适合精致流行与轻电子。'
    },
    AuroraRibbon: {
      label: '极光丝带',
      description: '流动极光丝带、悬浮封面和发光歌词，适合梦幻流行与电子。'
    },
    InkScroll: {
      label: '水墨卷轴',
      description: '宣纸质感、水墨晕染和纵向歌词，适合国风、民谣和抒情。'
    },
    MetroPoster: {
      label: '地铁海报',
      description: '强网格排版、站牌编号和海报封面，适合独立流行与城市感歌曲。'
    },
    MoonRing: {
      label: '月环幻境',
      description: '月相环绕、柔光封面和静谧歌词，适合夜晚、慢歌和氛围音乐。'
    },
    PrismGrid: {
      label: '棱镜网格',
      description: '彩色棱镜、数字网格和高能歌词，适合电子、说唱和快节奏歌曲。'
    },
    CassetteDream: {
      label: '磁带梦境',
      description: '复古磁带、暖色颗粒和手写感歌词，适合怀旧与 Lo-Fi。'
    },
    MinimalHalo: {
      label: '极简光环',
      description: '留白构图、细线光环和高级文字排版，适合清爽、干净的歌曲。'
    },
    CitySkyline: {
      label: '城市天际线',
      description: '夜景天际线、灯光节拍和街头歌词，适合都市、R&B 和说唱。'
    },
    PaperCutStage: {
      label: '剪纸舞台',
      description: '层叠剪纸、舞台聚光和鲜明色块，适合活泼流行与节奏歌。'
    },
    GalaxyKaraoke: {
      label: '星河 KTV',
      description: '星河背景、卡拉 OK 字幕条和闪光进度，适合合唱与副歌导向歌曲。'
    },
    TypewriterNoir: {
      label: '黑色打字机',
      description: '黑白报纸、打字机光标和胶片颗粒，适合独白、民谣和叙事。'
    },
    LiquidChrome: {
      label: '液态铬镜',
      description: '金属液滴、反光封面和镜面歌词，适合前卫电子与高级流行。'
    },
    BotanicalVinyl: {
      label: '植物唱片',
      description: '叶片环绕、自然纸感和温柔唱片，适合治愈、轻民谣和清新歌曲。'
    },
    OrigamiCinema: {
      label: '折纸影院',
      description: '折纸光影、剧场幕布和立体封面，适合电影感和幻想主题。'
    },
    BlueprintWave: {
      label: '蓝图波形',
      description: '工程蓝图、测量线和精密波形，适合科技、实验和器乐。'
    },
    SunrisePolaroid: {
      label: '日出拍立得',
      description: '暖色日出、拍立得相纸和旅行感歌词，适合甜歌与公路音乐。'
    },
    CyberTerminal: {
      label: '赛博终端',
      description: '终端扫描、代码网格和故障发光，适合赛博、摇滚和说唱。'
    },
    DesertMirage: {
      label: '沙漠幻境',
      description: '沙丘渐变、热浪折射和远景封面，适合空灵、异域和氛围歌。'
    },
    RainyWindow: {
      label: '雨窗夜色',
      description: '雨滴玻璃、霓虹倒影和私密歌词，适合失恋、夜晚和 R&B。'
    },
    ComicPop: {
      label: '漫画波普',
      description: '漫画网点、爆炸贴纸和强对比字幕，适合活泼、朋克和快歌。'
    },
    VaporwaveMall: {
      label: '蒸汽波商场',
      description: '粉紫渐变、复古商场雕塑和水平网格，适合复古电子与梦核。'
    },
    BauhausBlocks: {
      label: '包豪斯积木',
      description: '红黄蓝几何、理性网格和大胆排版，适合艺术流行和独立音乐。'
    },
    DarkAcademia: {
      label: '暗黑学院',
      description: '古典书页、烛光暗角和学院派字体，适合低沉叙事和民谣。'
    },
    Y2KSticker: {
      label: 'Y2K 贴纸',
      description: '亮面贴纸、银色泡泡和千禧年图形，适合甜酷流行。'
    },
    RetroGameHUD: {
      label: '复古游戏 HUD',
      description: '像素框、能量槽和街机界面，适合 8-bit、摇滚和快节奏。'
    },
    DeepSeaSonar: {
      label: '海底声呐',
      description: '深海光束、声呐圆环和漂浮歌词，适合氛围、器乐和空灵人声。'
    },
    AlpineMinimal: {
      label: '雪山极简',
      description: '冷白雪峰、极简留白和干净字幕，适合清澈、安静的歌。'
    },
    CyberKabuki: {
      label: '赛博歌舞伎',
      description: '红黑舞台、面具轮廓和霓虹日式构图，适合戏剧感强的歌曲。'
    },
    FilmContactSheet: {
      label: '胶片接触印相',
      description: '多格底片、编号标尺和摄影暗房质感，适合纪实和怀旧。'
    },
    AeroInstrument: {
      label: '航空仪表',
      description: '飞行仪表、方位刻度和驾驶舱 HUD，适合公路、电子和速度感。'
    },
    GeologicRings: {
      label: '地质年轮',
      description: '岩层年轮、等高线和大地色视觉，适合实验、自然和器乐。'
    },
    VelvetCurtain: {
      label: '绸缎幕布',
      description: '丝绒剧幕、金色边框和舞台字幕，适合爵士、情歌和现场感。'
    },
    NeonConvenience: {
      label: '霓虹便利店',
      description: '夜店招牌、便利店灯箱和城市孤独感，适合夜晚流行与 R&B。'
    },
    StarChartVoyage: {
      label: '星图航海',
      description: '航海星图、连线星座和复古罗盘，适合史诗、幻想和旅行。'
    },
    LowPolyIsland: {
      label: '低多边形岛屿',
      description: '低模岛屿、几何海面和明亮层次，适合轻快、夏日和游戏感。'
    },
    RetroTVScanline: {
      label: '复古电视',
      description: 'CRT 扫描线、弯曲屏幕和频道字幕，适合怀旧、Lo-Fi 和摇滚。'
    },
    CrystalCave: {
      label: '晶体洞穴',
      description: '发光晶簇、折射光束和洞穴纵深，适合梦幻、电子和空灵。'
    },
    SportsJersey: {
      label: '运动球衣',
      description: '球衣号码、赛场灯光和冠军海报，适合热血、说唱和励志。'
    },
    FireworkMarket: {
      label: '烟火夜市',
      description: '夜市灯笼、烟火粒子和热闹字幕，适合节庆、华语流行和合唱。'
    },
    NoiseLab: {
      label: '实验噪声',
      description: '模拟噪声、示波器故障和抽象版式，适合实验电子和先锋音乐。'
    },
    MuseumLightbox: {
      label: '博物馆灯箱',
      description: '展厅灯箱、作品说明牌和静默光束，适合艺术歌、古典和高级叙事。'
    },
    ShadowPuppet: {
      label: '皮影纸剧场',
      description: '半透明幕布、剪影人物和暖纸质感，适合民乐、故事和戏剧感。'
    },
    SolarGreenhouse: {
      label: '太阳朋克温室',
      description: '温室玻璃、藤蔓光斑和生态未来感，适合轻快治愈与新民谣。'
    },
    MonochromeRunway: {
      label: '黑白秀场',
      description: '高反差时装秀、聚光走道和冷感排版，适合酷感流行。'
    },
    BrassClockwork: {
      label: '黄铜钟表',
      description: '齿轮刻度、黄铜光泽和机械节拍，适合复古、爵士和复杂编曲。'
    },
    LavaLamp: {
      label: '熔岩灯',
      description: '慢速液泡、70 年代暖色和迷幻歌词，适合迷幻摇滚与慢电子。'
    },
    TarotCard: {
      label: '塔罗牌',
      description: '神秘牌面、金色符号和仪式感构图，适合暗色流行与幻想主题。'
    },
    GraffitiWall: {
      label: '街头涂鸦',
      description: '喷漆墙面、手写标签和街头动势，适合 hip-hop、朋克和强节奏。'
    },
    ZenGarden: {
      label: '枯山水',
      description: '砂纹、石阵和留白歌词，适合冥想、器乐和极简氛围。'
    },
    ClayPoster: {
      label: '黏土海报',
      description: '软陶形状、手工阴影和温柔色块，适合可爱流行与儿童感。'
    },
    HologramIdol: {
      label: '全息偶像',
      description: '虚拟舞台、全息光栅和偶像应援色，适合二次元、偶像和电子。'
    },
    NeuralConstellation: {
      label: '神经星图',
      description: '神经网络、星点脉冲和智能感连线，适合科技、AI 和实验电子。'
    },
    BaroqueFrame: {
      label: '巴洛克金框',
      description: '繁复金框、暗色油画和宫廷排版，适合华丽、古典和戏剧化作品。'
    },
    SwissGrid: {
      label: '瑞士网格',
      description: '现代主义网格、极准对齐和信息海报感，适合设计感流行。'
    },
    CandyGlass: {
      label: '糖果玻璃',
      description: '半透明糖果材质、柔彩折射和甜亮视觉，适合甜歌和少女流行。'
    },
    RosePostcard: {
      label: '玫瑰明信片',
      description: '暖粉情书纸面、玫瑰邮戳和轻心形漂浮，适合甜歌、告白和恋爱主题。'
    },
    IndustrialFurnace: {
      label: '工业熔炉',
      description: '钢铁结构、火花和热浪光，适合金属、摇滚和重节奏。'
    },
    JellyfishGarden: {
      label: '水母花园',
      description: '水母触须、蓝紫漂浮和深海柔光，适合空灵、电音和慢歌。'
    },
    RadioTower: {
      label: '无线电塔',
      description: '电波扩散、信号塔和夜空噪点，适合独白、电台感和怀旧。'
    },
    CloudAtlas: {
      label: '云图',
      description: '气象云层、等压线和柔和天空，适合辽阔、治愈和旅行歌。'
    },
    RedSealPrint: {
      label: '红章拓印',
      description: '朱砂印章、拓印肌理和东方留白，适合国风、诗意和人声独唱。'
    },
    KineticPoster: { label: '动感字体', description: '巨型字母、节拍位移和强海报张力，适合快歌和流行主打。' },
    NordicNight: { label: '北欧极夜', description: '雪山剪影、冷蓝夜空和极地静谧，适合空灵慢歌。' },
    MemphisConfetti: { label: '孟菲斯纸屑', description: '几何纸屑、复古糖果色和跳跃构图，适合轻快流行。' },
    CircuitGarden: { label: '电路花园', description: '绿色电路、植物脉络和科技自然混合，适合电子和新民谣。' },
    OceanBlueprint: { label: '海洋蓝图', description: '深蓝工程线、海图框和精密标注，适合器乐和实验歌。' },
    VelourClub: { label: '绒绳俱乐部', description: '绒面绳索、夜店暗粉和私密舞台感，适合 R&B。' },
    MountainCabin: { label: '山间木屋', description: '木纹墙面、暖灯和民谣小屋氛围，适合吉他与温暖人声。' },
    NewspaperCollage: { label: '报纸拼贴', description: '剪报块面、灰阶纸张和编辑部感，适合叙事和独白。' },
    LaserWarehouse: { label: '激光仓库', description: '仓库光束、锐利扫描和高能舞台，适合电子、说唱和摇滚。' },
    PorcelainDiary: { label: '瓷器日记', description: '青白瓷圆纹、安静手记感和清透留白，适合细腻抒情。' },
    MatchboxPop: { label: '火柴盒流行', description: '小盒包装、橙红冲击和复古商品海报感，适合短视频副歌。' },
    AstroDome: { label: '天文穹顶', description: '穹顶夜空、星象光晕和圆形封面，适合宏大氛围。' },
    StainedChoir: { label: '彩窗合唱', description: '彩色玻璃、教堂光和合唱层次，适合华丽人声。' },
    WindTunnel: { label: '风洞', description: '流线框、空气动力线和清爽蓝白，适合轻电子和器乐。' },
    FossilArchive: { label: '化石档案', description: '岩层圆纹、档案棕色和博物馆采样感，适合低沉叙事。' },
    MarbleLobby: { label: '大理石大堂', description: '冷白大理石、金属线和高级空间感，适合精致流行。' },
    PaperLanternLake: { label: '纸灯湖面', description: '橙色灯笼、水面夜色和漂浮颗粒，适合温柔夜歌。' },
    ChromeDiner: { label: '铬色餐车', description: '粉铬反光、复古餐车和霓虹边缘，适合复古舞曲。' },
    TextileLoom: { label: '纺织织机', description: '织物经纬、暖棕纹理和手工秩序，适合民谣与世界音乐。' },
    SatelliteWeather: { label: '卫星天气', description: '卫星云图、灰蓝仪表和气象观测感，适合氛围电子。' },
    LibraryCard: { label: '图书卡片', description: '借书卡、纸张拼贴和安静排版，适合校园、民谣和叙事。' },
    SnowglobeMemory: { label: '雪球记忆', description: '玻璃球、雪点和清冷回忆感，适合冬日慢歌。' },
    CarnivalTicket: { label: '嘉年华票根', description: '票券红黄、游乐场印刷和欢快节奏，适合热闹流行。' },
    BrutalistAtrium: { label: '粗野中庭', description: '混凝土块、硬边结构和冷灰空间，适合另类摇滚。' },
    PixelCafe: { label: '像素咖啡', description: '像素色块、咖啡暖棕和小游戏 UI 感，适合 Lo-Fi。' },
    GoldenWheat: { label: '金色麦田', description: '麦浪、金黄光和乡野辽阔感，适合民谣与公路歌。' },
    MicrochipBloom: { label: '微芯花序', description: '芯片线条、绿色荧光和花序结构，适合科技电子。' },
    UnderwaterMetro: { label: '海底地铁', description: '水下蓝绿、站台线框和深海通勤感，适合城市氛围。' },
    DragonDancePoster: { label: '舞龙海报', description: '红金海报字、节庆动势和东方冲击力，适合国潮快歌。' },
    PearlOpera: { label: '珍珠歌剧', description: '珍珠粉紫、剧院绒光和圆形舞台，适合华丽女声。' },
    KiteFestival: { label: '风筝节', description: '天空风筝、彩色纸片和轻盈移动，适合明亮治愈歌。' },
    RainforestCanopy: { label: '雨林冠层', description: '树冠绿光、藤蔓电路和自然低频，适合灵性与世界音乐。' },
    DesertObservatory: { label: '沙漠天文台', description: '沙漠夜空、望远镜感构图和暖星光，适合辽阔慢歌。' },
    CandleChapel: { label: '烛光礼拜堂', description: '烛火暖光、暗木空间和静默仪式感，适合人声独唱。' },
    GlassElevator: { label: '玻璃电梯', description: '透明竖线、蓝色升降感和现代空间，适合未来流行。' },
    MonsoonMarket: { label: '季风市场', description: '湿润夜市、绿色灯牌和雨季热闹感，适合律动歌曲。' },
    PolarExpedition: { label: '极地科考', description: '白灰科考站、冷色网格和纪录片气质，适合冷静叙事。' },
    SakuraTram: { label: '樱花电车', description: '粉色花瓣、蓝天电车和青春感，适合日系与甜歌。' },
    MoonPress: { label: '月面报纸', description: '灰白剪报、月面颗粒和夜间新闻感，适合独立音乐。' },
    VelvetAquarium: { label: '绒面水族馆', description: '蓝绿水族箱、绒面暗光和柔软漂浮，适合梦幻电子。' },
    QuartzDial: { label: '石英钟面', description: '钟面圆纹、石英冷灰和精准节拍，适合精密编曲。' },
    SaffronKitchen: { label: '藏红花厨房', description: '香料橙、厨房木纹和烟火暖意，适合生活感歌曲。' },
    PaperPlaneTerminal: { label: '纸飞机航站楼', description: '航站蓝图、纸飞机路径和旅行出发感，适合公路与青春歌。' },
    StaticMagazine: { label: '静电杂志', description: '黑白杂志、静电噪声和硬切拼贴，适合另类与独立。' },
    PrismOrchestra: { label: '棱镜管弦', description: '紫色激光、交响光束和宏大层次，适合史诗流行。' },
    CopperCircuit: { label: '铜线电路', description: '铜色线路、暗底发光和模拟电子感，适合复古合成器。' },
    FountainPlaza: { label: '喷泉广场', description: '蓝白水纹、广场圆环和清亮反射，适合轻快器乐。' },
    SynthVelvet: { label: '合成器绒光', description: '紫色绒面、合成器光束和夜间舞台，适合 synth-pop。' },
    CoralMicroscope: { label: '珊瑚显微镜', description: '珊瑚粉绿、微观线条和生物科技感，适合实验流行。' },
    MidnightBilliards: { label: '午夜台球', description: '深绿台呢、圆形球感和夜店冷光，适合律动与爵士感。' },
    MicroscopeSlide: { label: '显微标本', description: '微生物切片、实验网格和荧光细胞，适合实验流行与氛围电子。' },
    BoardingPass: { label: '登机牌', description: '机场票据、条码线和登机信息感，适合旅行、公路和青春歌。' },
    EvidenceDossier: { label: '法庭卷宗', description: '档案纸、案件印章和证物标签，适合悬疑叙事与低沉独白。' },
    WeatherRadar: { label: '天气雷达', description: '气象雷达、降雨色块和扫描扇面，适合电子、氛围和律动歌曲。' },
    ArchitectSection: { label: '建筑剖面', description: '建筑剖面线、柱网结构和工程纸面，适合冷静、理性和器乐。' },
    ChefMenu: { label: '主厨菜单', description: '菜单纸、餐厅边框和生活烟火感，适合温暖流行与轻民谣。' },
    ExplodedManual: { label: '机械说明书', description: '爆炸图、标注连线和蓝色说明书，适合科技、摇滚和实验音乐。' },
    NightRadioDial: { label: '夜间电台旋钮', description: '收音机刻度、指针摆动和午夜广播感，适合独白、R&B 和复古歌。' },
    EmbroideryHoop: { label: '刺绣圆框', description: '绣绷、针线花纹和手作质感，适合温柔、民谣和治愈歌曲。' },
    CalendarMinimal: { label: '极简日历', description: '月历网格、红黑日期和办公纸面，适合干净、叙事和日常感歌曲。' },
    ThermalReceipt: { label: '热敏小票', description: '小票纸、条码纹和消费记录感，适合城市叙事、Lo-Fi 和生活切片。' },
    XrayCassette: { label: 'X 光卡匣', description: '冷青 X 光、骨架光栅和医学胶片感，适合暗色电子和实验人声。' },
    PlanetariumConsole: { label: '天象仪控制台', description: '穹顶星轨、控制台刻度和紫色星图，适合宏大氛围与幻想主题。' },
    SubmarineScope: { label: '潜艇声呐镜', description: '潜艇雷达、扫描线和深海绿蓝，适合低频、悬疑和冷静叙事。' },
    ScrapbookDesk: { label: '手账桌面', description: '贴纸纸片、胶带横线和手作拼贴，适合青春、旅行和温柔流行。' },
    SignalTower: { label: '信号塔', description: '塔身电波、同心信号和午夜广播，适合独白、电台感和复古合成器。' },
    TopographicSandbox: { label: '沙盘等高线', description: '沙盘地形、等高线和暖黄地貌，适合公路、民谣和自然叙事。' },
    AstralCompass: { label: '星象罗盘', description: '罗盘方位、星象圆盘和仪式光，适合史诗、幻想和抒情慢歌。' },
    DepartureFlipboard: { label: '航站翻牌', description: '机场翻牌屏、机械字母和出发信息感，适合离别、旅行和都市歌。' },
    PlatformBroadcast: { label: '月台广播', description: '站台播报屏、时间编码和秩序翻牌感，适合叙事流行、旅行和怀旧主题。' },
    SilverHalide: { label: '显影相纸', description: '相纸留白、暗房显影和胶片温度，适合回忆、抒情和青春感歌曲。' },
    NeonRainveil: { label: '霓虹雨幕', description: '雨丝玻璃、霓虹反射和夜色拖影，适合 R&B、夜行流行和都市情歌。' },
    ThermalPulse: { label: '热成像心跳', description: '热力图、心跳波和能量热点，适合电子、摇滚和爆发型副歌。' },
    TapeOverwrite: { label: '磁带复写', description: '卡带标签、走带时间码和复录痕迹，适合复古流行、校园与青春主题。' },
    StarEchoAtlas: { label: '星图回声', description: '星图轨迹、冷光星点和静谧深空，适合梦幻流行、空灵人声和夜空系抒情。' },
    MetroCircuit: { label: '地铁电路', description: '线路图、电路光轨和换乘节点感，适合都市电子、疾走节拍和夜行叙事。' },
    VelvetTransit: { label: '丝绒列车厢', description: '列车拱窗、丝绒暖光和夜间旅途感，适合抒情流行、爵士和慢速叙事。' },
    HazeBlueprint: { label: '雾蓝制图', description: '雾化蓝图、漂移线稿和冷静工程气质，适合器乐、独立和理性电子。' },
    AuroraLedger: { label: '极光账页', description: '账页纵线、极光流带和清亮留白，适合清新流行、女声和轻电子。' },
    MonolithPulse: { label: '巨碑脉冲', description: '竖向碑体、深色能量柱和强拍震动，适合摇滚、史诗电子和重鼓点。' },
    LotusNeon: { label: '霓虹莲台', description: '莲瓣霓虹、中心光核和东方未来感，适合梦幻电子、国潮流行和空灵人声。' },
    QuartzForecast: { label: '石英预报', description: '石英圆盘、扫描扇面和天气仪表感，适合冷感流行、电子律动和科技主题。' },
    MotelPostcard: { label: '汽旅明信片', description: '明信片纸面、旅行贴片和公路停驻感，适合青春歌、公路民谣和怀旧流行。' },
    SignalLantern: { label: '信号灯笼', description: '悬挂灯笼、信号脉冲和夜市灯海，适合国风流行、节庆氛围和温暖叙事。' },
    MarbleObservatory: { label: '大理石观象台', description: '石质圆盘、轨道刻环和静谧观测感，适合器乐、空灵慢歌和史诗抒情。' },
    ChromeLotus: { label: '铬光莲镜', description: '金属莲瓣、镜面波纹和冷感高光，适合未来流行、R&B 和梦核电子。' },
    NocturneBlueprint: { label: '夜曲蓝图', description: '深夜蓝图、斜向光束和建筑草案感，适合独立摇滚、暗色流行和夜行主题。' },
    OrchidSwitchboard: { label: '兰影接线台', description: '接线孔、紫色线缆和舞台控制台感，适合电子、人声实验和氛围作品。' },
    CopperMonsoon: { label: '铜色季风', description: '铜雨线、暖云热浪和潮湿夜色，适合都市情歌、Lo-Fi 和雨夜 R&B。' },
    BotanicalBlueprint: { label: '植物蓝图', description: '蓝图网格、植物叶脉和生态工程感，适合自然、科技与轻电子。' },
    NeonPawnshop: { label: '霓虹当铺', description: '椭圆霓虹招牌、紫粉夜色和街角店铺感，适合 R&B、夜歌和复古舞曲。' },
    FilmBurn: { label: '胶片灼烧', description: '胶片孔、橙色漏光和烧片质感，适合怀旧、摇滚和情绪爆发。' },
    VelvetRope: { label: '绒绳门厅', description: '金色绒绳、立柱和高级门厅氛围，适合爵士、R&B 和现场感。' },
    DataRain: { label: '数据雨墙', description: '垂直代码雨、绿色荧光和暗网格，适合科技、赛博和电子律动。' },
    CeramicKiln: { label: '陶瓷窑火', description: '窑火热浪、陶土色和手工烧制感，适合温暖人声与民谣。' },
    PaperTheater: { label: '纸雕剧场', description: '多层纸景、剪影山形和手工舞台，适合故事歌、童话和民乐。' },
    ArcadeCartridge: { label: '街机卡带', description: '游戏卡带、荧光槽位和复古硬件感，适合 chiptune、说唱和快歌。' },
    GlacierCore: { label: '冰川岩芯', description: '冰裂纹、冷蓝剖面和极地样本感，适合空灵慢歌与冷感叙事。' },
    ObservatoryNotebook: { label: '观测笔记', description: '观星笔记、手绘圆轨和横线纸，适合独立、校园和夜间民谣。' },
    CircuitCathedral: { label: '电路教堂', description: '尖拱窗、电路纹和紫色圣堂光，适合宏大电子和戏剧化作品。' },
    ForensicDarkroom: { label: '法医暗房', description: '暗红证物章、冲洗光斑和案件暗房感，适合悬疑叙事、低沉独白和暗色摇滚。' },
    InsectCabinet: { label: '昆虫标本柜', description: '标本盒、荧光甲虫和自然档案网格，适合实验流行、自然氛围和怪诞电子。' },
    MineElevator: { label: '矿井升降机', description: '金属笼、竖向矿道和低频震动，适合工业摇滚、说唱和压迫感歌曲。' },
    OrigamiSatellite: { label: '折纸卫星', description: '纸面卫星、紫色轨道和轻盈折线，适合未来流行、梦幻电子和青春歌。' },
    RisographPress: { label: '孔版印刷机', description: '红蓝黄错版、油墨网纹和独立海报质感，适合另类、车库和复古流行。' },
    TidalGreenhouse: { label: '潮汐温室', description: '温室竖梁、潮线波纹和蓝绿植物，适合灵性人声、自然电子和疗愈慢歌。' },
    BilliardParlor: { label: '台球会馆', description: '深绿台呢、球体跳动和木质边框，适合爵士律动、R&B 和夜店叙事。' },
    TempleShadowFair: { label: '庙会皮影', description: '灯笼、剪影山形和暖橙夜市，适合国风、民乐融合和故事型歌曲。' },
    CyanotypeHarbor: { label: '蓝晒海港', description: '蓝晒纸、船帆线稿和港口波纹，适合海风民谣、公路和清冷独立。' },
    CandyWrapperShop: { label: '糖纸商店', description: '糖纸条纹、粉黄包装和甜感商品陈列，适合甜歌、J-pop 和轻快副歌。' },
    LaserEngraver: { label: '激光雕刻机', description: '青色切割光、扫描圆环和工业刻线，适合电子、科技感说唱和快节奏作品。' },
    VolcanicSeismograph: { label: '火山地震仪', description: '橙色震波、记录纸和熔岩暗底，适合爆发型摇滚、史诗电子和强鼓点。' },
    VelvetPlanetarium: { label: '绒面天文馆', description: '紫色绒光、星点穹顶和双线圆轨，适合梦幻慢歌、宏大人声和氛围电子。' },
    CircuitKimono: { label: '电路和服', description: '和服轮廓、电路线和粉紫织纹，适合国潮电子、未来感人声和精致流行。' },
    RainTaxiMeter: { label: '雨夜计价器', description: '雨线车窗、黄色计价数字和城市夜行，适合都市 R&B、独白和雨夜情歌。' },
    SundialCourtyard: { label: '日晷庭院', description: '日晷刻度、暖石庭院和慢速指针，适合古典融合、民谣和时间主题歌曲。' },
    PorcelainXray: { label: '瓷器 X 光', description: '青白瓷圆纹、X 光透视和冷蓝器物感，适合空灵女声、实验流行和冷感叙事。' },
    CloudServerFarm: { label: '云端机房', description: '服务器机柜、蓝色云雾和数据中心光，适合科技电子、AI 主题和未来流行。' },
    PaperFortress: { label: '纸堡垒', description: '纸面城墙、暖黄剪影和童话防线，适合故事歌、童声感作品和治愈民谣。' },
    MirageGasStation: { label: '海市蜃楼加油站', description: '沙漠霓虹、热浪弧线和公路加油站，适合公路摇滚、复古电子和夏夜歌。' }
  }

const themePresets = [
  { name: 'Cinema Lime', primary: '#F8FAFC', accent: '#A3E635' },
  { name: 'Ultra Violet', primary: '#FFFFFF', accent: '#7C3AED' },
  { name: 'Hot Signal', primary: '#FFF7ED', accent: '#F97316' }
]

const previewFontStack =
  'Noto Sans CJK SC, Noto Sans SC, PingFang SC, Microsoft YaHei, sans-serif'
const defaultStageLighting = 0.75
const defaultSongTitle = '歌曲名字'
const defaultArtistName = '歌手名字'
const defaultArtistEnglishName = '英文名'
const previewFallbackCoverUrl =
  'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1200&q=80'
const previewFallbackAnalysis: AudioAnalysis = {
  duration: 9,
  bpm: 120,
  beats: [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5.5, 6],
  frames: Array.from({ length: 90 }, (_, index) => {
    const pulse = (Math.sin(index / 4) + 1) / 2

    return {
      time: index / 10,
      rms: 0.3 + pulse * 0.5,
      loudness: -22 + pulse * 8,
      bass: 0.35 + pulse * 0.55,
      mid: 0.3 + pulse * 0.4,
      treble: 0.2 + pulse * 0.5
    }
  })
}

function getCurrentPage(): AppPage {
  return window.location.pathname === '/admin' ? 'admin' : 'studio'
}

export function App() {
  const [page, setPage] = useState<AppPage>(() => getCurrentPage())
  const [title, setTitle] = useState(defaultSongTitle)
  const [artist, setArtist] = useState(defaultArtistName)
  const [artistEnglish, setArtistEnglish] = useState(defaultArtistEnglishName)
  const [uploads, setUploads] = useState<UploadState>({
    audio: undefined,
    lyrics: undefined,
    cover: undefined
  })
  const [project, setProject] = useState<Project | undefined>()
  const [projectHistory, setProjectHistory] = useState<Project[]>([])
  const [templateId, setTemplateId] = useState<TemplateId>('NeonLyric')
  const [ratio, setRatio] = useState<VideoRatio>('9:16')
  const [themeIndex, setThemeIndex] = useState(0)
  const [stageLighting, setStageLighting] = useState(defaultStageLighting)
  const [status, setStatus] = useState('准备生成音乐响应式歌词视频。')
  const [renderJob, setRenderJob] = useState<RenderJob | undefined>()
  const [renderHistory, setRenderHistory] = useState<RenderJob[]>([])
  const [customTemplates, setCustomTemplates] = useState<TemplateDefinition[]>([])
  const [selectedCustomTemplateId, setSelectedCustomTemplateId] = useState<string | undefined>()
  const [isRendering, setIsRendering] = useState(false)
  const [isSavingLyrics, setIsSavingLyrics] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [deletingProjectId, setDeletingProjectId] = useState<string | undefined>()
  const [lyricDraft, setLyricDraft] = useState<LyricLine[] | undefined>()
  const [error, setError] = useState<string | undefined>()

  useEffect(() => {
    function handleNavigation() {
      setPage(getCurrentPage())
    }

    window.addEventListener('popstate', handleNavigation)

    return () => {
      window.removeEventListener('popstate', handleNavigation)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadHistory() {
      try {
        const { projects } = await listProjects()

        if (!cancelled) {
          setProjectHistory(projects)
        }
      } catch {
        if (!cancelled) {
          setProjectHistory([])
        }
      }
    }

    const timeoutId = window.setTimeout(() => {
      void loadHistory()
    }, 600)

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadTemplates() {
      try {
        const { templates } = await listTemplates()

        if (!cancelled) {
          setCustomTemplates(templates)
        }
      } catch {
        if (!cancelled) {
          setCustomTemplates([])
        }
      }
    }

    void loadTemplates()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadRenderHistory() {
      if (!project) {
        setRenderHistory([])
        return
      }

      try {
        const { jobs } = await listRenderJobs(project.id)

        if (!cancelled) {
          setRenderHistory(jobs)
          setRenderJob((currentJob) =>
            currentJob?.projectId === project.id
              ? currentJob
              : (jobs.find(isActiveRenderJob) ??
                jobs.find((job) => job.status === 'succeeded'))
          )
        }
      } catch {
        if (!cancelled) {
          setRenderHistory([])
        }
      }
    }

    void loadRenderHistory()

    return () => {
      cancelled = true
    }
  }, [project])

  const canUpload = Boolean(uploads.audio && uploads.lyrics && uploads.cover)
  const selectedTheme = themePresets[themeIndex]
  const effectiveArtist = project?.artist ?? toOptionalInputValue(artist, defaultArtistName)
  const effectiveArtistEnglish =
    project?.artistEnglish ??
    toOptionalInputValue(artistEnglish, defaultArtistEnglishName)
  const displayArtist = formatArtistDisplay(effectiveArtist, effectiveArtistEnglish)
  const projectLyricsSource = lyricDraft ?? project?.lyrics
  const filteredProjectLyrics = projectLyricsSource
    ? filterLyricsByArtistName(projectLyricsSource, effectiveArtist)
    : undefined
  const lyrics = project ? filteredProjectLyrics ?? [] : sampleLyrics
  const timelineLyrics = project ? projectLyricsSource ?? [] : sampleLyrics
  const hasLyricDraft = Boolean(project && lyricDraft)
  const renderReadiness = getRenderReadiness(project)
  const selectedCustomTemplate = customTemplates.find(
    (template) => template.id === selectedCustomTemplateId
  )
  const previewConfig = buildPreviewConfig({
    project,
    projectLyricsSource,
    ratio,
    templateId,
    title,
    artist: effectiveArtist,
    artistEnglish: effectiveArtistEnglish,
    theme: selectedTheme,
    stageLighting,
    sampleLyrics,
    previewFallbackCoverUrl,
    previewFallbackAnalysis,
    previewFontStack,
    selectedCustomTemplate
  })

  async function handleCreateStudioProject() {
    if (!canUpload || isUploading) {
      return
    }

    setIsUploading(true)
    setError(undefined)
    setStatus('正在创建项目并上传素材...')

    try {
      setLyricDraft(undefined)
      const created = await createProject({
        title: toOptionalInputValue(title, defaultSongTitle) ?? '',
        artist: effectiveArtist ?? '',
        artistEnglish: effectiveArtistEnglish
      })
      let nextProject = created.project

      for (const kind of ['audio', 'lyrics', 'cover'] as const) {
        const file = uploads[kind]

        if (!file) {
          continue
        }

        const result = await uploadAsset(nextProject.id, kind, file)
        nextProject = result.project
        setProject(nextProject)
      }

      setStatus('正在分析音频节奏和响度...')
      const analyzed = await analyzeProject(nextProject.id)
      setProject(analyzed.project)
      setProjectHistory((items) =>
        upsertProjectHistory(items, analyzed.project)
      )
      setStatus('Studio 已同步，可以调模板并开始渲染。')
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : '上传失败')
      setStatus('项目创建需要处理错误。')
    } finally {
      setIsUploading(false)
    }
  }

  async function handleStartRender() {
    if (!project || isRendering) {
      return
    }

    const readiness = getRenderReadiness(project)

    if (readiness.issues.length > 0) {
      const message = `渲染前还需要处理：${readiness.issues.join('、')}`
      setError(message)
      setStatus('渲染准备未完成。')
      return
    }

    setIsRendering(true)
    setError(undefined)
    setStatus('正在创建渲染任务...')

    try {
      const created = await createRenderJob(project.id, {
        ratio,
        renderQuality: 'standard',
        templateId,
        title: project.title ?? toOptionalInputValue(title, defaultSongTitle),
        artist: project.artist ?? effectiveArtist,
        artistEnglish: project.artistEnglish ?? effectiveArtistEnglish,
        theme: {
          primaryColor: selectedTheme.primary,
          accentColor: selectedTheme.accent,
          backgroundIntensity: 0.85,
          fontFamily: previewFontStack
        },
        effect: {
          lyricGlow: 0.8,
          pulseIntensity: 0.75,
          beatImpact: 0.7,
          stageLighting
        },
        ...(selectedCustomTemplate ? { customTemplate: selectedCustomTemplate } : {})
      })

      setRenderJob(created.job)
      setRenderHistory((current) => upsertRenderHistory(current, created.job))
      setStatus('渲染任务已创建。可以先去做别的，过一段时间刷新页面，或在历史任务里点进来查看进度。')

      const finished = await pollRenderJob(
        project.id,
        created.job.id,
        (job) => {
          setRenderJob(job)
          setRenderHistory((current) => upsertRenderHistory(current, job))
        }
      )
      setRenderJob(finished)
      setRenderHistory((current) => upsertRenderHistory(current, finished))
      setStatus(
        finished.status === 'succeeded'
          ? 'MP4 已生成，可以预览和下载。'
          : `渲染失败：${finished.failureReason ?? '未知错误'}`
      )
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : '渲染失败')
      setStatus('渲染任务创建失败。')
    } finally {
      setIsRendering(false)
    }
  }

  if (page === 'admin') {
    return (
      <main className="relative min-h-screen overflow-hidden px-4 py-5 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-0 opacity-50 [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:72px_72px]" />
        <div className="pointer-events-none absolute left-1/2 top-20 h-80 w-80 -translate-x-1/2 rounded-full bg-primary/30 blur-[120px]" />

        <div className="relative mx-auto flex max-w-7xl flex-col gap-6">
          <Header page={page} />
          <Suspense
            fallback={
              <Card>
                <CardContent className="p-6 text-sm text-muted-foreground">
                  正在加载模板管理模块...
                </CardContent>
              </Card>
            }
          >
            <AdminPanel
              ratio={ratio}
              setRatio={setRatio}
              setTemplateId={setTemplateId}
              customTemplates={customTemplates}
              selectedCustomTemplateId={selectedCustomTemplateId}
              setSelectedCustomTemplateId={setSelectedCustomTemplateId}
              setCustomTemplates={setCustomTemplates}
            />
          </Suspense>
        </div>
      </main>
    )
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-5 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 opacity-50 [background-image:linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:72px_72px]" />
      <div className="pointer-events-none absolute left-1/2 top-20 h-80 w-80 -translate-x-1/2 rounded-full bg-primary/30 blur-[120px]" />

      <div className="relative mx-auto flex max-w-7xl flex-col gap-6">
        <Header page={page} />

        <section>
          <HeroPanel
            title={title}
            artist={artist}
            artistEnglish={artistEnglish}
            setTitle={setTitle}
            setArtist={setArtist}
            setArtistEnglish={setArtistEnglish}
            uploads={uploads}
            setUploads={setUploads}
            canUpload={canUpload}
            isUploading={isUploading}
            status={status}
            error={error}
            onCreate={handleCreateStudioProject}
            projectHistory={projectHistory}
            currentProjectId={project?.id}
            deletingProjectId={deletingProjectId}
            onSelectProject={(selectedProject) => {
              void handleSelectProject(selectedProject)
            }}
            onDeleteProject={(selectedProject) => {
              void handleDeleteProject(selectedProject)
            }}
          />
        </section>

        <section className="grid items-stretch gap-6 lg:grid-cols-[0.86fr_1.14fr]">
          <Suspense
            fallback={
              <Card>
                <CardContent className="p-6 text-sm text-muted-foreground">
                  正在加载 Studio 控制台...
                </CardContent>
              </Card>
            }
          >
            <StudioEditorPanel
              templateId={templateId}
              setTemplateId={setTemplateId}
              ratio={ratio}
              setRatio={setRatio}
              themeIndex={themeIndex}
              setThemeIndex={setThemeIndex}
              stageLighting={stageLighting}
              setStageLighting={setStageLighting}
              customTemplates={customTemplates}
              selectedCustomTemplateId={selectedCustomTemplateId}
              setSelectedCustomTemplateId={setSelectedCustomTemplateId}
            />
          </Suspense>
          <PreviewPanel
            ratio={ratio}
            templateId={templateId}
            theme={selectedTheme}
            lyrics={lyrics}
            timelineLyrics={timelineLyrics}
            title={project?.title ?? title}
            artist={displayArtist ?? defaultArtistName}
            config={previewConfig}
            project={project}
            status={status}
            canEditLyrics={Boolean(project)}
            hasUnsavedLyrics={hasLyricDraft}
            isSavingLyrics={isSavingLyrics}
            onDeleteLyricLine={handleDeleteLyricLine}
            onShiftLyricLine={handleShiftLyricLine}
            onResetLyrics={handleResetLyrics}
            onSaveLyrics={handleSaveLyrics}
          />
        </section>

        <RenderPanel
          project={project}
          renderJob={renderJob}
          renderReadiness={renderReadiness}
          renderHistory={renderHistory}
          isRendering={isRendering}
          onRender={handleStartRender}
          onSelectRenderJob={setRenderJob}
        />
      </div>
    </main>
  )

  async function handleSelectProject(selectedProject: Project) {
    setError(undefined)
    setStatus('正在载入完整项目数据...')

    try {
      const { project: fullProject } = await getProject(selectedProject.id)
      setProject(fullProject)
      setLyricDraft(undefined)
      setTitle(fullProject.title ?? title)
      setArtist(fullProject.artist ?? defaultArtistName)
      setArtistEnglish(fullProject.artistEnglish ?? defaultArtistEnglishName)
      setRenderJob(undefined)
      setError(undefined)
      setStatus('已载入本地项目历史，可继续调整模板或重新渲染。')
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : '载入项目失败'
      )
      setStatus('载入项目失败。')
    }
  }

  async function handleDeleteProject(selectedProject: Project) {
    const confirmed = window.confirm(
      `永久删除项目「${selectedProject.title ?? '未命名歌曲'}」？这会清理本地素材、预览音频和渲染产物。`
    )

    if (!confirmed) {
      return
    }

    setDeletingProjectId(selectedProject.id)
    setError(undefined)

    try {
      await deleteProject(selectedProject.id)
      setProjectHistory((items) =>
        items.filter((item) => item.id !== selectedProject.id)
      )

      if (project?.id === selectedProject.id) {
        setProject(undefined)
        setLyricDraft(undefined)
        setRenderJob(undefined)
        setRenderHistory([])
        setStatus('项目已删除，本地资源已经释放。')
      } else {
        setStatus('项目已删除，历史列表已更新。')
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : '删除项目失败'
      )
      setStatus('删除项目失败。')
    } finally {
      setDeletingProjectId(undefined)
    }
  }

  function handleDeleteLyricLine(index: number) {
    if (!project) {
      return
    }

    const nextLyrics = syncLyricLineTimings(
      (lyricDraft ?? project.lyrics).filter((_, lineIndex) => lineIndex !== index)
    )

    setLyricDraft(nextLyrics)
    setStatus('已更新歌词时间线草稿，记得保存。')
  }

  function handleShiftLyricLine(index: number, delta: number) {
    if (!project?.analysis) {
      return
    }

    const nextLyrics = shiftLyricLineStartTime(
      lyricDraft ?? project.lyrics,
      index,
      delta,
      {
        minGap: 0.3,
        maxTime: project.analysis.duration
      }
    )

    setLyricDraft(nextLyrics)
    setStatus('已更新歌词时间线草稿，记得保存。')
  }

  function handleResetLyrics() {
    setLyricDraft(undefined)
    setStatus('歌词时间线草稿已撤销。')
  }

  async function handleSaveLyrics() {
    if (!project || !lyricDraft || isSavingLyrics) {
      return
    }

    setIsSavingLyrics(true)
    setError(undefined)
    setStatus('正在保存歌词时间线...')

    try {
      const { project: savedProject } = await updateProjectLyrics(project.id, lyricDraft)
      setProject(savedProject)
      setLyricDraft(undefined)
      setProjectHistory((items) => upsertProjectHistory(items, savedProject))
      setStatus('歌词时间线已保存。')
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : '保存歌词时间线失败'
      )
      setStatus('保存歌词时间线失败。')
    } finally {
      setIsSavingLyrics(false)
    }
  }
}

function Header({ page }: { page: AppPage }) {
  const navItems = [
    { href: '/', label: '制作台', page: 'studio' as const },
    { href: '/admin', label: '管理员', page: 'admin' as const }
  ]

  return (
    <header className="sticky top-4 z-20 rounded-full border border-white/10 bg-background/70 px-4 py-3 shadow-2xl shadow-black/25 backdrop-blur-xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-full bg-accent text-accent-foreground shadow-[0_0_28px_rgba(34,197,94,0.45)]">
            <AudioLines className="size-5" aria-hidden="true" />
          </div>
          <div>
            <p className="font-display text-2xl leading-none tracking-wide">
              LyricPulse
            </p>
            <p className="text-xs text-muted-foreground">动态歌词视频工作台</p>
          </div>
        </div>
        <nav className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={cn(
                'rounded-full border px-3 py-2 transition hover:bg-white/10',
                page === item.page
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-white/10'
              )}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  )
}

type HeroPanelProps = {
  title: string
  artist: string
  artistEnglish: string
  setTitle: (value: string) => void
  setArtist: (value: string) => void
  setArtistEnglish: (value: string) => void
  uploads: UploadState
  setUploads: (value: UploadState) => void
  canUpload: boolean
  isUploading: boolean
  status: string
  error?: string
  onCreate: () => void
  projectHistory: Project[]
  currentProjectId?: string
  deletingProjectId?: string
  onSelectProject: (project: Project) => void
  onDeleteProject: (project: Project) => void
}

function HeroPanel({
  title,
  artist,
  artistEnglish,
  setTitle,
  setArtist,
  setArtistEnglish,
  uploads,
  setUploads,
  canUpload,
  isUploading,
  status,
  error,
  onCreate,
  projectHistory,
  currentProjectId,
  deletingProjectId,
  onSelectProject,
  onDeleteProject
}: HeroPanelProps) {
  const activeLyricPreview = status.includes('失败')
    ? '请检查素材后重新生成'
    : uploads.lyrics
      ? '副歌会被推到前景，节拍会驱动文字层次'
      : '上传 LRC 后，这里会出现歌词镜头预演'
  const artistDisplay =
    formatArtistDisplay(
      toOptionalInputValue(artist, defaultArtistName),
      toOptionalInputValue(artistEnglish, defaultArtistEnglishName)
    ) ?? defaultArtistName

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute right-0 top-0 h-52 w-52 rounded-full bg-accent/20 blur-3xl" />
      <CardHeader className="relative pb-4">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_19.5rem] lg:items-stretch xl:grid-cols-[minmax(0,1fr)_20.5rem]">
          <div className="flex h-full max-w-[62rem] flex-col justify-between gap-5">
            <div>
              <div className="mb-2 inline-flex w-fit items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-2 text-xs font-medium text-accent">
                <Sparkles className="size-4" aria-hidden="true" />
                本地优先的开源 Studio
              </div>
              <div className="w-fit max-w-full">
                <h1 className="inline-block font-display text-[2.55rem] leading-[0.98] tracking-[-0.04em] text-foreground sm:text-[3rem] xl:text-[3.45rem]">
                  把歌词变成
                  <br />
                  <span className="text-white">会跟着音乐</span>
                  <br />
                  <span className="whitespace-nowrap text-accent">跳动的视频。</span>
                </h1>
                <div className="mt-3 h-1.5 w-20 rounded-full bg-accent/80 shadow-[0_0_20px_rgba(34,197,94,0.45)]" />
              </div>
              <CardDescription className="mt-3 max-w-[38rem] text-[0.95rem] leading-6 text-white/64 sm:text-[0.98rem]">
                上传音频、LRC 歌词和封面图。LyricPulse 会自动解析歌词、分析节奏，并生成可渲染的动态视觉项目。
              </CardDescription>
              <div className="mt-4 grid gap-2 sm:grid-cols-3 xl:max-w-[65rem]">
                <HeroPill icon={Music2} label="音频节拍分析" />
                <HeroPill icon={Clapperboard} label="歌词镜头推进" />
                <HeroPill icon={Wand2} label="模板即时预览" />
              </div>
              <div className="mt-4 grid gap-2.5 md:grid-cols-3 xl:max-w-[65rem]">
                <HeroSceneCard
                  title="歌词前景"
                  caption="副歌、主句和节拍点会被推成同一个视觉镜头。"
                  variant="lyrics"
                />
                <HeroSceneCard
                  title="封面光场"
                  caption="封面、频谱和背景氛围会自然贴合到同一张画面。"
                  variant="cover"
                />
                <HeroSceneCard
                  title="节拍动线"
                  caption="鼓点、呼吸感和切镜节奏会先在这里形成画面骨架。"
                  variant="rhythm"
                />
              </div>
            </div>
          </div>
          <HeroVisualCard
            title={title}
            artist={artistDisplay}
            lyricPreview={activeLyricPreview}
            hasAudio={Boolean(uploads.audio)}
            hasLyrics={Boolean(uploads.lyrics)}
            hasCover={Boolean(uploads.cover)}
          />
        </div>
      </CardHeader>
      <CardContent className="relative space-y-4 pt-2">
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="歌曲标题">
            <Input
              value={title}
              className={cn(title === defaultSongTitle && 'text-muted-foreground')}
              onFocus={() => {
                if (title === defaultSongTitle) {
                  setTitle('')
                }
              }}
              onBlur={() => {
                if (!title.trim()) {
                  setTitle(defaultSongTitle)
                }
              }}
              onChange={(event) => setTitle(event.target.value)}
            />
          </Field>
          <Field label="艺人 / 作者">
            <Input
              value={artist}
              className={cn(artist === defaultArtistName && 'text-muted-foreground')}
              onFocus={() => {
                if (artist === defaultArtistName) {
                  setArtist('')
                }
              }}
              onBlur={() => {
                if (!artist.trim()) {
                  setArtist(defaultArtistName)
                }
              }}
              onChange={(event) => setArtist(event.target.value)}
            />
          </Field>
          <Field label="歌手英文名">
            <Input
              value={artistEnglish}
              className={cn(
                artistEnglish === defaultArtistEnglishName && 'text-muted-foreground'
              )}
              onFocus={() => {
                if (artistEnglish === defaultArtistEnglishName) {
                  setArtistEnglish('')
                }
              }}
              onBlur={() => {
                if (!artistEnglish.trim()) {
                  setArtistEnglish(defaultArtistEnglishName)
                }
              }}
              onChange={(event) => setArtistEnglish(event.target.value)}
            />
          </Field>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <UploadTile
            kind="audio"
            icon={Music2}
            label="音频"
            file={uploads.audio}
            onChange={(file) => setUploads({ ...uploads, audio: file })}
          />
          <UploadTile
            kind="lyrics"
            icon={Clapperboard}
            label="LRC 歌词"
            file={uploads.lyrics}
            onChange={(file) => setUploads({ ...uploads, lyrics: file })}
          />
          <UploadTile
            kind="cover"
            icon={Image}
            label="封面图"
            file={uploads.cover}
            onChange={(file) => setUploads({ ...uploads, cover: file })}
          />
        </div>

        {error ? (
          <p className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <div className="rounded-3xl border border-white/10 bg-white/6 p-3.5">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-foreground">
              本地项目历史
            </p>
            <span className="text-xs text-muted-foreground">
              {projectHistory.length} 个项目
            </span>
          </div>
          {projectHistory.length > 0 ? (
            <div className="grid max-h-64 gap-2 overflow-y-auto pr-1">
                {projectHistory.map((item) => (
                  <div key={item.id} className="flex gap-2">
                    <button
                      type="button"
                      className={cn(
                        'flex min-h-12 flex-1 items-center justify-between rounded-2xl border px-3 text-left text-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        item.id === currentProjectId
                          ? 'border-accent/40 bg-accent/10 text-foreground'
                          : 'border-white/10 bg-black/20 text-muted-foreground hover:border-accent/40 hover:bg-accent/10 hover:text-foreground'
                      )}
                      onClick={() => onSelectProject(item)}
                    >
                      <span>
                        <span className="block font-semibold text-foreground">
                          {item.title ?? '未命名歌曲'}
                        </span>
                        <span>
                          {formatArtistDisplay(item.artist, item.artistEnglish) ?? '未知艺人'}
                        </span>
                      </span>
                      <span>{formatDateTime(item.updatedAt)}</span>
                    </button>
                    <button
                      type="button"
                      className="grid size-12 shrink-0 place-items-center rounded-2xl border border-white/10 bg-black/20 text-muted-foreground transition hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
                      aria-label={`删除项目 ${item.title ?? '未命名歌曲'}`}
                      disabled={deletingProjectId === item.id}
                      onClick={() => onDeleteProject(item)}
                    >
                      {deletingProjectId === item.id ? (
                        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                      ) : (
                        <Trash2 className="size-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>
              ))}
            </div>
          ) : (
            <p className="text-xs leading-5 text-muted-foreground">
              上传素材并完成分析后，项目会保存到本地历史。
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/6 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">{status}</p>
            <p className="text-xs text-muted-foreground">
              支持：MP3/WAV/FLAC/M4A、LRC、JPG/PNG/WebP。
            </p>
          </div>
          <Button disabled={!canUpload || isUploading} onClick={onCreate}>
            {isUploading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <UploadCloud className="size-4" />
            )}
            同步到 Studio
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function HeroPill({ icon: Icon, label }: { icon: typeof Music2; label: string }) {
  return (
    <div className="flex min-h-11 w-full items-center justify-center gap-2 rounded-[1rem] border border-white/10 bg-white/6 px-4 py-2 text-[0.84rem] text-white/74 backdrop-blur-md">
      <Icon className="size-3.5 text-accent" aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}

function HeroSceneCard({
  title,
  caption,
  variant
}: {
  title: string
  caption: string
  variant: 'lyrics' | 'cover' | 'rhythm'
}) {
  return (
    <div className="relative flex min-h-[11rem] overflow-hidden rounded-[1.35rem] border border-white/10 bg-white/6 p-3 backdrop-blur-md">
      <div
        className={cn(
          'absolute inset-0 opacity-90',
          variant === 'lyrics'
            ? 'bg-[radial-gradient(circle_at_18%_22%,rgba(34,197,94,0.18),transparent_28%),linear-gradient(145deg,rgba(10,13,25,0.94),rgba(18,25,51,0.92))]'
            : variant === 'cover'
              ? 'bg-[radial-gradient(circle_at_72%_24%,rgba(255,255,255,0.16),transparent_26%),linear-gradient(145deg,rgba(10,13,25,0.94),rgba(27,18,52,0.9))]'
              : 'bg-[radial-gradient(circle_at_50%_18%,rgba(34,197,94,0.22),transparent_24%),linear-gradient(145deg,rgba(10,13,25,0.94),rgba(13,36,42,0.92))]'
        )}
      />
      <div className="relative">
        <div
          className={cn(
            'mb-3 overflow-hidden rounded-[1rem] border border-white/10',
            variant === 'lyrics' ? 'h-20 bg-black/25' : 'h-20 bg-white/5'
          )}
        >
          {variant === 'lyrics' ? (
            <div className="relative flex h-full flex-col justify-end gap-1.5 p-2.5">
              <div className="absolute left-4 top-2.5 h-12 w-12 rounded-full bg-accent/20 blur-2xl" />
              <div className="ml-auto max-w-[8.2rem] rounded-2xl border border-white/10 bg-white px-2.5 py-1 text-[0.72rem] font-semibold leading-4 text-[#0a0d19] shadow-[0_10px_30px_rgba(255,255,255,0.18)]">
                你写下的那一句，正在成为主镜头
              </div>
              <div className="flex gap-1">
                {Array.from({ length: 14 }).map((_, index) => (
                  <span
                    key={index}
                    className="flex-1 rounded-full bg-accent/70"
                    style={{ height: `${10 + (index % 5) * 5}px`, opacity: 0.35 + (index % 4) * 0.12 }}
                  />
                ))}
              </div>
            </div>
          ) : variant === 'cover' ? (
            <div className="relative h-full p-3">
              <div className="absolute left-4 top-4 h-14 w-[4.5rem] rounded-[0.95rem] bg-gradient-to-br from-white/40 via-white/15 to-transparent shadow-[0_18px_40px_rgba(0,0,0,0.26)]" />
              <div className="absolute left-11 top-7 h-14 w-[4.5rem] rounded-[0.95rem] border border-white/10 bg-gradient-to-br from-accent/25 to-transparent" />
              <div className="absolute inset-x-4 bottom-3 h-8 rounded-full bg-[linear-gradient(90deg,rgba(255,255,255,0.12),rgba(34,197,94,0.35),rgba(255,255,255,0.08))] blur-[1px]" />
            </div>
          ) : (
            <div className="relative flex h-full items-end gap-1 px-3 pb-3">
              <div className="absolute left-1/2 top-2.5 h-10 w-10 -translate-x-1/2 rounded-full bg-accent/18 blur-xl" />
              {Array.from({ length: 11 }).map((_, index) => (
                <span
                  key={index}
                  className="flex-1 rounded-t-full bg-[linear-gradient(180deg,rgba(255,255,255,0.78),rgba(34,197,94,0.42))]"
                  style={{ height: `${24 + ((index * 7) % 28)}px`, opacity: 0.35 + (index % 4) * 0.13 }}
                />
              ))}
            </div>
          )}
        </div>
        <p className="text-[0.82rem] font-semibold tracking-[0.08em] text-white">{title}</p>
        <p className="mt-1.5 text-[0.8rem] leading-5 text-white/60">{caption}</p>
      </div>
    </div>
  )
}

type UploadTileProps = {
  kind: AssetKind
  icon: typeof Music2
  label: string
  file?: File
  onChange: (file: File | undefined) => void
}

function UploadTile({
  kind,
  icon: Icon,
  label,
  file,
  onChange
}: UploadTileProps) {
  const inputId = useId()
  const formats = acceptedFormats[kind]
  const accept = getAcceptedFileTypes(kind)

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0]

    if (!selectedFile) {
      onChange(undefined)
      return
    }

    if (!isAcceptedFile(kind, selectedFile)) {
      event.target.value = ''
      onChange(undefined)
      return
    }

    onChange(selectedFile)
  }

  return (
    <label
      htmlFor={inputId}
      className="group flex min-h-40 cursor-pointer flex-col justify-between rounded-3xl border border-dashed border-white/15 bg-white/6 p-4 transition duration-200 hover:border-accent/60 hover:bg-accent/10"
    >
      <input
        id={inputId}
        className="sr-only"
        type="file"
        accept={accept}
        onChange={handleChange}
      />
      <div className="flex items-center justify-between">
        <div className="grid size-11 place-items-center rounded-2xl bg-white/10 text-accent transition group-hover:bg-accent group-hover:text-accent-foreground">
          <Icon className="size-5" aria-hidden="true" />
        </div>
        {file ? (
          <BadgeCheck className="size-5 text-accent" aria-hidden="true" />
        ) : null}
      </div>
      <div>
        <p className="font-semibold text-foreground">{label}</p>
        <p className="line-clamp-1 text-sm text-muted-foreground">
          {file?.name ?? formats.join(', ').toUpperCase()}
        </p>
      </div>
    </label>
  )
}

function getAcceptedFileTypes(kind: AssetKind) {
  return [
    ...acceptedFormats[kind].map((format) => `.${format}`),
    ...acceptedMimeTypes[kind]
  ].join(',')
}

function isAcceptedFile(kind: AssetKind, file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase()

  if (!extension || !acceptedFormats[kind].includes(extension as never)) {
    return false
  }

  const mimeTypes = acceptedMimeTypes[kind]

  return mimeTypes.length === 0 || !file.type || mimeTypes.includes(file.type)
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  const fieldId = useId()

  return (
    <div className="space-y-2">
      <Label htmlFor={fieldId}>{label}</Label>
      <div id={fieldId}>{children}</div>
    </div>
  )
}

type PreviewPanelProps = {
  ratio: VideoRatio
  templateId: TemplateId
  theme: (typeof themePresets)[number]
  lyrics: typeof sampleLyrics
  timelineLyrics: typeof sampleLyrics
  title: string
  artist: string
  config?: LyricVideoConfig
  project?: Project
  status: string
  canEditLyrics: boolean
  hasUnsavedLyrics: boolean
  isSavingLyrics: boolean
  onDeleteLyricLine: (index: number) => void
  onShiftLyricLine: (index: number, delta: number) => void
  onResetLyrics: () => void
  onSaveLyrics: () => void
}

function PreviewPanel({
  ratio,
  templateId,
  theme,
  lyrics,
  timelineLyrics,
  title,
  artist,
  config,
  project,
  status,
  canEditLyrics,
  hasUnsavedLyrics,
  isSavingLyrics,
  onDeleteLyricLine,
  onShiftLyricLine,
  onResetLyrics,
  onSaveLyrics
}: PreviewPanelProps) {
  const isPortrait = ratio === '9:16'

  return (
    <Card className="flex h-full flex-col overflow-hidden p-4">
      <div className="mb-4 flex items-center justify-between gap-3 px-2">
        <div>
          <p className="text-sm text-muted-foreground">实时预览</p>
          <h2 className="text-2xl font-semibold">
            {templateCopy[templateId].label}
          </h2>
        </div>
        <div className="rounded-full border border-white/10 px-3 py-2 text-sm text-muted-foreground">
          {ratio}
        </div>
      </div>
      <div className="grid place-items-center rounded-[1.5rem] bg-black/30 p-5">
        {config ? (
          <div
            className={cn(
              'overflow-hidden rounded-[2rem] border border-white/15 bg-[#101025] shadow-[0_32px_120px_rgba(0,0,0,0.6)]',
              isPortrait ? 'w-full max-w-[340px]' : 'w-full'
            )}
          >
            <Suspense fallback={<PreviewLoading isPortrait={isPortrait} />}>
              <RemotionPreview config={config} />
            </Suspense>
          </div>
        ) : (
          <MockPreview
            isPortrait={isPortrait}
            theme={theme}
            templateId={templateId}
            lyrics={lyrics}
            title={title}
            artist={artist}
          />
        )}
      </div>
      <div className="mt-4 grid gap-4">
        <TimelinePanel
          lyrics={timelineLyrics}
          compact
          canEdit={canEditLyrics}
          hasUnsavedChanges={hasUnsavedLyrics}
          isSaving={isSavingLyrics}
          onDeleteLine={onDeleteLyricLine}
          onShiftLine={onShiftLyricLine}
          onReset={onResetLyrics}
          onSave={onSaveLyrics}
        />
        <AnalysisPanel project={project} status={status} compact />
      </div>
    </Card>
  )
}

function HeroVisualCard({
  title,
  artist,
  lyricPreview,
  hasAudio,
  hasLyrics,
  hasCover
}: {
  title: string
  artist: string
  lyricPreview: string
  hasAudio: boolean
  hasLyrics: boolean
  hasCover: boolean
}) {
  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-[1.8rem] border border-white/12 bg-[#0a0d19] p-4 shadow-[0_24px_70px_rgba(0,0,0,0.3)] lg:p-5">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(34,197,94,0.18),transparent_30%),radial-gradient(circle_at_78%_22%,rgba(255,255,255,0.14),transparent_24%),linear-gradient(145deg,#0a0d19_0%,#121933_55%,#0b1020_100%)]" />
      <div className="absolute -right-8 top-8 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute bottom-10 left-10 h-20 w-20 rounded-full bg-accent/20 blur-3xl" />
      <div className="relative flex h-full flex-col justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[1.2rem] border border-white/12 bg-gradient-to-br from-white/20 via-white/8 to-transparent shadow-[0_14px_40px_rgba(0,0,0,0.3)]">
            <div className="absolute inset-3 rounded-[1rem] border border-white/10 bg-[linear-gradient(160deg,rgba(255,255,255,0.2),rgba(255,255,255,0.03))]" />
            <div className="absolute inset-x-5 top-5 h-8 rounded-full bg-white/14 blur-md" />
            <div className="absolute bottom-4 left-4 right-4 flex items-end gap-1">
              {Array.from({ length: 10 }).map((_, index) => (
                <span
                  key={index}
                  className="rounded-full bg-accent/80"
                  style={{
                    width: 5,
                    height: `${16 + (index % 4) * 8}px`,
                    opacity: 0.45 + (index % 3) * 0.15
                  }}
                />
              ))}
            </div>
          </div>
          <div className="min-w-0 flex-1 pt-1">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.34em] text-white/42">
              Visual Cue
            </p>
            <p className="mt-2 text-[1.02rem] font-semibold leading-tight text-white">
              让封面、歌词和频谱像同一个镜头在呼吸
            </p>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/62">
              {artist === defaultArtistName ? '输入歌名与歌手后，右侧预览会立即形成完整镜头关系。' : `当前正在塑造 ${artist} 的动态歌词画面。`}
            </p>
          </div>
        </div>
        <div className="rounded-[1.3rem] border border-white/10 bg-white/6 p-4 backdrop-blur-md">
          <div className="mb-3 flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-white/40">
            <Activity className="size-4 text-accent/80" aria-hidden="true" />
            Lyric Frame
          </div>
          <p className="line-clamp-2 text-lg font-semibold leading-tight text-white">
            {title || defaultSongTitle}
          </p>
          <p className="mt-1 text-sm text-white/52">
            {artist || defaultArtistName}
          </p>
          <div className="mt-4 rounded-[1.2rem] border border-white/10 bg-black/20 px-4 py-3">
            <p className="text-sm leading-6 text-white/78">“{lyricPreview}”</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <HeroChip icon={Music2} label={hasAudio ? '音频就绪' : '等待音频'} active={hasAudio} />
          <HeroChip icon={Clapperboard} label={hasLyrics ? '歌词驱动' : '等待歌词'} active={hasLyrics} />
          <HeroChip icon={Image} label={hasCover ? '封面入镜' : '等待封面'} active={hasCover} />
        </div>
      </div>
    </div>
  )
}

function HeroChip({
  icon: Icon,
  label,
  active
}: {
  icon: typeof Music2
  label: string
  active: boolean
}) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm backdrop-blur-md',
        active ? 'border-accent/40 bg-accent/12 text-white' : 'border-white/10 bg-white/6 text-white/58'
      )}
    >
      <Icon className={cn('size-4', active ? 'text-accent' : 'text-white/45')} aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}

function PreviewLoading({ isPortrait }: { isPortrait: boolean }) {
  return (
    <div
      className={cn(
        'grid place-items-center bg-[#101025] text-sm text-white/60',
        isPortrait ? 'aspect-[9/16]' : 'aspect-video'
      )}
    >
      正在加载实时预览...
    </div>
  )
}

function MockPreview({
  isPortrait,
  theme,
  templateId,
  lyrics,
  title,
  artist
}: {
  isPortrait: boolean
  theme: (typeof themePresets)[number]
  templateId: TemplateId
  lyrics: typeof sampleLyrics
  title: string
  artist: string
}) {
  return (
    <div
      className={cn(
        'animate-preview-enter relative overflow-hidden rounded-[2rem] border border-white/15 bg-[#101025] shadow-[0_32px_120px_rgba(0,0,0,0.6)]',
        isPortrait
          ? 'aspect-[9/16] w-full max-w-[340px]'
          : 'aspect-video w-full'
      )}
    >
      <div
        className="absolute inset-0 opacity-80"
        style={{
          background: `radial-gradient(circle at 30% 20%, ${theme.primary}99, transparent 32%), radial-gradient(circle at 72% 70%, ${theme.accent}88, transparent 34%), linear-gradient(145deg, #080816, #171733)`
        }}
      />
      <div className="animate-preview-orb absolute left-1/2 top-20 size-44 -translate-x-1/2 rounded-full border border-white/20 bg-white/10 shadow-[0_0_80px_rgba(255,255,255,0.24)] backdrop-blur-md" />
      <div className="absolute inset-x-8 top-8 flex items-center justify-between text-xs uppercase tracking-[0.28em] text-white/70">
        <span>LyricPulse</span>
        <span>{templateId}</span>
      </div>
      <div className="absolute inset-x-7 bottom-10 space-y-5">
        <div>
          <p className="text-sm text-white/60">{artist}</p>
          <p className="font-display text-4xl leading-none tracking-wide text-white">
            {title}
          </p>
        </div>
        <div className="space-y-3">
          {lyrics.slice(0, 3).map((line, index) => (
            <p
              key={line.id}
              className={cn(
                'rounded-2xl border border-white/10 px-4 py-3 font-semibold',
                index === 1
                  ? 'animate-preview-line bg-white text-[#080816] shadow-[0_0_40px_rgba(255,255,255,0.28)]'
                  : 'bg-white/10 text-white/70'
              )}
            >
              {line.text}
            </p>
          ))}
        </div>
      </div>
      <WaveStrips color={theme.accent} />
    </div>
  )
}

function WaveStrips({ color }: { color: string }) {
  return (
    <div className="absolute inset-x-0 bottom-0 flex h-20 items-end gap-1 px-5 opacity-70">
      {Array.from({ length: 28 }).map((_, index) => (
        <span
          key={index}
          className="animate-preview-bar flex-1 origin-bottom rounded-t-full"
          style={{
            animationDelay: `${index * 45}ms`,
            animationDuration: `${1000 + (index % 6) * 80}ms`,
            backgroundColor: color,
            height: `${18 + (index % 5) * 8}%`
          }}
        />
      ))}
    </div>
  )
}

function TimelinePanel({
  lyrics,
  compact = false,
  canEdit = false,
  hasUnsavedChanges = false,
  isSaving = false,
  onDeleteLine,
  onShiftLine,
  onReset,
  onSave
}: {
  lyrics: typeof sampleLyrics
  compact?: boolean
  canEdit?: boolean
  hasUnsavedChanges?: boolean
  isSaving?: boolean
  onDeleteLine?: (index: number) => void
  onShiftLine?: (index: number, delta: number) => void
  onReset?: () => void
  onSave?: () => void
}) {
  const visibleLyrics = canEdit ? lyrics : lyrics.slice(0, compact ? 5 : 7)

  return (
    <Card className={cn(compact && 'bg-white/[0.04]')}>
      <CardHeader className={compact ? 'pb-3' : undefined}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="size-5 text-accent" aria-hidden="true" />
              歌词时间线
            </CardTitle>
            <CardDescription className={compact ? 'text-xs' : undefined}>
              上传 LRC 后，这里会显示解析后的逐行时间轴。
            </CardDescription>
          </div>
          {canEdit ? (
            <div className="flex flex-wrap items-center justify-end gap-2">
              {hasUnsavedChanges ? (
                <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-[11px] font-medium text-amber-200">
                  未保存修改
                </span>
              ) : null}
              <Button
                size="sm"
                variant="ghost"
                disabled={!hasUnsavedChanges || isSaving}
                onClick={onReset}
              >
                <RotateCcw className="size-3.5" aria-hidden="true" />
                撤销
              </Button>
              <Button size="sm" disabled={!hasUnsavedChanges || isSaving} onClick={onSave}>
                {isSaving ? (
                  <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <Save className="size-3.5" aria-hidden="true" />
                )}
                保存
              </Button>
            </div>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className={cn('space-y-3', compact && 'max-h-64 overflow-y-auto pr-2')}>
        {visibleLyrics.map((line, index) => (
          <div
            key={line.id}
            className={cn(
              'grid grid-cols-[4.5rem_1fr_auto] gap-3 rounded-2xl border border-white/10 bg-white/6',
              compact ? 'p-2.5' : 'p-3'
            )}
          >
            <span className="font-mono text-xs text-accent">
              {formatTime(line.startTime)}
            </span>
            <span
              className={cn(
                'text-sm',
                index === 1 ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              {line.text}
            </span>
            {canEdit ? (
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="min-h-9 rounded-full px-2"
                  onClick={() => onShiftLine?.(index, -0.5)}
                >
                  <Minus className="size-3.5" aria-hidden="true" />
                  0.5s
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="min-h-9 rounded-full px-2"
                  onClick={() => onShiftLine?.(index, 0.5)}
                >
                  <Plus className="size-3.5" aria-hidden="true" />
                  0.5s
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="min-h-9 rounded-full px-2 text-destructive hover:text-destructive"
                  onClick={() => onDeleteLine?.(index)}
                >
                  <Trash2 className="size-3.5" aria-hidden="true" />
                </Button>
              </div>
            ) : null}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function AnalysisPanel({
  project,
  status,
  compact = false
}: {
  project?: Project
  status: string
  compact?: boolean
}) {
  const analysis = project?.analysis
  const metrics = [
    {
      label: '时长',
      value: analysis ? `${analysis.duration.toFixed(1)}s` : '待分析'
    },
    {
      label: 'BPM',
      value: analysis?.bpm ? Math.round(analysis.bpm).toString() : '回退值'
    },
    {
      label: '节拍',
      value: analysis ? analysis.beats.length.toString() : '待分析'
    },
    {
      label: '分析帧',
      value: analysis ? analysis.frames.length.toString() : '待分析'
    }
  ]

  return (
    <Card className={cn(compact && 'bg-white/[0.04]')}>
      <CardHeader className={compact ? 'pb-3' : undefined}>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="size-5 text-accent" aria-hidden="true" />
          音频分析
        </CardTitle>
        <CardDescription className={compact ? 'text-xs' : undefined}>{status}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className={cn(
                'rounded-2xl border border-white/10 bg-white/6',
                compact ? 'p-3' : 'p-4'
              )}
            >
              <p className="text-xs text-muted-foreground">{metric.label}</p>
              <p className="mt-1 text-lg font-semibold text-foreground">
                {metric.value}
              </p>
            </div>
          ))}
        </div>
        {analysis?.unavailableFields?.length ? (
          <p className="rounded-2xl border border-white/10 bg-white/6 p-3 text-xs leading-5 text-muted-foreground">
            使用回退数据的字段：{analysis.unavailableFields.join(', ')}
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}

function RenderPanel({
  project,
  renderJob,
  renderReadiness,
  renderHistory,
  isRendering,
  onRender,
  onSelectRenderJob
}: {
  project?: Project
  renderJob?: RenderJob
  renderReadiness: RenderReadiness
  renderHistory: RenderJob[]
  isRendering: boolean
  onRender: () => void
  onSelectRenderJob: (job: RenderJob) => void
}) {
  const downloadUrl =
    project &&
    renderJob?.projectId === project.id &&
    renderJob.status === 'succeeded'
      ? `/api/projects/${project.id}/render/${renderJob.id}/download`
      : undefined
  const canRender = Boolean(project && renderReadiness.issues.length === 0)
  const isRetry = renderJob?.status === 'failed'

  return (
    <Card className="overflow-hidden">
      <CardContent className="space-y-5 p-5">
        <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
          <div className="flex items-start gap-4">
            <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary/20 text-primary">
              <Film className="size-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">渲染结果</h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                创建本地渲染任务后，系统会调用 Remotion 生成
                MP4。任务完成后可直接预览和下载。
              </p>
              <p className="mt-2 max-w-2xl rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-xs leading-5 text-muted-foreground">
                渲染会在后台继续运行。你可以先去做别的，稍后刷新页面；历史任务支持点击查看当前进度，成功后可直接下载。
              </p>
              {renderJob ? (
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full border border-white/10 px-3 py-1.5">
                    状态：{translateRenderStatus(renderJob.status)}
                  </span>
                  <span className="rounded-full border border-white/10 px-3 py-1.5">
                    进度：{Math.round(renderJob.progress * 100)}%
                  </span>
                  <span className="rounded-full border border-white/10 px-3 py-1.5">
                    模板：{templateCopy[renderJob.config.templateId].label}
                  </span>
                  <span className="rounded-full border border-white/10 px-3 py-1.5">
                    画幅：{renderJob.config.ratio}
                  </span>
                </div>
              ) : null}
              {renderJob?.failureReason ? (
                <p className="mt-3 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {renderJob.failureReason}
                </p>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button disabled={!canRender || isRendering} onClick={onRender}>
              {isRendering ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Film className="size-4" aria-hidden="true" />
              )}
              {isRetry ? '重新渲染' : '开始渲染'}
            </Button>
            <Button
              asLink
              variant="secondary"
              disabled={!downloadUrl}
              href={downloadUrl}
            >
              <Play className="size-4" aria-hidden="true" />
              预览 MP4
            </Button>
            <Button asLink disabled={!downloadUrl} href={downloadUrl} download>
              <Download className="size-4" aria-hidden="true" />
              下载
            </Button>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-3xl border border-white/10 bg-white/6 p-4">
            <p className="mb-3 text-sm font-semibold text-foreground">
              渲染前检查
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {renderReadiness.checks.map((check) => (
                <div
                  key={check.label}
                  className={cn(
                    'rounded-2xl border px-3 py-2 text-xs',
                    check.done
                      ? 'border-accent/30 bg-accent/10 text-accent'
                      : 'border-white/10 bg-black/20 text-muted-foreground'
                  )}
                >
                  {check.done ? '已完成' : '待完成'}：{check.label}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/6 p-4">
            <p className="mb-3 text-sm font-semibold text-foreground">
              历史任务
            </p>
            {renderHistory.length > 0 && project ? (
              <div className="space-y-2">
                {renderHistory.slice(0, 4).map((item) => (
                  <button
                    key={item.id}
                    className={cn(
                      'flex min-h-12 w-full cursor-pointer items-center justify-between rounded-2xl border px-3 text-left text-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      renderJob?.id === item.id
                        ? 'border-accent/50 bg-accent/10 text-foreground'
                        : 'border-white/10 text-muted-foreground hover:border-accent/40 hover:bg-accent/10 hover:text-foreground'
                    )}
                    onClick={() => onSelectRenderJob(item)}
                    >
                      <span>
                        {templateCopy[item.config.templateId].label} · {item.config.ratio} · {translateRenderStatus(item.status)}
                        {item.status === 'rendering' || item.status === 'created'
                          ? ` · ${Math.round(item.progress * 100)}%`
                          : ''}
                    </span>
                    <span>{formatDateTime(item.updatedAt)}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs leading-5 text-muted-foreground">
                渲染任务会在这里保留，方便稍后回来查看进度或下载结果。
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

async function pollRenderJob(
  projectId: string,
  jobId: string,
  onUpdate: (job: RenderJob) => void
): Promise<RenderJob> {
  for (let attempt = 0; attempt < 3600; attempt += 1) {
    const { job } = await getRenderJob(projectId, jobId)
    onUpdate(job)

    if (job.status === 'succeeded' || job.status === 'failed') {
      return job
    }

    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  throw new Error('渲染任务超时')
}

type RenderReadiness = {
  checks: Array<{ label: string; done: boolean }>
  issues: string[]
}

function getRenderReadiness(project?: Project): RenderReadiness {
  const checks = [
    { label: '项目已创建', done: Boolean(project) },
    {
      label: '音频已上传',
      done: Boolean(project?.assets.some((asset) => asset.kind === 'audio'))
    },
    {
      label: '歌词已解析',
      done: Boolean(project?.lyrics.length)
    },
    {
      label: '封面已上传',
      done: Boolean(project?.assets.some((asset) => asset.kind === 'cover'))
    },
    { label: '音频分析已完成', done: Boolean(project?.analysis) }
  ]

  return {
    checks,
    issues: checks.filter((check) => !check.done).map((check) => check.label)
  }
}

function translateRenderStatus(status: RenderJob['status']) {
  const labels: Record<RenderJob['status'], string> = {
    created: '已创建',
    analyzing: '分析中',
    rendering: '渲染中',
    succeeded: '已完成',
    failed: '失败'
  }

  return labels[status]
}

function isActiveRenderJob(job: RenderJob) {
  return ['created', 'analyzing', 'rendering'].includes(job.status)
}

function upsertRenderHistory(
  items: RenderJob[],
  nextItem: RenderJob
) {
  return [nextItem, ...items.filter((item) => item.id !== nextItem.id)]
}

function upsertProjectHistory(items: Project[], nextProject: Project) {
  return [nextProject, ...items.filter((item) => item.id !== nextProject.id)]
}

function toOptionalInputValue(value: string, placeholder: string) {
  const trimmed = value.trim()

  if (!trimmed || trimmed === placeholder) {
    return undefined
  }

  return trimmed
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const remainder = Math.floor(seconds % 60)
  return `${minutes}:${remainder.toString().padStart(2, '0')}`
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value))
}

const sampleLyrics = [
  {
    id: 'sample-1',
    startTime: 0,
    text: '午夜里信号慢慢升起'
  },
  {
    id: 'sample-2',
    startTime: 8,
    text: '每一次鼓点都比上一秒更亮'
  },
  {
    id: 'sample-3',
    startTime: 16,
    text: '歌词被点燃，穿过整个画面'
  },
  {
    id: 'sample-4',
    startTime: 24,
    text: '我们把副歌涂成电子绿色'
  },
  {
    id: 'sample-5',
    startTime: 32,
    text: '让脉冲决定颜色落点'
  },
  {
    id: 'sample-6',
    startTime: 40,
    text: '每一行文字都锁在声音上'
  },
  { id: 'sample-7', startTime: 48, text: '把夜晚渲染成一支歌词影片' }
]
