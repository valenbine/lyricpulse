import { z } from 'zod'
import {
  audioFormats,
  coverFormats,
  lyricFormats,
  renderQualities,
  renderJobStatuses,
  renderJobSteps,
  templateIds,
  videoRatios
} from './types'

const isoDateSchema = z.string().datetime({ offset: true })
const idSchema = z.string().min(1)

export const assetKindSchema = z.enum(['audio', 'lyrics', 'cover'])
export const audioFormatSchema = z.enum(audioFormats)
export const lyricFormatSchema = z.enum(lyricFormats)
export const coverFormatSchema = z.enum(coverFormats)
export const videoRatioSchema = z.enum(videoRatios)
export const renderQualitySchema = z.enum(renderQualities)
export const templateIdSchema = z.enum(templateIds)
export const renderJobStatusSchema = z.enum(renderJobStatuses)
export const renderJobStepSchema = z.enum(renderJobSteps)

export const assetMetadataSchema = z.object({
  id: idSchema,
  kind: assetKindSchema,
  filename: z.string().min(1),
  format: z.union([audioFormatSchema, lyricFormatSchema, coverFormatSchema]),
  mimeType: z.string().min(1).optional(),
  sizeBytes: z.number().int().nonnegative(),
  storagePath: z.string().min(1),
  createdAt: isoDateSchema
})

export const lyricLineSchema = z.object({
  id: idSchema,
  startTime: z.number().nonnegative(),
  endTime: z.number().nonnegative().optional(),
  text: z.string()
})

export const audioAnalysisFrameSchema = z.object({
  time: z.number().nonnegative(),
  rms: z.number().nonnegative(),
  loudness: z.number(),
  bass: z.number().nonnegative(),
  mid: z.number().nonnegative(),
  treble: z.number().nonnegative()
})

export const audioAnalysisSchema = z.object({
  duration: z.number().positive(),
  bpm: z.number().positive().optional(),
  beats: z.array(z.number().nonnegative()),
  frames: z.array(audioAnalysisFrameSchema),
  unavailableFields: z
    .array(z.enum(['bpm', 'beats', 'loudness', 'frequencyBands']))
    .optional()
})

export const lyricVideoThemeSchema = z.object({
  primaryColor: z.string().min(1),
  accentColor: z.string().min(1),
  backgroundIntensity: z.number().min(0).max(1),
  fontFamily: z.string().min(1)
})

export const lyricVideoEffectSchema = z.object({
  lyricGlow: z.number().min(0).max(1),
  pulseIntensity: z.number().min(0).max(1),
  beatImpact: z.number().min(0).max(1),
  stageLighting: z.number().min(0).max(1).default(0.75)
})

export const editableObjectIdSchema = z.enum([
  'title',
  'artist',
  'lyrics',
  'activeLyric',
  'cover',
  'background',
  'spectrum'
])

export const templateLayoutBoxSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
  width: z.number().positive(),
  height: z.number().positive(),
  scale: z.number().positive().optional(),
  rotation: z.number().finite().optional(),
  opacity: z.number().min(0).max(1).optional(),
  visible: z.boolean().optional()
})

export const templateTypographySchema = z.object({
  fontFamily: z.string().min(1).optional(),
  fontSize: z.number().positive().optional(),
  fontWeight: z.number().positive().optional(),
  lineHeight: z.number().positive().optional(),
  letterSpacing: z.number().finite().optional(),
  color: z.string().min(1).optional()
})

export const templateObjectSettingsSchema = z.object({
  id: editableObjectIdSchema,
  layout: templateLayoutBoxSchema.optional(),
  typography: templateTypographySchema.optional(),
  style: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional()
})

export const templateRatioSettingsSchema = z.object({
  objects: z.array(templateObjectSettingsSchema)
})

export const templateDefinitionSchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  description: z.string().min(1).optional(),
  schemaVersion: z.literal('1.0'),
  baseTemplateId: templateIdSchema,
  sourceType: z.enum(['custom', 'built-in-override']).optional(),
  ratioSettings: z.partialRecord(videoRatioSchema, templateRatioSettingsSchema),
  theme: lyricVideoThemeSchema.partial().optional(),
  effect: lyricVideoEffectSchema.partial().optional(),
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema,
  publishedAt: isoDateSchema.optional(),
  unpublishedAt: isoDateSchema.optional(),
  deletedAt: isoDateSchema.optional(),
  archivedAt: isoDateSchema.optional()
})

export const lyricVideoConfigSchema = z.object({
  projectId: idSchema,
  ratio: videoRatioSchema,
  renderQuality: renderQualitySchema.default('standard'),
  templateId: templateIdSchema,
  title: z.string().min(1).optional(),
  artist: z.string().min(1).optional(),
  artistEnglish: z.string().min(1).optional(),
  audioAssetId: idSchema,
  audioUrl: z.string().min(1).optional(),
  coverAssetId: idSchema,
  coverUrl: z.string().min(1).optional(),
  lyrics: z.array(lyricLineSchema),
  analysis: audioAnalysisSchema,
  theme: lyricVideoThemeSchema,
  effect: lyricVideoEffectSchema,
  customTemplate: templateDefinitionSchema.optional()
})

export const uploadMetadataSchema = z.object({
  kind: assetKindSchema,
  filename: z.string().min(1),
  sizeBytes: z.number().int().positive(),
  mimeType: z.string().min(1).optional()
})

export const projectSchema = z.object({
  id: idSchema,
  title: z.string().min(1).optional(),
  artist: z.string().min(1).optional(),
  artistEnglish: z.string().min(1).optional(),
  assets: z.array(assetMetadataSchema),
  lyrics: z.array(lyricLineSchema),
  analysis: audioAnalysisSchema.optional(),
  config: lyricVideoConfigSchema.optional(),
  storageProvider: z.enum(['local']),
  renderProvider: z.enum(['local']),
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema
})

export const renderJobSchema = z.object({
  id: idSchema,
  projectId: idSchema,
  config: lyricVideoConfigSchema,
  status: renderJobStatusSchema,
  currentStep: renderJobStepSchema.optional(),
  progress: z.number().min(0).max(1),
  outputPath: z.string().min(1).optional(),
  failureReason: z.string().min(1).optional(),
  failureCode: z.string().min(1).optional(),
  createdAt: isoDateSchema,
  queuedAt: isoDateSchema.optional(),
  startedAt: isoDateSchema.optional(),
  heartbeatAt: isoDateSchema.optional(),
  lastProgressAt: isoDateSchema.optional(),
  finishedAt: isoDateSchema.optional(),
  updatedAt: isoDateSchema
})

export const renderJobRequestSchema = z.object({
  projectId: idSchema,
  config: lyricVideoConfigSchema
})
