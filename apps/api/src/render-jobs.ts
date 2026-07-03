import {
  mkdir,
  readdir,
  readFile,
  rename,
  stat,
  writeFile
} from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'
import { randomUUID } from 'node:crypto'
import {
  nodeCommandRunner,
  type CommandRunner
} from '@lyricpulse/audio-analysis'
import { renderLyricVideo as defaultRenderLyricVideo } from '@lyricpulse/video/render'
import {
  filterLyricsByArtistName,
  formatArtistDisplay,
  lyricVideoConfigSchema,
  renderQualitySchema,
  renderJobSchema,
  templateIdSchema,
  videoRatioSchema,
  type LyricVideoConfig,
  type Project,
  type RenderJob
} from '@lyricpulse/core'
import { getTemplateMetadata } from '@lyricpulse/video/template-metadata'
import { z } from 'zod'
import { ApiError } from './errors'
import type { ProjectStore } from './projects'

export type RenderLyricVideoFunction = typeof defaultRenderLyricVideo
export type MuxVideoWithAudioFunction = typeof muxVideoWithAudio

const renderTimeoutMs = resolveRenderTimeoutMs()
const staleAfterMs = resolveStaleRenderThresholdMs(renderTimeoutMs)
const renderHeartbeatMs = resolvePositiveNumber(
  process.env.RENDER_HEARTBEAT_MS,
  60 * 1000
)
const renderAssetBaseUrl = resolveRenderAssetBaseUrl()
const processStartedAt = Date.now()

export async function createRenderJob(input: {
  storageRoot: string
  store: ProjectStore
  project: Project
  body: unknown
  renderLyricVideo?: RenderLyricVideoFunction
  muxVideoWithAudio?: MuxVideoWithAudioFunction
}) {
  const activeJob = await findActiveRenderJob({
    storageRoot: input.storageRoot,
    projectId: input.project.id
  })

  if (activeJob) {
    throw new ApiError(
      409,
      'RENDER_JOB_IN_PROGRESS',
      'A render job is already in progress for this project'
    )
  }

  const config = await buildRenderConfig(
    input.project,
    input.body
  )
  const now = new Date().toISOString()
  const job: RenderJob = {
    id: randomUUID(),
    projectId: input.project.id,
    config,
    status: 'created',
    currentStep: 'queued',
    progress: 0,
    createdAt: now,
    queuedAt: now,
    heartbeatAt: now,
    updatedAt: now
  }

  await writeRenderJob(input.storageRoot, job)
  await input.store.saveProject({ ...input.project, config })

  void runRenderJob({
    storageRoot: input.storageRoot,
    project: input.project,
    job,
    renderLyricVideo: input.renderLyricVideo ?? defaultRenderLyricVideo,
    muxVideoWithAudio: input.muxVideoWithAudio ?? muxVideoWithAudio
  })

  return job
}

export async function getRenderJob(input: {
  storageRoot: string
  projectId: string
  jobId: string
}) {
  const job = await readRenderJob(
    input.storageRoot,
    input.projectId,
    input.jobId
  )

  if (!job) {
    throw new ApiError(404, 'RENDER_JOB_NOT_FOUND', 'Render job was not found')
  }

  return job
}

export async function listRenderJobs(input: {
  storageRoot: string
  projectId: string
}) {
  const root = join(input.storageRoot, 'render-jobs', input.projectId)

  try {
    const files = await readdir(root)
    const jobs = await Promise.all(
      files
        .filter((file) => file.endsWith('.json'))
        .map((file) =>
          readRenderJobSafely(
            input.storageRoot,
            input.projectId,
            file.replace(/\.json$/, '')
          )
        )
    )

    return jobs
      .filter((job): job is RenderJob => Boolean(job))
      .map(markStaleRenderJob)
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      )
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return []
    }

    throw error
  }
}

async function findActiveRenderJob(input: {
  storageRoot: string
  projectId: string
}) {
  const jobs = await listRenderJobs(input)

  return jobs.find((job) =>
    ['created', 'analyzing', 'rendering'].includes(job.status) &&
    !isStaleRenderJob(job)
  )
}

function isStaleRenderJob(job: RenderJob) {
  if (!['created', 'analyzing', 'rendering'].includes(job.status)) {
    return false
  }

  const updatedAtMs = new Date(job.updatedAt).getTime()

  return updatedAtMs < processStartedAt || updatedAtMs < Date.now() - staleAfterMs
}

