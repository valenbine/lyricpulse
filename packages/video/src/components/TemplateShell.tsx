import type { ReactNode } from 'react'
import { AbsoluteFill, Audio, useCurrentFrame, useVideoConfig } from 'remotion'
import type { LyricVideoConfig } from '@lyricpulse/core'
import { getAnalysisFrame, getPlaybackTime } from '../helpers'
import { isDraftRender, isServerRender } from '../render-mode'
import { getBeatLighting, type TemplateShellVariant } from '../beat-lighting'

export function TemplateShell({
  config,
  children,
  variant
}: {
  config: LyricVideoConfig
  children: ReactNode
  variant: TemplateShellVariant
}) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const time = getPlaybackTime(frame, fps)
  const analysisFrame = getAnalysisFrame(config.analysis.frames, time)
  const isWide = config.ratio === '16:9'
  const accent = config.theme.accentColor
  const primary = config.theme.primaryColor
  const fastRender = isServerRender(config)
  const draftRender = isDraftRender(config)
  const showFrame = variant !== 'dashboard'
  const lighting = getBeatLighting(config, analysisFrame, variant)
  const baseGradient =
    variant === 'neon'
      ? `radial-gradient(circle at 18% 16%, ${accent}44, transparent 24%), radial-gradient(circle at 82% 72%, #0EA5E944, transparent 28%), linear-gradient(135deg, #020617, #111827 46%, #030712)`
      : variant === 'waveform'
        ? `radial-gradient(circle at 80% 24%, ${accent}3D, transparent 26%), linear-gradient(135deg, #020617, #0F172A 48%, #030712)`
        : variant === 'dashboard'
          ? `radial-gradient(circle at 24% 18%, ${accent}30, transparent 24%), radial-gradient(circle at 72% 68%, #38BDF833, transparent 30%), linear-gradient(145deg, #020617, #0B1120 52%, #111827)`
          : `radial-gradient(circle at 50% 18%, ${accent}42, transparent 28%), linear-gradient(180deg, #020617, #111827 50%, #020617)`

  return (
    <AbsoluteFill
      style={{
        background: baseGradient,
        color: primary,
        fontFamily: config.theme.fontFamily,
        overflow: 'hidden'
      }}
    >
      {config.audioUrl ? <Audio src={config.audioUrl} /> : null}
      <div
        style={{
          position: 'absolute',
          inset: draftRender ? '-10%' : fastRender ? '-16%' : '-24%',
          opacity: draftRender ? lighting.ambientOpacity * 0.72 : lighting.ambientOpacity,
          transform: `scale(${lighting.ambientScale})`,
          background: `radial-gradient(circle at 50% 18%, ${accent}AA, transparent 34%), radial-gradient(circle at 18% 78%, ${primary}88, transparent 34%), radial-gradient(circle at 84% 28%, ${accent}77, transparent 30%), linear-gradient(180deg, ${accent}18 0%, transparent 34%, ${primary}14 68%, ${accent}10 100%)`,
          filter: draftRender ? 'blur(18px)' : fastRender ? 'blur(34px)' : 'blur(82px)',
          mixBlendMode: draftRender ? 'normal' : 'screen',
          pointerEvents: 'none'
        }}
      />
      {draftRender ? null : (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: lighting.beamOpacity,
            transform: `scale(${lighting.beamScale})`,
            transformOrigin: '50% 16%',
            background: isWide
              ? `linear-gradient(90deg, transparent 0%, ${accent}42 16%, transparent 34%, ${primary}30 50%, transparent 68%, ${accent}30 100%), radial-gradient(circle at 50% 0%, ${accent}88, transparent 42%)`
              : `linear-gradient(180deg, ${accent}38 0%, transparent 28%, ${primary}24 52%, transparent 82%), radial-gradient(circle at 50% 0%, ${accent}88, transparent 42%)`,
            filter: fastRender ? 'blur(24px)' : 'blur(48px)',
            mixBlendMode: 'screen',
            pointerEvents: 'none'
          }}
        />
      )}
      {showFrame ? (
        <div
          style={{
            position: 'absolute',
            inset: isWide ? 56 : 28,
            border: `2px solid ${accent}40`,
            borderRadius: isWide ? 44 : 64,
              boxShadow: draftRender
                ? `0 0 0 1px rgba(255,255,255,0.05) inset`
                : fastRender
                ? `0 0 0 1px rgba(255,255,255,0.08) inset, 0 0 ${Math.round(lighting.frameGlowBlur * 0.4)}px ${accent}22`
                : `0 0 0 1px rgba(255,255,255,0.08) inset, 0 0 ${Math.round(lighting.frameGlowBlur)}px ${accent}${Math.round(lighting.frameGlowOpacity * 255)
                    .toString(16)
                    .padStart(2, '0')} inset, 0 0 ${Math.round(lighting.frameGlowBlur * 0.8)}px ${accent}22`,
            pointerEvents: 'none'
          }}
        />
      ) : null}
      {fastRender || draftRender ? null : (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.16,
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.16) 1px, transparent 1px)',
            backgroundSize: isWide ? '64px 64px' : '54px 54px',
            maskImage:
              'radial-gradient(circle at center, black, transparent 72%)',
            pointerEvents: 'none'
          }}
        />
      )}
      {children}
    </AbsoluteFill>
  )
}
