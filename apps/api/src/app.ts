import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { extname, join, relative, resolve, sep } from 'node:path'
import multipart from '@fastify/multipart'
import type { Multipart } from '@fastify/multipart'
import Fastify from 'fastify'
import type { FastifyReply, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { lyricLineSchema, projectSchema, syncLyricLineTimings } from '@lyricpulse/core'
import { templateDefinitionSchema, templateIdSchema } from '@lyricpulse/core'
import { createApiConfig, type ApiConfig } from './config'
import { previewAudioForBrowser } from './audio-preview'
import { ApiError, createErrorPayload } from './errors'
import { createProjectStore } from './projects'
import { createTemplateStore } from './templates'
import {
  getAssetKind,
  saveUploadedAsset,
  normalizeUploadedAudio,
  optimizeUploadedCover
} from './uploads'
import { analyzeProjectAudio } from './analysis'
import {
  createRenderJob,
  createRenderJobDownload,
  getRenderJob,
  listRenderJobs
} from './render-jobs'

const createProjectBodySchema = z.object({
  title: z.string().min(1).optional(),
  artist: z.string().min(1).optional(),
  artistEnglish: z.string().min(1).optional()
})

const createTemplateBodySchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1).optional(),
  baseTemplateId: templateIdSchema,
  sourceType: z.enum(['custom', 'built-in-override']).optional(),
  template: templateDefinitionSchema.partial().optional()
})

const updateProjectLyricsBodySchema = z.object({
  lyrics: z.array(lyricLineSchema)
})

async function sendFileWithOptionalRange(
  request: FastifyRequest,
  reply: FastifyReply,
  filePath: string,
  contentType: string
) {
  const fileStat = await stat(filePath)
  const rangeHeader = request.headers.range

  reply.header('Content-Type', contentType)
  reply.header('Cache-Control', 'no-cache')
  reply.header('Accept-Ranges', 'bytes')

  if (!rangeHeader?.startsWith('bytes=')) {
    reply.header('Content-Length', String(fileStat.size))
    return reply.send(createReadStream(filePath))
  }

  const [rawStart, rawEnd] = rangeHeader.replace('bytes=', '').split('-', 2)
  const parsedStart = rawStart ? Number.parseInt(rawStart, 10) : Number.NaN
  const parsedEnd = rawEnd ? Number.parseInt(rawEnd, 10) : Number.NaN
  const start = Number.isFinite(parsedStart) ? parsedStart : 0
  const end = Number.isFinite(parsedEnd) ? parsedEnd : fileStat.size - 1

  if (start < 0 || end < start || start >= fileStat.size) {
    reply.code(416)
    reply.header('Content-Range', `bytes */${fileStat.size}`)
    return reply.send()
  }

  const safeEnd = Math.min(end, fileStat.size - 1)

  reply.code(206)
  reply.header('Content-Range', `bytes ${start}-${safeEnd}/${fileStat.size}`)
  reply.header('Content-Length', String(safeEnd - start + 1))
  return reply.send(createReadStream(filePath, { start, end: safeEnd }))
}

