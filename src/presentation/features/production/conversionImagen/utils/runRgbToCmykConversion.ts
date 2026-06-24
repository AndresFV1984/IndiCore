import { postProcessCmyk16Buffer } from './tacAndGcr'
import {
  getLcmsModule,
  openIccProfile,
  openInputProfile,
  rgba8ToRgb16,
  transformCmyk16PreviewToRgba8,
  transformRgb16ToCmyk16,
} from './lcmsEngine'
import { downsampleCmyk16To8, encodeCmykTiff } from './tiffCmykEncoder'
import { encodeCmykPdf } from './pdfCmykEncoder'
import { buildOutputFileName, buildPdfFileName } from './imageDecode'
import { findOutputProfile } from '../constants/iccProfiles'
import type { ConversionOptions, ConversionResultPayload, ConversionSourceMeta } from '../types'

const yieldToMainThread = (): Promise<void> =>
  new Promise(resolve => {
    window.setTimeout(resolve, 0)
  })

export type ConversionProgressCallback = (percent: number, phase: string) => void

export async function runRgbToCmykConversion(params: {
  rgba8: Uint8ClampedArray
  width: number
  height: number
  fileName: string
  meta: Omit<ConversionSourceMeta, 'width' | 'height' | 'fileName'>
  options: ConversionOptions
  outputIccBytes: Uint8Array
  inputIccBytes?: Uint8Array
  onProgress?: ConversionProgressCallback
  isCancelled?: () => boolean
}): Promise<ConversionResultPayload> {
  const {
    rgba8,
    width,
    height,
    fileName,
    meta,
    options,
    outputIccBytes,
    inputIccBytes,
    onProgress,
    isCancelled,
  } = params

  if (isCancelled?.()) throw new Error('cancelled')

  const lcms = await getLcmsModule()
  const pixelCount = width * height

  onProgress?.(5, 'prepare')
  await yieldToMainThread()

  const rgb16 = rgba8ToRgb16(rgba8, pixelCount)
  const inputProfile = openInputProfile(lcms, inputIccBytes)
  const outputProfile = openIccProfile(lcms, outputIccBytes)

  try {
    if (isCancelled?.()) throw new Error('cancelled')

    onProgress?.(10, 'transform')
    const cmyk16 = transformRgb16ToCmyk16(
      lcms,
      rgb16,
      pixelCount,
      inputProfile,
      outputProfile,
      options.renderingIntent,
      percent => onProgress?.(10 + Math.round(percent * 0.65), 'transform')
    )

    if (isCancelled?.()) throw new Error('cancelled')

    onProgress?.(80, 'post')
    await yieldToMainThread()
    postProcessCmyk16Buffer(cmyk16, pixelCount, options.tacPercent, options.gcrLevel)

    if (isCancelled?.()) throw new Error('cancelled')

    onProgress?.(88, 'preview')
    await yieldToMainThread()
    const preview = transformCmyk16PreviewToRgba8(
      lcms,
      cmyk16,
      pixelCount,
      outputProfile,
      960,
      width,
      height
    )

    if (isCancelled?.()) throw new Error('cancelled')

    onProgress?.(92, 'encode')
    const bitsPerSample = options.outputFormat === 'tiff16' ? 16 : 8
    const cmykBytes =
      bitsPerSample === 16
        ? new Uint8Array(cmyk16.buffer, cmyk16.byteOffset, cmyk16.byteLength)
        : downsampleCmyk16To8(cmyk16)
    const cmyk8ForPdf = bitsPerSample === 16 ? downsampleCmyk16To8(cmyk16) : cmykBytes

    const tiffBytes = encodeCmykTiff({
      width,
      height,
      cmykBytes,
      bitsPerSample,
      iccProfile: outputIccBytes,
      imageDescription: meta.exifDescription,
    })

    onProgress?.(96, 'pdf')
    await yieldToMainThread()
    const pdfBytes = encodeCmykPdf({
      width,
      height,
      cmykBytes: cmyk8ForPdf,
      iccProfile: outputIccBytes,
      title: meta.exifDescription,
      outputProfileLabel: findOutputProfile(options.outputProfileId)?.label,
    })

    onProgress?.(100, 'done')

    return {
      fileName: buildOutputFileName(fileName, options.outputProfileId),
      pdfFileName: buildPdfFileName(fileName, options.outputProfileId),
      mimeType: 'image/tiff',
      pdfMimeType: 'application/pdf',
      byteLength: tiffBytes.byteLength,
      pdfByteLength: pdfBytes.byteLength,
      tiffBytes: tiffBytes.buffer.slice(
        tiffBytes.byteOffset,
        tiffBytes.byteOffset + tiffBytes.byteLength
      ),
      pdfBytes: pdfBytes.buffer.slice(pdfBytes.byteOffset, pdfBytes.byteOffset + pdfBytes.byteLength),
      previewRgba: preview.rgba,
      previewWidth: preview.previewWidth,
      previewHeight: preview.previewHeight,
      outputProfileId: options.outputProfileId,
      meta: {
        fileName,
        width,
        height,
        hadAlpha: meta.hadAlpha,
        wasGrayscale: meta.wasGrayscale,
        exifDescription: meta.exifDescription,
      },
    }
  } finally {
    lcms.cmsCloseProfile(inputProfile)
    lcms.cmsCloseProfile(outputProfile)
  }
}
