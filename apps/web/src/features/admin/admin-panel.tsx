import { SlidersHorizontal } from 'lucide-react'
import { lazy, Suspense, useEffect, useState, type PointerEvent as ReactPointerEvent } from 'react'
import {
  formatArtistDisplay,
  templateIds,
  videoRatios,
  type TemplateDefinition,
  type TemplateId,
  type TemplateTypography,
  type VideoRatio
} from '@lyricpulse/core'
import { heroSplitFrameInsets } from '@lyricpulse/video'
import {
  createTemplate,
  deleteTemplate,
  importTemplate,
  listTemplates,
  publishTemplate,
  restoreTemplate,
  trashTemplate,
  unpublishTemplate,
  updateTemplate
} from '../../api'
import { Button } from '../../components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { cn } from '../../lib/utils'
import { ControlGroup, Field, NumberField } from '../../components/form-controls'
import {
  createTemplateDraft,
  createTemplateInspectorPreviewConfig,
  createTemplateObjectSettings,
  editableObjectLabels,
  getDefaultObjectSettings,
  getTemplateEditorObjects,
  getTemplateObjectSettings,
  normalizeTemplateEditorObjects,
  supportsObjectEditor,
  type TemplateEditorObjectId,
  updateTemplateObjectSettings
} from './template-editor-helpers'
import {
  defaultArtistEnglishName,
  defaultArtistName,
  defaultSongTitle,
  getTemplateCopy,
  isRandomPosterTemplate,
  isTemplatePublished,
  previewFallbackCoverUrl,
  previewFontStack,
  sampleLyrics,
} from '../templates/catalog'

const RemotionPreview = lazy(() =>
  import('../../components/remotion-preview').then((module) => ({
    default: module.RemotionPreview
  }))
)

export type AdminPanelProps = {
  ratio: VideoRatio
  setRatio: (ratio: VideoRatio) => void
  setTemplateId: (templateId: TemplateId) => void
  customTemplates: TemplateDefinition[]
  selectedCustomTemplateId?: string
  setSelectedCustomTemplateId: (templateId: string | undefined) => void
  setCustomTemplates: (templates: TemplateDefinition[]) => void
}

