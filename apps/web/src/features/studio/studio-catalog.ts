import type {
  AudioAnalysis,
  LyricLine,
  TemplateDefinition,
  TemplateId
} from '@lyricpulse/core'

export const templateCopy = {
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
  FilmBurnDiary: {
    label: '胶片烧灼日记',
    description: '烧灼胶片边缘、手写歌词和暖色漏光，适合回忆感副歌。'
  },
  MetroGlass: {
    label: '地铁玻璃',
    description: '玻璃反光、路线图线条和通勤字幕，适合城市流行和独白歌曲。'
  },
  ChromePulse: {
    label: '铬银脉冲',
    description: '高反射金属和霓虹脉冲同时推进，适合高能电子与舞曲。'
  },
  PaperCuts: {
    label: '纸片剪影',
    description: '分层纸片、切边阴影和温柔歌词，适合民谣和治愈感歌曲。'
  },
  HologramRain: {
    label: '全息雨幕',
    description: '透明 HUD、雨幕和浮动歌词，适合未来感和夜雨氛围。'
  },
  SunsetBillboard: {
    label: '落日晚霞看板',
    description: '大字歌词像城市看板悬在晚霞里，适合抒情流行和公路感歌曲。'
  },
  VelvetSubtitle: {
    label: '丝绒字幕',
    description: '暖暗舞台和精致字幕牌感，适合慢歌和复古女声。'
  },
  PixelNotebook: {
    label: '像素记事本',
    description: '低像素界面和游标闪烁，适合 lo-fi、游戏感和轻实验作品。'
  },
  NightBusWindow: {
    label: '夜巴车窗',
    description: '车窗倒影、路灯拖影和近景歌词，适合通勤夜歌与回忆向作品。'
  },
  OceanReceipt: {
    label: '海风小票',
    description: '细长票据版式和海风噪点，适合轻快独立流行与旅行歌。'
  },
  LaserBlueprint: {
    label: '激光蓝图',
    description: '蓝图网格、激光描边和工程感歌词，适合科技感和机械节奏。'
  },
  ChoirHalo: {
    label: '合唱光环',
    description: '圣洁光晕、柔焦边缘和主副歌对照，适合抒情和空灵氛围。'
  },
  RainTaxiMeter: {
    label: '雨夜计价器',
    description: '雨线车窗、黄色计价数字和城市夜行，适合都市 R&B、独白和雨夜情歌。'
  },
  SundialCourtyard: {
    label: '日晷庭院',
    description: '日晷刻度、暖石庭院和慢速指针，适合古典融合、民谣和时间主题歌曲。'
  },
  PorcelainXray: {
    label: '瓷器 X 光',
    description: '青白瓷圆纹、X 光透视和冷蓝器物感，适合空灵女声、实验流行和冷感叙事。'
  },
  CloudServerFarm: {
    label: '云端机房',
    description: '服务器机柜、蓝色云雾和数据中心光，适合科技电子、AI 主题和未来流行。'
  },
  PaperFortress: {
    label: '纸堡垒',
    description: '纸面城墙、暖黄剪影和童话防线，适合故事歌、童声感作品和治愈民谣。'
  },
  RosePostcard: {
    label: '玫瑰明信片',
    description: '暖粉情书纸面、玫瑰邮戳和轻心形漂浮，适合甜歌、告白和恋爱主题。'
  },
  MirageGasStation: {
    label: '海市蜃楼加油站',
    description: '沙漠霓虹、热浪弧线和公路加油站，适合公路摇滚、复古电子和夏夜歌。'
  }
} as Record<string, { label: string; description: string }>

export function getTemplateCopy(templateId: TemplateId) {
  return (
    templateCopy[templateId] ?? {
      label: templateId,
      description: templateId
    }
  )
}

export type ThemePreset = {
  name: string
  primary: string
  accent: string
}

export const themePresets: ThemePreset[] = [
  { name: 'Cinema Lime', primary: '#F8FAFC', accent: '#A3E635' },
  { name: 'Ultra Violet', primary: '#FFFFFF', accent: '#7C3AED' },
  { name: 'Hot Signal', primary: '#FFF7ED', accent: '#F97316' }
]

export const previewFontStack =
  'Noto Sans CJK SC, Noto Sans SC, PingFang SC, Microsoft YaHei, sans-serif'
export const defaultStageLighting = 0.75
export const defaultSongTitle = '歌曲名字'
export const defaultArtistName = '歌手名字'
export const defaultArtistEnglishName = '英文名'
export const previewFallbackCoverUrl =
  'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1200&q=80'
export const previewFallbackAnalysis: AudioAnalysis = {
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

export function isTemplatePublished(template: TemplateDefinition) {
  return Boolean(template.publishedAt) && !template.unpublishedAt && !template.deletedAt && !template.archivedAt
}

export const sampleLyrics: LyricLine[] = [
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
  {
    id: 'sample-7',
    startTime: 48,
    text: '把夜晚渲染成一支歌词影片'
  }
]
