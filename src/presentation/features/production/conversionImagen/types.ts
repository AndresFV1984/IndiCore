/** Rendering intents estándar de ICC / LCMS2. */
export type ConversionRenderingIntent =
  | 'perceptual'
  | 'relativeColorimetric'
  | 'saturation'
  | 'absoluteColorimetric'

/**
 * Simulación de GCR post-conversión.
 * LCMS2 no expone generación de negro en lcms-wasm; el perfil CMYK de destino
 * define el reparto base. Este ajuste mueve componente gris de CMY hacia K.
 */
export type ConversionGcrLevel = 'light' | 'medium' | 'maximum'

export type ConversionOutputFormat = 'tiff16' | 'tiff8'

export type ConversionInputProfileId = 'srgb-builtin' | 'srgb-icc'

export type ConversionOutputProfileId =
  | 'GenericCMYK_LCMS'
  | 'SWOP2006_Coated3v2'
  | 'ISOcoated_v2_eci'
  | 'GRACoL2006_Coated1v2'

export interface ConversionOptions {
  inputProfileId: ConversionInputProfileId
  outputProfileId: ConversionOutputProfileId
  renderingIntent: ConversionRenderingIntent
  /** TAC máximo en porcentaje (220–340). Suma C+M+Y+K por píxel. */
  tacPercent: number
  gcrLevel: ConversionGcrLevel
  outputFormat: ConversionOutputFormat
}

export interface ConversionSourceMeta {
  fileName: string
  width: number
  height: number
  hadAlpha: boolean
  wasGrayscale: boolean
  exifDescription?: string
}

export interface ConversionResultPayload {
  fileName: string
  pdfFileName: string
  mimeType: 'image/tiff'
  pdfMimeType: 'application/pdf'
  byteLength: number
  pdfByteLength: number
  tiffBytes: ArrayBuffer
  pdfBytes: ArrayBuffer
  previewRgba: Uint8ClampedArray
  previewWidth: number
  previewHeight: number
  outputProfileId: ConversionOutputProfileId
  meta: ConversionSourceMeta
}

export type ConversionErrorCode =
  | 'wasm-unsupported'
  | 'wasm-init-failed'
  | 'unsupported-format'
  | 'corrupt-image'
  | 'icc-missing'
  | 'icc-invalid'
  | 'conversion-failed'
  | 'cancelled'

export type WorkerInboundMessage =
  | { type: 'init' }
  | {
      type: 'convert'
      jobId: string
      rgba8: Uint8ClampedArray
      width: number
      height: number
      fileName: string
      meta: Omit<ConversionSourceMeta, 'width' | 'height' | 'fileName'>
      options: ConversionOptions
      outputIccBytes: Uint8Array
      inputIccBytes?: Uint8Array
    }
  | { type: 'cancel'; jobId: string }

export type WorkerOutboundMessage =
  | { type: 'ready' }
  | { type: 'progress'; jobId: string; percent: number; phase: string }
  | { type: 'complete'; jobId: string; result: ConversionResultPayload }
  | { type: 'error'; jobId?: string; code: ConversionErrorCode; message: string }
