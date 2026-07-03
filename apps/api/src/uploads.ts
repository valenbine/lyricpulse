import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { basename, extname, join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { tmpdir } from 'node:os'
import type { MultipartFile } from '@fastify/multipart'
import { nodeCommandRunner } from '@lyricpulse/audio-analysis'
import {
  audioFormats,
  coverFormats,
  lyricFormats,
  parseLrc,
  type AssetKind,
  type AssetMetadata,
  type CoverFormat,
  type LyricFormat,
  type Project
} from '@lyricpulse/core'
import { ApiError } from './errors'
import type { ProjectStore } from './projects'

const supportedFormatsByKind = {
  audio: audioFormats,
  lyrics: lyricFormats,
  cover: coverFormats
} as const

const maxCoverBytes = 5 * 1024 * 1024

export type NormalizeUploadedAudioFunction = (input: {
  filename: string
  mimeType?: string
  buffer: Buffer
}) => Promise<{
  filename: string
  format: AssetMetadata['format']
  mimeType: string
  buffer: Buffer
}>

export type OptimizeUploadedCoverFunction = (input: {
  filename: string
  mimeType?: string
  buffer: Buffer
}) => Promise<{
  filename: string
  format: AssetMetadata['format']
  mimeType: string
  buffer: Buffer
}>

export async function saveUploadedAsset(input: {
  storageRoot: string
  store: ProjectStore
  project: Project
  kind: AssetKind
  file: MultipartFile
  normalizeUploadedAudio: NormalizeUploadedAudioFunction
  optimizeUploadedCover: OptimizeUploadedCoverFunction
}): Promise<{ asset: AssetMetadata; project: Project }> {
  const format = getFileFormat(input.file.filename)
  const allowedFormats = supportedFormatsByKind[input.kind]

  if (!allowedFormats.includes(format as never)) {
    throw new ApiError(
      400,
      'UNSUPPORTED_ASSET_FORMAT',
      'Unsupported asset format',
      {
        filename: input.file.filename,
        kind: input.kind,
        supportedFormats: [...allowedFormats]
      }
    )
  }

  const sourceBuffer = await input.file.toBuffer()
  const preparedAsset = await prepareAssetForStorage({
    kind: input.kind,
    filename: input.file.filename,
    mimeType: input.file.mimetype,
    buffer: sourceBuffer,
    normalizeUploadedAudio: input.normalizeUploadedAudio,
    optimizeUploadedCover: input.optimizeUploadedCover
  })
  const assetId = randomUUID()
  const storedFilename = `${assetId}.${preparedAsset.format}`
  const relativePath = join(
    'uploads',
    input.project.id,
    input.kind,
    storedFilename
  )
  const absolutePath = join(input.storageRoot, relativePath)

  await mkdir(
    join(input.storageRoot, 'uploads', input.project.id, input.kind),
    {
      recursive: true
    }
  )
  await writeFile(absolutePath, preparedAsset.buffer)

  const asset: AssetMetadata = {
    id: assetId,
    kind: input.kind,
    filename: preparedAsset.filename,
    format: preparedAsset.format,
    mimeType: preparedAsset.mimeType,
    sizeBytes: preparedAsset.buffer.byteLength,
    storagePath: relativePath,
    createdAt: new Date().toISOString()
  }

  const projectWithAsset = await input.store.addAsset(input.project.id, asset)

  if (input.kind !== 'lyrics') {
    return { asset, project: projectWithAsset }
  }

  const lyrics = parseLrc(preparedAsset.buffer.toString('utf8'))
  const projectWithLyrics = await input.store.saveProject({
    ...projectWithAsset,
    lyrics: lyrics.lines
  })

  return { asset, project: projectWithLyrics }
}

export function getAssetKind(value: unknown): AssetKind {
  if (value === 'audio' || value === 'lyrics' || value === 'cover') {
    return value
  }

  throw new ApiError(400, 'INVALID_ASSET_KIND', 'Invalid asset kind', {
    supportedKinds: ['audio', 'lyrics', 'cover']
  })
}

export function getFileFormat(
  filename: string
): (typeof audioFormats)[number] | LyricFormat | CoverFormat | string {
  return extname(filename).replace('.', '').toLowerCase()
}

async function prepareAssetForStorage(input: {
  kind: AssetKind
  filename: string
  mimeType?: string
  buffer: Buffer
  normalizeUploadedAudio: NormalizeUploadedAudioFunction
  optimizeUploadedCover: OptimizeUploadedCoverFunction
}) {
  if (input.kind === 'audio') {
    return input.normalizeUploadedAudio(input)
  }

  if (input.kind === 'cover') {
    return input.optimizeUploadedCover(input)
  }

  if (input.kind === 'lyrics') {
    return normalizeUploadedLyrics(input)
  }

  return {
    filename: input.filename,
    format: getFileFormat(input.filename) as AssetMetadata['format'],
    mimeType: input.mimeType ?? 'application/octet-stream',
    buffer: input.buffer
  }
}

function normalizeUploadedLyrics(input: {
  filename: string
  mimeType?: string
  buffer: Buffer
}) {
  const text = decodeLyricsText(input.buffer)

  return {
    filename: input.filename,
    format: getFileFormat(input.filename) as AssetMetadata['format'],
    mimeType: 'text/plain; charset=utf-8',
    buffer: Buffer.from(text, 'utf8')
  }
}

function decodeLyricsText(buffer: Buffer) {
  if (hasPrefix(buffer, [0xef, 0xbb, 0xbf])) {
    return new TextDecoder('utf-8').decode(buffer.subarray(3))
  }

  if (hasPrefix(buffer, [0xff, 0xfe])) {
    return new TextDecoder('utf-16le').decode(buffer.subarray(2))
  }

  if (hasPrefix(buffer, [0xfe, 0xff])) {
    return new TextDecoder('utf-16be').decode(buffer.subarray(2))
  }

  if (looksLikeUtf16(buffer)) {
    return new TextDecoder(getUtf16Encoding(buffer)).decode(buffer)
  }

  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(buffer)
    return text.includes('\uFFFD') ? new TextDecoder('gb18030').decode(buffer) : text
  } catch {
    return new TextDecoder('gb18030').decode(buffer)
  }
}

