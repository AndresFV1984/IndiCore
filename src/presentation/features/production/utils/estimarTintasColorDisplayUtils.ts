import type React from 'react'
import { DISENO_INK_PANTONE_MIX_BACKGROUND, isDisenoInkPantoneMix } from '../constants/preprensaDisenoColors'

const clampChannel = (value: number): number => Math.max(0, Math.min(255, Math.round(value)))

export const hexToRgbChannels = (hex: string): [number, number, number] => {
  const normalized = hex.replace('#', '').trim()
  if (normalized.length !== 6) return [100, 116, 139]
  const value = Number.parseInt(normalized, 16)
  if (!Number.isFinite(value)) return [100, 116, 139]
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255]
}

export const rgbChannelsToHex = (r: number, g: number, b: number): string =>
  `#${[clampChannel(r), clampChannel(g), clampChannel(b)]
    .map(channel => channel.toString(16).padStart(2, '0'))
    .join('')}`

export const resolveSwatchForegroundColor = (hex: string): string => {
  const [r, g, b] = hexToRgbChannels(hex)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.62 ? '#0f172a' : '#ffffff'
}

export const resolveSwatchStrongVariant = (hex: string, factor = 0.82): string => {
  const [r, g, b] = hexToRgbChannels(hex)
  return rgbChannelsToHex(r * factor, g * factor, b * factor)
}

export const resolveInkRingTrackColor = (swatch: string, lighten = 0.68): string => {
  const [r, g, b] = hexToRgbChannels(swatch)
  return rgbChannelsToHex(
    r + (255 - r) * lighten,
    g + (255 - g) * lighten,
    b + (255 - b) * lighten
  )
}

export const resolveInkCoverageFillStyle = (swatch: string): React.CSSProperties => {
  if (isDisenoInkPantoneMix(swatch)) {
    return { background: 'linear-gradient(90deg, #7c3aed 0%, #5b21b6 100%)' }
  }
  return { backgroundColor: swatch }
}

export const resolveInkHeroSurfaceStyle = (swatch: string): React.CSSProperties => {
  if (isDisenoInkPantoneMix(swatch)) {
    return { background: DISENO_INK_PANTONE_MIX_BACKGROUND }
  }
  return { backgroundColor: swatch }
}

export const resolveInkTileBadgeStyle = (swatch: string): React.CSSProperties => {
  const onDark = resolveSwatchForegroundColor(swatch) === '#ffffff'
  return {
    color: onDark ? '#ffffff' : '#0f172a',
    backgroundColor: onDark ? 'rgb(15 23 42 / 0.42)' : 'rgb(255 255 255 / 0.92)',
  }
}

export const resolveInkRingCardThemeFromSwatch = (swatch: string): React.CSSProperties => {
  if (isDisenoInkPantoneMix(swatch)) {
    return {
      '--ink-chip-background': DISENO_INK_PANTONE_MIX_BACKGROUND,
      '--ink-chip-foreground': '#0f172a',
    } as React.CSSProperties
  }

  const strong = resolveSwatchStrongVariant(swatch)

  return {
    '--ring-ink': swatch,
    '--ring-ink-strong': strong,
    '--ring-border': swatch,
    '--ring-surface': '#ffffff',
    '--ring-track': resolveInkRingTrackColor(swatch),
    '--ink-chip-color': swatch,
    '--ink-chip-foreground': resolveSwatchForegroundColor(swatch),
  } as React.CSSProperties
}

export const resolveInkSwatchChipStyle = (swatch: string): React.CSSProperties => {
  if (isDisenoInkPantoneMix(swatch)) {
    return {
      background: DISENO_INK_PANTONE_MIX_BACKGROUND,
      color: '#0f172a',
      borderColor: 'rgb(15 23 42 / 0.14)',
      opacity: 1,
    }
  }

  return {
    background: swatch,
    color: resolveSwatchForegroundColor(swatch),
    borderColor: resolveSwatchStrongVariant(swatch, 0.55),
    opacity: 1,
  }
}

export const resolveInkRingSvgStrokes = (
  swatch: string
): { progress: string; track: string } => ({
  progress: isDisenoInkPantoneMix(swatch) ? '#7c3aed' : swatch,
  track: isDisenoInkPantoneMix(swatch) ? '#e9d5ff' : resolveInkRingTrackColor(swatch),
})
