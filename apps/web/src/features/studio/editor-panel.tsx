import { SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'
import {
  templateIds,
  videoRatios,
  type TemplateDefinition,
  type TemplateId,
  type VideoRatio
} from '@lyricpulse/core'
import { Button } from '../../components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { cn } from '../../lib/utils'
import {
  getTemplateCopy,
  isTemplatePublished,
  themePresets
} from './studio-catalog'

export type EditorPanelProps = {
  templateId: TemplateId
  setTemplateId: (templateId: TemplateId) => void
  ratio: VideoRatio
  setRatio: (ratio: VideoRatio) => void
  themeIndex: number
  setThemeIndex: (index: number) => void
  stageLighting: number
  setStageLighting: (value: number) => void
  customTemplates: TemplateDefinition[]
  selectedCustomTemplateId?: string
  setSelectedCustomTemplateId: (templateId: string | undefined) => void
}

export default function EditorPanel({
  templateId,
  setTemplateId,
  ratio,
  setRatio,
  themeIndex,
  setThemeIndex,
  stageLighting,
  setStageLighting,
  customTemplates,
  selectedCustomTemplateId,
  setSelectedCustomTemplateId
}: EditorPanelProps) {
  const selectedCustomTemplate = customTemplates.find(
    (template) => template.id === selectedCustomTemplateId
  )
  const hiddenBuiltInIds = new Set(
    customTemplates
      .filter(
        (template) =>
          template.sourceType === 'built-in-override' && !isTemplatePublished(template)
      )
      .map((template) => template.baseTemplateId)
  )
  const selectableCustomTemplates = customTemplates.filter(
    (template) => template.sourceType !== 'built-in-override' && isTemplatePublished(template)
  )
  const [templateSearch, setTemplateSearch] = useState('')
  const normalizedTemplateSearch = templateSearch.trim().toLowerCase()
  const visibleTemplateIds = normalizedTemplateSearch
    ? templateIds.filter((id) => {
        if (hiddenBuiltInIds.has(id)) {
          return false
        }

        const copy = getTemplateCopy(id)
        const keywords = `${id} ${copy.label} ${copy.description}`.toLowerCase()

        return keywords.includes(normalizedTemplateSearch)
      })
    : templateIds.filter((id) => !hiddenBuiltInIds.has(id))
  const visibleCustomTemplates = normalizedTemplateSearch
    ? selectableCustomTemplates.filter((template) => {
        const keywords = `${template.name} ${template.description ?? ''} ${template.baseTemplateId}`.toLowerCase()

        return keywords.includes(normalizedTemplateSearch)
      })
    : selectableCustomTemplates

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SlidersHorizontal className="size-5 text-accent" aria-hidden="true" />
          Studio 控制台
        </CardTitle>
        <CardDescription>选择模板、画幅和颜色能量。</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <ControlGroup label="模板">
          <Input
            value={templateSearch}
            placeholder="搜索模板名称、风格或 ID"
            onChange={(event) => setTemplateSearch(event.target.value)}
          />
          <div className="max-h-[28rem] space-y-2 overflow-y-auto pr-2 [scrollbar-color:hsl(var(--accent))_transparent]">
            {visibleTemplateIds.length > 0 ? (
              visibleTemplateIds.map((id) => (
                (() => {
                  const copy = getTemplateCopy(id)

                  return (
                <ChoiceButton
                  key={id}
                  active={templateId === id}
                  title={copy.label}
                  description={copy.description}
                  onClick={() => setTemplateId(id)}
                />
                  )
                })()
              ))
            ) : (
              <p className="rounded-2xl border border-white/10 bg-white/6 p-3 text-xs leading-5 text-muted-foreground">
                没有匹配的系统模板。
              </p>
            )}
          </div>
        </ControlGroup>
        <ControlGroup label="自定义模板">
          <div className="space-y-2">
            <Button
              className="w-full"
              variant={selectedCustomTemplateId ? 'secondary' : 'default'}
              onClick={() => setSelectedCustomTemplateId(undefined)}
            >
              使用系统模板
            </Button>
            {selectableCustomTemplates.length > 0 ? (
              <div className="space-y-2">
                {visibleCustomTemplates.length > 0 ? (
                  visibleCustomTemplates.map((template) => (
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
                      <span className="block font-medium text-foreground">
                        {template.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {template.baseTemplateId}
                      </span>
                    </button>
                  ))
                ) : (
                  <p className="rounded-2xl border border-white/10 bg-white/6 p-3 text-xs leading-5 text-muted-foreground">
                    没有匹配的自定义模板。
                  </p>
                )}
              </div>
            ) : (
              <p className="rounded-2xl border border-white/10 bg-white/6 p-3 text-xs leading-5 text-muted-foreground">
                管理员创建自定义模板后，这里可以选择并应用。
              </p>
            )}
            {selectedCustomTemplate ? (
              <p className="rounded-2xl border border-accent/30 bg-accent/10 p-3 text-xs leading-5 text-muted-foreground">
                已应用：{selectedCustomTemplate.name}
              </p>
            ) : null}
          </div>
        </ControlGroup>
        <ControlGroup label="画幅">
          <div className="grid grid-cols-2 gap-2">
            {videoRatios.map((nextRatio) => (
              <Button
                key={nextRatio}
                variant={ratio === nextRatio ? 'default' : 'secondary'}
                onClick={() => setRatio(nextRatio)}
              >
                {nextRatio}
              </Button>
            ))}
          </div>
        </ControlGroup>
        <ControlGroup label="主题">
          <div className="grid gap-2">
            {themePresets.map((theme, index) => (
              <button
                key={theme.name}
                className={cn(
                  'flex min-h-12 cursor-pointer items-center justify-between rounded-2xl border px-3 text-left transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  themeIndex === index
                    ? 'border-accent bg-accent/10'
                    : 'border-white/10 bg-white/6 hover:bg-white/10'
                )}
                onClick={() => setThemeIndex(index)}
              >
                <span className="font-medium">{theme.name}</span>
                <span className="flex gap-1">
                  <span
                    className="size-5 rounded-full"
                    style={{ backgroundColor: theme.primary }}
                  />
                  <span
                    className="size-5 rounded-full"
                    style={{ backgroundColor: theme.accent }}
                  />
                </span>
              </button>
            ))}
          </div>
        </ControlGroup>
        <ControlGroup label="灯光">
          <RangeField
            label="舞台灯强度"
            value={stageLighting}
            min={0}
            max={1}
            step={0.05}
            onChange={setStageLighting}
          />
        </ControlGroup>
      </CardContent>
    </Card>
  )
}

function ControlGroup({
  label,
  children
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </p>
      {children}
    </div>
  )
}

function RangeField({
  label,
  value,
  min,
  max,
  step,
  onChange
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
}) {
  return (
    <label className="space-y-2 text-xs text-muted-foreground">
      <div className="flex items-center justify-between gap-3">
        <span>{label}</span>
        <span className="font-medium text-foreground">{value.toFixed(2)}</span>
      </div>
      <Input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(clamp(Number(event.target.value), min, max))}
      />
    </label>
  )
}

function ChoiceButton({
  active,
  title,
  description,
  onClick
}: {
  active: boolean
  title: string
  description: string
  onClick: () => void
}) {
  return (
    <button
      className={cn(
        'w-full cursor-pointer rounded-2xl border p-4 text-left transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        active
          ? 'border-accent bg-accent/10'
          : 'border-white/10 bg-white/6 hover:bg-white/10'
      )}
      onClick={onClick}
    >
      <p className="font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        {description}
      </p>
    </button>
  )
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}