function markStaleRenderJob(job: RenderJob): RenderJob {
  if (!isStaleRenderJob(job)) {
    return job
  }

  return {
    ...job,
    status: 'failed',
    progress: 1,
    currentStep: 'failed',
    finishedAt: job.finishedAt ?? new Date().toISOString(),
    failureCode: job.failureCode ?? 'RENDER_STALE',
    failureReason: 'Render process was interrupted before completion'
  }
}

export async function createRenderJobDownload(input: {
  storageRoot: string
  projectId: string
  jobId: string
}) {
  const job = await getRenderJob(input)

  if (job.status !== 'succeeded' || !job.outputPath) {
    throw new ApiError(
      400,
      'RENDER_OUTPUT_NOT_READY',
      'Render output is not ready'
    )
  }

  const absolutePath = join(input.storageRoot, job.outputPath)
  const outputStat = await stat(absolutePath).catch(() => undefined)

  if (!outputStat?.isFile()) {
    throw new ApiError(
      404,
      'RENDER_OUTPUT_NOT_FOUND',
      'Render output file was not found'
    )
  }

  return {
    filename: basename(job.outputPath),
    absolutePath,
    sizeBytes: outputStat.size
  }
}

async function buildRenderConfig(
  project: Project,
  body: unknown
): Promise<LyricVideoConfig> {
  const parsedBody = renderRequestBodySchema.parse(body ?? {})
  const audioAsset = project.assets.find((asset) => asset.kind === 'audio')
  const coverAsset = project.assets.find((asset) => asset.kind === 'cover')

  if (!audioAsset) {
    throw new ApiError(400, 'AUDIO_ASSET_REQUIRED', 'Audio asset is required')
  }

  if (!coverAsset) {
    throw new ApiError(400, 'COVER_ASSET_REQUIRED', 'Cover asset is required')
  }

  if (project.lyrics.length === 0) {
    throw new ApiError(400, 'LYRICS_REQUIRED', 'Lyrics are required')
  }

  if (!project.analysis) {
    throw new ApiError(
      400,
      'AUDIO_ANALYSIS_REQUIRED',
      'Audio analysis is required'
    )
  }

  const effectiveArtist = parsedBody.artist ?? project.artist
  const effectiveArtistEnglish =
    parsedBody.artistEnglish ?? project.artistEnglish
  const filteredLyrics = filterLyricsByArtistName(project.lyrics, effectiveArtist)
  const shouldEmbedCover =
    getTemplateMetadata(parsedBody.templateId).coverMode !== 'hidden'

  return lyricVideoConfigSchema.parse({
    projectId: project.id,
    ratio: parsedBody.ratio,
    renderQuality: parsedBody.renderQuality,
    templateId: parsedBody.templateId,
    title: parsedBody.title ?? project.title,
    artist: formatArtistDisplay(effectiveArtist, effectiveArtistEnglish),
    artistEnglish: effectiveArtistEnglish,
    audioAssetId: audioAsset.id,
    coverAssetId: coverAsset.id,
    ...(shouldEmbedCover
      ? {
          coverUrl: createRenderAssetUrl(project.id, coverAsset.id)
        }
      : {}),
    lyrics: filteredLyrics,
    analysis: project.analysis,
    theme: parsedBody.theme,
    effect: parsedBody.effect,
    customTemplate: parsedBody.customTemplate
  })
}

function createRenderAssetUrl(projectId: string, assetId: string) {
  return `${renderAssetBaseUrl}/api/projects/${projectId}/assets/${assetId}`
}

function resolveRenderAssetBaseUrl() {
  const port = resolvePositiveNumber(process.env.PORT, 3001)

  return `http://127.0.0.1:${port}`
}

