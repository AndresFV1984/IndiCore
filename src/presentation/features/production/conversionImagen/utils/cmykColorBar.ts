/** Parches CMYK estándar para firma de color (valores 0–255 = cobertura de tinta). */
export const COLOR_BAR_PATCHES: ReadonlyArray<readonly [number, number, number, number]> = [
  [255, 0, 0, 0],
  [0, 255, 0, 0],
  [0, 0, 255, 0],
  [0, 0, 0, 255],
  [192, 192, 192, 0],
  [128, 128, 128, 0],
  [64, 64, 64, 0],
  [255, 255, 255, 0],
]

const DEFAULT_BAR_HEIGHT_RATIO = 0.045
const MIN_BAR_HEIGHT_PX = 28
const MAX_BAR_HEIGHT_PX = 96

export function resolveColorBarHeightPx(imageHeight: number): number {
  const scaled = Math.round(imageHeight * DEFAULT_BAR_HEIGHT_RATIO)
  return Math.max(MIN_BAR_HEIGHT_PX, Math.min(MAX_BAR_HEIGHT_PX, scaled))
}

/**
 * Añade una tira de firmas CMYK bajo la imagen (preprensa / control en imprenta).
 */
export function appendCmykColorBar(params: {
  width: number
  height: number
  cmykBytes: Uint8Array
  barHeightPx?: number
}): { width: number; height: number; cmykBytes: Uint8Array; barHeightPx: number } {
  const { width, height, cmykBytes } = params
  const expectedBytes = width * height * 4
  if (cmykBytes.byteLength !== expectedBytes) {
    throw new Error('color-bar-invalid-buffer')
  }

  const barHeightPx = params.barHeightPx ?? resolveColorBarHeightPx(height)
  const patchCount = COLOR_BAR_PATCHES.length
  const patchWidth = Math.max(1, Math.floor(width / patchCount))
  const newHeight = height + barHeightPx
  const out = new Uint8Array(width * newHeight * 4)

  out.set(cmykBytes, 0)

  const barStart = width * height * 4
  for (let row = 0; row < barHeightPx; row += 1) {
    for (let x = 0; x < width; x += 1) {
      const patchIndex = Math.min(patchCount - 1, Math.floor(x / patchWidth))
      const [c, m, y, k] = COLOR_BAR_PATCHES[patchIndex]!
      const offset = barStart + (row * width + x) * 4
      out[offset] = c
      out[offset + 1] = m
      out[offset + 2] = y
      out[offset + 3] = k
    }
  }

  return { width, height: newHeight, cmykBytes: out, barHeightPx }
}

/** Muestras CMYK 0–1 para operadores PDF (Estimar tintas). */
export function buildEstimarTintasPdfCmykOperators(): ReadonlyArray<
  readonly [number, number, number, number]
> {
  return COLOR_BAR_PATCHES.slice(0, 4).map(([c, m, y, k]) => [
    Number((c / 255).toFixed(4)),
    Number((m / 255).toFixed(4)),
    Number((y / 255).toFixed(4)),
    Number((k / 255).toFixed(4)),
  ] as const)
}
