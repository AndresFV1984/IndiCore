import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import clsx from 'clsx'
import { IMPRESION_COPY as copy } from '../constants/impresionCopy'
import ProductionWorkspaceSection from '../ProductionWorkspaceSection'
import EstimarTintasProgressBar from '../EstimarTintasProgressBar'
import {
  INPUT_ICC_PROFILES,
  OUTPUT_ICC_PROFILES,
} from './constants/iccProfiles'
import ConversionImagenFlowShell from './components/ConversionImagenFlowShell'
import ConversionImagenReveal from './components/ConversionImagenReveal'
import ConversionImagenHelpDetails from './components/ConversionImagenHelpDetails'
import type { ConversionImagenStepState } from './components/ConversionImagenFlowShell'
import { useRgbToCmykConversion } from './useRgbToCmykConversion'
import type { ConversionErrorCode, ConversionGcrLevel, ConversionOutputProfileId, ConversionRenderingIntent } from './types'
import { formatBytes } from './utils/imageDecode'

const conversionCopy = copy.conversionImagen

const RENDERING_INTENTS: {
  id: ConversionRenderingIntent
  label: string
  description: string
}[] = [
  {
    id: 'perceptual',
    label: conversionCopy.renderingIntent.perceptual,
    description: conversionCopy.renderingIntent.perceptualDesc,
  },
  {
    id: 'relativeColorimetric',
    label: conversionCopy.renderingIntent.relativeColorimetric,
    description: conversionCopy.renderingIntent.relativeColorimetricDesc,
  },
  {
    id: 'saturation',
    label: conversionCopy.renderingIntent.saturation,
    description: conversionCopy.renderingIntent.saturationDesc,
  },
  {
    id: 'absoluteColorimetric',
    label: conversionCopy.renderingIntent.absoluteColorimetric,
    description: conversionCopy.renderingIntent.absoluteColorimetricDesc,
  },
]

const GCR_LEVELS: { id: ConversionGcrLevel; label: string }[] = [
  { id: 'light', label: conversionCopy.gcr.light },
  { id: 'medium', label: conversionCopy.gcr.medium },
  { id: 'maximum', label: conversionCopy.gcr.maximum },
]

const resolveErrorMessage = (code: ConversionErrorCode): string => {
  switch (code) {
    case 'wasm-unsupported':
      return conversionCopy.wasm.unsupported
    case 'wasm-init-failed':
      return conversionCopy.wasm.initFailed
    case 'unsupported-format':
      return conversionCopy.errors.unsupportedFormat
    case 'corrupt-image':
      return conversionCopy.errors.corruptImage
    case 'icc-missing':
      return conversionCopy.errors.iccMissing
    case 'icc-invalid':
      return conversionCopy.errors.iccInvalid
    default:
      return conversionCopy.errors.conversionFailed
  }
}

const resolveProgressLabel = (phase: string): string => {
  switch (phase) {
    case 'decode':
      return conversionCopy.progress.decode
    case 'prepare':
      return conversionCopy.progress.prepare
    case 'transform':
      return conversionCopy.progress.transform
    case 'post':
      return conversionCopy.progress.post
    case 'preview':
      return conversionCopy.progress.preview
    case 'encode':
      return conversionCopy.progress.encode
    case 'pdf':
      return conversionCopy.progress.pdf
    case 'queue':
      return conversionCopy.progress.queue
    case 'done':
      return conversionCopy.progress.done
    default:
      return conversionCopy.actions.converting
  }
}

const ConversionImagenCallout: React.FC<{
  tone?: 'info' | 'warning'
  children: React.ReactNode
}> = ({ tone = 'info', children }) => (
  <p
    className={clsx(
      'production-impresion-estimar-tintas-callout',
      `production-impresion-estimar-tintas-callout--${tone}`
    )}
    role="status"
  >
    {children}
  </p>
)

const conversionSelectClassName = clsx(
  'production-form-input',
  'production-form-select',
  'production-diseno-montaje-select__control'
)

