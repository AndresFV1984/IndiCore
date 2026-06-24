import type { ConversionGcrLevel } from '../types'

const UINT16_MAX = 65535

/** Convierte valor 16-bit CMYK (0–65535) a cobertura 0–100 %. */
export const cmyk16ToPercent = (value: number): number => (value / UINT16_MAX) * 100

/** Convierte cobertura 0–100 % a valor 16-bit. */
export const percentToCmyk16 = (percent: number): number =>
  Math.max(0, Math.min(UINT16_MAX, Math.round((percent / 100) * UINT16_MAX)))

const GCR_STRENGTH: Record<ConversionGcrLevel, number> = {
  /** Conserva más CMY; negro más suave. */
  light: 0.35,
  /** Balance estándar, similar al default de muchos perfiles comerciales. */
  medium: 0.55,
  /** Más tinta K, menos CMY (ahorro de tinta de color). */
  maximum: 0.8,
}

/**
 * Simula GCR moviendo el mínimo de C,M,Y hacia K.
 * No reemplaza la curva del perfil ICC, pero permite comparar niveles de negro.
 */
export function applyGcrToCmyk16Pixel(
  c: number,
  m: number,
  y: number,
  k: number,
  level: ConversionGcrLevel
): [number, number, number, number] {
  const strength = GCR_STRENGTH[level]
  if (strength <= 0) return [c, m, y, k]

  const cn = c / UINT16_MAX
  const mn = m / UINT16_MAX
  const yn = y / UINT16_MAX
  const kn = k / UINT16_MAX
  const gray = Math.min(cn, mn, yn) * strength

  const nextC = Math.max(0, cn - gray)
  const nextM = Math.max(0, mn - gray)
  const nextY = Math.max(0, yn - gray)
  const nextK = Math.min(1, kn + gray)

  return [
    percentToCmyk16(nextC * 100),
    percentToCmyk16(nextM * 100),
    percentToCmyk16(nextY * 100),
    percentToCmyk16(nextK * 100),
  ]
}

/**
 * Limita TAC (Total Area Coverage): suma C+M+Y+K por píxel.
 * Escala proporcionalmente los cuatro canales si se supera el máximo.
 */
export function applyTacLimitToCmyk16Pixel(
  c: number,
  m: number,
  y: number,
  k: number,
  tacPercent: number
): [number, number, number, number] {
  const tac = cmyk16ToPercent(c) + cmyk16ToPercent(m) + cmyk16ToPercent(y) + cmyk16ToPercent(k)
  if (tac <= tacPercent || tacPercent <= 0) return [c, m, y, k]

  const scale = tacPercent / tac
  return [
    percentToCmyk16(cmyk16ToPercent(c) * scale),
    percentToCmyk16(cmyk16ToPercent(m) * scale),
    percentToCmyk16(cmyk16ToPercent(y) * scale),
    percentToCmyk16(cmyk16ToPercent(k) * scale),
  ]
}

/** Aplica GCR y TAC en buffer CMYK 16-bit interleaved (C,M,Y,K por píxel). */
export function postProcessCmyk16Buffer(
  pixels: Uint16Array,
  pixelCount: number,
  tacPercent: number,
  gcrLevel: ConversionGcrLevel
): void {
  for (let i = 0; i < pixelCount; i += 1) {
    const offset = i * 4
    let [c, m, y, k] = applyGcrToCmyk16Pixel(
      pixels[offset],
      pixels[offset + 1],
      pixels[offset + 2],
      pixels[offset + 3],
      gcrLevel
    )
    ;[c, m, y, k] = applyTacLimitToCmyk16Pixel(c, m, y, k, tacPercent)
    pixels[offset] = c
    pixels[offset + 1] = m
    pixels[offset + 2] = y
    pixels[offset + 3] = k
  }
}
