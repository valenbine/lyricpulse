import { Img, useCurrentFrame, useVideoConfig } from 'remotion'
import type { LyricLine, LyricVideoConfig, VideoRatio } from '@lyricpulse/core'
import {
  getAnalysisFrame,
  getCurrentLyricLine,
  getPlaybackTime
} from '../helpers'
import { TemplateShell } from '../components/TemplateShell'
import { isServerRender } from '../render-mode'

type CloudItem = {
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

function getCloudBox(ratio: VideoRatio) {
  return ratio === '16:9'
    ? { left: 180, top: 126, width: 1560, height: 820 }
    : { left: 86, top: 170, width: 908, height: 1500 }
}

function getCloudItems(lyrics: LyricLine[], currentLine: LyricLine | undefined) {
  const currentIndex = currentLine
    ? lyrics.findIndex((line) => line.id === currentLine.id)
    : 0
  const safeIndex = Math.max(0, currentIndex)
  const offsets = [-4, -3, -2, -1, 0, 1, 2, 3, 4]

  return offsets
    .map((offset): CloudItem | undefined => {
      const line = lyrics[safeIndex + offset]

      if (!line) {
        return undefined
      }

      return {
        line,
        key: `${line.id}-${offset}`,
        active: offset === 0,
        distance: Math.abs(offset)
      }
    })
    .filter(Boolean) as CloudItem[]
}

export function LyricsCloud({ config }: { config: LyricVideoConfig }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const time = getPlaybackTime(frame, fps)
  const currentLine = getCurrentLyricLine(config.lyrics, time)
  const analysisFrame = getAnalysisFrame(config.analysis.frames, time)
  const isWide = config.ratio === '16:9'
  const fastRender = isServerRender(config)
  const box = getCloudBox(config.ratio)
  const cloudItems = getCloudItems(config.lyrics, currentLine)
  const pulse = 1 + analysisFrame.rms * 0.06 * config.effect.beatImpact

  return (
    <TemplateShell config={config} variant="dashboard">
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
        {config.coverUrl ? (
          <Img
            src={config.coverUrl}
            alt={config.title ?? 'cover artwork'}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: fastRender ? 'blur(14px) brightness(0.32)' : 'blur(22px) brightness(0.34) saturate(1.16)',
              transform: 'scale(1.08)'
            }}
          />
        ) : null}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(circle at 22% 18%, ${config.theme.accentColor}55, transparent 34%), radial-gradient(circle at 78% 74%, ${config.theme.primaryColor}33, transparent 38%), linear-gradient(135deg, rgba(2,6,23,0.92), rgba(15,23,42,0.72))`
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: isWide ? 96 : 70,
            top: isWide ? 74 : 86,
            right: isWide ? 96 : 70,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'start',
            gap: 28,
            color: 'rgba(248,250,252,0.86)'
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: isWide ? 46 : 58, fontWeight: 950, letterSpacing: '-0.06em', lineHeight: 0.96 }}>
              {config.title ?? ' '}
            </div>
            {config.artist ? (
              <div style={{ marginTop: 14, fontSize: isWide ? 23 : 30, fontWeight: 760, color: 'rgba(248,250,252,0.64)' }}>
                {config.artist}
              </div>
            ) : null}
          </div>
          <div
            style={{
              flex: '0 0 auto',
              borderRadius: 999,
              border: `1px solid ${config.theme.accentColor}88`,
              padding: isWide ? '12px 18px' : '14px 20px',
              fontSize: isWide ? 18 : 24,
              fontWeight: 800,
              letterSpacing: '0.08em',
              color: config.theme.accentColor,
              background: 'rgba(2,6,23,0.34)'
            }}
          >
            <span style={{ display: 'inline-flex', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: config.theme.accentColor }} />
              <span style={{ width: 8, height: 8, borderRadius: 999, background: config.theme.accentColor, opacity: 0.55 }} />
              <span style={{ width: 8, height: 8, borderRadius: 999, background: config.theme.accentColor, opacity: 0.28 }} />
            </span>
          </div>
        </div>
        <div style={{ position: 'absolute', left: box.left, top: box.top, width: box.width, height: box.height }}>
          {cloudItems.map((item) => {
            const seed = `${config.projectId}-${item.key}`
            const width = item.active ? (isWide ? 980 : 820) : randomRange(`${seed}-w`, isWide ? 430 : 360, isWide ? 760 : 710)
            const x = item.active
              ? (box.width - width) / 2
              : randomRange(`${seed}-x`, 0, Math.max(0, box.width - width))
            const fontSize = item.active
              ? (isWide ? 104 : 126)
              : randomRange(`${seed}-fs`, isWide ? 38 : 42, isWide ? 76 : 92)
            const height = fontSize * (item.active ? 2.35 : 1.65)
            const y = item.active
              ? box.height * (isWide ? 0.43 : 0.47) - height / 2
              : randomRange(`${seed}-y`, 0, Math.max(0, box.height - height))
            const rotation = item.active
              ? randomRange(`${seed}-ra`, -6, 6)
              : randomRange(`${seed}-r`, -24, 24)
            const opacity = item.active ? 1 : Math.max(0.16, 0.54 - item.distance * 0.08)
            const color = item.active ? '#F8FAFC' : randomUnit(`${seed}-c`) > 0.45 ? 'rgba(248,250,252,0.62)' : `${config.theme.accentColor}AA`

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
                  color,
                  fontFamily: config.theme.fontFamily,
                  fontSize,
                  fontWeight: item.active ? 980 : 860,
                  lineHeight: item.active ? 0.98 : 1.04,
                  letterSpacing: item.active ? '-0.07em' : '-0.045em',
                  textAlign: randomUnit(`${seed}-align`) > 0.5 ? 'center' : 'left',
                  textShadow: item.active
                    ? `0 0 46px ${config.theme.accentColor}66, 0 8px 0 rgba(0,0,0,0.36)`
                    : '0 4px 18px rgba(0,0,0,0.42)',
                  padding: item.active ? (isWide ? '28px 36px' : '34px 38px') : '8px 10px',
                  borderRadius: item.active ? 36 : 22,
                  background: item.active ? 'rgba(2,6,23,0.42)' : 'transparent',
                  border: item.active ? `1px solid ${config.theme.accentColor}55` : undefined,
                  boxShadow: item.active && !fastRender ? `0 28px 120px ${config.theme.accentColor}22` : undefined,
                  overflow: 'hidden'
                }}
              >
                {item.line.text}
              </div>
            )
          })}
        </div>
      </div>
    </TemplateShell>
  )
}
