import type {
  AssetKind,
  AudioAnalysis,
  LyricLine,
  LyricVideoEffect,
  LyricVideoTheme,
  Project,
  RenderJob,
  RenderQuality,
  TemplateDefinition,
  TemplateId,
  VideoRatio
} from '@lyricpulse/core'

type ProjectResponse = {
  project: Project
}

type ProjectsResponse = {
  projects: Project[]
}

type DeleteProjectResponse = {
  projectId: string
}

type AnalysisResponse = ProjectResponse & {
  analysis: AudioAnalysis
}

type RenderJobResponse = {
  job: RenderJob
}

type RenderJobsResponse = {
  jobs: RenderJob[]
}

type TemplateResponse = {
  template: TemplateDefinition
}

type TemplatesResponse = {
  templates: TemplateDefinition[]
}

export async function listTemplates(scope: 'active' | 'trash' | 'all' = 'active') {
  return request<TemplatesResponse>(`/api/templates?scope=${scope}`)
}

export async function createTemplate(input: {
  name: string
  description?: string
  baseTemplateId: TemplateId
  sourceType?: 'custom' | 'built-in-override'
  template?: Partial<TemplateDefinition>
}) {
  return request<TemplateResponse>('/api/templates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  })
}

export async function updateTemplate(template: TemplateDefinition) {
  return request<TemplateResponse>(`/api/templates/${template.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(template)
  })
}

export async function archiveTemplate(templateId: string) {
  return request<TemplateResponse>(`/api/templates/${templateId}/archive`, {
    method: 'PUT'
  })
}

export async function publishTemplate(templateId: string) {
  return request<TemplateResponse>(`/api/templates/${templateId}/publish`, {
    method: 'PUT'
  })
}

export async function unpublishTemplate(templateId: string) {
  return request<TemplateResponse>(`/api/templates/${templateId}/unpublish`, {
    method: 'PUT'
  })
}

export async function trashTemplate(templateId: string) {
  return request<TemplateResponse>(`/api/templates/${templateId}/trash`, {
    method: 'PUT'
  })
}

export async function restoreTemplate(templateId: string) {
  return request<TemplateResponse>(`/api/templates/${templateId}/restore`, {
    method: 'PUT'
  })
}

export async function deleteTemplate(templateId: string) {
  return request<TemplateResponse>(`/api/templates/${templateId}`, {
    method: 'DELETE'
  })
}

export async function importTemplate(template: unknown) {
  return request<TemplateResponse>('/api/templates/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(template)
  })
}

export async function listProjects() {
  return request<ProjectsResponse>('/api/projects')
}

export async function getProject(projectId: string) {
  return request<ProjectResponse>(`/api/projects/${projectId}`)
}

export async function deleteProject(projectId: string) {
  return request<DeleteProjectResponse>(`/api/projects/${projectId}`, {
    method: 'DELETE'
  })
}

export async function updateProjectLyrics(projectId: string, lyrics: LyricLine[]) {
  return request<ProjectResponse>(`/api/projects/${projectId}/lyrics`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lyrics })
  })
}

export async function createProject(input: {
  title: string
  artist: string
  artistEnglish?: string
}) {
  return request<ProjectResponse>('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: input.title || undefined,
      artist: input.artist || undefined,
      artistEnglish: input.artistEnglish || undefined
    })
  })
}

export async function uploadAsset(
  projectId: string,
  kind: AssetKind,
  file: File
) {
  const formData = new FormData()
  formData.append('kind', kind)
  formData.append('file', file)

  return request<ProjectResponse>(`/api/projects/${projectId}/assets`, {
    method: 'POST',
    body: formData
  })
}

export async function analyzeProject(projectId: string) {
  return request<AnalysisResponse>(`/api/projects/${projectId}/analyze`, {
    method: 'POST'
  })
}

export async function createRenderJob(
  projectId: string,
  input: {
    ratio: VideoRatio
    renderQuality?: RenderQuality
    templateId: TemplateId
    title?: string
    artist?: string
    artistEnglish?: string
    theme: LyricVideoTheme
    effect: LyricVideoEffect
    customTemplate?: TemplateDefinition
  }
) {
  return request<RenderJobResponse>(`/api/projects/${projectId}/render`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input)
  })
}

export async function getRenderJob(projectId: string, jobId: string) {
  return request<RenderJobResponse>(
    `/api/projects/${projectId}/render/${jobId}`
  )
}

export async function listRenderJobs(projectId: string) {
  return request<RenderJobsResponse>(`/api/projects/${projectId}/render`)
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init)
  const payload = (await response.json().catch(() => null)) as unknown

  if (!response.ok) {
    const message =
      payload &&
      typeof payload === 'object' &&
      'message' in payload &&
      typeof payload.message === 'string'
        ? payload.message
        : `Request failed with status ${response.status}`
    throw new Error(message)
  }

  return payload as T
}
