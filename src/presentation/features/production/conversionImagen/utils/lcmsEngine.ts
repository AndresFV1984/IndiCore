import type { ConversionRenderingIntent } from '../types'
import lcmsWasmUrl from '../assets/lcms.wasm?url'

type LcmsPackage = typeof import('lcms-wasm')
export type LcmsModule = Awaited<ReturnType<LcmsPackage['instantiate']>>

let lcmsPromise: Promise<LcmsModule> | null = null
let lcmsPackage: LcmsPackage | null = null

const loadLcmsPackage = async (): Promise<LcmsPackage> => {
  if (!lcmsPackage) {
    lcmsPackage = await import('lcms-wasm')
  }
  return lcmsPackage
}

const loadWasmBinary = async (): Promise<ArrayBuffer> => {
  const response = await fetch(lcmsWasmUrl)
  if (!response.ok) {
    throw new Error(`lcms-wasm: no se encontró lcms.wasm (${response.status})`)
  }
  return response.arrayBuffer()
}

/** Carga LCMS2 con el binario WASM empaquetado (evita 404 en dev con Vite). */
export async function importLcms(): Promise<LcmsModule> {
  const pkg = await loadLcmsPackage()
  const wasmBinary = await loadWasmBinary()
  const module = await pkg.instantiate({ wasmBinary })

  if (typeof module.cmsCreate_sRGBProfile !== 'function') {
    throw new Error('lcms-wasm: módulo inicializado sin API CMYK')
  }

  return module
}

export async function getLcmsModule(): Promise<LcmsModule> {
  if (!lcmsPromise) {
    lcmsPromise = importLcms().catch(error => {
      lcmsPromise = null
      throw error
    })
  }
  return lcmsPromise
}

export function isWebAssemblySupported(): boolean {
  try {
    return typeof WebAssembly === 'object' && typeof WebAssembly.instantiate === 'function'
  } catch {
    return false
  }
}

const getPkg = (): LcmsPackage => {
  if (!lcmsPackage) {
    throw new Error('lcms-not-initialized')
  }
  return lcmsPackage
}

export const resolveRenderingIntent = (intent: ConversionRenderingIntent): number => {
  const {
    INTENT_PERCEPTUAL,
    INTENT_RELATIVE_COLORIMETRIC,
    INTENT_SATURATION,
    INTENT_ABSOLUTE_COLORIMETRIC,
  } = getPkg()

  switch (intent) {
    case 'perceptual':
      return INTENT_PERCEPTUAL
    case 'relativeColorimetric':
      return INTENT_RELATIVE_COLORIMETRIC
    case 'saturation':
      return INTENT_SATURATION
    case 'absoluteColorimetric':
      return INTENT_ABSOLUTE_COLORIMETRIC
    default:
      return INTENT_RELATIVE_COLORIMETRIC
  }
}

export function openIccProfile(lcms: LcmsModule, bytes: Uint8Array): number {
  const profile = lcms.cmsOpenProfileFromMem(bytes, bytes.byteLength)
  if (!profile) throw new Error('icc-invalid')
  return profile
}

export function openInputProfile(
  lcms: LcmsModule,
  inputIccBytes: Uint8Array | undefined
): number {
  if (inputIccBytes?.byteLength) {
    return openIccProfile(lcms, inputIccBytes)
  }
  const profile = lcms.cmsCreate_sRGBProfile()
  if (!profile) throw new Error('icc-invalid')
  return profile
}

export function transformRgb16ToCmyk16(
  lcms: LcmsModule,
  rgb16: Uint16Array,
  pixelCount: number,
  inputProfile: number,
  outputProfile: number,
  renderingIntent: ConversionRenderingIntent,
  onProgress?: (percent: number) => void
): Uint16Array {
  const { TYPE_RGB_16, TYPE_CMYK_16, cmsFLAGS_BLACKPOINTCOMPENSATION } = getPkg()
  const flags = cmsFLAGS_BLACKPOINTCOMPENSATION
  const transform = lcms.cmsCreateTransform(
    inputProfile,
    TYPE_RGB_16,
    outputProfile,
    TYPE_CMYK_16,
    resolveRenderingIntent(renderingIntent),
    flags
  )

  if (!transform) throw new Error('conversion-failed')

  try {
    const cmyk16 = new Uint16Array(pixelCount * 4)
    const chunkPixels = 65_536
    let processed = 0

    while (processed < pixelCount) {
      const count = Math.min(chunkPixels, pixelCount - processed)
      const rgbOffset = processed * 3
      const rgbChunk = rgb16.subarray(rgbOffset, rgbOffset + count * 3)
      const cmykChunk = lcms.cmsDoTransform(transform, rgbChunk, count) as Uint16Array
      cmyk16.set(cmykChunk, processed * 4)
      processed += count
      onProgress?.(Math.round((processed / pixelCount) * 100))
    }

    return cmyk16
  } finally {
    lcms.cmsDeleteTransform(transform)
  }
}