export default function AdminPanel({
  ratio,
  setRatio,
  setTemplateId,
  customTemplates,
  selectedCustomTemplateId,
  setSelectedCustomTemplateId,
  setCustomTemplates
}: AdminPanelProps) {
  const [adminStatus, setAdminStatus] = useState('选择模板后可编辑并保存。')
  const [adminError, setAdminError] = useState<string | undefined>()
  const [isSavingTemplate, setIsSavingTemplate] = useState(false)
  const [adminBaseTemplateId, setAdminBaseTemplateId] = useState<TemplateId>('HeroSplit')
  const [recycleTemplates, setRecycleTemplates] = useState<TemplateDefinition[]>([])
  const activeTemplates = customTemplates.filter(
    (template) => !template.deletedAt && !template.archivedAt
  )
  const managedBaseTemplates = activeTemplates.filter(
    (template) => template.baseTemplateId === adminBaseTemplateId
  )
  const selectedCustomTemplate = customTemplates.find(
    (template) => template.id === selectedCustomTemplateId
  )

  useEffect(() => {
    let cancelled = false

    async function loadRecycleBin() {
      try {
        const response = await listTemplates('trash')

        if (!cancelled) {
          setRecycleTemplates(response.templates)
        }
      } catch {
        if (!cancelled) {
          setRecycleTemplates([])
        }
      }
    }

    void loadRecycleBin()

    return () => {
      cancelled = true
    }
  }, [])

  async function handleCreateTemplate(sourceType: 'custom' | 'built-in-override') {
    setAdminError(undefined)
    setAdminStatus('正在创建模板...')

    try {
      const copy = getTemplateCopy(adminBaseTemplateId)
      const created = await createTemplate({
        name:
          sourceType === 'built-in-override'
            ? `${copy.label} 管理记录`
            : `${copy.label} 自定义 ${managedBaseTemplates.length + 1}`,
        description:
          sourceType === 'built-in-override'
            ? `用于控制「${copy.label}」内置模板的上架状态和管理配置。`
            : `基于「${copy.label}」的自定义模板`,
        baseTemplateId: adminBaseTemplateId,
        sourceType,
        template: createTemplateDraft(adminBaseTemplateId, ratio)
      })

      setTemplateId(adminBaseTemplateId)
      setCustomTemplates([
        created.template,
        ...customTemplates.filter((template) => template.id !== created.template.id)
      ])
      setSelectedCustomTemplateId(created.template.id)
      setAdminStatus('模板已创建，可以继续编辑。')
    } catch (caughtError) {
      setAdminError(caughtError instanceof Error ? caughtError.message : '创建模板失败')
      setAdminStatus('模板创建失败。')
    }
  }

  async function handleSaveTemplate(template: TemplateDefinition) {
    if (!template.name.trim()) {
      setAdminError('模板名称不能为空。')
      return
    }

    setIsSavingTemplate(true)
    setAdminError(undefined)
    setAdminStatus('正在保存模板...')

    try {
      const saved = await updateTemplate({
        ...template,
        name: template.name.trim(),
        description: template.description?.trim() || undefined
      })
      setCustomTemplates(
        customTemplates.map((item) =>
          item.id === saved.template.id ? saved.template : item
        )
      )
      setSelectedCustomTemplateId(saved.template.id)
      setAdminStatus('模板已保存。')
    } catch (caughtError) {
      setAdminError(caughtError instanceof Error ? caughtError.message : '保存模板失败')
      setAdminStatus('模板保存失败。')
    } finally {
      setIsSavingTemplate(false)
    }
  }

  async function handleTrashTemplate(template: TemplateDefinition) {
    const confirmed = window.confirm(`将模板「${template.name}」移入回收站？`)

    if (!confirmed) {
      return
    }

    setIsSavingTemplate(true)
    setAdminError(undefined)
    setAdminStatus('正在移入回收站...')

    try {
      const trashed = await trashTemplate(template.id)
      setCustomTemplates(customTemplates.filter((item) => item.id !== template.id))
      setRecycleTemplates([trashed.template, ...recycleTemplates])
      setSelectedCustomTemplateId(undefined)
      setAdminStatus('模板已移入回收站。')
    } catch (caughtError) {
      setAdminError(caughtError instanceof Error ? caughtError.message : '移入回收站失败')
      setAdminStatus('模板移入回收站失败。')
    } finally {
      setIsSavingTemplate(false)
    }
  }

  async function handlePublishTemplate(template: TemplateDefinition, publish: boolean) {
    setIsSavingTemplate(true)
    setAdminError(undefined)
    setAdminStatus(publish ? '正在上架模板...' : '正在下架模板...')

    try {
      const updated = publish
        ? await publishTemplate(template.id)
        : await unpublishTemplate(template.id)

      setCustomTemplates(
        customTemplates.map((item) =>
          item.id === updated.template.id ? updated.template : item
        )
      )
      setSelectedCustomTemplateId(updated.template.id)
      setAdminStatus(publish ? '模板已上架。' : '模板已下架。')
    } catch (caughtError) {
      setAdminError(
        caughtError instanceof Error ? caughtError.message : '更新上架状态失败'
      )
      setAdminStatus('模板上架状态更新失败。')
    } finally {
      setIsSavingTemplate(false)
    }
  }

  async function handleRestoreTemplate(template: TemplateDefinition) {
    setIsSavingTemplate(true)
    setAdminError(undefined)
    setAdminStatus('正在恢复模板...')

    try {
      const restored = await restoreTemplate(template.id)
      setRecycleTemplates(recycleTemplates.filter((item) => item.id !== template.id))
      setCustomTemplates([restored.template, ...customTemplates])
      setSelectedCustomTemplateId(restored.template.id)
      setAdminStatus('模板已恢复。')
    } catch (caughtError) {
      setAdminError(caughtError instanceof Error ? caughtError.message : '恢复模板失败')
      setAdminStatus('模板恢复失败。')
    } finally {
      setIsSavingTemplate(false)
    }
  }

  async function handleDeleteTemplate(template: TemplateDefinition) {
    const confirmed = window.confirm(`永久删除模板「${template.name}」？此操作会移除回收站记录。`)

    if (!confirmed) {
      return
    }

    setIsSavingTemplate(true)
    setAdminError(undefined)
    setAdminStatus('正在永久删除模板...')

    try {
      await deleteTemplate(template.id)
      setRecycleTemplates(recycleTemplates.filter((item) => item.id !== template.id))
      setAdminStatus('模板已永久删除。')
    } catch (caughtError) {
      setAdminError(caughtError instanceof Error ? caughtError.message : '永久删除模板失败')
      setAdminStatus('模板永久删除失败。')
    } finally {
      setIsSavingTemplate(false)
    }
  }

  async function handleImportTemplate(file: File) {
    setAdminError(undefined)
    setAdminStatus('正在导入模板...')

    try {
      const text = await file.text()
      const imported = await importTemplate(JSON.parse(text))

      setCustomTemplates([imported.template, ...customTemplates])
      setTemplateId(imported.template.baseTemplateId)
      setSelectedCustomTemplateId(imported.template.id)
      setAdminStatus('模板已导入。')
    } catch (caughtError) {
      setAdminError(caughtError instanceof Error ? caughtError.message : '导入模板失败')
      setAdminStatus('模板导入失败。')
    }
  }

  function handleChangeSelectedTemplate(template: TemplateDefinition) {
    setCustomTemplates(
      customTemplates.map((item) => (item.id === template.id ? template : item))
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SlidersHorizontal className="size-5 text-accent" aria-hidden="true" />
          管理员 · 模板维护
        </CardTitle>
        <CardDescription>
          创建、导入、导出和维护自定义模板。普通制作流程只负责选择模板。
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5 lg:grid-cols-[0.7fr_1.3fr]">
        <div className="space-y-3">
          <ControlGroup label="维护画幅">
            <div className="grid grid-cols-2 gap-2">
              {videoRatios.map((item) => (
                <Button
                  key={item}
                  variant={ratio === item ? 'default' : 'secondary'}
                  onClick={() => setRatio(item)}
                >
                  {item}
                </Button>
              ))}
            </div>
          </ControlGroup>
          <ControlGroup label="基础模板">
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
              value={adminBaseTemplateId}
              onChange={(event) =>
                setAdminBaseTemplateId(event.target.value as TemplateId)
              }
            >
              {templateIds.map((id) => (
                <option key={id} value={id}>
                  {getTemplateCopy(id).label} · {id}
                </option>
              ))}
            </select>
          </ControlGroup>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button
              className="w-full"
              variant="secondary"
              onClick={() => void handleCreateTemplate('custom')}
            >
              创建自定义
            </Button>
            <Button
              className="w-full"
              variant="secondary"
              onClick={() => void handleCreateTemplate('built-in-override')}
            >
              管理内置
            </Button>
          </div>
          <label className="block cursor-pointer rounded-2xl border border-white/10 bg-white/6 px-3 py-2 text-center text-sm text-muted-foreground hover:bg-white/10">
            导入 JSON
            <input
              className="hidden"
              type="file"
              accept="application/json,.json"
              onChange={(event) => {
                const file = event.target.files?.[0]
                event.target.value = ''
                if (file) {
                  void handleImportTemplate(file)
                }
              }}
            />
          </label>
          <div className="space-y-2">
            {activeTemplates.length > 0 ? (
              activeTemplates.map((template) => (
                <button
                  key={template.id}
                  className={cn(
                    'w-full rounded-2xl border px-3 py-2 text-left text-sm transition',
                    selectedCustomTemplateId === template.id
                      ? 'border-accent bg-accent/10'
                      : 'border-white/10 bg-white/6 hover:bg-white/10'
                  )}
                  onClick={() => {
                    setTemplateId(template.baseTemplateId)
                    setSelectedCustomTemplateId(template.id)
                  }}
                >
                  <span className="block font-medium text-foreground">{template.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {template.baseTemplateId} ·
                    {' '}
                    {isTemplatePublished(template) ? '已上架' : '已下架'} ·
                    {' '}
                    {new Date(template.updatedAt).toLocaleString()}
                  </span>
                </button>
              ))
            ) : (
              <p className="rounded-2xl border border-white/10 bg-white/6 p-3 text-xs leading-5 text-muted-foreground">
                暂无自定义模板。
              </p>
            )}
          </div>
          <ControlGroup label="回收站">
            <div className="space-y-2">
              {recycleTemplates.length > 0 ? (
                recycleTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="rounded-2xl border border-white/10 bg-white/6 p-3 text-sm"
                  >
                    <p className="font-medium text-foreground">{template.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {template.baseTemplateId} · 删除：
                      {new Date(
                        template.deletedAt ?? template.archivedAt ?? template.updatedAt
                      ).toLocaleString()}
                    </p>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <Button
                        variant="secondary"
                        disabled={isSavingTemplate}
                        onClick={() => void handleRestoreTemplate(template)}
                      >
                        恢复
                      </Button>
                      <Button
                        variant="secondary"
                        disabled={isSavingTemplate}
                        onClick={() => void handleDeleteTemplate(template)}
                      >
                        永久删除
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="rounded-2xl border border-white/10 bg-white/6 p-3 text-xs leading-5 text-muted-foreground">
                  回收站为空。
                </p>
              )}
            </div>
          </ControlGroup>
          <div className="rounded-2xl border border-white/10 bg-white/6 p-3 text-xs leading-5 text-muted-foreground">
            <p>{adminStatus}</p>
            {adminError ? <p className="mt-2 text-destructive">{adminError}</p> : null}
          </div>
        </div>
        {selectedCustomTemplate ? (
          <TemplateInspector
            ratio={ratio}
            template={selectedCustomTemplate}
            isSaving={isSavingTemplate}
            onChange={handleChangeSelectedTemplate}
            onSave={(template) => void handleSaveTemplate(template)}
            onPublish={(template, publish) =>
              void handlePublishTemplate(template, publish)
            }
            onTrash={(template) => void handleTrashTemplate(template)}
          />
        ) : (
          <div className="rounded-2xl border border-white/10 bg-white/6 p-4 text-sm leading-6 text-muted-foreground">
            选择一个自定义模板后，可以维护歌词对象的坐标、尺寸、字号和字体。
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function TemplateInspector({
  ratio,
  template,
  isSaving,
  onChange,
  onSave,
  onPublish,
  onTrash
}: {
  ratio: VideoRatio
  template: TemplateDefinition
  isSaving: boolean
  onChange: (template: TemplateDefinition) => void
  onSave: (template: TemplateDefinition) => void
  onPublish: (template: TemplateDefinition, publish: boolean) => void
  onTrash: (template: TemplateDefinition) => void
}) {
  const editorObjects = getTemplateEditorObjects(template.baseTemplateId)
  const [selectedObjectId, setSelectedObjectId] = useState<TemplateEditorObjectId>('lyrics')

  useEffect(() => {
    if (!editorObjects.some((objectId) => objectId === selectedObjectId)) {
      setSelectedObjectId(editorObjects[0])
    }
  }, [editorObjects, selectedObjectId])

  const selectedObject = getTemplateObjectSettings(template, ratio, selectedObjectId)
  const layout =
    selectedObject.layout ??
    createTemplateObjectSettings(template.baseTemplateId, ratio, selectedObjectId).layout
  const typography =
    selectedObject.typography ??
    createTemplateObjectSettings(template.baseTemplateId, ratio, selectedObjectId).typography
  const hasRatioSettings = Boolean(template.ratioSettings[ratio])
  const isPublished = isTemplatePublished(template)
  const canEditObjects = supportsObjectEditor(template.baseTemplateId)
  const livePreviewConfig = createTemplateInspectorPreviewConfig(template, ratio)
  const editorCanvas =
    ratio === '16:9'
      ? { width: 640, height: 360, sourceWidth: 1920, sourceHeight: 1080 }
      : { width: 260, height: 462, sourceWidth: 1080, sourceHeight: 1920 }
  const frameInsets =
    template.baseTemplateId === 'HeroSplit'
      ? heroSplitFrameInsets[ratio]
      : { top: 0, right: 0, bottom: 0, left: 0, radius: 0 }
  const scaleX = editorCanvas.width / editorCanvas.sourceWidth
  const scaleY = editorCanvas.height / editorCanvas.sourceHeight

  function updateTemplateMeta(
    input: Partial<Pick<TemplateDefinition, 'name' | 'description'>>
  ) {
    onChange({
      ...template,
      ...input,
      updatedAt: new Date().toISOString()
    })
  }

  function updateObject(input: {
    layout?: Partial<NonNullable<typeof layout>>
    typography?: Partial<NonNullable<typeof typography>>
  }) {
    onChange(updateTemplateObjectSettings(template, ratio, selectedObjectId, input))
  }

  function resetSelectedObject() {
    const defaults = createTemplateObjectSettings(
      template.baseTemplateId,
      ratio,
      selectedObjectId
    )

    onChange(
      updateTemplateObjectSettings(template, ratio, selectedObjectId, {
        layout: defaults.layout,
        typography: defaults.typography
      })
    )
  }

  function handleDragObject(
    objectId: TemplateEditorObjectId,
    event: ReactPointerEvent<HTMLDivElement>
  ) {
    const object = getTemplateObjectSettings(template, ratio, objectId)
    const objectLayout =
      object.layout ??
      createTemplateObjectSettings(template.baseTemplateId, ratio, objectId).layout
    const target = event.currentTarget
    const startClientX = event.clientX
    const startClientY = event.clientY
    const startX = objectLayout.x
    const startY = objectLayout.y

    target.setPointerCapture(event.pointerId)
    setSelectedObjectId(objectId)

    function handlePointerMove(moveEvent: PointerEvent) {
      onChange(
        updateTemplateObjectSettings(template, ratio, objectId, {
          layout: {
            x: Math.round(startX + (moveEvent.clientX - startClientX) / scaleX),
            y: Math.round(startY + (moveEvent.clientY - startClientY) / scaleY)
          }
        })
      )
    }

    function handlePointerUp() {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
  }

  function handleResizeObject(
    objectId: TemplateEditorObjectId,
    event: ReactPointerEvent<HTMLDivElement>
  ) {
    event.stopPropagation()

    const object = getTemplateObjectSettings(template, ratio, objectId)
    const objectLayout =
      object.layout ??
      createTemplateObjectSettings(template.baseTemplateId, ratio, objectId).layout
    const target = event.currentTarget
    const startClientX = event.clientX
    const startClientY = event.clientY
    const startWidth = objectLayout.width
    const startHeight = objectLayout.height

    target.setPointerCapture(event.pointerId)
    setSelectedObjectId(objectId)

    function handlePointerMove(moveEvent: PointerEvent) {
      onChange(
        updateTemplateObjectSettings(template, ratio, objectId, {
          layout: {
            width: Math.max(
              24,
              Math.round(startWidth + (moveEvent.clientX - startClientX) / scaleX)
            ),
            height: Math.max(
              24,
              Math.round(startHeight + (moveEvent.clientY - startClientY) / scaleY)
            )
          }
        })
      )
    }

    function handlePointerUp() {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
  }

  return (
    <div className="space-y-5">
      <ControlGroup label="模板信息">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="模板名称">
            <Input
              value={template.name}
              onChange={(event) => updateTemplateMeta({ name: event.target.value })}
            />
          </Field>
          <Field label="基础模板">
            <Input value={template.baseTemplateId} disabled />
          </Field>
        </div>
        <Field label="模板描述">
          <Input
            value={template.description ?? ''}
            placeholder="描述模板用途和适合的歌曲风格"
            onChange={(event) =>
              updateTemplateMeta({ description: event.target.value })
            }
          />
        </Field>
        <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
          <p className="rounded-2xl border border-white/10 bg-white/6 p-3">
            当前画幅：{ratio}
          </p>
          <p className="rounded-2xl border border-white/10 bg-white/6 p-3">
            画幅配置：{hasRatioSettings ? '已配置' : '使用默认值'}
          </p>
          <p className="rounded-2xl border border-white/10 bg-white/6 p-3">
            更新：{new Date(template.updatedAt).toLocaleString()}
          </p>
        </div>
      </ControlGroup>

      <ControlGroup label="真实模板预览">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/70 p-3">
          <Suspense
            fallback={
              <div className="flex aspect-video items-center justify-center text-sm text-muted-foreground">
                正在加载真实预览...
              </div>
            }
          >
            <RemotionPreview config={livePreviewConfig} />
          </Suspense>
        </div>
        <p className="text-xs leading-5 text-muted-foreground">
          这里直接渲染当前基础模板，随机海报类模板会显示稳定随机编排后的实际画面。
        </p>
      </ControlGroup>

      {canEditObjects ? (
        <>
          <ControlGroup label="可视化拖拽编辑器">
            <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/70 p-4">
              <div className="mb-3 grid grid-cols-4 gap-2">
                {editorObjects.map((objectId) => (
                  <Button
                    key={objectId}
                    variant={selectedObjectId === objectId ? 'default' : 'secondary'}
                    onClick={() => setSelectedObjectId(objectId)}
                  >
                    {editableObjectLabels[objectId]}
                  </Button>
                ))}
              </div>
              <div
                className="relative mx-auto rounded-xl border border-accent/40 bg-slate-950"
                style={{ width: editorCanvas.width, height: editorCanvas.height }}
              >
                {template.baseTemplateId === 'HeroSplit' ? (
                  <div
                    className="absolute overflow-hidden border border-accent/30 bg-gradient-to-br from-slate-950 to-slate-800"
                    style={{
                      left: frameInsets.left * scaleX,
                      top: frameInsets.top * scaleY,
                      right: frameInsets.right * scaleX,
                      bottom: frameInsets.bottom * scaleY,
                      borderRadius: frameInsets.radius * scaleX,
                      boxShadow: 'inset 0 0 38px rgba(255,255,255,0.05)'
                    }}
                  >
                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          ratio === '16:9'
                            ? 'linear-gradient(90deg, rgba(8,8,22,0.98) 0%, rgba(8,8,22,0.88) 43%, rgba(8,8,22,0.36) 68%, rgba(8,8,22,0.68) 100%)'
                            : 'linear-gradient(180deg, rgba(8,8,22,0.98) 0%, rgba(8,8,22,0.88) 36%, rgba(8,8,22,0.72) 100%)'
                      }}
                    />
                  </div>
                ) : null}
                {editorObjects.map((objectId) => {
                  const object = getTemplateObjectSettings(template, ratio, objectId)
                  const objectLayout =
                    object.layout ??
                    createTemplateObjectSettings(template.baseTemplateId, ratio, objectId)
                      .layout
                  const objectTypography = object.typography
                  const active = selectedObjectId === objectId

                  return (
                    <div
                      key={objectId}
                      className={cn(
                        'absolute cursor-move select-none overflow-hidden rounded-xl border',
                        active
                          ? 'border-accent bg-accent/25 shadow-[0_0_30px_hsl(var(--accent)/0.3)]'
                          : 'border-white/25'
                      )}
                      style={{
                        left: (frameInsets.left + objectLayout.x) * scaleX,
                        top: (frameInsets.top + objectLayout.y) * scaleY,
                        width: Math.max(28, objectLayout.width * scaleX),
                        height: Math.max(24, objectLayout.height * scaleY),
                        opacity:
                          objectLayout.visible === false
                            ? 0.35
                            : objectLayout.opacity ?? 1
                      }}
                      onPointerDown={(event) => handleDragObject(objectId, event)}
                    >
                      <TemplateEditorObjectPreview
                        objectId={objectId}
                        ratio={ratio}
                        templateId={template.baseTemplateId}
                        scale={scaleY}
                        typography={objectTypography}
                      />
                      <div
                        className="absolute bottom-0 right-0 size-4 translate-x-1/2 translate-y-1/2 cursor-nwse-resize rounded-full border border-background bg-accent"
                        onPointerDown={(event) => handleResizeObject(objectId, event)}
                      />
                    </div>
                  )
                })}
              </div>
              <p className="mt-3 text-xs leading-5 text-muted-foreground">
                选择对象后可拖动位置，拖拽右下角圆点可缩放宽高；下方数值可精确调整。
              </p>
            </div>
          </ControlGroup>

          <ControlGroup label={`${editableObjectLabels[selectedObjectId]}对象`}>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <NumberField
                label="X"
                value={layout.x}
                onChange={(value) => updateObject({ layout: { x: value } })}
              />
              <NumberField
                label="Y"
                value={layout.y}
                onChange={(value) => updateObject({ layout: { y: value } })}
              />
              <NumberField
                label="宽"
                value={layout.width}
                onChange={(value) => updateObject({ layout: { width: value } })}
              />
              <NumberField
                label="高"
                value={layout.height}
                onChange={(value) => updateObject({ layout: { height: value } })}
              />
              <NumberField
                label="缩放"
                value={layout.scale ?? 1}
                step="0.05"
                onChange={(value) =>
                  updateObject({ layout: { scale: clamp(value, 0.1, 3) } })
                }
              />
              <NumberField
                label="透明度"
                value={layout.opacity ?? 1}
                step="0.05"
                onChange={(value) =>
                  updateObject({ layout: { opacity: clamp(value, 0, 1) } })
                }
              />
              {selectedObjectId !== 'cover' ? (
                <NumberField
                  label="字号"
                  value={
                    typography?.fontSize ??
                    getDefaultObjectSettings(
                      template.baseTemplateId,
                      ratio,
                      selectedObjectId
                    ).typography?.fontSize ??
                    0
                  }
                  onChange={(value) =>
                    updateObject({ typography: { fontSize: value } })
                  }
                />
              ) : null}
            </div>
            <div className="mt-2 space-y-2">
              {selectedObjectId !== 'cover' ? (
                <>
                  <Label className="text-xs text-muted-foreground">字体</Label>
                  <Input
                    value={typography?.fontFamily ?? ''}
                    onChange={(event) =>
                      updateObject({ typography: { fontFamily: event.target.value } })
                    }
                  />
                </>
              ) : null}
              <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/6 px-3 py-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={layout.visible ?? true}
                  onChange={(event) =>
                    updateObject({ layout: { visible: event.target.checked } })
                  }
                />
                显示{editableObjectLabels[selectedObjectId]}对象
              </label>
              <div className="grid gap-2 sm:grid-cols-4">
                <Button variant="secondary" onClick={resetSelectedObject}>
                  重置对象
                </Button>
                <Button
                  disabled={isSaving}
                  onClick={() => onSave(normalizeTemplateEditorObjects(template, ratio))}
                >
                  {isSaving ? '保存中...' : '保存模板'}
                </Button>
                <Button
                  disabled={isSaving}
                  variant="secondary"
                  onClick={() => onPublish(template, !isPublished)}
                >
                  {isPublished ? '下架模板' : '上架模板'}
                </Button>
                <Button
                  disabled={isSaving}
                  variant="secondary"
                  onClick={() => onTrash(template)}
                >
                  移入回收站
                </Button>
                <a
                  className="inline-flex h-10 items-center justify-center rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
                  href={`/api/templates/${template.id}/export`}
                >
                  导出 JSON
                </a>
              </div>
            </div>
          </ControlGroup>
        </>
      ) : (
        <ControlGroup label="模板管理说明">
          <div className="rounded-2xl border border-white/10 bg-white/6 p-4 text-sm leading-6 text-muted-foreground">
            {isRandomPosterTemplate(template.baseTemplateId)
              ? '这类海报模板使用稳定随机文字编排，画面由模板算法生成；当前可在此管理名称、描述、上下架、回收站和导出。'
              : '当前基础模板使用内置视觉算法；对象拖拽编辑暂未接入该模板。'}
          </div>
          <div className="grid gap-2 sm:grid-cols-4">
            <Button disabled={isSaving} onClick={() => onSave(template)}>
              {isSaving ? '保存中...' : '保存模板'}
            </Button>
            <Button
              disabled={isSaving}
              variant="secondary"
              onClick={() => onPublish(template, !isPublished)}
            >
              {isPublished ? '下架模板' : '上架模板'}
            </Button>
            <Button
              disabled={isSaving}
              variant="secondary"
              onClick={() => onTrash(template)}
            >
              移入回收站
            </Button>
            <a
              className="inline-flex h-10 items-center justify-center rounded-md bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
              href={`/api/templates/${template.id}/export`}
            >
              导出 JSON
            </a>
          </div>
        </ControlGroup>
      )}
    </div>
  )
}

function TemplateEditorObjectPreview({
  objectId,
  ratio,
  templateId,
  scale,
  typography
}: {
  objectId: TemplateEditorObjectId
  ratio: VideoRatio
  templateId: TemplateId
  scale: number
  typography?: TemplateTypography
}) {
  const isWide = ratio === '16:9'
  const defaults = getDefaultObjectSettings(templateId, ratio, objectId)
  const fontSize = (typography?.fontSize ?? defaults.typography?.fontSize ?? 18) * scale
  const fontFamily =
    typography?.fontFamily ?? defaults.typography?.fontFamily ?? previewFontStack

  if (objectId === 'cover') {
    return (
      <img
        src={previewFallbackCoverUrl}
        alt="封面预览"
        className="h-full w-full object-cover"
        draggable={false}
        style={{
          filter: isWide
            ? 'brightness(0.66) saturate(1.16)'
            : 'brightness(0.86) saturate(1.08)'
        }}
      />
    )
  }

  if (objectId === 'artist') {
    const artistDefaults = defaults.typography

    return (
      <div
        className="h-full w-full truncate px-1 text-left text-white/65"
        style={{
          fontFamily,
          fontSize,
          fontWeight: typography?.fontWeight ?? artistDefaults?.fontWeight,
          lineHeight: typography?.lineHeight ?? artistDefaults?.lineHeight
        }}
      >
        {formatArtistDisplay(defaultArtistName, defaultArtistEnglishName)}
      </div>
    )
  }

  if (objectId === 'title') {
    const titleDefaults = defaults.typography

    return (
      <div
        className="h-full w-full overflow-hidden px-1 text-left text-slate-50"
        style={{
          fontFamily,
          fontSize,
          fontWeight: typography?.fontWeight ?? titleDefaults?.fontWeight,
          lineHeight: typography?.lineHeight ?? titleDefaults?.lineHeight,
          letterSpacing: `${
            typography?.letterSpacing ?? titleDefaults?.letterSpacing ?? 0
          }em`,
          textShadow: '0 0 12px rgba(255,255,255,0.2)'
        }}
      >
        {defaultSongTitle}
      </div>
    )
  }

  if (objectId === 'activeLyric') {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-xl border border-white/35 bg-white/12 px-3 text-center text-white shadow-lg">
        <div
          className="overflow-hidden"
          style={{
            fontFamily,
            fontSize,
            fontWeight: typography?.fontWeight ?? defaults.typography?.fontWeight ?? 980,
            lineHeight: typography?.lineHeight ?? defaults.typography?.lineHeight ?? 0.98,
            letterSpacing: `${
              typography?.letterSpacing ?? defaults.typography?.letterSpacing ?? -0.065
            }em`
          }}
        >
          {sampleLyrics[1]?.text ?? '当前句'}
        </div>
      </div>
    )
  }

  const lyricFontSize = fontSize

  if (templateId === 'PulseCover') {
    return (
      <div className="flex h-full w-full flex-col justify-center rounded-md border border-accent/60 bg-slate-950/75 px-2 py-1 text-center text-white shadow-lg">
        <div
          className="overflow-hidden"
          style={{
            fontFamily,
            fontSize: lyricFontSize,
            fontWeight: typography?.fontWeight ?? defaults.typography?.fontWeight,
            lineHeight: typography?.lineHeight ?? defaults.typography?.lineHeight,
            letterSpacing: `${
              typography?.letterSpacing ?? defaults.typography?.letterSpacing ?? 0
            }em`
          }}
        >
          {sampleLyrics[1]?.text ?? ' '}
        </div>
        <div className="mx-auto mt-1 h-1 w-16 rounded-full bg-white/80" />
      </div>
    )
  }

  const inactiveFontSize = Math.max(8, lyricFontSize * 0.74)
  const rows = sampleLyrics.slice(0, 3)

  return (
    <div className="flex h-full w-full flex-col gap-1 p-1 text-left">
      {rows.map((line, index) => {
        const active = index === 1

        return (
          <div
            key={line.id}
            className={cn(
              'overflow-hidden rounded-md border px-2 py-1 leading-tight',
              active
                ? 'border-white/90 bg-white text-slate-950'
                : 'border-white/15 bg-white/10 text-white/70'
            )}
            style={{
              fontFamily,
              fontSize: active ? lyricFontSize : inactiveFontSize,
              fontWeight: active ? 920 : 760,
              letterSpacing: active ? '-0.052em' : '-0.035em'
            }}
          >
            {line.text}
          </div>
        )
      })}
    </div>
  )
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}
