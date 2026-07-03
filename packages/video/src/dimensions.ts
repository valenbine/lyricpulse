import type { RenderQuality, VideoRatio } from '@lyricpulse/core'

export type VideoDimensions = {
  width: number
  height: number
}

export function getVideoDimensions(ratio: VideoRatio): VideoDimensions {
  if (ratio === '16:9') {
    return { width: 1920, height: 1080 }
  }

  return { width: 1080, height: 1920 }
}

export function getRenderDimensions(
  ratio: VideoRatio,
  quality: RenderQuality = 'standard'
): VideoDimensions {
  void quality
  return getVideoDimensions(ratio)
}

export function getCompositionId(
  templateId: string,
  ratio: VideoRatio
): string {
  return `${templateId}-${ratio.replace(':', 'x')}`
}