export function buildApp(config: Partial<ApiConfig> = {}) {
  const apiConfig = createApiConfig(config)
  const store = createProjectStore(apiConfig.storageRoot)
  const templateStore = createTemplateStore(apiConfig.storageRoot)
  const browserPreviewAudio =
    apiConfig.previewAudioForBrowser ?? previewAudioForBrowser
  const uploadedAudioNormalizer =
    apiConfig.normalizeUploadedAudio ?? normalizeUploadedAudio
  const uploadedCoverOptimizer =
    apiConfig.optimizeUploadedCover ?? optimizeUploadedCover
  const app = Fastify({ logger: false })

  app.register(multipart, {
    limits: {
      fileSize: 250 * 1024 * 1024,
      files: 1
    }
  })

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ApiError) {
      reply.code(error.statusCode).send(createErrorPayload(error))
      return
    }

    if (error instanceof z.ZodError) {
      reply.code(400).send({
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed',
        details: error.issues
      })
      return
    }

    request.log.error({ error }, 'Unhandled API error')
    reply.code(500).send({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error'
    })
  })

  app.get('/health', async () => ({ status: 'ok' }))

  app.get('/api/templates', async (request) => {
    const query = z
      .object({ scope: z.enum(['active', 'trash', 'all']).optional() })
      .parse(request.query)
    const templates = await templateStore.listTemplates({
      includeArchived: query.scope === 'trash' || query.scope === 'all',
      includeDeleted: query.scope === 'trash' || query.scope === 'all'
    })

    return {
      templates:
        query.scope === 'trash'
          ? templates.filter((template) => template.deletedAt || template.archivedAt)
          : query.scope === 'all'
            ? templates
            : templates.filter((template) => !template.deletedAt && !template.archivedAt)
    }
  })

  async function updateTemplateLifecycle(
    request: FastifyRequest,
    update: (templateId: string) => Promise<unknown>
  ) {
    const params = z
      .object({ templateId: z.string().min(1) })
      .parse(request.params)
    const template = await update(params.templateId)

    if (!template) {
      throw new ApiError(404, 'TEMPLATE_NOT_FOUND', 'Template was not found')
    }

    return { template }
  }

  app.put('/api/templates/:templateId/publish', async (request) =>
    updateTemplateLifecycle(request, (templateId) =>
      templateStore.publishTemplate(templateId)
    )
  )

  app.put('/api/templates/:templateId/unpublish', async (request) =>
    updateTemplateLifecycle(request, (templateId) =>
      templateStore.unpublishTemplate(templateId)
    )
  )

  app.put('/api/templates/:templateId/trash', async (request) =>
    updateTemplateLifecycle(request, (templateId) =>
      templateStore.trashTemplate(templateId)
    )
  )

  app.put('/api/templates/:templateId/restore', async (request) =>
    updateTemplateLifecycle(request, (templateId) =>
      templateStore.restoreTemplate(templateId)
    )
  )

  app.delete('/api/templates/:templateId', async (request) =>
    updateTemplateLifecycle(request, (templateId) =>
      templateStore.deleteTemplate(templateId)
    )
  )

  app.put('/api/templates/:templateId/archive', async (request) => {
    const params = z
      .object({ templateId: z.string().min(1) })
      .parse(request.params)
    const template = await templateStore.archiveTemplate(params.templateId)

    if (!template) {
      throw new ApiError(404, 'TEMPLATE_NOT_FOUND', 'Template was not found')
    }

    return { template }
  })

  app.post('/api/templates', async (request, reply) => {
    const input = createTemplateBodySchema.parse(request.body ?? {})
    const template = await templateStore.createTemplate(input)

    reply.code(201).send({ template })
  })

  app.put('/api/templates/:templateId', async (request) => {
    const params = z
      .object({ templateId: z.string().min(1) })
      .parse(request.params)
    const body = templateDefinitionSchema.parse(request.body ?? {})

    return {
      template: await templateStore.saveTemplate({ ...body, id: params.templateId })
    }
  })

  app.post('/api/templates/import', async (request, reply) => {
    const template = await templateStore.importTemplate(request.body ?? {})

    reply.code(201).send({ template })
  })

  app.get('/api/templates/:templateId/export', async (request, reply) => {
    const params = z
      .object({ templateId: z.string().min(1) })
      .parse(request.params)
    const template = await templateStore.getTemplate(params.templateId)

    if (!template) {
      throw new ApiError(404, 'TEMPLATE_NOT_FOUND', 'Template was not found')
    }

    reply
      .header('Content-Type', 'application/json')
      .header(
        'Content-Disposition',
        `attachment; filename="${template.name.replace(/[^a-zA-Z0-9_-]+/g, '-')}.json"`
      )
      .send(template)
  })

  app.get('/api/projects', async () => {
    const projects = await store.listProjects()

    return { projects: projects.map((project) => summarizeProject(project)) }
  })

  app.post('/api/projects', async (request, reply) => {
    const input = createProjectBodySchema.parse(request.body ?? {})
    const project = await store.createProject(input)

    reply.code(201).send({ project: projectSchema.parse(project) })
  })

  app.get('/api/projects/:projectId', async (request) => {
    const params = z
      .object({ projectId: z.string().min(1) })
      .parse(request.params)
    const project = await store.getProject(params.projectId)

    if (!project) {
      throw new ApiError(404, 'PROJECT_NOT_FOUND', 'Project was not found')
    }

    return { project: projectSchema.parse(project) }
  })

  app.delete('/api/projects/:projectId', async (request) => {
    const params = z
      .object({ projectId: z.string().min(1) })
      .parse(request.params)
    const deleted = await store.deleteProject(params.projectId)

    if (!deleted) {
      throw new ApiError(404, 'PROJECT_NOT_FOUND', 'Project was not found')
    }

    return { projectId: params.projectId }
  })

  app.put('/api/projects/:projectId/lyrics', async (request) => {
    const params = z
      .object({ projectId: z.string().min(1) })
      .parse(request.params)
    const project = await store.getProject(params.projectId)

    if (!project) {
      throw new ApiError(404, 'PROJECT_NOT_FOUND', 'Project was not found')
    }

    const body = updateProjectLyricsBodySchema.parse(request.body ?? {})

    if (!isSortedLyricTimeline(body.lyrics)) {
      throw new ApiError(
        400,
        'LYRICS_TIMELINE_INVALID',
        'Lyrics timeline must remain sorted by start time'
      )
    }

    const nextProject = await store.saveProject({
      ...project,
      lyrics: syncLyricLineTimings(body.lyrics)
    })

    return { project: projectSchema.parse(nextProject) }
  })

  app.post('/api/projects/:projectId/assets', async (request, reply) => {
    const params = z
      .object({ projectId: z.string().min(1) })
      .parse(request.params)
    const project = await store.getProject(params.projectId)

    if (!project) {
      throw new ApiError(404, 'PROJECT_NOT_FOUND', 'Project was not found')
    }

    const file = await request.file()

    if (!file) {
      throw new ApiError(400, 'ASSET_FILE_REQUIRED', 'Asset file is required')
    }

    const kind = getAssetKind(readMultipartFieldValue(file.fields.kind))
    const result = await saveUploadedAsset({
      storageRoot: apiConfig.storageRoot,
      store,
      project,
      kind,
      file,
      normalizeUploadedAudio: uploadedAudioNormalizer,
      optimizeUploadedCover: uploadedCoverOptimizer
    })

    reply.code(201).send({
      asset: result.asset,
      project: projectSchema.parse(result.project)
    })
  })

  app.get(
    '/api/projects/:projectId/assets/:assetId',
    async (request, reply) => {
      const params = z
        .object({ projectId: z.string().min(1), assetId: z.string().min(1) })
        .parse(request.params)
      const project = await store.getProject(params.projectId)

      if (!project) {
        throw new ApiError(404, 'PROJECT_NOT_FOUND', 'Project was not found')
      }

      const asset = project.assets.find((item) => item.id === params.assetId)

      if (!asset) {
        throw new ApiError(404, 'ASSET_NOT_FOUND', 'Asset was not found')
      }

      reply.header(
        'Content-Type',
        asset.mimeType ?? getAssetContentType(asset.format)
      )
      return reply.send(
        createReadStream(join(apiConfig.storageRoot, asset.storagePath))
      )
    }
  )

  app.get(
    '/api/projects/:projectId/assets/:assetId/preview-audio',
    async (request, reply) => {
      const params = z
        .object({ projectId: z.string().min(1), assetId: z.string().min(1) })
        .parse(request.params)
      const project = await store.getProject(params.projectId)

      if (!project) {
        throw new ApiError(404, 'PROJECT_NOT_FOUND', 'Project was not found')
      }

      const asset = project.assets.find((item) => item.id === params.assetId)

      if (!asset) {
        throw new ApiError(404, 'ASSET_NOT_FOUND', 'Asset was not found')
      }

      if (asset.kind !== 'audio') {
        throw new ApiError(400, 'AUDIO_ASSET_REQUIRED', 'Audio asset is required')
      }

      const sourcePath = join(apiConfig.storageRoot, asset.storagePath)

      if (['mp3', 'm4a'].includes(asset.format)) {
        return sendFileWithOptionalRange(
          request,
          reply,
          sourcePath,
          asset.mimeType ?? getAssetContentType(asset.format)
        )
      }

      const previewPath = join(
        apiConfig.storageRoot,
        'preview-audio',
        params.projectId,
        `${params.assetId}.mp3`
      )

      await browserPreviewAudio({
        inputPath: sourcePath,
        outputPath: previewPath
      })

      return sendFileWithOptionalRange(request, reply, previewPath, 'audio/mpeg')
    }
  )

  app.post('/api/projects/:projectId/analyze', async (request, reply) => {
    const params = z
      .object({ projectId: z.string().min(1) })
      .parse(request.params)
    const project = await store.getProject(params.projectId)

    if (!project) {
      throw new ApiError(404, 'PROJECT_NOT_FOUND', 'Project was not found')
    }

    const result = await analyzeProjectAudio({
      storageRoot: apiConfig.storageRoot,
      store,
      project,
      analyzeAudio: apiConfig.analyzeAudio
    })

    reply.send({
      analysis: result.analysis,
      project: projectSchema.parse(result.project)
    })
  })

  app.post('/api/projects/:projectId/render', async (request, reply) => {
    const params = z
      .object({ projectId: z.string().min(1) })
      .parse(request.params)
    const project = await store.getProject(params.projectId)

    if (!project) {
      throw new ApiError(404, 'PROJECT_NOT_FOUND', 'Project was not found')
    }

    const job = await createRenderJob({
      storageRoot: apiConfig.storageRoot,
      store,
      project,
      body: request.body,
      renderLyricVideo: apiConfig.renderLyricVideo,
      muxVideoWithAudio: apiConfig.muxVideoWithAudio
    })

    reply.code(201).send({ job })
  })

  app.get('/api/projects/:projectId/render', async (request) => {
    const params = z
      .object({ projectId: z.string().min(1) })
      .parse(request.params)
    const project = await store.getProject(params.projectId)

    if (!project) {
      throw new ApiError(404, 'PROJECT_NOT_FOUND', 'Project was not found')
    }

    const jobs = await listRenderJobs({
      storageRoot: apiConfig.storageRoot,
      projectId: params.projectId
    })

    return { jobs }
  })

  app.get('/api/projects/:projectId/render/:jobId', async (request) => {
    const params = z
      .object({ projectId: z.string().min(1), jobId: z.string().min(1) })
      .parse(request.params)
    const project = await store.getProject(params.projectId)

    if (!project) {
      throw new ApiError(404, 'PROJECT_NOT_FOUND', 'Project was not found')
    }

    const job = await getRenderJob({
      storageRoot: apiConfig.storageRoot,
      projectId: params.projectId,
      jobId: params.jobId
    })

    return { job }
  })

  app.get(
    '/api/projects/:projectId/render/:jobId/download',
    async (request, reply) => {
      const params = z
        .object({ projectId: z.string().min(1), jobId: z.string().min(1) })
        .parse(request.params)
      const project = await store.getProject(params.projectId)

      if (!project) {
        throw new ApiError(404, 'PROJECT_NOT_FOUND', 'Project was not found')
      }

      const output = await createRenderJobDownload({
        storageRoot: apiConfig.storageRoot,
        projectId: params.projectId,
        jobId: params.jobId
      })

      return reply
        .header('Content-Type', 'video/mp4')
        .header('Content-Length', output.sizeBytes.toString())
        .header(
          'Content-Disposition',
          `attachment; filename="${output.filename}"`
        )
        .send(createReadStream(output.absolutePath))
    }
  )

  if (apiConfig.webDistRoot) {
    const staticHandler = async (
      request: FastifyRequest,
      reply: FastifyReply
    ) => {
      const urlPath = request.url.split('?')[0] ?? '/'

      if (urlPath.startsWith('/api/')) {
        throw new ApiError(404, 'ROUTE_NOT_FOUND', 'Route was not found')
      }

      const staticResponse = await resolveStaticFile(
        apiConfig.webDistRoot as string,
        urlPath
      )

      if (!staticResponse) {
        throw new ApiError(
          404,
          'STATIC_FILE_NOT_FOUND',
          'Static file was not found'
        )
      }

      reply.header('Content-Type', getContentType(staticResponse.path))
      reply.header('Cache-Control', getStaticCacheControl(staticResponse.path))
      return reply.send(createReadStream(staticResponse.path))
    }

    app.get('/', staticHandler)
    app.get('/*', staticHandler)
  }

  return app
}

