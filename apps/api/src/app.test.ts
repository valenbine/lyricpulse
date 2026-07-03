import { mkdir, mkdtemp, stat, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { tmpdir } from 'node:os'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { FastifyInstance } from 'fastify'
import type { AnalyzeAudioFunction } from './analysis'
import type { PreviewAudioForBrowserFunction } from './audio-preview'
import type {
  MuxVideoWithAudioFunction,
  RenderLyricVideoFunction
} from './render-jobs'
import type {
  NormalizeUploadedAudioFunction,
  OptimizeUploadedCoverFunction
} from './uploads'
import { buildApp } from './app'

describe('LyricPulse API', () => {
  let app: FastifyInstance
  let storageRoot: string

  beforeEach(async () => {
    storageRoot = await mkdtemp(join(tmpdir(), 'lyricpulse-api-'))
    const analyzeAudio: AnalyzeAudioFunction = async () => ({
      duration: 8,
      bpm: 120,
      beats: [0, 0.5, 1],
      frames: [
        {
          time: 0,
          rms: 0.5,
          loudness: -14,
          bass: 0.7,
          mid: 0.5,
          treble: 0.3
        }
      ]
    })
    const renderLyricVideo: RenderLyricVideoFunction = async (input) => {
      await mkdir(dirname(input.outputLocation), { recursive: true })
      await writeFile(input.outputLocation, 'fake visual mp4 bytes')
    }
    const muxVideoWithAudio: MuxVideoWithAudioFunction = async (input) => {
      await mkdir(dirname(input.outputPath), { recursive: true })
      await writeFile(
        input.outputPath,
        `muxed:${input.visualVideoPath}:${input.audioPath}`
      )
    }
    const previewAudioForBrowser: PreviewAudioForBrowserFunction = async (
      input
    ) => {
      await mkdir(dirname(input.outputPath), { recursive: true })
      await writeFile(input.outputPath, `preview:${input.inputPath}`)
    }
    const normalizeUploadedAudio: NormalizeUploadedAudioFunction = async (
      input
    ) => ({
      filename: input.filename.replace(/\.[^.]+$/, '.m4a'),
      format: 'm4a',
      mimeType: 'audio/mp4',
      buffer: Buffer.from(`normalized:${input.buffer.toString()}`)
    })
    const optimizeUploadedCover: OptimizeUploadedCoverFunction = async (input) => {
      if (input.filename.startsWith('large-cover')) {
        return {
          filename: 'large-cover.jpg',
          format: 'jpg',
          mimeType: 'image/jpeg',
          buffer: Buffer.from('compressed cover bytes')
        }
      }

      return {
        filename: input.filename,
        format: input.filename.endsWith('.png') ? 'png' : 'jpg',
        mimeType: input.mimeType ?? 'image/png',
        buffer: input.buffer
      }
    }

    app = buildApp({
      storageRoot,
      analyzeAudio,
      renderLyricVideo,
      muxVideoWithAudio,
      previewAudioForBrowser,
      normalizeUploadedAudio,
      optimizeUploadedCover
    })
    await app.ready()
  })

  afterEach(async () => {
    await app.close()
  })

  it('returns health status', async () => {
    const response = await app.inject({ method: 'GET', url: '/health' })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ status: 'ok' })
  })

  it('creates and fetches a project', async () => {
    const createResponse = await app.inject({
      method: 'POST',
      url: '/api/projects',
      payload: {
        title: 'Pulse Song',
        artist: 'Lyric Artist',
        artistEnglish: 'LYRIC ARTIST'
      }
    })

    expect(createResponse.statusCode).toBe(201)
    const createdProject = createResponse.json().project

    expect(createdProject).toMatchObject({
      title: 'Pulse Song',
      artist: 'Lyric Artist',
      artistEnglish: 'LYRIC ARTIST',
      assets: [],
      lyrics: [],
      storageProvider: 'local',
      renderProvider: 'local'
    })

    const fetchResponse = await app.inject({
      method: 'GET',
      url: `/api/projects/${createdProject.id}`
    })

    expect(fetchResponse.statusCode).toBe(200)
    expect(fetchResponse.json().project.id).toBe(createdProject.id)

    const listResponse = await app.inject({
      method: 'GET',
      url: '/api/projects'
    })

    expect(listResponse.statusCode).toBe(200)
    expect(listResponse.json().projects[0].id).toBe(createdProject.id)
  })

  it('updates project lyrics and recalculates end times', async () => {
    const project = await createRenderableProject()

    const response = await app.inject({
      method: 'PUT',
      url: `/api/projects/${project.id}/lyrics`,
      payload: {
        lyrics: [
          { id: 'line-1', startTime: 1.2, endTime: 99, text: '第一句' },
          { id: 'line-2', startTime: 4.1, endTime: 99, text: '第二句' }
        ]
      }
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().project.lyrics).toEqual([
      { id: 'line-1', startTime: 1.2, endTime: 4.1, text: '第一句' },
      { id: 'line-2', startTime: 4.1, text: '第二句' }
    ])
  })

  it('creates, updates, exports, imports, publishes, trashes, restores, and deletes a custom template', async () => {
    const createResponse = await app.inject({
      method: 'POST',
      url: '/api/templates',
      payload: {
        name: '维护流程测试模板',
        description: '测试创建保存导出导入',
        baseTemplateId: 'HeroSplit',
        template: {
          ratioSettings: {
            '9:16': {
              objects: [
                {
                  id: 'lyrics',
                  layout: {
                    x: 58,
                    y: 940,
                    width: 490,
                    height: 440,
                    opacity: 1,
                    visible: true
                  },
                  typography: {
                    fontFamily: 'FangSong, STFangsong, Noto Serif CJK SC, SimSun, serif',
                    fontSize: 78
                  }
                }
              ]
            }
          }
        }
      }
    })

    expect(createResponse.statusCode).toBe(201)
    const createdTemplate = createResponse.json().template

    const updateResponse = await app.inject({
      method: 'PUT',
      url: `/api/templates/${createdTemplate.id}`,
      payload: {
        ...createdTemplate,
        name: '维护流程测试模板已保存',
        ratioSettings: {
          ...createdTemplate.ratioSettings,
          '9:16': {
            objects: [
              {
                ...createdTemplate.ratioSettings['9:16'].objects[0],
                layout: {
                  ...createdTemplate.ratioSettings['9:16'].objects[0].layout,
                  y: 980
                }
              }
            ]
          }
        }
      }
    })

    expect(updateResponse.statusCode).toBe(200)
    expect(updateResponse.json().template).toMatchObject({
      id: createdTemplate.id,
      name: '维护流程测试模板已保存'
    })

    const exportResponse = await app.inject({
      method: 'GET',
      url: `/api/templates/${createdTemplate.id}/export`
    })

    expect(exportResponse.statusCode).toBe(200)
    expect(exportResponse.headers['content-type']).toContain('application/json')

    const exportedTemplate = exportResponse.json()
    const importResponse = await app.inject({
      method: 'POST',
      url: '/api/templates/import',
      payload: {
        ...exportedTemplate,
        id: 'imported-maintenance-template',
        name: '导入维护流程测试模板'
      }
    })

    expect(importResponse.statusCode).toBe(201)
    expect(importResponse.json().template).toMatchObject({
      id: 'imported-maintenance-template',
      name: '导入维护流程测试模板'
    })

    const unpublishResponse = await app.inject({
      method: 'PUT',
      url: `/api/templates/${createdTemplate.id}/unpublish`
    })

    expect(unpublishResponse.statusCode).toBe(200)
    expect(unpublishResponse.json().template.unpublishedAt).toEqual(expect.any(String))

    const publishResponse = await app.inject({
      method: 'PUT',
      url: `/api/templates/${createdTemplate.id}/publish`
    })

    expect(publishResponse.statusCode).toBe(200)
    expect(publishResponse.json().template.publishedAt).toEqual(expect.any(String))
    expect(publishResponse.json().template.unpublishedAt).toBeUndefined()

    const trashResponse = await app.inject({
      method: 'PUT',
      url: `/api/templates/${createdTemplate.id}/trash`
    })

    expect(trashResponse.statusCode).toBe(200)
    expect(trashResponse.json().template.deletedAt).toEqual(expect.any(String))

    const listResponse = await app.inject({
      method: 'GET',
      url: '/api/templates'
    })

    expect(listResponse.statusCode).toBe(200)
    expect(
      listResponse.json().templates.some((template: { id: string }) => template.id === createdTemplate.id)
    ).toBe(false)

    const trashListResponse = await app.inject({
      method: 'GET',
      url: '/api/templates?scope=trash'
    })

    expect(trashListResponse.statusCode).toBe(200)
    expect(
      trashListResponse.json().templates.some((template: { id: string }) => template.id === createdTemplate.id)
    ).toBe(true)

    const restoreResponse = await app.inject({
      method: 'PUT',
      url: `/api/templates/${createdTemplate.id}/restore`
    })

    expect(restoreResponse.statusCode).toBe(200)
    expect(restoreResponse.json().template.deletedAt).toBeUndefined()

    const archivedExportResponse = await app.inject({
      method: 'GET',
      url: `/api/templates/${createdTemplate.id}/export`
    })

    expect(archivedExportResponse.statusCode).toBe(200)
    expect(archivedExportResponse.json().id).toBe(createdTemplate.id)

    await app.inject({
      method: 'PUT',
      url: `/api/templates/${createdTemplate.id}/trash`
    })

    const deleteResponse = await app.inject({
      method: 'DELETE',
      url: `/api/templates/${createdTemplate.id}`
    })

    expect(deleteResponse.statusCode).toBe(200)

    const deletedExportResponse = await app.inject({
      method: 'GET',
      url: `/api/templates/${createdTemplate.id}/export`
    })

    expect(deletedExportResponse.statusCode).toBe(404)
  })

  it('uploads LRC assets and exposes parsed lyric timeline', async () => {
    const project = await createProject()
    const body = createMultipartBody({
      kind: 'lyrics',
      filename: 'song.lrc',
      content: '[00:01.00]First line\n[00:03.50]Second line'
    })

    const uploadResponse = await app.inject({
      method: 'POST',
      url: `/api/projects/${project.id}/assets`,
      headers: body.headers,
      payload: body.payload
    })

    expect(uploadResponse.statusCode).toBe(201)
    const result = uploadResponse.json()

    expect(result.asset).toMatchObject({
      kind: 'lyrics',
      filename: 'song.lrc',
      format: 'lrc',
      sizeBytes: 42
    })
    expect(result.project.lyrics).toEqual([
      {
        id: 'lrc-1-1',
        startTime: 1,
        endTime: 3.5,
        text: 'First line'
      },
      {
        id: 'lrc-2-1',
        startTime: 3.5,
        text: 'Second line'
      }
    ])

    const assetResponse = await app.inject({
      method: 'GET',
      url: `/api/projects/${project.id}/assets/${result.asset.id}`
    })

    expect(assetResponse.statusCode).toBe(200)
    expect(assetResponse.body).toContain('First line')
  })

  it('normalizes non UTF-8 LRC uploads before storage and parsing', async () => {
    const project = await createProject()
    const encodedLyrics = Buffer.from(
      new Uint8Array([
        0x5b, 0x30, 0x30, 0x3a, 0x30, 0x31, 0x2e, 0x30, 0x30, 0x5d,
        0xd6, 0xd0, 0xce, 0xc4, 0xb8, 0xe8, 0xb4, 0xca, 0x0a, 0x5b,
        0x30, 0x30, 0x3a, 0x30, 0x33, 0x2e, 0x35, 0x30, 0x5d, 0xcf,
        0xc2, 0xd2, 0xbb, 0xbe, 0xe4
      ])
    )
    const body = createMultipartBody({
      kind: 'lyrics',
      filename: 'song.lrc',
      content: encodedLyrics
    })

    const uploadResponse = await app.inject({
      method: 'POST',
      url: `/api/projects/${project.id}/assets`,
      headers: body.headers,
      payload: body.payload
    })

    expect(uploadResponse.statusCode).toBe(201)
    const result = uploadResponse.json()

    expect(result.asset).toMatchObject({
      kind: 'lyrics',
      filename: 'song.lrc',
      format: 'lrc',
      mimeType: 'text/plain; charset=utf-8'
    })
    expect(result.project.lyrics).toEqual([
      {
        id: 'lrc-1-1',
        startTime: 1,
        endTime: 3.5,
        text: '中文歌词'
      },
      {
        id: 'lrc-2-1',
        startTime: 3.5,
        text: '下一句'
      }
    ])

    const assetResponse = await app.inject({
      method: 'GET',
      url: `/api/projects/${project.id}/assets/${result.asset.id}`
    })

    expect(assetResponse.statusCode).toBe(200)
    expect(assetResponse.body).toContain('中文歌词')
    expect(assetResponse.body).toContain('下一句')
  })

  it('normalizes UTF-16 LRC uploads before storage and parsing', async () => {
    const project = await createProject()
    const encodedLyrics = Buffer.concat([
      Buffer.from([0xff, 0xfe]),
      Buffer.from('[00:01.00]中文歌词\n[00:03.50]下一句', 'utf16le')
    ])
    const body = createMultipartBody({
      kind: 'lyrics',
      filename: 'song.lrc',
      content: encodedLyrics
    })

    const uploadResponse = await app.inject({
      method: 'POST',
      url: `/api/projects/${project.id}/assets`,
      headers: body.headers,
      payload: body.payload
    })

    expect(uploadResponse.statusCode).toBe(201)
    const result = uploadResponse.json()

    expect(result.asset.mimeType).toBe('text/plain; charset=utf-8')
    expect(result.project.lyrics).toEqual([
      {
        id: 'lrc-1-1',
        startTime: 1,
        endTime: 3.5,
        text: '中文歌词'
      },
      {
        id: 'lrc-2-1',
        startTime: 3.5,
        text: '下一句'
      }
    ])

    const assetResponse = await app.inject({
      method: 'GET',
      url: `/api/projects/${project.id}/assets/${result.asset.id}`
    })

    expect(assetResponse.statusCode).toBe(200)
    expect(assetResponse.body).toContain('中文歌词')
    expect(assetResponse.body).toContain('下一句')
  })

  it('serves browser preview audio for non-stream-friendly history assets', async () => {
    const project = await createProject()
    const uploadedAudioResponse = await uploadAsset({
      projectId: project.id,
      kind: 'audio',
      filename: 'song.flac',
      content: 'fake flac bytes'
    })
    const uploadedAudio = uploadedAudioResponse.json().asset

    const response = await app.inject({
      method: 'GET',
      url: `/api/projects/${project.id}/assets/${uploadedAudio.id}/preview-audio`
    })

    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toContain('audio/mp4')
    expect(response.body).toContain('normalized:fake flac bytes')
  })

  it('supports range requests for preview audio', async () => {
    const project = await createProject()
    const uploadedAudioResponse = await uploadAsset({
      projectId: project.id,
      kind: 'audio',
      filename: 'song.flac',
      content: 'fake flac bytes'
    })
    const uploadedAudio = uploadedAudioResponse.json().asset

    const response = await app.inject({
      method: 'GET',
      url: `/api/projects/${project.id}/assets/${uploadedAudio.id}/preview-audio`,
      headers: {
        range: 'bytes=0-6'
      }
    })

    expect(response.statusCode).toBe(206)
    expect(response.headers['accept-ranges']).toBe('bytes')
    expect(response.headers['content-range']).toMatch(/^bytes 0-6\//)
    expect(response.body).toBe('normali')
  })

  it('normalizes uploaded audio assets to m4a', async () => {
    const project = await createProject()
    const response = await uploadAsset({
      projectId: project.id,
      kind: 'audio',
      filename: 'song.flac',
      content: 'fake flac bytes'
    })

    expect(response.statusCode).toBe(201)
    expect(response.json().asset).toMatchObject({
      filename: 'song.m4a',
      format: 'm4a',
      mimeType: 'audio/mp4'
    })
  })

  it('compresses oversized cover uploads before storage', async () => {
    const project = await createProject()
    const response = await uploadAsset({
      projectId: project.id,
      kind: 'cover',
      filename: 'large-cover.png',
      content: 'placeholder cover bytes'
    })

    expect(response.statusCode).toBe(201)
    expect(response.json().asset).toMatchObject({
      filename: 'large-cover.jpg',
      format: 'jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 'compressed cover bytes'.length
    })
  })

  it('deletes projects together with uploaded assets and generated artifacts', async () => {
    const project = await createProject()
    const uploadedAudioResponse = await uploadAsset({
      projectId: project.id,
      kind: 'audio',
      filename: 'song.flac',
      content: 'fake flac bytes'
    })
    const uploadedAudio = uploadedAudioResponse.json().asset
    await uploadAsset({
      projectId: project.id,
      kind: 'lyrics',
      filename: 'song.lrc',
      content: '[00:01.00]First line\n[00:03.50]Second line'
    })
    await uploadAsset({
      projectId: project.id,
      kind: 'cover',
      filename: 'cover.png',
      content: 'fake cover bytes'
    })

    await app.inject({
      method: 'GET',
      url: `/api/projects/${project.id}/assets/${uploadedAudio.id}/preview-audio`
    })
    await app.inject({
      method: 'POST',
      url: `/api/projects/${project.id}/analyze`
    })

    const createRenderResponse = await app.inject({
      method: 'POST',
      url: `/api/projects/${project.id}/render`,
      payload: {
        ratio: '9:16',
        renderQuality: 'standard',
        templateId: 'NeonLyric',
        theme: {
          primaryColor: '#8B5CF6',
          accentColor: '#22C55E',
          backgroundIntensity: 0.85,
          fontFamily: 'Poppins, sans-serif'
        },
        effect: {
          lyricGlow: 0.8,
          pulseIntensity: 0.75,
          beatImpact: 0.7,
          stageLighting: 0.75
        }
      }
    })
    const renderJob = await waitForRenderJob(
      project.id,
      createRenderResponse.json().job.id
    )

    expect(renderJob.status).toBe('succeeded')

    const deleteResponse = await app.inject({
      method: 'DELETE',
      url: `/api/projects/${project.id}`
    })

    expect(deleteResponse.statusCode).toBe(200)
    expect(deleteResponse.json()).toEqual({ projectId: project.id })

    const fetchResponse = await app.inject({
      method: 'GET',
      url: `/api/projects/${project.id}`
    })

    expect(fetchResponse.statusCode).toBe(404)

    const listResponse = await app.inject({
      method: 'GET',
      url: '/api/projects'
    })

    expect(listResponse.json().projects).toEqual([])

    await expect(
      stat(join(storageRoot, 'uploads', project.id, 'audio', `${uploadedAudio.id}.m4a`))
    ).rejects.toMatchObject({ code: 'ENOENT' })
    await expect(
      stat(join(storageRoot, 'preview-audio', project.id, `${uploadedAudio.id}.mp3`))
    ).rejects.toMatchObject({ code: 'ENOENT' })
    await expect(stat(join(storageRoot, 'render-jobs', project.id))).rejects.toMatchObject({
      code: 'ENOENT'
    })
    await expect(stat(join(storageRoot, 'outputs', project.id))).rejects.toMatchObject({
      code: 'ENOENT'
    })
  })

  it('rejects unsupported asset formats', async () => {
    const project = await createProject()
    const body = createMultipartBody({
      kind: 'audio',
      filename: 'song.txt',
      content: 'not audio'
    })

    const response = await app.inject({
      method: 'POST',
      url: `/api/projects/${project.id}/assets`,
      headers: body.headers,
      payload: body.payload
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toMatchObject({
      code: 'UNSUPPORTED_ASSET_FORMAT',
      message: 'Unsupported asset format'
    })
  })

  it('analyzes uploaded audio and stores analysis on the project', async () => {
    const project = await createProject()
    await uploadAsset({
      projectId: project.id,
      kind: 'audio',
      filename: 'song.mp3',
      content: 'fake audio bytes'
    })

    const response = await app.inject({
      method: 'POST',
      url: `/api/projects/${project.id}/analyze`
    })

    expect(response.statusCode).toBe(200)
    const result = response.json()

    expect(result.analysis).toMatchObject({
      duration: 8,
      bpm: 120,
      beats: [0, 0.5, 1]
    })
    expect(result.project.analysis).toMatchObject({ duration: 8, bpm: 120 })
  })

  it('requires an audio asset before analysis', async () => {
    const project = await createProject()

    const response = await app.inject({
      method: 'POST',
      url: `/api/projects/${project.id}/analyze`
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toEqual({
      code: 'AUDIO_ASSET_REQUIRED',
      message: 'Audio asset is required'
    })
  })

  it('creates render jobs and exposes finished MP4 downloads', async () => {
    const project = await createProject()
    await uploadAsset({
      projectId: project.id,
      kind: 'audio',
      filename: 'song.mp3',
      content: 'fake audio bytes'
    })
    await uploadAsset({
      projectId: project.id,
      kind: 'lyrics',
      filename: 'song.lrc',
      content: '[00:01.00]First line\n[00:03.50]Second line'
    })
    await uploadAsset({
      projectId: project.id,
      kind: 'cover',
      filename: 'cover.png',
      content: 'fake cover bytes'
    })
    await app.inject({
      method: 'POST',
      url: `/api/projects/${project.id}/analyze`
    })

    const createResponse = await app.inject({
      method: 'POST',
      url: `/api/projects/${project.id}/render`,
      payload: {
        ratio: '9:16',
        templateId: 'NeonLyric',
        theme: {
          primaryColor: '#8B5CF6',
          accentColor: '#22C55E',
          backgroundIntensity: 0.85,
          fontFamily: 'Poppins, sans-serif'
        },
        effect: {
          lyricGlow: 0.8,
          pulseIntensity: 0.75,
          beatImpact: 0.7,
          stageLighting: 0.75
        }
      }
    })

    expect(createResponse.statusCode).toBe(201)
    const createdJob = createResponse.json().job

    expect(createdJob).toMatchObject({
      projectId: project.id,
      status: 'created',
      currentStep: 'queued',
      progress: 0,
      queuedAt: expect.any(String),
      heartbeatAt: expect.any(String),
      config: {
        ratio: '9:16',
        renderQuality: 'standard',
        templateId: 'NeonLyric'
      }
    })
    expect(createdJob.config.coverUrl).toBe(
      `http://127.0.0.1:3001/api/projects/${project.id}/assets/${createdJob.config.coverAssetId}`
    )

    const finishedJob = await waitForRenderJob(project.id, createdJob.id)

    expect(finishedJob).toMatchObject({
      status: 'succeeded',
      currentStep: 'completed',
      progress: 1,
      startedAt: expect.any(String),
      lastProgressAt: expect.any(String),
      finishedAt: expect.any(String)
    })

    const downloadResponse = await app.inject({
      method: 'GET',
      url: `/api/projects/${project.id}/render/${createdJob.id}/download`
    })

    expect(downloadResponse.statusCode).toBe(200)
    expect(downloadResponse.headers['content-type']).toContain('video/mp4')
    expect(downloadResponse.headers['content-disposition']).toContain(
      `${createdJob.id}.mp4`
    )
    expect(downloadResponse.headers['content-length']).toBeTruthy()
    expect(Number(downloadResponse.headers['content-length'])).toBeGreaterThan(0)

    const listResponse = await app.inject({
      method: 'GET',
      url: `/api/projects/${project.id}/render`
    })

    expect(listResponse.statusCode).toBe(200)
    expect(listResponse.json().jobs[0]).toMatchObject({
      id: createdJob.id,
      status: 'succeeded'
    })
  })

  it('filters lyric lines that contain the artist name before rendering', async () => {
    const project = await createProject({
      title: 'Artist Filter Song',
      artist: '周杰伦',
      artistEnglish: 'JAY CHOU'
    })
    await uploadAsset({
      projectId: project.id,
      kind: 'audio',
      filename: 'song.mp3',
      content: 'fake audio bytes'
    })
    await uploadAsset({
      projectId: project.id,
      kind: 'lyrics',
      filename: 'song.lrc',
      content:
        '[00:01.00]今夜只想听周杰伦\n[00:03.50]副歌继续往前走\n[00:05.00]Jay Chou on the mic'
    })
    await uploadAsset({
      projectId: project.id,
      kind: 'cover',
      filename: 'cover.png',
      content: 'fake cover bytes'
    })
    await app.inject({
      method: 'POST',
      url: `/api/projects/${project.id}/analyze`
    })

    const createResponse = await app.inject({
      method: 'POST',
      url: `/api/projects/${project.id}/render`,
      payload: {
        ratio: '9:16',
        renderQuality: 'standard',
        templateId: 'NeonLyric',
        artist: '周杰伦',
        artistEnglish: 'JAY CHOU',
        theme: {
          primaryColor: '#8B5CF6',
          accentColor: '#22C55E',
          backgroundIntensity: 0.85,
          fontFamily: 'Poppins, sans-serif'
        },
        effect: {
          lyricGlow: 0.8,
          pulseIntensity: 0.75,
          beatImpact: 0.7,
          stageLighting: 0.75
        }
      }
    })

    expect(createResponse.statusCode).toBe(201)
    expect(createResponse.json().job.config.artist).toBe('周杰伦JAY CHOU')
    expect(createResponse.json().job.config.lyrics).toEqual([
      {
        id: 'lrc-2-1',
        startTime: 3.5,
        endTime: 5,
        text: '副歌继续往前走'
      },
      {
        id: 'lrc-3-1',
        startTime: 5,
        text: 'Jay Chou on the mic'
      }
    ])
  })

  it('skips coverUrl for random poster templates that hide the cover artwork', async () => {
    const project = await createRenderableProject()

    const response = await app.inject({
      method: 'POST',
      url: `/api/projects/${project.id}/render`,
      payload: {
        ratio: '9:16',
        renderQuality: 'standard',
        templateId: 'OrbitWords',
        theme: {
          primaryColor: '#8B5CF6',
          accentColor: '#22C55E',
          backgroundIntensity: 0.85,
          fontFamily: 'Poppins, sans-serif'
        },
        effect: {
          lyricGlow: 0.8,
          pulseIntensity: 0.75,
          beatImpact: 0.7,
          stageLighting: 0.75
        }
      }
    })

    expect(response.statusCode).toBe(201)
    expect(response.json().job.config.coverUrl).toBeUndefined()
  })

  it('rejects a second render job while one is already running', async () => {
    const project = await createRenderableProject()

    const firstResponse = await createRenderRequest(project.id)
    const secondResponse = await createRenderRequest(project.id)

    expect(firstResponse.statusCode).toBe(201)
    expect(secondResponse.statusCode).toBe(409)
    expect(secondResponse.json()).toEqual({
      code: 'RENDER_JOB_IN_PROGRESS',
      message: 'A render job is already in progress for this project'
    })
  })

  it('persists draft render quality in render jobs', async () => {
    const project = await createRenderableProject()

    const response = await app.inject({
      method: 'POST',
      url: `/api/projects/${project.id}/render`,
      payload: {
        ratio: '9:16',
        renderQuality: 'draft',
        templateId: 'NeonLyric',
        theme: {
          primaryColor: '#8B5CF6',
          accentColor: '#22C55E',
          backgroundIntensity: 0.85,
          fontFamily: 'Poppins, sans-serif'
        },
        effect: {
          lyricGlow: 0.8,
          pulseIntensity: 0.75,
          beatImpact: 0.7,
          stageLighting: 0.75
        }
      }
    })

    expect(response.statusCode).toBe(201)
    expect(response.json().job.config.renderQuality).toBe('draft')
  })

  it('serves production web assets from a configured dist folder', async () => {
    await app.close()

    const storageRoot = await mkdtemp(join(tmpdir(), 'lyricpulse-api-'))
    const webDistRoot = await mkdtemp(join(tmpdir(), 'lyricpulse-web-'))
    await writeFile(join(webDistRoot, 'index.html'), '<div id="root"></div>')
    await writeFile(join(webDistRoot, 'app.js'), 'console.log("LyricPulse")')

    app = buildApp({ storageRoot, webDistRoot })
    await app.ready()

    const assetResponse = await app.inject({ method: 'GET', url: '/app.js' })
    const spaResponse = await app.inject({ method: 'GET', url: '/studio/demo' })
    const apiResponse = await app.inject({ method: 'GET', url: '/api/unknown' })

    expect(assetResponse.statusCode).toBe(200)
    expect(assetResponse.headers['content-type']).toContain('text/javascript')
    expect(spaResponse.statusCode).toBe(200)
    expect(spaResponse.body).toContain('root')
    expect(apiResponse.statusCode).toBe(404)
  })

  it('returns not found for unknown projects', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/projects/missing-project'
    })

    expect(response.statusCode).toBe(404)
    expect(response.json()).toEqual({
      code: 'PROJECT_NOT_FOUND',
      message: 'Project was not found'
    })
  })

  it('skips invalid render job files when listing project jobs', async () => {
    const project = await createProject()
    const jobsRoot = join(storageRoot, 'render-jobs', project.id)
    await mkdir(jobsRoot, { recursive: true })
    await writeFile(join(jobsRoot, 'empty.json'), '')

    const response = await app.inject({
      method: 'GET',
      url: `/api/projects/${project.id}/render`
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ jobs: [] })
  })

  it('marks stale interrupted render jobs as failed', async () => {
    const project = await createProject()
    const staleJob = {
      id: 'stale-render',
      projectId: project.id,
      config: {
        projectId: project.id,
        ratio: '9:16',
        templateId: 'NeonLyric',
        title: 'Stale Song',
        artist: 'Stale Artist',
        audioAssetId: 'audio-asset',
        coverAssetId: 'cover-asset',
        lyrics: [{ id: 'line-1', startTime: 1, text: 'First line' }],
        analysis: { duration: 8, beats: [], frames: [] },
        theme: {
          primaryColor: '#8B5CF6',
          accentColor: '#22C55E',
          backgroundIntensity: 0.85,
          fontFamily: 'Poppins, sans-serif'
        },
        effect: {
          lyricGlow: 0.8,
          pulseIntensity: 0.75,
          beatImpact: 0.7,
          stageLighting: 0.75
        }
      },
      status: 'rendering',
      progress: 0.4,
      createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString()
    }
    const jobsRoot = join(storageRoot, 'render-jobs', project.id)
    await mkdir(jobsRoot, { recursive: true })
    await writeFile(join(jobsRoot, `${staleJob.id}.json`), JSON.stringify(staleJob))

    const response = await app.inject({
      method: 'GET',
      url: `/api/projects/${project.id}/render`
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().jobs[0]).toMatchObject({
      id: staleJob.id,
      status: 'failed',
      currentStep: 'failed',
      progress: 1,
      failureCode: 'RENDER_STALE',
      finishedAt: expect.any(String),
      failureReason: 'Render process was interrupted before completion'
    })
  })

  async function createProject(
    payload: { title?: string; artist?: string; artistEnglish?: string } = {}
  ) {
    const response = await app.inject({
      method: 'POST',
      url: '/api/projects',
      payload
    })

    return response.json().project as { id: string }
  }

  async function createRenderableProject() {
    const project = await createProject()
    await uploadAsset({
      projectId: project.id,
      kind: 'audio',
      filename: 'song.mp3',
      content: 'fake audio bytes'
    })
    await uploadAsset({
      projectId: project.id,
      kind: 'lyrics',
      filename: 'song.lrc',
      content: '[00:01.00]First line\n[00:03.50]Second line'
    })
    await uploadAsset({
      projectId: project.id,
      kind: 'cover',
      filename: 'cover.png',
      content: 'fake cover bytes'
    })
    await app.inject({
      method: 'POST',
      url: `/api/projects/${project.id}/analyze`
    })

    return project
  }

  function createRenderRequest(projectId: string) {
    return app.inject({
      method: 'POST',
      url: `/api/projects/${projectId}/render`,
      payload: {
        ratio: '9:16',
        renderQuality: 'standard',
        templateId: 'NeonLyric',
        theme: {
          primaryColor: '#8B5CF6',
          accentColor: '#22C55E',
          backgroundIntensity: 0.85,
          fontFamily: 'Poppins, sans-serif'
        },
        effect: {
          lyricGlow: 0.8,
          pulseIntensity: 0.75,
          beatImpact: 0.7,
          stageLighting: 0.75
        }
      }
    })
  }

  async function uploadAsset(input: {
    projectId: string
    kind: string
    filename: string
    content: string
  }) {
    const body = createMultipartBody(input)

    return app.inject({
      method: 'POST',
      url: `/api/projects/${input.projectId}/assets`,
      headers: body.headers,
      payload: body.payload
    })
  }

  async function waitForRenderJob(projectId: string, jobId: string) {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const response = await app.inject({
        method: 'GET',
        url: `/api/projects/${projectId}/render/${jobId}`
      })
      const job = response.json().job

      if (job.status === 'succeeded' || job.status === 'failed') {
        return job
      }

      await new Promise((resolve) => setTimeout(resolve, 10))
    }

    throw new Error('Render job did not finish')
  }
})

function createMultipartBody(input: {
  kind: string
  filename: string
  content: string | Buffer
}) {
  const boundary = `----lyricpulse-${Date.now()}`
  const fileContent = Buffer.isBuffer(input.content)
    ? input.content
    : Buffer.from(input.content)
  const payload = Buffer.concat(
    [
      Buffer.from(
        [
          `--${boundary}`,
          'Content-Disposition: form-data; name="kind"',
          '',
          input.kind,
          `--${boundary}`,
          `Content-Disposition: form-data; name="file"; filename="${input.filename}"`,
          'Content-Type: application/octet-stream',
          ''
        ].join('\r\n') + '\r\n'
      ),
      fileContent,
      Buffer.from(`\r\n--${boundary}--\r\n`)
    ]
  )

  return {
    headers: {
      'content-type': `multipart/form-data; boundary=${boundary}`,
      'content-length': payload.byteLength.toString()
    },
    payload
  }
}