async function runRenderJob(input: {
  storageRoot: string
  project: Project
  job: RenderJob
  renderLyricVideo: RenderLyricVideoFunction
  muxVideoWithAudio: MuxVideoWithAudioFunction
}) {
  const outputPath = join('outputs', input.job.projectId, `${input.job.id}.mp4`)
  const visualOutputPath = join(
    'outputs',
    input.job.projectId,
    `${input.job.id}.visual.mp4`
  )
  let timeout: NodeJS.Timeout | undefined
  let heartbeat: NodeJS.Timeout | undefined
  let cancelRender: (() => void) | undefined
  let latestProgress = 0.2
  let latestHeartbeatAt =
    input.job.heartbeatAt ?? input.job.queuedAt ?? input.job.createdAt

  try {
    const audioAsset = input.project.assets.find(
      (asset) => asset.id === input.job.config.audioAssetId
    )

    if (!audioAsset) {
      throw new ApiError(400, 'AUDIO_ASSET_REQUIRED', 'Audio asset is required')
    }

    await patchRenderJob(input.storageRoot, input.job.projectId, input.job.id, () => {
      const now = new Date().toISOString()
      latestHeartbeatAt = now

      return {
        status: 'rendering',
        currentStep: 'rendering-video',
        progress: latestProgress,
        startedAt: now,
        heartbeatAt: now,
        lastProgressAt: now,
        updatedAt: now
      }
    })

    heartbeat = setInterval(() => {
      void patchRenderJob(
        input.storageRoot,
        input.job.projectId,
        input.job.id,
        () => {
          const now = new Date().toISOString()
          latestHeartbeatAt = now

          return {
            heartbeatAt: now,
            updatedAt: now
          }
        }
      )
    }, renderHeartbeatMs)

    await withRenderTimeout(
      input.renderLyricVideo({
        config: input.job.config,
        outputLocation: join(input.storageRoot, visualOutputPath),
        onCancel: (cancel) => {
          cancelRender = cancel
        },
        onProgress: async (progress) => {
          latestProgress = 0.2 + Math.min(Math.max(progress, 0), 1) * 0.55
          await patchRenderJob(input.storageRoot, input.job.projectId, input.job.id, () => {
            const now = new Date().toISOString()
            latestHeartbeatAt = now

            return {
              status: 'rendering',
              currentStep: 'rendering-video',
              progress: latestProgress,
              heartbeatAt: now,
              lastProgressAt: now,
              updatedAt: now
            }
          })
        }
      }),
      () => {
        cancelRender?.()
      },
      (handle) => {
        timeout = handle
      }
    )

    await patchRenderJob(input.storageRoot, input.job.projectId, input.job.id, () => {
      const now = new Date().toISOString()
      latestHeartbeatAt = now

      return {
        status: 'rendering',
        currentStep: 'muxing-audio',
        progress: 0.75,
        heartbeatAt: now,
        lastProgressAt: now,
        updatedAt: now
      }
    })

    await input.muxVideoWithAudio({
      visualVideoPath: join(input.storageRoot, visualOutputPath),
      audioPath: join(input.storageRoot, audioAsset.storagePath),
      outputPath: join(input.storageRoot, outputPath)
    })

    await patchRenderJob(input.storageRoot, input.job.projectId, input.job.id, () => {
      const now = new Date().toISOString()

      return {
        status: 'succeeded',
        currentStep: 'completed',
        progress: 1,
        outputPath,
        heartbeatAt: latestHeartbeatAt,
        lastProgressAt: now,
        finishedAt: now,
        updatedAt: now
      }
    })
  } catch (error) {
    const failureReason =
      error instanceof Error ? error.message : 'Render failed'

    await patchRenderJob(input.storageRoot, input.job.projectId, input.job.id, () => {
      const now = new Date().toISOString()

      return {
        status: 'failed',
        currentStep: 'failed',
        progress: 1,
        failureReason,
        failureCode: resolveFailureCode(error),
        heartbeatAt: latestHeartbeatAt,
        finishedAt: now,
        updatedAt: now
      }
    })
  } finally {
    if (heartbeat) {
      clearInterval(heartbeat)
    }

    if (timeout) {
      clearTimeout(timeout)
    }
  }
}

async function withRenderTimeout<T>(
  promise: Promise<T>,
  cancel: () => void,
  setHandle: (handle: NodeJS.Timeout) => void
) {
  if (renderTimeoutMs === undefined) {
    return promise
  }

  let timeout: NodeJS.Timeout
  const timeoutPromise = new Promise<never>((_resolve, reject) => {
    timeout = setTimeout(() => {
      const timeoutMinutes = Math.round(renderTimeoutMs / 60000)
      const error = new Error(
        `Render exceeded the ${timeoutMinutes} minute timeout limit`
      )
      cancel()
      reject(error)
    }, renderTimeoutMs)
    setHandle(timeout)
  })

  return Promise.race([promise, timeoutPromise])
}

