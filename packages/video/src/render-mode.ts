import type { LyricVideoConfig } from '@lyricpulse/core'

export function isServerRender(config: LyricVideoConfig) {
  return !config.audioUrl
}

export function isDraftRender(config: LyricVideoConfig) {
  return config.renderQuality === 'draft'
}
