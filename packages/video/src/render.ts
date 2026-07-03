import { availableParallelism } from 'node:os'
import { mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { bundle } from '@remotion/bundler'
import {
  makeCancelSignal,
  renderMedia,
  selectComposition
} from '@remotion/renderer'
import type { RenderMediaOnProgress } from '@remotion/renderer'
import type { LyricVideoConfig, RenderQuality } from '@lyricpulse/core'
import { getCompositionId, getRenderDimensions } from './dimensions'
import { getDurationInFrames } from './helpers'

const currentDir = dirname(fileURLToPath(import.meta.url))

function getRenderConcurrency(_quality: RenderQuality = 'standard') {
  const cpuCount = Math.max(1, availableParallelism())
  const configuredConcurrency = Number(process.env.RENDER_CONCURRENCY)

  if (Number.isFinite(configuredConcurrency) && configuredConcurrency > 0) {
    return Math.min(cpuCount, Math.floor(configuredConcurrency))
  }

  return cpuCount
}

export type RenderLyricVideoInput = {
  config: LyricVideoConfig
  outputLocation: string
  onProgress?: (progress: number) => void | Promise<void>
  onCancel?: (cancel: () => void) => void
}

export async function renderLyricVideo(input: RenderLyricVideoInput) {
  await mkdir(dirname(input.outputLocation), { recursive: true })

  const entryPoint = resolve(currentDir, 'register.tsx')
  const serveUrl = await bundle({ entryPoint })
  const compositionId = getCompositionId(
    input.config.templateId,
    input.config.ratio
  )
  const renderQuality = input.config.renderQuality ?? 'standard'
  const inputProps = { config: input.config }
  const { cancelSignal, cancel } = makeCancelSignal()
  input.onCancel?.(cancel)
  const composition = await selectComposition({
    serveUrl,
    id: compositionId,
    inputProps
  })

  await renderMedia({
    serveUrl,
    composition: {
      ...composition,
      ...getRenderDimensions(input.config.ratio, renderQuality),
      durationInFrames: getDurationInFrames(input.config, composition.fps)
    },
    codec: 'h264',
    concurrency: getRenderConcurrency(renderQuality),
    outputLocation: input.outputLocation,
    inputProps,
    cancelSignal,
    onProgress: async ({ progress }: Parameters<RenderMediaOnProgress>[0]) => {
      if (typeof progress === 'number') {
        await input.onProgress?.(progress)
      }
    }
  })
}