export async function muxVideoWithAudio(input: {
  visualVideoPath: string
  audioPath: string
  outputPath: string
  commandRunner?: CommandRunner
}) {
  await mkdir(dirname(input.outputPath), { recursive: true })
  const runner = input.commandRunner ?? nodeCommandRunner

  await runner('ffmpeg', [
    '-y',
    '-i',
    input.visualVideoPath,
    '-i',
    input.audioPath,
    '-map',
    '0:v:0',
    '-map',
    '1:a:0',
    '-c:v',
    'copy',
    '-c:a',
    'aac',
    input.outputPath
  ])
}

async function readRenderJob(
  storageRoot: string,
  projectId: string,
  jobId: string
): Promise<RenderJob | undefined> {
  const path = renderJobPath(storageRoot, projectId, jobId)

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const content = await readFile(path, 'utf8')
      return renderJobSchema.parse(JSON.parse(content))
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        return undefined
      }

      if (error instanceof SyntaxError && attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 20))
        continue
      }

      throw error
    }
  }

  return undefined
}

async function readRenderJobSafely(
  storageRoot: string,
  projectId: string,
  jobId: string
): Promise<RenderJob | undefined> {
  try {
    return await readRenderJob(storageRoot, projectId, jobId)
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof z.ZodError) {
      return undefined
    }

    throw error
  }
}

async function writeRenderJob(storageRoot: string, job: RenderJob) {
  await mkdir(join(storageRoot, 'render-jobs', job.projectId), {
    recursive: true
  })
  const path = renderJobPath(storageRoot, job.projectId, job.id)
  const temporaryPath = `${path}.${process.pid}.${Date.now()}.tmp`

  await writeFile(
    temporaryPath,
    JSON.stringify(renderJobSchema.parse(job), null, 2)
  )
  await rename(temporaryPath, path)
}

async function patchRenderJob(
  storageRoot: string,
  projectId: string,
  jobId: string,
  mutate: (current: RenderJob) => Partial<RenderJob>
) {
  const current = await readRenderJob(storageRoot, projectId, jobId)

  if (!current) {
    return undefined
  }

  const next = {
    ...current,
    ...mutate(current)
  }

  await writeRenderJob(storageRoot, next)
  return next
}

function renderJobPath(storageRoot: string, projectId: string, jobId: string) {
  return join(storageRoot, 'render-jobs', projectId, `${jobId}.json`)
}

function resolveFailureCode(error: unknown) {
  if (error instanceof ApiError) {
    return error.code
  }

  if (error instanceof Error) {
    if (error.message.includes('timeout limit')) {
      return 'RENDER_TIMEOUT'
    }

    return 'RENDER_FAILED'
  }

  return 'RENDER_FAILED'
}

function resolveRenderTimeoutMs() {
  const resolved = resolvePositiveNumber(process.env.RENDER_TIMEOUT_MS)

  if (resolved === undefined) {
    return 4 * 60 * 60 * 1000
  }

  return resolved === 0 ? undefined : resolved
}

function resolveStaleRenderThresholdMs(renderTimeout: number | undefined) {
  const resolved = resolvePositiveNumber(process.env.RENDER_STALE_AFTER_MS)

  if (resolved !== undefined) {
    return resolved
  }

  if (renderTimeout === undefined) {
    return 12 * 60 * 60 * 1000
  }

  return Math.max(30 * 60 * 1000, renderTimeout + 10 * 60 * 1000)
}

function resolvePositiveNumber(value: string | undefined, fallback?: number) {
  if (value === undefined || value === '') {
    return fallback
  }

  const parsed = Number(value)

  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback
  }

  return parsed
}

const renderRequestBodySchema = lyricVideoConfigSchema
  .pick({
    ratio: true,
    templateId: true,
    title: true,
    artist: true,
    artistEnglish: true,
    theme: true,
    effect: true,
    customTemplate: true
  })
  .extend({
    ratio: videoRatioSchema.default('9:16'),
    renderQuality: renderQualitySchema.default('standard'),
    templateId: templateIdSchema.default('NeonLyric')
  })