function summarizeProject(project: unknown) {
  const summary = projectSchema.parse(project)

  return {
    ...summary,
    lyrics: summary.lyrics.slice(0, 3),
    analysis: summary.analysis
      ? {
          duration: summary.analysis.duration,
          bpm: summary.analysis.bpm,
          beats: summary.analysis.beats.slice(0, 8),
          frames: summary.analysis.frames.slice(0, 3),
          unavailableFields: summary.analysis.unavailableFields
        }
      : undefined,
    config: summary.config
      ? {
          ...summary.config,
          audioUrl: undefined,
          coverUrl: undefined,
          lyrics: summary.config.lyrics.slice(0, 3),
          analysis: {
            duration: summary.config.analysis.duration,
            bpm: summary.config.analysis.bpm,
            beats: summary.config.analysis.beats.slice(0, 8),
            frames: summary.config.analysis.frames.slice(0, 3),
            unavailableFields: summary.config.analysis.unavailableFields
          }
        }
      : undefined
  }
}

function readMultipartFieldValue(field: Multipart | Multipart[] | undefined) {
  const firstField = Array.isArray(field) ? field[0] : field

  if (firstField && 'value' in firstField) {
    return firstField.value
  }

  return undefined
}

async function resolveStaticFile(webDistRoot: string, urlPath: string) {
  const root = resolve(webDistRoot)
  const cleanPath = getSafeStaticUrlPath(urlPath)

  if (cleanPath === undefined) {
    return undefined
  }

  const requestedPath = resolve(root, cleanPath || 'index.html')

  if (!isPathInside(root, requestedPath)) {
    return undefined
  }

  const candidates = [requestedPath, join(root, 'index.html')]

  for (const candidate of candidates) {
    const candidateStat = await stat(candidate).catch(() => undefined)

    if (candidateStat?.isFile()) {
      return { path: candidate }
    }
  }

  return undefined
}

