import { useCallback, useEffect, useRef, useState } from 'react'
import exifr from 'exifr'
import type {
  ConversionErrorCode,
  ConversionOptions,
  ConversionResultPayload,
  ConversionSourceMeta,
} from './types'
import { decodeImageFile } from './utils/imageDecode'
import { getLcmsModule, isWebAssemblySupported } from './utils/lcmsEngine'
import { loadInputIccBytes, loadOutputIccBytes, probeAvailableOutputProfiles } from './utils/iccLoader'
import { runRgbToCmykConversion } from './utils/runRgbToCmykConversion'

type ConversionPhase = 'idle' | 'initializing' | 'decoding' | 'converting' | 'complete' | 'error'

export interface UseRgbToCmykConversionState {
  phase: ConversionPhase
  wasmReady: boolean
  progress: number
  progressPhase: string
  result: ConversionResultPayload | null
  error: { code: ConversionErrorCode; message: string } | null
  isBusy: boolean
  availableOutputProfiles: ConversionOptions['outputProfileId'][]
}

const defaultOptions: ConversionOptions = {
  inputProfileId: 'srgb-builtin',
  outputProfileId: 'GenericCMYK_LCMS',
  renderingIntent: 'relativeColorimetric',
  tacPercent: 320,
  gcrLevel: 'medium',
  outputFormat: 'tiff16',
}

export { probeAvailableOutputProfiles } from './utils/iccLoader'

export function useRgbToCmykConversion() {
  const cancelRef = useRef(false)
  const [options, setOptions] = useState<ConversionOptions>(defaultOptions)
  const [state, setState] = useState<UseRgbToCmykConversionState>({
    phase: 'idle',
    wasmReady: false,
    progress: 0,
    progressPhase: '',
    result: null,
    error: null,
    isBusy: false,
    availableOutputProfiles: ['GenericCMYK_LCMS'],
  })

  useEffect(() => {
    if (!isWebAssemblySupported()) {
      setState(prev => ({
        ...prev,
        phase: 'error',
        error: { code: 'wasm-unsupported', message: 'wasm-unsupported' },
      }))
      return
    }

    setState(prev => ({ ...prev, phase: 'initializing' }))
    void getLcmsModule()
      .then(() => {
        setState(prev => ({
          ...prev,
          wasmReady: true,
          phase: prev.phase === 'initializing' ? 'idle' : prev.phase,
        }))
      })
      .catch(error => {
        setState(prev => ({
          ...prev,
          phase: 'error',
          wasmReady: false,
          error: {
            code: 'wasm-init-failed',
            message: error instanceof Error ? error.message : 'wasm-init-failed',
          },
        }))
      })

    void probeAvailableOutputProfiles().then(profiles => {
      const resolved = profiles.length > 0 ? profiles : (['GenericCMYK_LCMS'] as const)
      setState(prev => ({ ...prev, availableOutputProfiles: [...resolved] }))
      setOptions(prev => ({
        ...prev,
        outputProfileId: resolved.includes(prev.outputProfileId) ? prev.outputProfileId : resolved[0],
      }))
    })
  }, [])

  const updateOptions = useCallback((patch: Partial<ConversionOptions>) => {
    setOptions(prev => ({ ...prev, ...patch }))
    setState(prev => ({ ...prev, result: null, error: null, phase: prev.phase === 'complete' ? 'idle' : prev.phase }))
  }, [])

  const reset = useCallback(() => {
    cancelRef.current = false
    setState(prev => ({
      ...prev,
      phase: 'idle',
      progress: 0,
      progressPhase: '',
      result: null,
      error: null,
      isBusy: false,
    }))
  }, [])

  const convertFile = useCallback(
    async (file: File) => {
      if (!isWebAssemblySupported()) return

      cancelRef.current = false

      setState(prev => ({
        ...prev,
        phase: 'decoding',
        progress: 0,
        progressPhase: 'decode',
        result: null,
        error: null,
        isBusy: true,
      }))

      try {
        await getLcmsModule()
        const decoded = await decodeImageFile(file)
        const outputIccBytes = await loadOutputIccBytes(options.outputProfileId)
        const inputIccBytes = await loadInputIccBytes(options.inputProfileId)

        let exifDescription: string | undefined
        try {
          const exif = await exifr.parse(file, { iptc: true })
          if (exif && typeof exif === 'object') {
            exifDescription = JSON.stringify(exif).slice(0, 512)
          }
        } catch {
          // metadatos opcionales
        }

        const meta: Omit<ConversionSourceMeta, 'width' | 'height' | 'fileName'> = {
          hadAlpha: decoded.hadAlpha,
          wasGrayscale: decoded.wasGrayscale,
          exifDescription,
        }

        setState(prev => ({
          ...prev,
          phase: 'converting',
          wasmReady: true,
          progress: 2,
          progressPhase: 'queue',
        }))

        const result = await runRgbToCmykConversion({
          rgba8: decoded.rgba,
          width: decoded.width,
          height: decoded.height,
          fileName: file.name,
          meta,
          options,
          outputIccBytes,
          inputIccBytes,
          isCancelled: () => cancelRef.current,
          onProgress: (percent, phase) => {
            if (cancelRef.current) return
            setState(prev => ({
              ...prev,
              progress: percent,
              progressPhase: phase,
            }))
          },
        })

        if (cancelRef.current) return

        setState(prev => ({
          ...prev,
          phase: 'complete',
          wasmReady: true,
          progress: 100,
          progressPhase: 'done',
          result,
          error: null,
          isBusy: false,
        }))
      } catch (error) {
        if (cancelRef.current) return

        const message = error instanceof Error ? error.message : 'conversion-failed'
        const code: ConversionErrorCode =
          message === 'unsupported-format'
            ? 'unsupported-format'
            : message === 'corrupt-image'
              ? 'corrupt-image'
              : message === 'icc-missing'
                ? 'icc-missing'
                : message === 'icc-invalid'
                  ? 'icc-invalid'
                  : message === 'cancelled'
                    ? 'cancelled'
                    : 'conversion-failed'

        setState(prev => ({
          ...prev,
          phase: 'error',
          error: { code, message },
          isBusy: false,
        }))
      }
    },
    [options]
  )

  const cancel = useCallback(() => {
    cancelRef.current = true
    setState(prev => ({ ...prev, isBusy: false, phase: 'idle', progress: 0 }))
  }, [])

  return {
    options,
    updateOptions,
    state,
    convertFile,
    cancel,
    reset,
  }
}