function hasPrefix(buffer: Buffer, prefix: number[]) {
  return prefix.every((byte, index) => buffer[index] === byte)
}

function looksLikeUtf16(buffer: Buffer) {
  if (buffer.byteLength < 4) {
    return false
  }

  const sampleLength = Math.min(buffer.byteLength, 200)
  let evenNulls = 0
  let oddNulls = 0

  for (let index = 0; index < sampleLength; index += 1) {
    if (buffer[index] === 0) {
      if (index % 2 === 0) {
        evenNulls += 1
      } else {
        oddNulls += 1
      }
    }
  }

  return Math.max(evenNulls, oddNulls) >= sampleLength / 8
}

function getUtf16Encoding(buffer: Buffer) {
  const sampleLength = Math.min(buffer.byteLength, 200)
  let evenNulls = 0
  let oddNulls = 0

  for (let index = 0; index < sampleLength; index += 1) {
    if (buffer[index] === 0) {
      if (index % 2 === 0) {
        evenNulls += 1
      } else {
        oddNulls += 1
      }
    }
  }

  return oddNulls >= evenNulls ? 'utf-16le' : 'utf-16be'
}

export const normalizeUploadedAudio: NormalizeUploadedAudioFunction = async (
  input
) => {
  return runInTemporaryUploadWorkspace(input.filename, input.buffer, async (paths) => {
    await nodeCommandRunner('ffmpeg', [
      '-y',
      '-i',
      paths.inputPath,
      '-vn',
      '-c:a',
      'aac',
      '-b:a',
      '192k',
      '-movflags',
      '+faststart',
      paths.outputPath('normalized.m4a')
    ])

    return {
      filename: replaceExtension(input.filename, 'm4a'),
      format: 'm4a',
      mimeType: 'audio/mp4',
      buffer: await readFile(paths.outputPath('normalized.m4a'))
    }
  })
}

export const optimizeUploadedCover: OptimizeUploadedCoverFunction = async (
  input
) => {
  if (input.buffer.byteLength <= maxCoverBytes) {
    return {
      filename: input.filename,
      format: getFileFormat(input.filename) as AssetMetadata['format'],
      mimeType: input.mimeType ?? 'application/octet-stream',
      buffer: input.buffer
    }
  }

  return runInTemporaryUploadWorkspace(input.filename, input.buffer, async (paths) => {
    const widths = [2048, 1600, 1280, 960, 720, 540]
    const qualities = [3, 5, 8, 12, 18, 24, 30]
    let fallbackBuffer: Buffer | undefined

    for (const width of widths) {
      for (const quality of qualities) {
        const candidateName = `cover-${width}-${quality}.jpg`
        const candidatePath = paths.outputPath(candidateName)

        await nodeCommandRunner('ffmpeg', [
          '-y',
          '-i',
          paths.inputPath,
          '-vf',
          `scale=min(${width}\\,iw):-2:flags=lanczos,format=yuvj420p`,
          '-frames:v',
          '1',
          '-q:v',
          String(quality),
          candidatePath
        ])

        const candidateBuffer = await readFile(candidatePath)
        fallbackBuffer = candidateBuffer

        if (candidateBuffer.byteLength <= maxCoverBytes) {
          return {
            filename: replaceExtension(input.filename, 'jpg'),
            format: 'jpg',
            mimeType: 'image/jpeg',
            buffer: candidateBuffer
          }
        }
      }
    }

    if (fallbackBuffer) {
      return {
        filename: replaceExtension(input.filename, 'jpg'),
        format: 'jpg',
        mimeType: 'image/jpeg',
        buffer: fallbackBuffer
      }
    }

    throw new ApiError(500, 'COVER_OPTIMIZATION_FAILED', 'Cover optimization failed')
  })
}

async function runInTemporaryUploadWorkspace<T>(
  filename: string,
  buffer: Buffer,
  work: (paths: {
    inputPath: string
    outputPath: (name: string) => string
  }) => Promise<T>
) {
  const root = await mkdtemp(join(tmpdir(), 'lyricpulse-upload-'))
  const inputPath = join(root, basename(filename) || 'upload.bin')

  await writeFile(inputPath, buffer)

  try {
    return await work({
      inputPath,
      outputPath: (name) => join(root, name)
    })
  } finally {
    await rm(root, { recursive: true, force: true })
  }
}

function replaceExtension(filename: string, extension: string) {
  const base = filename.replace(/\.[^.]+$/, '') || filename
  return `${base}.${extension}`
}
