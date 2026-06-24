const SUPPORTED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/bmp',
  'image/gif',
  'image/tiff',
])

const SUPPORTED_EXT = /\.(jpe?g|png|webp|bmp|gif|tiff?)$/i

export interface DecodedImageSource {
  rgba: Uint8ClampedArray
  width: number
  height: number
  hadAlpha: boolean
  wasGrayscale: boolean
}

export function isSupportedImageFile(file: File): boolean {
  if (file.type && SUPPORTED_MIME.has(file.type)) return true
  return SUPPORTED_EXT.test(file.name)
}

function isGrayscale(rgba: Uint8ClampedArray, pixelCount: number): boolean {
  const sampleStep = Math.max(1, Math.floor(pixelCount / 4096))
  for (let i = 0; i < pixelCount; i += sampleStep) {
    const offset = i * 4
    const r = rgba[offset]
    const g = rgba[offset + 1]
    const b = rgba[offset + 2]
    if (Math.abs(r - g) > 2 || Math.abs(g - b) > 2) return false
  }
  return true
}

/** Aplana transparencia sobre blanco — CMYK no admite canal alfa. */
export function flattenAlphaOnWhite(rgba: Uint8ClampedArray): { rgba: Uint8ClampedArray; hadAlpha: boolean } {
  let hadAlpha = false
  const out = new Uint8ClampedArray(rgba)

  for (let i = 0; i < out.length; i += 4) {
    const alpha = out[i + 3] / 255
    if (out[i + 3] < 255) hadAlpha = true
    out[i] = Math.round(out[i] * alpha + 255 * (1 - alpha))
    out[i + 1] = Math.round(out[i + 1] * alpha + 255 * (1 - alpha))
    out[i + 2] = Math.round(out[i + 2] * alpha + 255 * (1 - alpha))
    out[i + 3] = 255
  }

  return { rgba: out, hadAlpha }
}

/**
 * Decodifica imagen a RGBA 8-bit en resolución original (sin reescalar).
 * Usa createImageBitmap cuando está disponible para mejor rendimiento.
 */
export async function decodeImageFile(file: File): Promise<DecodedImageSource> {
  if (!isSupportedImageFile(file)) {
    throw new Error('unsupported-format')
  }

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw new Error('corrupt-image')
  }

  try {
    const { width, height } = bitmap
    if (width <= 0 || height <= 0) throw new Error('corrupt-image')

    const canvas = new OffscreenCanvas(width, height)
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) throw new Error('corrupt-image')

    ctx.drawImage(bitmap, 0, 0)
    const imageData = ctx.getImageData(0, 0, width, height)
    const flattened = flattenAlphaOnWhite(imageData.data)
    const pixelCount = width * height

    return {
      rgba: flattened.rgba,
      width,
      height,
      hadAlpha: flattened.hadAlpha,
      wasGrayscale: isGrayscale(flattened.rgba, pixelCount),
    }
  } finally {
    bitmap.close()
  }
}

export function buildOutputFileName(sourceName: string, outputProfileId: string): string {
  const base = sourceName.replace(/\.[^.]+$/, '')
  return `${base}_${outputProfileId}_CMYK.tif`
}

export function buildPdfFileName(sourceName: string, outputProfileId: string): string {
  const base = sourceName.replace(/\.[^.]+$/, '')
  return `${base}_${outputProfileId}_CMYK.pdf`
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}