export function transformCmyk16PreviewToRgba8(
  lcms: LcmsModule,
  cmyk16: Uint16Array,
  pixelCount: number,
  cmykProfile: number,
  previewMaxSide: number,
  width: number,
  height: number
): { rgba: Uint8ClampedArray; previewWidth: number; previewHeight: number } {
  const {
    TYPE_CMYK_16,
    TYPE_RGB_16,
    INTENT_RELATIVE_COLORIMETRIC,
    cmsFLAGS_BLACKPOINTCOMPENSATION,
  } = getPkg()

  const scale = Math.min(1, previewMaxSide / Math.max(width, height))
  const previewWidth = Math.max(1, Math.round(width * scale))
  const previewHeight = Math.max(1, Math.round(height * scale))
  const previewPixels = previewWidth * previewHeight

  const sampledCmyk = new Uint16Array(previewPixels * 4)
  for (let y = 0; y < previewHeight; y += 1) {
    const srcY = Math.min(height - 1, Math.round(y / scale))
    for (let x = 0; x < previewWidth; x += 1) {
      const srcX = Math.min(width - 1, Math.round(x / scale))
      const srcIndex = (srcY * width + srcX) * 4
      const dstIndex = (y * previewWidth + x) * 4
      sampledCmyk[dstIndex] = cmyk16[srcIndex]
      sampledCmyk[dstIndex + 1] = cmyk16[srcIndex + 1]
      sampledCmyk[dstIndex + 2] = cmyk16[srcIndex + 2]
      sampledCmyk[dstIndex + 3] = cmyk16[srcIndex + 3]
    }
  }

  const srgbProfile = lcms.cmsCreate_sRGBProfile()
  const transform = lcms.cmsCreateTransform(
    cmykProfile,
    TYPE_CMYK_16,
    srgbProfile,
    TYPE_RGB_16,
    INTENT_RELATIVE_COLORIMETRIC,
    cmsFLAGS_BLACKPOINTCOMPENSATION
  )

  if (!transform) {
    lcms.cmsCloseProfile(srgbProfile)
    throw new Error('conversion-failed')
  }

  try {
    const rgb16 = lcms.cmsDoTransform(transform, sampledCmyk, previewPixels) as Uint16Array
    const rgba = new Uint8ClampedArray(previewPixels * 4)
    for (let i = 0; i < previewPixels; i += 1) {
      const rgbOffset = i * 3
      const rgbaOffset = i * 4
      rgba[rgbaOffset] = rgb16[rgbOffset] >> 8
      rgba[rgbaOffset + 1] = rgb16[rgbOffset + 1] >> 8
      rgba[rgbaOffset + 2] = rgb16[rgbOffset + 2] >> 8
      rgba[rgbaOffset + 3] = 255
    }
    return { rgba, previewWidth, previewHeight }
  } finally {
    lcms.cmsDeleteTransform(transform)
    lcms.cmsCloseProfile(srgbProfile)
  }
}

export function rgba8ToRgb16(rgba8: Uint8ClampedArray, pixelCount: number): Uint16Array {
  const rgb16 = new Uint16Array(pixelCount * 3)
  for (let i = 0; i < pixelCount; i += 1) {
    const rgbaOffset = i * 4
    const rgbOffset = i * 3
    rgb16[rgbOffset] = rgba8[rgbaOffset] * 257
    rgb16[rgbOffset + 1] = rgba8[rgbaOffset + 1] * 257
    rgb16[rgbOffset + 2] = rgba8[rgbaOffset + 2] * 257
  }
  return rgb16
}