function getSafeStaticUrlPath(urlPath: string) {
  try {
    const segments = urlPath
      .split('/')
      .map((segment) => decodeURIComponent(segment))
      .filter(Boolean)

    if (segments.some((segment) => segment === '..' || segment.includes('\\'))) {
      return undefined
    }

    return segments.join('/')
  } catch {
    return undefined
  }
}

function isPathInside(root: string, target: string) {
  const relation = relative(root, target)

  return (
    relation === '' || (!relation.startsWith('..') && !relation.startsWith(sep))
  )
}

function isSortedLyricTimeline(lyrics: Array<{ startTime: number }>) {
  return lyrics.every((line, index) => {
    const previous = lyrics[index - 1]

    return !previous || line.startTime >= previous.startTime
  })
}

function getContentType(filePath: string) {
  const contentTypes: Record<string, string> = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.json': 'application/json; charset=utf-8',
    '.mp4': 'video/mp4'
  }

  return contentTypes[extname(filePath)] ?? 'application/octet-stream'
}

function getStaticCacheControl(filePath: string) {
  if (filePath.includes(`${sep}assets${sep}`)) {
    return 'public, max-age=31536000, immutable'
  }

  return 'no-cache'
}

function getAssetContentType(format: string) {
  const contentTypes: Record<string, string> = {
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    flac: 'audio/flac',
    m4a: 'audio/mp4',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    lrc: 'text/plain; charset=utf-8'
  }

  return contentTypes[format] ?? 'application/octet-stream'
}