const ConversionImagenRgbToCmykPanel: React.FC = () => {
  const inputId = useId()
  const { options, updateOptions, state, convertFile, cancel, reset } = useRgbToCmykConversion()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [imageMeta, setImageMeta] = useState<{ width: number; height: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isReadingFile, setIsReadingFile] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)
  const resultSectionRef = useRef<HTMLDivElement>(null)
  const availableProfiles = state.availableOutputProfiles

  const hasFile = Boolean(selectedFile)
  const hasResult = Boolean(state.result)
  const isBusy = state.isBusy

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null)
      setImageMeta(null)
      setIsReadingFile(false)
      return
    }

    const url = URL.createObjectURL(selectedFile)
    setPreviewUrl(url)
    setIsReadingFile(true)

    let cancelled = false
    void createImageBitmap(selectedFile)
      .then(bitmap => {
        if (cancelled) {
          bitmap.close()
          return
        }
        setImageMeta({ width: bitmap.width, height: bitmap.height })
        bitmap.close()
      })
      .catch(() => {
        if (!cancelled) setImageMeta(null)
      })
      .finally(() => {
        if (!cancelled) setIsReadingFile(false)
      })

    return () => {
      cancelled = true
      URL.revokeObjectURL(url)
    }
  }, [selectedFile])

  useEffect(() => {
    if (!state.result || !previewCanvasRef.current) return
    const canvas = previewCanvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = state.result.previewWidth
    canvas.height = state.result.previewHeight
    const imageData = new ImageData(
      new Uint8ClampedArray(state.result.previewRgba),
      state.result.previewWidth,
      state.result.previewHeight
    )
    ctx.putImageData(imageData, 0, 0)
  }, [state.result])

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const file = files?.[0]
      if (!file) return
      setSelectedFile(file)
      reset()
    },
    [reset]
  )

  const openFilePicker = useCallback(
    (event?: React.SyntheticEvent) => {
      if (isBusy) return
      event?.preventDefault()
      event?.stopPropagation()

      const input = fileInputRef.current
      if (!input) return

      if (typeof input.showPicker === 'function') {
        try {
          void input.showPicker().catch(() => {
            // El usuario canceló el diálogo nativo.
          })
          return
        } catch {
          // Algunos navegadores solo permiten showPicker tras activación del usuario.
        }
      }
      input.click()
    },
    [isBusy]
  )

  const clearFile = useCallback(() => {
    setSelectedFile(null)
    setIsReadingFile(false)
    reset()
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [reset])

  const handleConvert = useCallback(() => {
    if (!selectedFile || state.isBusy) return
    void convertFile(selectedFile)
    window.requestAnimationFrame(() => {
      resultSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    })
  }, [convertFile, selectedFile, state.isBusy])

  const conversionProgressLabel = resolveProgressLabel(state.progressPhase)
  const conversionProgressIndeterminate =
    isBusy && (state.progressPhase === 'decode' || (state.progressPhase === 'queue' && state.progress <= 2))

  const handleDownload = useCallback(() => {
    if (!state.result) return
    const blob = new Blob([state.result.tiffBytes], { type: state.result.mimeType })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = state.result.fileName
    anchor.click()
    URL.revokeObjectURL(url)
  }, [state.result])

  const handleDownloadPdf = useCallback(() => {
    if (!state.result) return
    const blob = new Blob([state.result.pdfBytes], { type: state.result.pdfMimeType })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = state.result.pdfFileName
    anchor.click()
    URL.revokeObjectURL(url)
  }, [state.result])

  const outputProfiles = useMemo(
    () =>
      OUTPUT_ICC_PROFILES.map(profile => ({
        ...profile,
        available: availableProfiles.includes(profile.id),
      })),
    [availableProfiles]
  )

  const inputProfileHelpItems = useMemo(
    () =>
      INPUT_ICC_PROFILES.map(profile => ({
        label: profile.label,
        description: profile.description,
      })),
    []
  )

  const outputProfileHelpItems = useMemo(
    () =>
      outputProfiles.map(profile => ({
        label: profile.label,
        description: profile.available
          ? profile.description
          : `${profile.description} ${conversionCopy.profiles.outputUnavailableNote}`,
      })),
    [outputProfiles]
  )

  const renderingIntentHelpItems = useMemo(
    () =>
      RENDERING_INTENTS.map(intent => ({
        label: intent.label,
        description: intent.description,
      })),
    []
  )

  const outputFormatHelpItems = useMemo(
    () => [
      { label: conversionCopy.output.tiff16, description: conversionCopy.output.tiff16Desc },
      { label: conversionCopy.output.tiff8, description: conversionCopy.output.tiff8Desc },
    ],
    []
  )

  const gcrHelpItems = useMemo(
    () => [
      { label: conversionCopy.gcr.light, description: conversionCopy.gcr.lightDesc },
      { label: conversionCopy.gcr.medium, description: conversionCopy.gcr.mediumDesc },
      { label: conversionCopy.gcr.maximum, description: conversionCopy.gcr.maximumDesc },
    ],
    []
  )

  const tacHelpItems = useMemo(
    () => [
      {
        label: conversionCopy.tac.presets.digital,
        description: conversionCopy.tac.presetHelp.digital,
      },
      {
        label: conversionCopy.tac.presets.bond,
        description: conversionCopy.tac.presetHelp.bond,
      },
      {
        label: conversionCopy.tac.presets.coated,
        description: conversionCopy.tac.presetHelp.coated,
      },
      {
        label: conversionCopy.tac.presets.max,
        description: conversionCopy.tac.presetHelp.max,
      },
    ],
    []
  )

  const profilesHelpItems = useMemo(
    () => [
      {
        label: conversionCopy.profiles.inputLabel,
        description: conversionCopy.profiles.inputHelpIntro,
      },
      ...inputProfileHelpItems,
      {
        label: conversionCopy.profiles.outputLabel,
        description: conversionCopy.profiles.outputHelpIntro,
      },
      ...outputProfileHelpItems,
    ],
    [inputProfileHelpItems, outputProfileHelpItems]
  )

  const conversionHelpItems = useMemo(
    () => [
      {
        label: conversionCopy.renderingIntent.label,
        description: conversionCopy.renderingIntent.helpIntro,
      },
      ...renderingIntentHelpItems,
      {
        label: conversionCopy.output.label,
        description: conversionCopy.output.helpIntro,
      },
      ...outputFormatHelpItems,
      {
        label: 'JPEG CMYK',
        description: conversionCopy.output.jpegNote,
      },
    ],
    [renderingIntentHelpItems, outputFormatHelpItems]
  )

  const printHelpItems = useMemo(
    () => [
      {
        label: conversionCopy.tac.label,
        description: conversionCopy.tac.helpIntro,
      },
      ...tacHelpItems,
      {
        label: conversionCopy.gcr.label,
        description: conversionCopy.gcr.helpIntro,
      },
      ...gcrHelpItems,
      {
        label: 'Importante',
        description: conversionCopy.gcr.limitation,
      },
    ],
    [tacHelpItems, gcrHelpItems]
  )

  const selectedRenderingIntentDesc = RENDERING_INTENTS.find(
    intent => intent.id === options.renderingIntent
  )?.description

  const selectedOutputAvailable = availableProfiles.includes(options.outputProfileId)

  const canConvert =
    Boolean(selectedFile) && selectedOutputAvailable && state.wasmReady && !state.isBusy

  const convertBlockHint = !canConvert && !isBusy
    ? !state.wasmReady
      ? conversionCopy.pending.wasm
      : !selectedOutputAvailable
        ? conversionCopy.profiles.iccMissing
        : null
    : null

  const flowSteps = useMemo((): { id: string; state: ConversionImagenStepState }[] => {
    const archivoState: ConversionImagenStepState = hasFile ? 'complete' : 'active'
    const opcionesState: ConversionImagenStepState = !hasFile
      ? 'locked'
      : hasResult
        ? 'complete'
        : 'active'
    const resultadoState: ConversionImagenStepState = hasResult
      ? 'complete'
      : isBusy
        ? 'active'
        : 'locked'

    return [
      { id: 'archivo', state: archivoState },
      { id: 'opciones', state: opcionesState },
      { id: 'resultado', state: resultadoState },
    ]
  }, [hasFile, hasResult, isBusy])

  const wasmStatus =
    state.phase === 'initializing'
      ? conversionCopy.wasm.initializing
      : state.wasmReady
        ? conversionCopy.wasm.ready
        : null

  const showOptionsSection = hasFile
  const showResultSection = hasResult || isBusy

  return (
    <>
      <p className="production-workspace-panel-desc production-impresion-estimar-tintas-lead">
        {conversionCopy.panelDesc}
      </p>

      <ProductionWorkspaceSection
        tag={conversionCopy.section.tag}
        title={conversionCopy.section.title}
        subtitle={conversionCopy.section.subtitle}
        tone={0}
        className="production-impresion-estimar-tintas production-impresion-conversion-imagen"
      >
        {wasmStatus ? (
          <ConversionImagenCallout tone={state.wasmReady ? 'info' : 'warning'}>{wasmStatus}</ConversionImagenCallout>
        ) : null}

        <p className="production-impresion-conversion-imagen__bundle-note">{conversionCopy.bundleNote}</p>

        {state.error ? (
          <p
            className="production-impresion-estimar-tintas-area__message production-impresion-estimar-tintas-area__message--error"
            role="alert"
          >
            {resolveErrorMessage(state.error.code)}
            {state.error.message &&
            state.error.message !== state.error.code &&
            !['wasm-unsupported', 'icc-missing'].includes(state.error.code)
              ? ` ${state.error.message}`
              : null}
          </p>
        ) : null}

        <div className="production-impresion-estimar-tintas__grid production-impresion-estimar-tintas__grid--single">
          <div className="production-impresion-estimar-tintas__main">
            <ConversionImagenFlowShell
              sectionId="archivo"
              title={conversionCopy.upload.title}
              subtitle={conversionCopy.upload.subtitle}
              status={flowSteps[0]?.state ?? 'active'}
            >
              <div className="production-impresion-estimar-tintas__upload">
                <input
                  ref={fileInputRef}
                  id={inputId}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/bmp,image/gif,image/tiff"
                  className="production-diseno-pdf-upload__input"
                  tabIndex={-1}
                  aria-hidden
                  disabled={isBusy}
                  onChange={event => {
                    handleFiles(event.target.files)
                    event.target.value = ''
                  }}
                />

                {!selectedFile ? (
                  <div
                    className={clsx(
                      'production-diseno-pdf-upload__drop',
                      'production-impresion-estimar-tintas__drop',
                      'production-impresion-estimar-tintas__drop--modern',
                      isDragging && 'production-diseno-pdf-upload__drop--active',
                      isBusy && 'production-impresion-conversion-imagen__drop--busy'
                    )}
                    role="button"
                    tabIndex={isBusy ? -1 : 0}
                    aria-disabled={isBusy}
                    onClick={event => openFilePicker(event)}
                    onKeyDown={event => {
                      if (isBusy) return
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        openFilePicker(event)
                      }
                    }}
                    onDragOver={event => {
                      if (isBusy) return
                      event.preventDefault()
                      setIsDragging(true)
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={event => {
                      if (isBusy) return
                      event.preventDefault()
                      setIsDragging(false)
                      handleFiles(event.dataTransfer.files)
                    }}
                  >
                    <span>{isDragging ? conversionCopy.upload.dropActive : conversionCopy.upload.dropLabel}</span>
                    <small>{conversionCopy.upload.dropHint}</small>
                    <button
                      type="button"
                      className="production-diseno-pdf-upload__select-btn"
                      disabled={isBusy}
                      onPointerDown={event => {
                        event.stopPropagation()
                        if (event.button !== 0) return
                        openFilePicker(event)
                      }}
                    >
                      {conversionCopy.upload.selectBtn}
                    </button>
                  </div>
                ) : (
                  <div className="production-impresion-estimar-tintas__asset">
                    <div className="production-impresion-estimar-tintas__asset-preview">
                      {previewUrl ? (
                        <img
                          src={previewUrl}
                          alt={conversionCopy.upload.previewAlt}
                          className="production-impresion-estimar-tintas__asset-image"
                        />
                      ) : null}
                    </div>
                    <div className="production-impresion-estimar-tintas__asset-body">
                      <strong
                        className="production-impresion-estimar-tintas__asset-name"
                        title={selectedFile.name}
                      >
                        {selectedFile.name}
                      </strong>
                      <div className="production-impresion-estimar-tintas__chips">
                        <span className="production-impresion-estimar-tintas__chip">
                          {formatBytes(selectedFile.size)}
                        </span>
                        {imageMeta ? (
                          <span className="production-impresion-estimar-tintas__chip">
                            {conversionCopy.upload.pixelsLabel(imageMeta.width, imageMeta.height)}
                          </span>
                        ) : null}
                      </div>
                      {isReadingFile ? (
                        <EstimarTintasProgressBar
                          label={conversionCopy.upload.readingFile}
                          percent={0}
                          indeterminate
                          className="production-impresion-conversion-imagen__upload-progress"
                        />
                      ) : null}
                      <div className="production-impresion-estimar-tintas__asset-actions">
                        <button
                          type="button"
                          className="production-diseno-pdf-upload__action-btn"
                          disabled={isBusy}
                          onPointerDown={event => {
                            if (event.button !== 0) return
                            openFilePicker(event)
                          }}
                        >
                          {conversionCopy.upload.replace}
                        </button>
                        <button
                          type="button"
                          className="production-diseno-pdf-upload__action-btn production-diseno-pdf-upload__action-btn--danger"
                          onClick={clearFile}
                        >
                          {conversionCopy.upload.remove}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ConversionImagenFlowShell>

            <ConversionImagenReveal show={showOptionsSection}>
              <ConversionImagenFlowShell
                sectionId="opciones"
                title={conversionCopy.options.title}
                subtitle={conversionCopy.options.subtitle}
                status={flowSteps[1]?.state ?? 'active'}
              >
                <div className="production-impresion-conversion-imagen__options">
                  <section className="production-impresion-conversion-imagen__options-group">
                    <header className="production-impresion-conversion-imagen__options-head">
                      <h4>{conversionCopy.options.groups.profilesTitle}</h4>
                      <p>{conversionCopy.options.groups.profilesHint}</p>
                    </header>
                    <div className="production-impresion-conversion-imagen__options-row">
                      <div className="production-impresion-conversion-imagen__option-field">
                        <label
                          className="production-impresion-conversion-imagen__option-label"
                          htmlFor="conv-input-profile"
                        >
                          {conversionCopy.profiles.inputLabel}
                        </label>
                        <select
                          id="conv-input-profile"
                          className={conversionSelectClassName}
                          value={options.inputProfileId}
                          disabled={isBusy}
                          onChange={event =>
                            updateOptions({
                              inputProfileId: event.target.value as typeof options.inputProfileId,
                            })
                          }
                        >
                          {INPUT_ICC_PROFILES.map(profile => (
                            <option key={profile.id} value={profile.id}>
                              {profile.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="production-impresion-conversion-imagen__option-field">
                        <label
                          className="production-impresion-conversion-imagen__option-label"
                          htmlFor="conv-output-profile"
                        >
                          {conversionCopy.profiles.outputLabel}
                        </label>
                        <select
                          id="conv-output-profile"
                          className={conversionSelectClassName}
                          value={options.outputProfileId}
                          disabled={isBusy}
                          onChange={event =>
                            updateOptions({
                              outputProfileId: event.target.value as ConversionOutputProfileId,
                            })
                          }
                        >
                          {outputProfiles.map(profile => (
                            <option key={profile.id} value={profile.id} disabled={!profile.available}>
                              {profile.label}
                              {!profile.available ? ' (no instalado)' : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {!selectedOutputAvailable ? (
                      <ConversionImagenCallout tone="warning">
                        {conversionCopy.profiles.iccMissing}
                      </ConversionImagenCallout>
                    ) : null}
                    <ConversionImagenHelpDetails
                      summary={conversionCopy.help.profilesSummary}
                      items={profilesHelpItems}
                    />
                  </section>

                  <section className="production-impresion-conversion-imagen__options-group">
                    <header className="production-impresion-conversion-imagen__options-head">
                      <h4>{conversionCopy.options.groups.conversionTitle}</h4>
                      <p>{conversionCopy.options.groups.conversionHint}</p>
                    </header>
                    <div className="production-impresion-conversion-imagen__options-row">
                      <div className="production-impresion-conversion-imagen__option-field">
                        <label
                          className="production-impresion-conversion-imagen__option-label"
                          htmlFor="conv-rendering-intent"
                        >
                          {conversionCopy.renderingIntent.label}
                        </label>
                        <select
                          id="conv-rendering-intent"
                          className={conversionSelectClassName}
                          value={options.renderingIntent}
                          disabled={isBusy}
                          onChange={event =>
                            updateOptions({
                              renderingIntent: event.target.value as ConversionRenderingIntent,
                            })
                          }
                        >
                          {RENDERING_INTENTS.map(intent => (
                            <option key={intent.id} value={intent.id}>
                              {intent.label}
                            </option>
                          ))}
                        </select>
                        {selectedRenderingIntentDesc ? (
                          <p className="production-impresion-conversion-imagen__option-hint">
                            {selectedRenderingIntentDesc}
                          </p>
                        ) : null}
                      </div>

                      <div className="production-impresion-conversion-imagen__option-field">
                        <label
                          className="production-impresion-conversion-imagen__option-label"
                          htmlFor="conv-output-format"
                        >
                          {conversionCopy.output.label}
                        </label>
                        <select
                          id="conv-output-format"
                          className={conversionSelectClassName}
                          value={options.outputFormat}
                          disabled={isBusy}
                          onChange={event =>
                            updateOptions({
                              outputFormat: event.target.value as typeof options.outputFormat,
                            })
                          }
                        >
                          <option value="tiff16">{conversionCopy.output.tiff16}</option>
                          <option value="tiff8">{conversionCopy.output.tiff8}</option>
                        </select>
                      </div>
                    </div>
                    <ConversionImagenHelpDetails
                      summary={conversionCopy.help.conversionSummary}
                      items={conversionHelpItems}
                    />
                  </section>

                  <details className="production-impresion-conversion-imagen__options-advanced">
                    <summary className="production-impresion-conversion-imagen__options-advanced-toggle">
                      <span className="production-impresion-conversion-imagen__options-advanced-copy">
                        <span className="production-impresion-conversion-imagen__options-advanced-heading">
                          <span className="production-impresion-conversion-imagen__options-advanced-title">
                            {conversionCopy.options.groups.printTitle}
                          </span>
                          <span className="production-impresion-conversion-imagen__options-advanced-action">
                            <span className="production-impresion-conversion-imagen__options-advanced-action-label">
                              <span className="production-impresion-conversion-imagen__options-advanced-action-closed">
                                {conversionCopy.options.groups.printToggleAction}
                              </span>
                              <span className="production-impresion-conversion-imagen__options-advanced-action-open">
                                {conversionCopy.options.groups.printToggleActionOpen}
                              </span>
                            </span>
                            <span
                              className="production-impresion-conversion-imagen__options-advanced-chevron"
                              aria-hidden
                            />
                          </span>
                        </span>
                        <span className="production-impresion-conversion-imagen__options-advanced-subtitle">
                          {conversionCopy.options.groups.printToggleHint}
                        </span>
                      </span>
                    </summary>
                    <div className="production-impresion-conversion-imagen__options-advanced-body">
                      <p className="production-impresion-conversion-imagen__options-advanced-hint">
                        {conversionCopy.options.groups.printHint}
                      </p>

                      <div className="production-impresion-conversion-imagen__option-field">
                        <label className="production-impresion-conversion-imagen__option-label" htmlFor="conv-tac">
                          {conversionCopy.tac.label}
                          <span className="production-impresion-conversion-imagen__option-value">
                            {options.tacPercent} %
                          </span>
                        </label>
                        <input
                          id="conv-tac"
                          type="range"
                          min={220}
                          max={340}
                          step={5}
                          value={options.tacPercent}
                          disabled={isBusy}
                          onChange={event => updateOptions({ tacPercent: Number(event.target.value) })}
                          className="production-impresion-conversion-imagen__range"
                        />
                        <div className="production-impresion-conversion-imagen__tac-presets">
                          {(
                            [
                              ['digital', 240],
                              ['bond', 280],
                              ['coated', 320],
                              ['max', 340],
                            ] as const
                          ).map(([key, value]) => (
                            <button
                              key={key}
                              type="button"
                              className={clsx(
                                'production-impresion-conversion-imagen__preset',
                                options.tacPercent === value &&
                                  'production-impresion-conversion-imagen__preset--active'
                              )}
                              disabled={isBusy}
                              onClick={() => updateOptions({ tacPercent: value })}
                            >
                              {conversionCopy.tac.presets[key]}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="production-impresion-conversion-imagen__option-field">
                        <span className="production-impresion-conversion-imagen__option-label">
                          {conversionCopy.gcr.label}
                        </span>
                        <div className="production-impresion-conversion-imagen__gcr-options">
                          {GCR_LEVELS.map(level => (
                            <button
                              key={level.id}
                              type="button"
                              className={clsx(
                                'production-impresion-conversion-imagen__gcr-pill',
                                options.gcrLevel === level.id &&
                                  'production-impresion-conversion-imagen__gcr-pill--active'
                              )}
                              disabled={isBusy}
                              onClick={() => updateOptions({ gcrLevel: level.id })}
                            >
                              {level.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <ConversionImagenHelpDetails
                        summary={conversionCopy.help.printSummary}
                        items={printHelpItems}
                      />
                    </div>
                  </details>

                  <div className="production-impresion-conversion-imagen__options-actions">
                    {convertBlockHint ? (
                      <p className="production-impresion-conversion-imagen__options-note" role="status">
                        {convertBlockHint}
                      </p>
                    ) : null}
                    <div className="production-impresion-estimar-tintas-area__actions">
                      <button
                        type="button"
                        className="production-impresion-estimar-tintas-hud__btn production-impresion-estimar-tintas-hud__btn--primary"
                        disabled={!canConvert}
                        onClick={handleConvert}
                      >
                        {isBusy ? (
                          <>
                            <span
                              className="production-impresion-estimar-tintas-hud__btn-spinner"
                              aria-hidden
                            />
                            {conversionCopy.actions.converting}
                          </>
                        ) : (
                          conversionCopy.actions.convert
                        )}
                      </button>
                      {isBusy ? (
                        <button
                          type="button"
                          className="production-impresion-estimar-tintas-hud__btn production-impresion-estimar-tintas-hud__btn--ghost"
                          onClick={cancel}
                        >
                          {conversionCopy.actions.cancel}
                        </button>
                      ) : null}
                    </div>

                    {isBusy ? (
                      <EstimarTintasProgressBar
                        label={conversionProgressLabel}
                        percent={state.progress}
                        indeterminate={conversionProgressIndeterminate}
                        className="production-impresion-conversion-imagen__convert-progress"
                      />
                    ) : null}
                  </div>
                </div>
              </ConversionImagenFlowShell>
            </ConversionImagenReveal>

            <ConversionImagenReveal show={showResultSection}>
              <div ref={resultSectionRef}>
              <ConversionImagenFlowShell
                sectionId="resultado"
                title={conversionCopy.results.title}
                subtitle={conversionCopy.results.subtitle}
                status={flowSteps[2]?.state ?? 'active'}
                className="production-impresion-estimar-tintas-step--result"
              >
                <div className="production-impresion-estimar-tintas-hud" aria-live="polite">
                  <div className="production-impresion-estimar-tintas-hud__fx" aria-hidden />

                  <div className="production-impresion-conversion-imagen__preview-wrap">
                    {state.result ? (
                      <canvas
                        ref={previewCanvasRef}
                        className="production-impresion-conversion-imagen__preview-canvas"
                      />
                    ) : isBusy ? (
                      <div className="production-impresion-conversion-imagen__preview-converting">
                        <EstimarTintasProgressBar
                          label={conversionProgressLabel}
                          percent={state.progress}
                          indeterminate={conversionProgressIndeterminate}
                          className="production-impresion-conversion-imagen__convert-progress"
                        />
                      </div>
                    ) : (
                      <p className="production-impresion-conversion-imagen__preview-empty">
                        {conversionCopy.preview.empty}
                      </p>
                    )}
                  </div>

                  <p className="production-impresion-estimar-tintas-area__field-hint">
                    {conversionCopy.preview.hint}
                  </p>

                  {state.result ? (
                    <>
                      <dl className="production-impresion-estimar-tintas-summary">
                        <div className="production-impresion-estimar-tintas-summary__row">
                          <dt>{conversionCopy.result.dimensionsLabel}</dt>
                          <dd>
                            {state.result.meta.width.toLocaleString('es-CO')} ×{' '}
                            {state.result.meta.height.toLocaleString('es-CO')} px
                          </dd>
                        </div>
                        <div className="production-impresion-estimar-tintas-summary__row">
                          <dt>{conversionCopy.result.sizeLabel}</dt>
                          <dd>{formatBytes(state.result.byteLength)}</dd>
                        </div>
                        <div className="production-impresion-estimar-tintas-summary__row">
                          <dt>{conversionCopy.result.pdfSizeLabel}</dt>
                          <dd>{formatBytes(state.result.pdfByteLength)}</dd>
                        </div>
                      </dl>

                      {state.result.meta.hadAlpha ? (
                        <ConversionImagenCallout>{conversionCopy.result.alphaFlattened}</ConversionImagenCallout>
                      ) : null}
                      {state.result.meta.wasGrayscale ? (
                        <ConversionImagenCallout>{conversionCopy.result.grayscaleConverted}</ConversionImagenCallout>
                      ) : null}
                      <ConversionImagenCallout tone="info">
                        {conversionCopy.result.tiffViewerNote}
                      </ConversionImagenCallout>

                      <div className="production-impresion-estimar-tintas-hud__save">
                        <div className="production-impresion-estimar-tintas-hud__save-actions">
                          <button
                            type="button"
                            className="production-impresion-estimar-tintas-hud__btn production-impresion-estimar-tintas-hud__btn--primary"
                            onClick={handleDownload}
                          >
                            {conversionCopy.actions.download}
                          </button>
                          <button
                            type="button"
                            className="production-impresion-estimar-tintas-hud__btn production-impresion-estimar-tintas-hud__btn--primary"
                            onClick={handleDownloadPdf}
                          >
                            {conversionCopy.actions.downloadPdf}
                          </button>
                          <button
                            type="button"
                            className="production-impresion-estimar-tintas-hud__btn production-impresion-estimar-tintas-hud__btn--ghost"
                            onClick={reset}
                          >
                            {conversionCopy.actions.reset}
                          </button>
                        </div>
                      </div>
                    </>
                  ) : null}
                </div>
              </ConversionImagenFlowShell>
              </div>
            </ConversionImagenReveal>

            {!hasFile ? (
              <p className="production-impresion-estimar-tintas-next-hint">{conversionCopy.pending.archivo}</p>
            ) : null}
            {hasFile && !state.wasmReady ? (
              <p className="production-impresion-estimar-tintas-next-hint">{conversionCopy.pending.wasm}</p>
            ) : null}
            {hasFile && state.wasmReady && !hasResult && !isBusy ? (
              <p className="production-impresion-estimar-tintas-next-hint">{conversionCopy.pending.opciones}</p>
            ) : null}
          </div>
        </div>
      </ProductionWorkspaceSection>
    </>
  )
}

export default ConversionImagenRgbToCmykPanel
