import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import clsx from 'clsx'
import type { PaperRow } from '../../../core/domain/entities/Order'
import type { TipoPapel } from '../../../core/domain/entities/TipoPapel'
import type { DisenoColorPlanchaItem } from '../../../core/domain/entities/PreprensaDiseno'
import ProductionWorkspaceSection from './ProductionWorkspaceSection'
import ImpresionPlanchaSelect from './ImpresionPlanchaSelect'
import { formatMedidaDisplayFrom } from '../catalog/cortePapelUtils'
import { findPaperRowForActiveId } from './utils/cortePapelFaltante'
import {
  normalizeTipoPapelList,
  resolveDespieceForPaperRow,
  syncPaperRowWithTipoPapelCatalog,
} from './utils/tipoPapelDisplay'
import { IMPRESION_COPY as copy } from './constants/impresionCopy'
import {
  CMYK_CHANNELS,
  ESTIMAR_TINTAS_DEFAULT_CONVERSION_FACTOR_G,
  ESTIMAR_TINTAS_DEFAULT_DPI,
  ESTIMAR_TINTAS_DEFAULT_HEIGHT_CM,
  ESTIMAR_TINTAS_DEFAULT_WIDTH_CM,
  ESTIMAR_TINTAS_MAX_FILE_MB,
  getEstimarTintasDefaultPrintArea,
  computeCalibrationPreview,
  computeEstimarTintasInkTotalsSnapshot,
  computeEstimarTintasTotalInkGPerPliego,
  buildEstimarTintasEstimateOptions,
  formatCalibrationDeltaPercent,
  formatConversionFactorForInput,
  parseConversionFactorInput,
  resolveConversionFactorG,
  type EstimarTintasCalibrationPreview,
  type EstimarTintasResult,
  estimateInkFromImageElement,
  estimateInkFromCanvas,
  formatEstimarTintasCoverage,
  formatEstimarTintasWeightG,
  formatEstimarTintasEntero,
  resolvePlanchaTotalPliegos,
  resolveDespiecePrintAreaCm,
  loadEstimarTintasImage,
  mapEstimarTintasErrorCode,
  resolveEstimarTintasPantoneSpotContext,
  validateEstimarTintasFile,
  ESTIMAR_TINTAS_ALPHA_MIN,
  ESTIMAR_TINTAS_WHITE_THRESHOLD,
  type EstimarTintasSourceKind,
  type EstimarTintasProgressUpdate,
  getEstimarTintasSourceKind,
} from './utils/estimarTintasUtils'
import { prepareEstimarTintasPdfSource } from './utils/estimarTintasPdfUtils'
import { captureEstimarTintasAssetPreviewDataUrl } from './utils/estimarTintasPreviewUtils'
import {
  deleteEstimarTintasCachedAsset,
  getEstimarTintasCachedAsset,
  setEstimarTintasCachedAsset,
} from './utils/estimarTintasAssetCache'
import EstimarTintasPdfAssetPreview from './EstimarTintasPdfAssetPreview'
import EstimarTintasEntradasList from './EstimarTintasEntradasList'
import EstimarTintasConsumoPalette from './EstimarTintasConsumoPalette'
import EstimarTintasInkTotalsPanel from './EstimarTintasInkTotalsPanel'
import EstimarTintasProgressBar from './EstimarTintasProgressBar'
import ProductionImpresionEstimarTintasResumen from './ProductionImpresionEstimarTintasResumen'
import {
  buildEstimarTintasTableRows,
  createImpresionEstimarTintasEntrada,
  entradaToEstimarTintasResult,
} from './utils/estimarTintasRegistrosUtils'
import type { ImpresionEstimarTintasEntrada, ImpresionEstimarTintasRegistro } from '../../../core/domain/entities/Order'
import {
  buildEstimarTintasFileColorProfile,
  detectEstimarTintasFileColorSpace,
  syncFileColorProfileSpotsFromEstimate,
  type EstimarTintasFileColorProfile,
  type EstimarTintasSourceColorSpace,
} from './utils/estimarTintasColorSpaceUtils'
import { resolvePantoneLabelAsCatalogName } from './utils/estimarTintasPdfSpotUtils'
import { resolvePantoneDisplayHexFromName } from './utils/estimarTintasPantoneDisplayCatalog'

const estimarCopy = copy.muestra
const planchaCopy = estimarCopy.plancha
const entradasCopy = estimarCopy.entradas

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const formatCmInput = (value: number): string => {
  if (!Number.isFinite(value) || value <= 0) return ''
  return (Math.round(value * 100) / 100).toString()
}

const formatDefaultPrintAreaInputs = () => {
  const defaults = getEstimarTintasDefaultPrintArea()
  return {
    widthCmInput: formatCmInput(defaults.widthCm),
    heightCmInput: formatCmInput(defaults.heightCm),
    dpiInput: String(defaults.dpi),
    conversionFactorInput: formatConversionFactorForInput(defaults.conversionFactorG),
  }
}

const resolveEstimarTintasProgressLabel = (
  update: EstimarTintasProgressUpdate
): string => {
  switch (update.label) {
    case 'preparing-sample':
      return estimarCopy.progress.preparingSample
    case 'rendering-pdf':
      return estimarCopy.progress.renderingPdf
    case 'reading-pixels':
      return estimarCopy.progress.readingPixels
    case 'detecting-spots':
      return estimarCopy.progress.detectingSpots
    case 'computing-cmyk':
      return estimarCopy.progress.computingCmyk
    case 'detecting-pantone':
      return estimarCopy.progress.detectingPantone
    case 'finishing':
    case 'done':
      return estimarCopy.progress.finishing
    default:
      return estimarCopy.actions.calculating
  }
}

const parsePositiveNumber = (value: string): number => {
  const parsed = Number.parseFloat(value.replace(',', '.'))
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

const resolveErrorMessage = (code: string): string => {
  switch (code) {
    case 'invalid-type':
      return estimarCopy.errors.invalidType
    case 'max-size':
      return estimarCopy.errors.maxSize(ESTIMAR_TINTAS_MAX_FILE_MB)
    case 'image-load-failed':
      return estimarCopy.errors.imageLoadFailed
    case 'pdf-load-failed':
      return estimarCopy.errors.pdfLoadFailed
    case 'invalid-image-dimensions':
      return estimarCopy.errors.invalidDimensions
    case 'canvas-unavailable':
      return estimarCopy.errors.canvasUnavailable
    case 'empty-image':
      return estimarCopy.errors.emptyImage
    case 'invalid-params':
      return estimarCopy.errors.invalidParams
    case 'invalid-calibration-params':
      return estimarCopy.calibration.invalidParams
    case 'invalid-coverage-sum':
      return estimarCopy.calibration.invalidCoverage
    default:
      return estimarCopy.errors.unknown
  }
}

type EstimarTintasStepState = 'locked' | 'active' | 'complete'

interface EstimarTintasFlowStep {
  id: string
  label: string
  state: EstimarTintasStepState
}

interface EstimarTintasShellProps {
  sectionId: string
  title: string
  subtitle?: string
  status?: EstimarTintasStepState
  children: React.ReactNode
  className?: string
}

const EstimarTintasShell: React.FC<EstimarTintasShellProps> = ({
  sectionId,
  title,
  subtitle,
  status = 'active',
  children,
  className,
}) => (
  <section
    id={`estimar-tintas-step-${sectionId}`}
    className={clsx(
      'production-impresion-estimar-tintas-step',
      `production-impresion-estimar-tintas-step--${status}`,
      className
    )}
    aria-labelledby={`estimar-tintas-step-title-${sectionId}`}
  >
    <header className="production-impresion-estimar-tintas-step__head">
      <div className="production-impresion-estimar-tintas-step__titles">
        <h3 className="production-impresion-estimar-tintas-step__title" id={`estimar-tintas-step-title-${sectionId}`}>
          {title}
        </h3>
        {subtitle ? <p className="production-impresion-estimar-tintas-step__sub">{subtitle}</p> : null}
      </div>
    </header>
    <div className="production-impresion-estimar-tintas-step__body">{children}</div>
  </section>
)

interface EstimarTintasCalloutProps {
  tone?: 'info' | 'warning'
  children: React.ReactNode
}

const EstimarTintasCallout: React.FC<EstimarTintasCalloutProps> = ({ tone = 'info', children }) => (
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

interface EstimarTintasRevealProps {
  show: boolean
  children: React.ReactNode
}

const EstimarTintasReveal: React.FC<EstimarTintasRevealProps> = ({ show, children }) => {
  if (!show) return null
  return <div className="production-impresion-estimar-tintas-reveal">{children}</div>
}

interface EstimarTintasSummaryRowProps {
  label: string
  value: React.ReactNode
}

const EstimarTintasSummaryRow: React.FC<EstimarTintasSummaryRowProps> = ({ label, value }) => (
  <div className="production-impresion-estimar-tintas-summary__row">
    <dt>{label}</dt>
    <dd>{value}</dd>
  </div>
)

interface EstimarTintasPlanchaSummaryProps {
  tipoPapelLabel: string
  tipoPapel?: string | null
  esmaltadoLabel: string
  esmaltado: boolean | null
  esmaltadoSi: string
  esmaltadoNo: string
  despieceLabel: string
  despiece?: string | null
  totalPliegos?: number | null
  totalPliegosLabel: string
}

const EstimarTintasPlanchaSummary: React.FC<EstimarTintasPlanchaSummaryProps> = ({
  tipoPapelLabel,
  tipoPapel,
  esmaltadoLabel,
  esmaltado,
  esmaltadoSi,
  esmaltadoNo,
  despieceLabel,
  despiece,
  totalPliegos,
  totalPliegosLabel,
}) => (
  <dl className="production-impresion-estimar-tintas-summary">
    {tipoPapel ? <EstimarTintasSummaryRow label={tipoPapelLabel} value={tipoPapel} /> : null}
    {esmaltado !== null ? (
      <EstimarTintasSummaryRow
        label={esmaltadoLabel}
        value={esmaltado ? esmaltadoSi : esmaltadoNo}
      />
    ) : null}
    {despiece ? <EstimarTintasSummaryRow label={despieceLabel} value={despiece} /> : null}
    {typeof totalPliegos === 'number' ? (
      <EstimarTintasSummaryRow
        label={totalPliegosLabel}
        value={formatEstimarTintasEntero(totalPliegos)}
      />
    ) : null}
  </dl>
)

interface EstimarTintasTotalPedidoFormulaProps {
  tamanosBuenos: number
  sobrante: number
  totalPliegos: number
  totalInkG: number
  totalPedidoG: number
}

const EstimarTintasTotalPedidoFormula: React.FC<EstimarTintasTotalPedidoFormulaProps> = ({
  tamanosBuenos,
  sobrante,
  totalPliegos,
  totalInkG,
  totalPedidoG,
}) => (
  <details className="production-impresion-millares-calculados__formula production-impresion-estimar-tintas-hud__total-formula">
    <summary>{estimarCopy.results.totalPedidoFormulaSummary}</summary>
    <ol className="production-impresion-millares-calculados__steps">
      <li className="production-impresion-millares-calculados__step">
        <span className="production-impresion-millares-calculados__step-rule">
          {estimarCopy.results.totalPedidoFormulaPliegosRule}
        </span>
        <code className="production-impresion-millares-calculados__step-calc">
          {estimarCopy.results.totalPedidoFormulaPliegosCalc(
            tamanosBuenos,
            sobrante,
            totalPliegos
          )}
        </code>
      </li>
      <li className="production-impresion-millares-calculados__step">
        <span className="production-impresion-millares-calculados__step-rule">
          {estimarCopy.results.totalPedidoFormulaPedidoRule}
        </span>
        <code className="production-impresion-millares-calculados__step-calc">
          {estimarCopy.results.totalPedidoFormulaPedidoCalc(
            totalInkG,
            totalPliegos,
            totalPedidoG
          )}
        </code>
      </li>
    </ol>
  </details>
)

const EstimarTintasFileColorProfilePanel: React.FC<{
  profile: EstimarTintasFileColorProfile
  sourceKind: EstimarTintasSourceKind
}> = ({ profile, sourceKind }) => {
  const uploadCopy = estimarCopy.upload
  const colorSpaceLabel = uploadCopy.colorSpaceValues[profile.sourceColorSpace]
  const spotCount = profile.declaredSpots.length
  const spotStatusMessage = profile.hasSpotMetadata
    ? sourceKind === 'pdf'
      ? uploadCopy.spotStatusFound(spotCount)
      : uploadCopy.spotStatusFoundImage(spotCount)
    : sourceKind === 'pdf'
      ? uploadCopy.spotStatusMissingPdf
      : uploadCopy.spotStatusMissingImage

  return (
    <div
      className="production-impresion-estimar-tintas__color-profile"
      role="status"
      aria-live="polite"
    >
      <p className="production-impresion-estimar-tintas__color-profile-title">
        {uploadCopy.colorProfileTitle}
      </p>
      <div className="production-impresion-estimar-tintas__chips production-impresion-estimar-tintas__chips--profile">
        <span className="production-impresion-estimar-tintas__chip">
          {uploadCopy.colorSpaceLabel}: {colorSpaceLabel}
        </span>
        <span
          className={clsx(
            'production-impresion-estimar-tintas__chip',
            profile.hasSpotMetadata
              ? 'production-impresion-estimar-tintas__chip--success'
              : 'production-impresion-estimar-tintas__chip--warn'
          )}
        >
          {profile.hasSpotMetadata ? uploadCopy.spotChipFound : uploadCopy.spotChipMissing}
        </span>
      </div>
      <p
        className={clsx(
          'production-impresion-estimar-tintas__color-profile-status',
          profile.hasSpotMetadata
            ? 'production-impresion-estimar-tintas__color-profile-status--ok'
            : 'production-impresion-estimar-tintas__color-profile-status--warn'
        )}
      >
        {spotStatusMessage}
      </p>
      {profile.hasSpotMetadata ? (
        <div className="production-impresion-estimar-tintas__color-profile-spots">
          <span className="production-impresion-estimar-tintas__color-profile-spots-label">
            {uploadCopy.spotNamesLabel}
            {spotCount > 1 ? ` (${spotCount})` : ''}:
          </span>
          <ul className="production-impresion-estimar-tintas__color-profile-spot-list">
            {profile.declaredSpots.map(spot => {
              const displaySwatch =
                resolvePantoneDisplayHexFromName(spot.name) ?? spot.swatch

              return (
              <li
                key={spot.name}
                className="production-impresion-estimar-tintas__color-profile-spot-item"
                title={spot.name}
              >
                <span
                  className={clsx(
                    'production-impresion-estimar-tintas__color-profile-spot-swatch',
                    !displaySwatch &&
                      'production-impresion-estimar-tintas__color-profile-spot-swatch--unknown'
                  )}
                  style={displaySwatch ? { backgroundColor: displaySwatch } : undefined}
                  aria-hidden
                />
                <span className="production-impresion-estimar-tintas__color-profile-spot-name">
                  {spot.displayLabel}
                </span>
              </li>
            )})}
          </ul>
          {profile.spotReferenceCount > 0 ? (
            <p className="production-impresion-estimar-tintas__color-profile-meta">
              {uploadCopy.spotReferencesLabel(profile.spotReferenceCount)}
            </p>
          ) : null}
        </div>
      ) : null}
      {profile.hasCmykOperatorSamples ? (
        <p className="production-impresion-estimar-tintas__color-profile-meta">
          {uploadCopy.cmykNativeLabel}
        </p>
      ) : null}
    </div>
  )
}

interface ProductionImpresionMuestraPanelProps {
  coloresPlanchas: DisenoColorPlanchaItem[]
  paperRows: PaperRow[]
  tiposPapel: TipoPapel[]
  activeColorPlanchaId: string
  onActiveColorPlanchaIdChange: (id: string) => void
  completedPlanchaIds?: string[]
  registros: ImpresionEstimarTintasRegistro[]
  onRegistroChange: (registro: ImpresionEstimarTintasRegistro) => void
}

const ProductionImpresionMuestraPanel: React.FC<ProductionImpresionMuestraPanelProps> = ({
  coloresPlanchas,
  paperRows,
  tiposPapel,
  activeColorPlanchaId,
  onActiveColorPlanchaIdChange,
  completedPlanchaIds = [],
  registros,
  onRegistroChange,
}) => {
  const inputId = useId()
  const planchaLabelId = useId()
  const registrosLabelId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const blobUrlRef = useRef<string | null>(null)
  const fileRef = useRef<File | null>(null)
  const dragDepthRef = useRef(0)
  const pdfAnalysisRef = useRef<(() => Promise<HTMLCanvasElement>) | null>(null)
  const pdfSpotReferenceRgbsRef = useRef<readonly [number, number, number][]>([])
  const pdfPantoneSpotNamesRef = useRef<string[]>([])
  const imageSpotReferenceRgbsRef = useRef<readonly [number, number, number][]>([])
  const imagePantoneSpotNamesRef = useRef<string[]>([])
  const sourceColorSpaceRef = useRef<EstimarTintasSourceColorSpace>('rgb')
  const pdfCmykOperatorSamplesRef = useRef<
    readonly { c: number; m: number; y: number; k: number }[]
  >([])
  const conversionFactorRef = useRef(formatConversionFactorForInput(ESTIMAR_TINTAS_DEFAULT_CONVERSION_FACTOR_G))
  const conversionFactorManuallyEditedRef = useRef(false)
  const skipResetOnPlanchaChangeRef = useRef(false)
  const skipReloadAfterSaveRef = useRef(false)

  const [fileName, setFileName] = useState('')
  const [fileSize, setFileSize] = useState<number | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [storedPreviewImageDataUrl, setStoredPreviewImageDataUrl] = useState<string | null>(null)
  const [sourceKind, setSourceKind] = useState<EstimarTintasSourceKind | null>(null)
  const [pdfPageCount, setPdfPageCount] = useState<number | null>(null)
  const [pdfPhysicalSize, setPdfPhysicalSize] = useState<{ widthCm: number; heightCm: number } | null>(
    null
  )
  const [fileColorProfile, setFileColorProfile] = useState<EstimarTintasFileColorProfile | null>(
    null
  )
  const [imageMeta, setImageMeta] = useState<{ width: number; height: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)
  const [estimateError, setEstimateError] = useState<string | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [isProcessingFile, setIsProcessingFile] = useState(false)
  const [calculationProgress, setCalculationProgress] = useState<{
    label: string
    percent: number
  } | null>(null)
  const [result, setResult] = useState<EstimarTintasResult | null>(null)
  const [dimensionsTouched, setDimensionsTouched] = useState(false)
  const [measuredGInput, setMeasuredGInput] = useState('')
  const [calibrationSummary, setCalibrationSummary] = useState<
    (EstimarTintasCalibrationPreview & { appliedFactorInput: string }) | null
  >(null)
  const [calibrationError, setCalibrationError] = useState<string | null>(null)
  const [restoreFactorSuccess, setRestoreFactorSuccess] = useState<string | null>(null)
  const [editingEntradaId, setEditingEntradaId] = useState<string | null>(null)
  const [registroDraftError, setRegistroDraftError] = useState<string | null>(null)

  const tableRows = useMemo(
    () => buildEstimarTintasTableRows(coloresPlanchas, registros, { paperRows, tiposPapel }),
    [coloresPlanchas, registros, paperRows, tiposPapel]
  )

  const activeRegistro = useMemo(
    () => registros.find(item => item.colorPlanchaId === activeColorPlanchaId) ?? null,
    [activeColorPlanchaId, registros]
  )

  const activeEntrada = activeRegistro?.entradas[0] ?? null
  const hasActiveEntrada = Boolean(activeEntrada)
  const showEstimarTintasComposer = !hasActiveEntrada || Boolean(editingEntradaId)
  const showComposerActions = showEstimarTintasComposer
  const registroPublicado = hasActiveEntrada && !editingEntradaId
  const showRegistrosSection = tableRows.length > 0

  const activePlancha = useMemo(
    () => coloresPlanchas.find(item => item.id === activeColorPlanchaId) ?? null,
    [activeColorPlanchaId, coloresPlanchas]
  )

  const planchaPliegos = useMemo(() => {
    if (!activePlancha) return null
    const tamanosBuenos = activePlancha.tamanosBuenos ?? 0
    const sobrante = activePlancha.sobrante ?? 0
    return {
      tamanosBuenos,
      sobrante,
      totalPliegos: resolvePlanchaTotalPliegos({ tamanosBuenos, sobrante }),
    }
  }, [activePlancha])

  const planchaCorteContext = useMemo(() => {
    if (!activeColorPlanchaId) return null

    const catalog = normalizeTipoPapelList(tiposPapel)
    const row = syncPaperRowWithTipoPapelCatalog(
      findPaperRowForActiveId(paperRows, activeColorPlanchaId),
      catalog
    )
    const tipo = row.tipoPapelId ? catalog.find(item => item.id === row.tipoPapelId) ?? null : null
    const despiece = resolveDespieceForPaperRow(row, catalog)

    const tipoPapelDisplay = tipo
      ? `${tipo.name} · ${formatMedidaDisplayFrom(tipo)}`
      : row.type?.trim() && row.size?.trim()
        ? `${row.type.trim()} · ${row.size.trim()}`
        : null

    const despieceDisplay = despiece
      ? `${despiece.name?.trim() || '—'} · ${formatMedidaDisplayFrom(despiece)}`
      : null

    return {
      despiece,
      printAreaCm: resolveDespiecePrintAreaCm(despiece),
      hasTipoPapel: Boolean(row.tipoPapelId?.trim()),
      tipoPapelDisplay,
      esmaltado: tipo ? tipo.esmaltado : null,
      despieceDisplay,
      hasCorteData: Boolean(tipoPapelDisplay && despieceDisplay),
    }
  }, [activeColorPlanchaId, paperRows, tiposPapel])

  const despiecePrintArea = planchaCorteContext?.printAreaCm ?? null
  const hasTipoPapel = Boolean(planchaCorteContext?.hasTipoPapel)
  const hasPlanchaSelected = Boolean(activePlancha)
  const hasPreviewVisual = Boolean(previewUrl || storedPreviewImageDataUrl)
  const isStoredPreviewOnly = Boolean(fileName && storedPreviewImageDataUrl && !previewUrl)
  const hasFileLoaded = Boolean(fileName && hasPreviewVisual)
  const canShowUploadSection = hasPlanchaSelected && showEstimarTintasComposer
  const canShowParamsSection = hasPlanchaSelected && hasFileLoaded && showEstimarTintasComposer
  const canShowResultsPanel = Boolean(result) && showEstimarTintasComposer
  const canUploadFile = hasPlanchaSelected
  const prevPlanchaIdRef = useRef<string | null>(null)

  const [widthCmInput, setWidthCmInput] = useState(() =>
    formatCmInput(ESTIMAR_TINTAS_DEFAULT_WIDTH_CM)
  )
  const [heightCmInput, setHeightCmInput] = useState(() =>
    formatCmInput(ESTIMAR_TINTAS_DEFAULT_HEIGHT_CM)
  )
  const [dpiInput, setDpiInput] = useState(String(ESTIMAR_TINTAS_DEFAULT_DPI))
  const [conversionFactorInput, setConversionFactorInput] = useState(() =>
    formatConversionFactorForInput(ESTIMAR_TINTAS_DEFAULT_CONVERSION_FACTOR_G)
  )

  const updateConversionFactor = useCallback((value: string) => {
    conversionFactorRef.current = value
    setConversionFactorInput(value)
  }, [])

  const revokePreview = useCallback(() => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current)
      blobUrlRef.current = null
    }
    pdfAnalysisRef.current = null
    pdfSpotReferenceRgbsRef.current = []
    pdfPantoneSpotNamesRef.current = []
    imageSpotReferenceRgbsRef.current = []
    imagePantoneSpotNamesRef.current = []
    sourceColorSpaceRef.current = 'rgb'
    pdfCmykOperatorSamplesRef.current = []
    setFileColorProfile(null)
    setPreviewUrl(null)
  }, [])

  useEffect(() => () => revokePreview(), [revokePreview])

  const resetEstimate = useCallback(() => {
    setResult(null)
    setEstimateError(null)
    setCalibrationSummary(null)
    setCalibrationError(null)
    setRestoreFactorSuccess(null)
    setRegistroDraftError(null)
  }, [])

  const scrollToEstimarTintasSection = useCallback((sectionId: string) => {
    document
      .getElementById(`estimar-tintas-step-${sectionId}`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const handleDiscardEstimate = useCallback(() => {
    resetEstimate()
    window.requestAnimationFrame(() => {
      scrollToEstimarTintasSection('archivo')
    })
  }, [resetEstimate, scrollToEstimarTintasSection])

  const applyDespiecePrintArea = useCallback(() => {
    if (despiecePrintArea) {
      setWidthCmInput(formatCmInput(despiecePrintArea.widthCm))
      setHeightCmInput(formatCmInput(despiecePrintArea.heightCm))
      return
    }

    const defaults = formatDefaultPrintAreaInputs()
    setWidthCmInput(defaults.widthCmInput)
    setHeightCmInput(defaults.heightCmInput)
  }, [despiecePrintArea])

  const clearUploadedAsset = useCallback(() => {
    revokePreview()
    fileRef.current = null
    setStoredPreviewImageDataUrl(null)
    setFileName('')
    setFileSize(null)
    setImageMeta(null)
    setSourceKind(null)
    setPdfPageCount(null)
    setPdfPhysicalSize(null)
    pdfAnalysisRef.current = null
    pdfSpotReferenceRgbsRef.current = []
    pdfPantoneSpotNamesRef.current = []
    imageSpotReferenceRgbsRef.current = []
    imagePantoneSpotNamesRef.current = []
    sourceColorSpaceRef.current = 'rgb'
    pdfCmykOperatorSamplesRef.current = []
    setFileColorProfile(null)
    setFileError(null)
  }, [revokePreview])

  const clearDraft = useCallback(() => {
    setEditingEntradaId(null)
    setRegistroDraftError(null)
    resetEstimate()
    setMeasuredGInput('')
    setCalibrationSummary(null)
    setCalibrationError(null)
    setDimensionsTouched(false)
    conversionFactorManuallyEditedRef.current = false
    updateConversionFactor(formatConversionFactorForInput(ESTIMAR_TINTAS_DEFAULT_CONVERSION_FACTOR_G))
    setDpiInput(String(ESTIMAR_TINTAS_DEFAULT_DPI))
    clearUploadedAsset()
    applyDespiecePrintArea()
  }, [applyDespiecePrintArea, clearUploadedAsset, resetEstimate, updateConversionFactor])

  const persistRegistro = useCallback(
    (registro: ImpresionEstimarTintasRegistro) => {
      onRegistroChange(registro)
    },
    [onRegistroChange]
  )

  const loadDraftFromEntrada = useCallback((entrada: ImpresionEstimarTintasEntrada) => {
    setWidthCmInput(formatCmInput(entrada.widthCm))
    setHeightCmInput(formatCmInput(entrada.heightCm))
    setDpiInput(String(entrada.dpi))
    updateConversionFactor(
      formatConversionFactorForInput(
        entrada.conversionFactorG > 0
          ? entrada.conversionFactorG
          : ESTIMAR_TINTAS_DEFAULT_CONVERSION_FACTOR_G
      )
    )
    conversionFactorManuallyEditedRef.current =
      entrada.conversionFactorG !== ESTIMAR_TINTAS_DEFAULT_CONVERSION_FACTOR_G
    setDimensionsTouched(true)
    setFileName(entrada.fileName)
    setSourceKind(entrada.sourceKind)
    setStoredPreviewImageDataUrl(entrada.previewImageDataUrl ?? null)
    setResult(entradaToEstimarTintasResult(entrada))
    setEditingEntradaId(entrada.id)
    setMeasuredGInput('')
    setCalibrationSummary(null)
    setCalibrationError(null)
    setRegistroDraftError(null)
  }, [updateConversionFactor])

  useEffect(() => {
    if (dimensionsTouched) return
    applyDespiecePrintArea()
  }, [applyDespiecePrintArea, dimensionsTouched])

  useEffect(() => {
    if (!result?.detectedColors?.length) return

    const pantoneNames = [
      ...new Set(
        result.detectedColors
          .filter(color => color.category === 'pantone')
          .map(color => resolvePantoneLabelAsCatalogName(color.name))
      ),
    ]

    if (sourceKind === 'pdf') {
      if (pantoneNames.length > 0) pdfPantoneSpotNamesRef.current = pantoneNames
    } else if (sourceKind === 'image') {
      if (pantoneNames.length > 0) imagePantoneSpotNamesRef.current = pantoneNames
    }

    setFileColorProfile(current => {
      if (!current) return current
      return syncFileColorProfileSpotsFromEstimate(current, result.detectedColors)
    })
  }, [result, sourceKind])

  const hydrateUploadedAsset = useCallback(
    async (file: File, url: string, kind: EstimarTintasSourceKind) => {
      if (kind === 'pdf') {
        const pdfSource = await prepareEstimarTintasPdfSource(url)
        pdfAnalysisRef.current = pdfSource.getAnalysisCanvas
        pdfSpotReferenceRgbsRef.current = pdfSource.spotReferenceRgbs
        pdfPantoneSpotNamesRef.current = pdfSource.pantoneSpotNames
        sourceColorSpaceRef.current = pdfSource.sourceColorSpace
        pdfCmykOperatorSamplesRef.current = pdfSource.cmykOperatorSamples
        setFileColorProfile(
          buildEstimarTintasFileColorProfile({
            sourceColorSpace: pdfSource.sourceColorSpace,
            pantoneSpotNames: pdfSource.pantoneSpotNames,
            spotReferenceRgbs: pdfSource.spotReferenceRgbs,
            spotReferenceCount: pdfSource.spotReferenceRgbs.length,
            cmykOperatorSampleCount: pdfSource.cmykOperatorSamples.length,
          })
        )
        setPdfPageCount(pdfSource.meta.pageCount)
        setPdfPhysicalSize({
          widthCm: pdfSource.meta.widthCm,
          heightCm: pdfSource.meta.heightCm,
        })
        setImageMeta({
          width: pdfSource.meta.widthPx,
          height: pdfSource.meta.heightPx,
        })
        void pdfSource.getAnalysisCanvas().catch(() => undefined)
        return
      }

      sourceColorSpaceRef.current = await detectEstimarTintasFileColorSpace(file, 'image')
      pdfCmykOperatorSamplesRef.current = []
      imageSpotReferenceRgbsRef.current = []
      imagePantoneSpotNamesRef.current = []

      const img = await loadEstimarTintasImage(url)
      setImageMeta({ width: img.naturalWidth, height: img.naturalHeight })

      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const context = canvas.getContext('2d', { willReadFrequently: true })

      if (context) {
        context.drawImage(img, 0, 0)
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
        const spotContext = resolveEstimarTintasPantoneSpotContext({
          imageData,
          alphaMin: ESTIMAR_TINTAS_ALPHA_MIN,
          whiteThreshold: ESTIMAR_TINTAS_WHITE_THRESHOLD,
        })
        imagePantoneSpotNamesRef.current = spotContext.pantoneSpotNames
        imageSpotReferenceRgbsRef.current = spotContext.spotReferenceRgbs
        setFileColorProfile(
          buildEstimarTintasFileColorProfile({
            sourceColorSpace: sourceColorSpaceRef.current,
            pantoneSpotNames: spotContext.pantoneSpotNames,
            spotReferenceRgbs: spotContext.spotReferenceRgbs,
            spotReferenceCount: spotContext.spotReferenceRgbs.length,
          })
        )
      } else {
        setFileColorProfile(
          buildEstimarTintasFileColorProfile({
            sourceColorSpace: sourceColorSpaceRef.current,
          })
        )
      }

      setPdfPageCount(null)
      setPdfPhysicalSize(null)
    },
    []
  )

  const restoreUploadedAssetForEdit = useCallback(
    async (file: File, entrada: ImpresionEstimarTintasEntrada) => {
      setIsProcessingFile(true)
      setFileError(null)
      fileRef.current = file
      revokePreview()
      setStoredPreviewImageDataUrl(null)

      const url = URL.createObjectURL(file)
      blobUrlRef.current = url
      setPreviewUrl(url)
      setFileSize(file.size)

      try {
        await hydrateUploadedAsset(file, url, entrada.sourceKind)
      } catch (error) {
        revokePreview()
        fileRef.current = null
        setStoredPreviewImageDataUrl(entrada.previewImageDataUrl ?? null)
        setFileError(
          resolveErrorMessage(
            mapEstimarTintasErrorCode(error instanceof Error ? error.message : 'unknown')
          )
        )
      } finally {
        setIsProcessingFile(false)
      }
    },
    [hydrateUploadedAsset, revokePreview]
  )

  const loadAnalysisCanvas = useCallback(async (): Promise<HTMLCanvasElement> => {
    if (sourceKind === 'pdf') {
      if (!pdfAnalysisRef.current) throw new Error('pdf-load-failed')
      return pdfAnalysisRef.current()
    }

    if (!previewUrl) throw new Error('image-load-failed')

    const img = await loadEstimarTintasImage(previewUrl)
    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    const context = canvas.getContext('2d')
    if (!context) throw new Error('canvas-context-unavailable')
    context.drawImage(img, 0, 0)
    return canvas
  }, [previewUrl, sourceKind])

  const reportCalculationProgress = useCallback((update: EstimarTintasProgressUpdate) => {
    setCalculationProgress({
      percent: update.percent,
      label: resolveEstimarTintasProgressLabel(update),
    })
  }, [])

  const applyFile = useCallback(
    async (file: File) => {
      if (!canUploadFile) return

      const validationCode = validateEstimarTintasFile(file, ESTIMAR_TINTAS_MAX_FILE_MB)
      if (validationCode) {
        setFileError(resolveErrorMessage(mapEstimarTintasErrorCode(validationCode)))
        return
      }

      const kind = getEstimarTintasSourceKind(file)
      if (!kind) {
        setFileError(resolveErrorMessage('invalid-type'))
        return
      }

      setFileError(null)
      setEstimateError(null)
      setResult(null)
      setCalculationProgress(null)
      setIsProcessingFile(true)
      setStoredPreviewImageDataUrl(null)
      fileRef.current = file
      setFileName(file.name)
      setFileSize(file.size)
      setSourceKind(kind)
      setPdfPageCount(null)
      setPdfPhysicalSize(null)
      pdfAnalysisRef.current = null
    pdfSpotReferenceRgbsRef.current = []
    pdfPantoneSpotNamesRef.current = []
    imageSpotReferenceRgbsRef.current = []
    imagePantoneSpotNamesRef.current = []
    sourceColorSpaceRef.current = 'rgb'
    pdfCmykOperatorSamplesRef.current = []
    setFileColorProfile(null)

      revokePreview()

      const url = URL.createObjectURL(file)
      blobUrlRef.current = url
      setPreviewUrl(url)

      try {
        await hydrateUploadedAsset(file, url, kind)
      } catch (error) {
        revokePreview()
        fileRef.current = null
        setFileName('')
        setFileSize(null)
        setImageMeta(null)
        setSourceKind(null)
        setPdfPageCount(null)
        setPdfPhysicalSize(null)
        setFileColorProfile(null)
        setFileError(
          resolveErrorMessage(
            mapEstimarTintasErrorCode(error instanceof Error ? error.message : 'unknown')
          )
        )
      } finally {
        setIsProcessingFile(false)
      }
    },
    [canUploadFile, hydrateUploadedAsset, revokePreview]
  )

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      event.target.value = ''
      if (file) void applyFile(file)
    },
    [applyFile]
  )

  const handleDragEnter = useCallback(
    (event: React.DragEvent) => {
      if (!canUploadFile) return
      event.preventDefault()
      dragDepthRef.current += 1
      setIsDragging(true)
    },
    [canUploadFile]
  )

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1)
    if (dragDepthRef.current === 0) setIsDragging(false)
  }, [])

  const handleDragOver = useCallback(
    (event: React.DragEvent) => {
      if (!canUploadFile) return
      event.preventDefault()
    },
    [canUploadFile]
  )

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      dragDepthRef.current = 0
      setIsDragging(false)
      if (!canUploadFile) return
      const file = event.dataTransfer.files?.[0]
      if (file) void applyFile(file)
    },
    [applyFile, canUploadFile]
  )

  const openFilePicker = useCallback(
    (event?: React.SyntheticEvent) => {
      if (!canUploadFile) return
      event?.preventDefault()
      event?.stopPropagation()
      inputRef.current?.click()
    },
    [canUploadFile]
  )

  const clearFile = useCallback(() => {
    clearUploadedAsset()
    setMeasuredGInput('')
    setDimensionsTouched(false)
    applyDespiecePrintArea()
    resetEstimate()
  }, [applyDespiecePrintArea, clearUploadedAsset, resetEstimate])

  useEffect(() => {
    if (prevPlanchaIdRef.current !== null && prevPlanchaIdRef.current !== activeColorPlanchaId) {
      if (skipResetOnPlanchaChangeRef.current) {
        skipResetOnPlanchaChangeRef.current = false
      } else if (!skipReloadAfterSaveRef.current) {
        setMeasuredGInput('')
        setDimensionsTouched(false)
        applyDespiecePrintArea()
        clearDraft()
      } else {
        skipReloadAfterSaveRef.current = false
      }
    }
    prevPlanchaIdRef.current = activeColorPlanchaId
  }, [activeColorPlanchaId, applyDespiecePrintArea, clearDraft])

  useEffect(() => {
    if (hasPlanchaSelected) return
    if (!fileName && !previewUrl) return
    clearUploadedAsset()
    resetEstimate()
  }, [hasPlanchaSelected, clearUploadedAsset, fileName, previewUrl, resetEstimate])

  const getEstimateParams = useCallback(
    () => ({
      widthCm: parsePositiveNumber(widthCmInput),
      heightCm: parsePositiveNumber(heightCmInput),
      dpi: parsePositiveNumber(dpiInput) || ESTIMAR_TINTAS_DEFAULT_DPI,
      conversionFactorG: resolveConversionFactorG(conversionFactorRef.current),
    }),
    [dpiInput, heightCmInput, widthCmInput]
  )

  const computeEstimateFromPreview = useCallback(async () => {
    if (!previewUrl) return null

    const params = getEstimateParams()
    if (params.widthCm <= 0 || params.heightCm <= 0 || params.conversionFactorG <= 0) {
      throw new Error('invalid-estimate-params')
    }

    const estimateOptions = buildEstimarTintasEstimateOptions({
      ...params,
      spotReferenceRgbs:
        sourceKind === 'pdf'
          ? pdfSpotReferenceRgbsRef.current
          : imageSpotReferenceRgbsRef.current,
      pantoneSpotNames:
        sourceKind === 'pdf'
          ? pdfPantoneSpotNamesRef.current
          : imagePantoneSpotNamesRef.current,
      sourceColorSpace: sourceColorSpaceRef.current,
      cmykOperatorSamples:
        sourceKind === 'pdf' ? pdfCmykOperatorSamplesRef.current : undefined,
    })

    if (sourceKind === 'pdf') {
      reportCalculationProgress({ phase: 'rendering', percent: 18, label: 'rendering-pdf' })
      const canvas = await loadAnalysisCanvas()
      return estimateInkFromCanvas(canvas, estimateOptions, reportCalculationProgress)
    }

    const img = await loadEstimarTintasImage(previewUrl)
    return estimateInkFromImageElement(img, estimateOptions, reportCalculationProgress)
  }, [
    getEstimateParams,
    loadAnalysisCanvas,
    previewUrl,
    reportCalculationProgress,
    sourceKind,
  ])

  const runEstimate = useCallback(async (): Promise<EstimarTintasResult | null> => {
    if (!previewUrl) return null

    setEstimateError(null)
    setIsCalculating(true)
    setCalculationProgress({
      percent: 6,
      label: estimarCopy.progress.preparingSample,
    })

    try {
      const estimate = await computeEstimateFromPreview()
      setResult(estimate)
      return estimate
    } catch (error) {
      setResult(null)
      setEstimateError(
        resolveErrorMessage(
          mapEstimarTintasErrorCode(error instanceof Error ? error.message : 'unknown')
        )
      )
      return null
    } finally {
      setIsCalculating(false)
      setCalculationProgress(null)
    }
  }, [computeEstimateFromPreview, previewUrl])

  const handleMeasuredGInputChange = useCallback((value: string) => {
    setMeasuredGInput(value)
    setCalibrationSummary(null)
    setCalibrationError(null)
  }, [])

  const canCalculate = Boolean(canUploadFile && previewUrl && fileName && !isCalculating && !isProcessingFile)
  const canSaveDraft = Boolean(
    result && activePlancha && activeRegistro && fileName && sourceKind && !isCalculating
  )
  const defaultFactorInput = formatConversionFactorForInput(ESTIMAR_TINTAS_DEFAULT_CONVERSION_FACTOR_G)
  const inkTotalsSnapshot = useMemo(() => {
    if (!result) return null
    return computeEstimarTintasInkTotalsSnapshot(result, planchaPliegos?.totalPliegos)
  }, [planchaPliegos?.totalPliegos, result])

  const totalInkG = inkTotalsSnapshot?.perPliego.totalInkG ?? 0
  const totalInkPedidoG = inkTotalsSnapshot?.pedido?.totalInkG ?? null
  const isUsingDefaultFactor =
    parseConversionFactorInput(conversionFactorInput) === ESTIMAR_TINTAS_DEFAULT_CONVERSION_FACTOR_G

  const calibrationPreview = useMemo(() => {
    if (!result || calibrationSummary) return null

    const measuredGTotal = parsePositiveNumber(measuredGInput)
    if (measuredGTotal <= 0) return null

    const widthCm = parsePositiveNumber(widthCmInput)
    const heightCm = parsePositiveNumber(heightCmInput)
    const currentFactorG = resolveConversionFactorG(conversionFactorRef.current)
    const currentTotalG = computeEstimarTintasTotalInkGPerPliego(result)

    try {
      return computeCalibrationPreview({
        coverage: result.coverage,
        widthCm,
        heightCm,
        currentFactorG,
        currentTotalG,
        measuredGTotal,
      })
    } catch {
      return null
    }
  }, [
    calibrationSummary,
    heightCmInput,
    measuredGInput,
    result,
    widthCmInput,
    conversionFactorInput,
  ])

  const canRecalculateWithCalibratedFactor = Boolean(
    result && !calibrationSummary && parsePositiveNumber(measuredGInput) > 0 && !isCalculating
  )

  const handleRecalculateWithCalibratedFactor = useCallback(async () => {
    if (!result) {
      setCalibrationError(estimarCopy.calibration.requiresEstimate)
      return
    }

    const measuredGTotal = parsePositiveNumber(measuredGInput)
    if (measuredGTotal <= 0) {
      setCalibrationError(estimarCopy.calibration.invalidMeasured)
      return
    }

    const widthCm = parsePositiveNumber(widthCmInput)
    const heightCm = parsePositiveNumber(heightCmInput)
    const currentFactorG = resolveConversionFactorG(conversionFactorRef.current)
    const currentTotalG = computeEstimarTintasTotalInkGPerPliego(result)

    let preview: EstimarTintasCalibrationPreview
    try {
      preview = computeCalibrationPreview({
        coverage: result.coverage,
        widthCm,
        heightCm,
        currentFactorG,
        currentTotalG,
        measuredGTotal,
      })
    } catch (error) {
      setCalibrationError(
        resolveErrorMessage(
          mapEstimarTintasErrorCode(error instanceof Error ? error.message : 'unknown')
        )
      )
      return
    }

    const appliedFactorInput = formatConversionFactorForInput(preview.projectedFactorG)
    if (!appliedFactorInput) {
      setCalibrationError(estimarCopy.calibration.invalidParams)
      return
    }

    conversionFactorManuallyEditedRef.current = true
    updateConversionFactor(appliedFactorInput)
    setCalibrationError(null)
    setRestoreFactorSuccess(null)
    setRegistroDraftError(null)

    const estimate = await runEstimate()
    if (!estimate) return

    setCalibrationSummary({
      ...preview,
      appliedFactorInput: appliedFactorInput.replace('.', ','),
    })
  }, [
    heightCmInput,
    measuredGInput,
    result,
    runEstimate,
    updateConversionFactor,
    widthCmInput,
  ])

  const handleCalculate = useCallback(async () => {
    setCalibrationSummary(null)
    setCalibrationError(null)
    setRestoreFactorSuccess(null)
    setRegistroDraftError(null)
    if (!measuredGInput.trim() && !conversionFactorManuallyEditedRef.current) {
      updateConversionFactor(defaultFactorInput)
    }
    await runEstimate()
  }, [defaultFactorInput, measuredGInput, runEstimate, updateConversionFactor])

  const handleSaveRegistro = useCallback(async () => {
    if (!activePlancha || !activeRegistro || !result || !fileName || !sourceKind) return

    setRegistroDraftError(null)
    setCalibrationError(null)

    if (measuredGInput.trim()) {
      const measuredGTotal = parsePositiveNumber(measuredGInput)
      if (measuredGTotal <= 0) {
        setCalibrationError(estimarCopy.calibration.invalidMeasured)
        return
      }
    }

    const params = getEstimateParams()
    const conversionFactorG = params.conversionFactorG
    if (params.widthCm <= 0 || params.heightCm <= 0 || conversionFactorG <= 0) {
      setRegistroDraftError(estimarCopy.errors.invalidParams)
      return
    }

    const entradaId = editingEntradaId ?? activeEntrada?.id ?? crypto.randomUUID()
    let previewImageDataUrl = storedPreviewImageDataUrl ?? undefined

    if (previewUrl && sourceKind) {
      try {
        previewImageDataUrl = await captureEstimarTintasAssetPreviewDataUrl(previewUrl, sourceKind)
      } catch {
        // Conservar miniatura previa si no se pudo regenerar.
      }
    }

    const entrada = createImpresionEstimarTintasEntrada(
      {
        fileName,
        sourceKind,
        widthCm: params.widthCm,
        heightCm: params.heightCm,
        dpi: params.dpi,
        conversionFactorG,
        result,
        totalPliegos: planchaPliegos?.totalPliegos ?? 0,
        tipoPapelDisplay: planchaCorteContext?.tipoPapelDisplay,
        despieceDisplay: planchaCorteContext?.despieceDisplay,
        previewImageDataUrl,
      },
      entradaId
    )

    if (fileRef.current) {
      setEstimarTintasCachedAsset(entrada.id, fileRef.current)
    }

    persistRegistro({
      ...activeRegistro,
      entradas: [entrada],
    })
    skipReloadAfterSaveRef.current = true
    clearDraft()
  }, [
    activeEntrada?.id,
    activePlancha,
    activeRegistro,
    clearDraft,
    editingEntradaId,
    fileName,
    getEstimateParams,
    measuredGInput,
    persistRegistro,
    planchaCorteContext?.despieceDisplay,
    planchaCorteContext?.tipoPapelDisplay,
    planchaPliegos?.totalPliegos,
    previewUrl,
    result,
    sourceKind,
    storedPreviewImageDataUrl,
  ])

  const handleEditEntrada = useCallback(
    (colorPlanchaId: string, entradaId: string) => {
      const registro = registros.find(item => item.colorPlanchaId === colorPlanchaId)
      const entrada = registro?.entradas.find(item => item.id === entradaId)
      if (!entrada || !registro) return

      if (colorPlanchaId !== activeColorPlanchaId) {
        skipResetOnPlanchaChangeRef.current = true
        onActiveColorPlanchaIdChange(colorPlanchaId)
      }

      loadDraftFromEntrada(entrada)

      const cachedFile = getEstimarTintasCachedAsset(entrada.id)
      if (cachedFile) {
        void restoreUploadedAssetForEdit(cachedFile, entrada)
      }
    },
    [
      activeColorPlanchaId,
      loadDraftFromEntrada,
      onActiveColorPlanchaIdChange,
      registros,
      restoreUploadedAssetForEdit,
    ]
  )

  const handleRemoveEntrada = useCallback(
    (colorPlanchaId: string, entradaId: string) => {
      const registro = registros.find(item => item.colorPlanchaId === colorPlanchaId)
      if (!registro) return

      persistRegistro({
        ...registro,
        entradas: registro.entradas.filter(item => item.id !== entradaId),
      })

      deleteEstimarTintasCachedAsset(entradaId)

      if (editingEntradaId === entradaId) {
        clearDraft()
      }
    },
    [clearDraft, editingEntradaId, persistRegistro, registros]
  )

  const handleCancelEdit = useCallback(() => {
    clearDraft()
  }, [clearDraft])

  const handleRestoreDefaultFactor = useCallback(async () => {
    conversionFactorManuallyEditedRef.current = false
    updateConversionFactor(defaultFactorInput)
    setMeasuredGInput('')
    setCalibrationSummary(null)
    setCalibrationError(null)
    setRestoreFactorSuccess(estimarCopy.params.restoreDefaultSuccess)

    if (previewUrl && result) {
      setIsCalculating(true)
      setCalculationProgress({
        percent: 6,
        label: estimarCopy.progress.preparingSample,
      })
      try {
        const estimate = await computeEstimateFromPreview()
        setResult(estimate)
      } catch (error) {
        setResult(null)
        setEstimateError(
          resolveErrorMessage(
            mapEstimarTintasErrorCode(error instanceof Error ? error.message : 'unknown')
          )
        )
      } finally {
        setIsCalculating(false)
        setCalculationProgress(null)
      }
    }
  }, [
    computeEstimateFromPreview,
    defaultFactorInput,
    previewUrl,
    result,
    updateConversionFactor,
  ])

  const flowSteps = useMemo((): EstimarTintasFlowStep[] => {
    const stepPlanchaComplete = hasPlanchaSelected
    const stepArchivoComplete = Boolean(fileName && hasPreviewVisual)
    const stepResultComplete = Boolean(result)

    const stepPlanchaState: EstimarTintasStepState = stepPlanchaComplete
      ? 'complete'
      : coloresPlanchas.length > 0
        ? 'active'
        : 'locked'

    const stepArchivoState: EstimarTintasStepState = !hasPlanchaSelected
      ? 'locked'
      : registroPublicado
        ? 'complete'
        : stepArchivoComplete
          ? 'complete'
          : 'active'

    const stepAreaState: EstimarTintasStepState = !hasPlanchaSelected
      ? 'locked'
      : registroPublicado
        ? 'complete'
        : stepResultComplete
          ? 'complete'
          : stepArchivoComplete
            ? 'active'
            : 'locked'

    const stepResultState: EstimarTintasStepState = !hasPlanchaSelected
      ? 'locked'
      : registroPublicado
        ? 'complete'
        : stepResultComplete
          ? 'complete'
          : stepArchivoComplete
            ? 'active'
            : 'locked'

    return [
      { id: 'plancha', label: estimarCopy.flow.stepPlancha, state: stepPlanchaState },
      { id: 'archivo', label: estimarCopy.flow.stepArchivo, state: stepArchivoState },
      { id: 'area', label: estimarCopy.flow.stepArea, state: stepAreaState },
      { id: 'resultado', label: estimarCopy.flow.stepResultado, state: stepResultState },
    ]
  }, [
    coloresPlanchas.length,
    editingEntradaId,
    fileName,
    hasActiveEntrada,
    hasPlanchaSelected,
    hasPreviewVisual,
    previewUrl,
    result,
  ])

  return (
    <>
      <p className="production-workspace-panel-desc production-impresion-estimar-tintas-lead">
        {estimarCopy.panelDesc}
      </p>

      <ProductionWorkspaceSection
        tag={estimarCopy.section.tag}
        title={estimarCopy.section.title}
        subtitle={estimarCopy.section.subtitle}
        tone={0}
        className="production-impresion-estimar-tintas"
      >
        <div className="production-impresion-estimar-tintas__grid production-impresion-estimar-tintas__grid--single">
          <div className="production-impresion-estimar-tintas__main">
            <EstimarTintasShell
              sectionId="plancha"
              title={planchaCopy.title}
              subtitle={planchaCopy.subtitle}
              status={flowSteps[0]?.state ?? 'active'}
            >
              {coloresPlanchas.length === 0 ? (
                <EstimarTintasCallout>{planchaCopy.emptySinRegistros}</EstimarTintasCallout>
              ) : (
                <div className="production-impresion-estimar-tintas__plancha">
                  <div className="production-form-field production-impresion-estimar-tintas__plancha-select">
                    <label className="production-form-label" id={planchaLabelId} htmlFor="prod-estimar-tintas-plancha-select">
                      {planchaCopy.label}
                    </label>
                    <ImpresionPlanchaSelect
                      id="prod-estimar-tintas-plancha-select"
                      labelId={planchaLabelId}
                      coloresPlanchas={coloresPlanchas}
                      value={activeColorPlanchaId}
                      completedPlanchaIds={completedPlanchaIds}
                      onChange={onActiveColorPlanchaIdChange}
                      placeholder={planchaCopy.placeholder}
                    />
                    <span className="production-plancha-draft__field-hint">{planchaCopy.hint}</span>
                  </div>

                  {hasActiveEntrada && !editingEntradaId ? (
                    <EstimarTintasCallout tone="info">{entradasCopy.planchaCompletaHint}</EstimarTintasCallout>
                  ) : null}

                  {activePlancha && hasTipoPapel && planchaCorteContext ? (
                    <EstimarTintasPlanchaSummary
                      tipoPapelLabel={planchaCopy.tipoPapelLabel}
                      tipoPapel={planchaCorteContext.tipoPapelDisplay}
                      esmaltadoLabel={planchaCopy.esmaltadoLabel}
                      esmaltado={planchaCorteContext.esmaltado}
                      esmaltadoSi={planchaCopy.esmaltadoSi}
                      esmaltadoNo={planchaCopy.esmaltadoNo}
                      despieceLabel={planchaCopy.despieceLabel}
                      despiece={planchaCorteContext.despieceDisplay}
                      totalPliegos={planchaPliegos?.totalPliegos ?? null}
                      totalPliegosLabel={planchaCopy.totalPliegosLabel}
                    />
                  ) : null}

                  {activePlancha && !hasTipoPapel ? (
                    <EstimarTintasCallout tone="warning">{planchaCopy.sinTipoPapelHint}</EstimarTintasCallout>
                  ) : null}

                  {activePlancha && hasTipoPapel && !planchaCorteContext?.hasCorteData ? (
                    <EstimarTintasCallout tone="warning">{planchaCopy.corteEmpty}</EstimarTintasCallout>
                  ) : null}
                </div>
              )}
            </EstimarTintasShell>

            <EstimarTintasReveal show={canShowUploadSection}>
              <EstimarTintasShell
                sectionId="archivo"
                title={estimarCopy.upload.title}
                subtitle={estimarCopy.upload.subtitle}
                status={flowSteps[1]?.state ?? 'active'}
              >
              <div className="production-impresion-estimar-tintas__upload">
                <input
                  ref={inputRef}
                  id={inputId}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,.jpg,.jpeg,.png,.webp,.gif,.pdf"
                  className="production-diseno-pdf-upload__input"
                  tabIndex={-1}
                  aria-hidden
                  disabled={!canUploadFile}
                  onChange={handleChange}
                />

                {!fileName ? (
                  <div
                    className={clsx(
                      'production-diseno-pdf-upload__drop',
                      'production-impresion-estimar-tintas__drop',
                      'production-impresion-estimar-tintas__drop--modern',
                      isDragging && 'production-diseno-pdf-upload__drop--active'
                    )}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  >
                    <span className="production-diseno-pdf-upload__drop-icon" aria-hidden>
                      <svg viewBox="0 0 24 24" focusable="false">
                        <rect
                          x="4.5"
                          y="6"
                          width="15"
                          height="12"
                          rx="1.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.6"
                        />
                        <circle cx="9" cy="10" r="1.5" fill="currentColor" stroke="none" />
                        <path
                          d="M5.5 16.5 9.5 12.5 12 15 15.5 11 18.5 14.5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                    <p className="production-diseno-pdf-upload__drop-title">
                      {isDragging ? estimarCopy.upload.dropActive : estimarCopy.upload.dropTitle}
                    </p>
                    <p className="production-diseno-pdf-upload__drop-hint">
                      {estimarCopy.upload.hint(ESTIMAR_TINTAS_MAX_FILE_MB)}
                    </p>
                    <button
                      type="button"
                      className="production-diseno-pdf-upload__select-btn"
                      onPointerDown={event => {
                        if (event.button !== 0) return
                        openFilePicker(event)
                      }}
                    >
                      {estimarCopy.upload.selectBtn}
                    </button>
                  </div>
                ) : (
                  <div className="production-impresion-estimar-tintas__asset">
                    <div className="production-impresion-estimar-tintas__asset-preview">
                      {previewUrl && sourceKind === 'pdf' ? (
                        <EstimarTintasPdfAssetPreview
                          url={previewUrl}
                          alt={estimarCopy.upload.previewAlt}
                        />
                      ) : previewUrl || storedPreviewImageDataUrl ? (
                        <img
                          src={previewUrl ?? storedPreviewImageDataUrl ?? undefined}
                          alt={estimarCopy.upload.previewAlt}
                          className="production-impresion-estimar-tintas__asset-image"
                        />
                      ) : null}
                    </div>
                    <div className="production-impresion-estimar-tintas__asset-body">
                      <strong className="production-impresion-estimar-tintas__asset-name" title={fileName}>
                        {fileName}
                      </strong>
                      {isStoredPreviewOnly ? (
                        <p className="production-impresion-estimar-tintas__asset-hint">
                          {estimarCopy.upload.editStoredPreviewHint}
                        </p>
                      ) : null}
                      <div className="production-impresion-estimar-tintas__chips">
                        {sourceKind === 'pdf' ? (
                          <span className="production-impresion-estimar-tintas__chip">
                            {estimarCopy.upload.pdfBadge}
                          </span>
                        ) : null}
                        {fileSize ? (
                          <span className="production-impresion-estimar-tintas__chip">{formatFileSize(fileSize)}</span>
                        ) : null}
                        {pdfPageCount ? (
                          <span className="production-impresion-estimar-tintas__chip">
                            {estimarCopy.upload.pdfPageLabel(1, pdfPageCount)}
                          </span>
                        ) : null}
                        {pdfPhysicalSize ? (
                          <span className="production-impresion-estimar-tintas__chip">
                            {estimarCopy.upload.pdfSizeLabel(
                              pdfPhysicalSize.widthCm,
                              pdfPhysicalSize.heightCm
                            )}
                          </span>
                        ) : null}
                        {imageMeta && sourceKind !== 'pdf' ? (
                          <span className="production-impresion-estimar-tintas__chip">
                            {estimarCopy.upload.pixelsLabel(imageMeta.width, imageMeta.height)}
                          </span>
                        ) : null}
                      </div>
                      {fileColorProfile && sourceKind ? (
                        <EstimarTintasFileColorProfilePanel
                          profile={fileColorProfile}
                          sourceKind={sourceKind}
                        />
                      ) : null}
                      {isProcessingFile ? (
                        <EstimarTintasProgressBar
                          label={estimarCopy.progress.processingFile}
                          percent={0}
                          indeterminate
                        />
                      ) : null}
                      <div className="production-impresion-estimar-tintas__asset-actions">
                        <button
                          type="button"
                          className="production-diseno-pdf-upload__action-btn"
                          onPointerDown={event => {
                            if (event.button !== 0) return
                            openFilePicker(event)
                          }}
                        >
                          {estimarCopy.upload.replaceBtn}
                        </button>
                        <button
                          type="button"
                          className="production-diseno-pdf-upload__action-btn production-diseno-pdf-upload__action-btn--danger"
                          onClick={clearFile}
                        >
                          {estimarCopy.upload.removeBtn}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {fileError ? (
                <p className="production-preprensa-message production-preprensa-message--error" role="alert">
                  {fileError}
                </p>
              ) : null}
            </EstimarTintasShell>
            </EstimarTintasReveal>

            <EstimarTintasReveal show={canShowParamsSection}>
            <EstimarTintasShell
              sectionId="area"
              title={estimarCopy.params.title}
              subtitle={estimarCopy.params.subtitle}
              status={flowSteps[2]?.state ?? 'active'}
              className="production-impresion-estimar-tintas-step--area"
            >
              <div className="production-impresion-estimar-tintas-area">
                <p className="production-impresion-estimar-tintas-area__question" id={`${inputId}-size-question`}>
                  {estimarCopy.params.sizeQuestion}
                </p>

                <div
                  className="production-impresion-estimar-tintas-area__size-row"
                  role="group"
                  aria-labelledby={`${inputId}-size-question`}
                >
                  <div className="production-impresion-estimar-tintas-area__field">
                    <label className="production-impresion-estimar-tintas-area__label" htmlFor={`${inputId}-width`}>
                      {estimarCopy.params.widthLabel}
                    </label>
                    <div className="production-impresion-estimar-tintas-area__input-wrap">
                      <input
                        id={`${inputId}-width`}
                        type="number"
                        min="0"
                        step="0.01"
                        inputMode="decimal"
                        className="production-impresion-estimar-tintas-area__input"
                        value={widthCmInput}
                        onChange={event => {
                          setDimensionsTouched(true)
                          setWidthCmInput(event.target.value)
                          resetEstimate()
                        }}
                      />
                      <span className="production-impresion-estimar-tintas-area__suffix">
                        {estimarCopy.params.measureUnit}
                      </span>
                    </div>
                  </div>
                  <span className="production-impresion-estimar-tintas-area__times" aria-hidden>
                    ×
                  </span>
                  <div className="production-impresion-estimar-tintas-area__field">
                    <label className="production-impresion-estimar-tintas-area__label" htmlFor={`${inputId}-height`}>
                      {estimarCopy.params.heightLabel}
                    </label>
                    <div className="production-impresion-estimar-tintas-area__input-wrap">
                      <input
                        id={`${inputId}-height`}
                        type="number"
                        min="0"
                        step="0.01"
                        inputMode="decimal"
                        className="production-impresion-estimar-tintas-area__input"
                        value={heightCmInput}
                        onChange={event => {
                          setDimensionsTouched(true)
                          setHeightCmInput(event.target.value)
                          resetEstimate()
                        }}
                      />
                      <span className="production-impresion-estimar-tintas-area__suffix">
                        {estimarCopy.params.measureUnit}
                      </span>
                    </div>
                  </div>
                </div>

                <EstimarTintasCallout tone={!despiecePrintArea ? 'warning' : 'info'}>
                  {despiecePrintArea && !dimensionsTouched
                    ? estimarCopy.params.despieceSizeHint(
                        despiecePrintArea.widthCm,
                        despiecePrintArea.heightCm
                      )
                    : !despiecePrintArea
                      ? estimarCopy.params.despieceSizeEmpty
                      : estimarCopy.params.defaultsHint}
                </EstimarTintasCallout>

                <details className="production-impresion-estimar-tintas-area__advanced">
                  <summary className="production-impresion-estimar-tintas-area__advanced-toggle">
                    {estimarCopy.params.advancedToggle}
                  </summary>
                  <div className="production-impresion-estimar-tintas-area__advanced-body">
                    <div className="production-impresion-estimar-tintas-area__field">
                      <label className="production-impresion-estimar-tintas-area__label" htmlFor={`${inputId}-dpi`}>
                        {estimarCopy.params.dpiLabel}
                      </label>
                      <div className="production-impresion-estimar-tintas-area__input-wrap">
                        <input
                          id={`${inputId}-dpi`}
                          type="number"
                          min="1"
                          step="1"
                          inputMode="numeric"
                          className="production-impresion-estimar-tintas-area__input"
                          title={estimarCopy.params.dpiHint}
                          value={dpiInput}
                          onChange={event => {
                            setDpiInput(event.target.value)
                            resetEstimate()
                          }}
                        />
                      </div>
                      <span className="production-impresion-estimar-tintas-area__field-hint">
                        {estimarCopy.params.dpiHint}
                      </span>
                    </div>
                    <div className="production-impresion-estimar-tintas-area__field">
                      <label className="production-impresion-estimar-tintas-area__label" htmlFor={`${inputId}-factor`}>
                        {estimarCopy.params.conversionLabel}
                      </label>
                      <div className="production-impresion-estimar-tintas-area__input-wrap">
                        <input
                          id={`${inputId}-factor`}
                          type="text"
                          inputMode="decimal"
                          autoComplete="off"
                          spellCheck={false}
                          className="production-impresion-estimar-tintas-area__input"
                          title={estimarCopy.params.factorHint}
                          value={conversionFactorInput.replace('.', ',')}
                          onChange={event => {
                            conversionFactorManuallyEditedRef.current = true
                            updateConversionFactor(event.target.value.replace(',', '.'))
                            resetEstimate()
                          }}
                          onBlur={() => {
                            if (parseConversionFactorInput(conversionFactorInput) <= 0) {
                              updateConversionFactor(defaultFactorInput)
                            }
                          }}
                        />
                        <span className="production-impresion-estimar-tintas-area__suffix">
                          {estimarCopy.params.factorUnit}
                        </span>
                      </div>
                      <span className="production-impresion-estimar-tintas-area__field-hint">
                        {estimarCopy.params.factorHint}
                      </span>
                      {!isUsingDefaultFactor ? (
                        <button
                          type="button"
                          className="production-impresion-estimar-tintas-area__restore"
                          disabled={isCalculating}
                          onClick={() => void handleRestoreDefaultFactor()}
                        >
                          {estimarCopy.params.restoreDefaultFactor(
                            formatConversionFactorForInput(ESTIMAR_TINTAS_DEFAULT_CONVERSION_FACTOR_G).replace(
                              '.',
                              ','
                            )
                          )}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </details>

                <div className="production-impresion-estimar-tintas-area__actions">
                  <button
                    type="button"
                    className="production-impresion-estimar-tintas-hud__btn production-impresion-estimar-tintas-hud__btn--primary"
                    disabled={!canCalculate}
                    onClick={() => void handleCalculate()}
                  >
                    {isCalculating ? (
                      <>
                        <span
                          className="production-impresion-estimar-tintas-hud__btn-spinner"
                          aria-hidden
                        />
                        {estimarCopy.actions.calculating}
                      </>
                    ) : (
                      estimarCopy.actions.calculate
                    )}
                  </button>
                </div>

                {isCalculating && calculationProgress ? (
                  <EstimarTintasProgressBar
                    label={calculationProgress.label}
                    percent={calculationProgress.percent}
                  />
                ) : null}

                {restoreFactorSuccess ? (
                  <p
                    className="production-impresion-estimar-tintas-area__message production-impresion-estimar-tintas-area__message--success"
                    role="status"
                  >
                    {restoreFactorSuccess}
                  </p>
                ) : null}
                {estimateError ? (
                  <p
                    className="production-impresion-estimar-tintas-area__message production-impresion-estimar-tintas-area__message--error"
                    role="alert"
                  >
                    {estimateError}
                  </p>
                ) : null}
              </div>
            </EstimarTintasShell>
            </EstimarTintasReveal>

            {canShowResultsPanel && result ? (
              <EstimarTintasReveal show>
                <EstimarTintasShell
                  sectionId="resultado"
                  title={estimarCopy.results.title}
                  status={flowSteps[3]?.state ?? 'complete'}
                  className="production-impresion-estimar-tintas-step--result"
                >
                  <div className="production-impresion-estimar-tintas-hud" aria-live="polite">
                    <div className="production-impresion-estimar-tintas-hud__fx" aria-hidden />
                    <EstimarTintasConsumoPalette
                      result={result}
                      pantoneSpotNames={
                        fileColorProfile?.pantoneSpotNames ??
                        (sourceKind === 'pdf'
                          ? pdfPantoneSpotNamesRef.current
                          : imagePantoneSpotNamesRef.current)
                      }
                      spotReferenceRgbs={
                        fileColorProfile?.spotReferenceRgbs ??
                        (sourceKind === 'pdf'
                          ? pdfSpotReferenceRgbsRef.current
                          : imageSpotReferenceRgbsRef.current)
                      }
                    />

                    <EstimarTintasInkTotalsPanel
                      totals={
                        inkTotalsSnapshot ?? {
                          perPliego: { processInkG: 0, pantoneInkG: 0, totalInkG: 0 },
                          pedido: null,
                        }
                      }
                      totalPliegos={planchaPliegos?.totalPliegos}
                      pedidoEmptyHint={estimarCopy.results.totalPedidoEmpty}
                    />

                    {totalInkPedidoG != null && planchaPliegos ? (
                      <EstimarTintasTotalPedidoFormula
                        tamanosBuenos={planchaPliegos.tamanosBuenos}
                        sobrante={planchaPliegos.sobrante}
                        totalPliegos={planchaPliegos.totalPliegos}
                        totalInkG={totalInkG}
                        totalPedidoG={totalInkPedidoG}
                      />
                    ) : null}

                    <details className="production-impresion-estimar-tintas-area__advanced production-impresion-estimar-tintas-hud__details production-impresion-estimar-tintas-hud__calibration">
                      <summary className="production-impresion-estimar-tintas-area__advanced-toggle">
                        {estimarCopy.results.calibrationDetailsSummary}
                      </summary>
                      <div className="production-impresion-estimar-tintas-area__advanced-body">
                        <p className="production-impresion-estimar-tintas-hud__calibration-sub">
                          {estimarCopy.calibration.subtitle}
                        </p>

                        <div className="production-impresion-estimar-tintas-hud__calibration-body">
                        <div className="production-impresion-estimar-tintas-hud__calibration-measured">
                          <label
                            className="production-impresion-estimar-tintas-hud__calibration-measured-label"
                            htmlFor={`${inputId}-measured-g`}
                          >
                            {estimarCopy.calibration.measuredLabel}
                          </label>
                          <div className="production-impresion-estimar-tintas-hud__calibration-measured-control">
                            <div className="production-impresion-estimar-tintas-area__input-wrap">
                              <input
                                id={`${inputId}-measured-g`}
                                type="number"
                                min="0"
                                step="any"
                                inputMode="decimal"
                                className="production-impresion-estimar-tintas-area__input production-impresion-estimar-tintas-hud__calibration-measured-input"
                                placeholder="0"
                                value={measuredGInput}
                                onChange={event => handleMeasuredGInputChange(event.target.value)}
                              />
                              <span className="production-impresion-estimar-tintas-area__suffix">grm</span>
                            </div>
                          </div>
                        </div>
                        <p className="production-impresion-estimar-tintas-hud__calibration-field-hint">
                          {estimarCopy.calibration.measuredHint}
                        </p>

                        {canRecalculateWithCalibratedFactor ? (
                          <div className="production-impresion-estimar-tintas-hud__calibration-actions">
                            <button
                              type="button"
                              className="production-impresion-estimar-tintas-hud__btn production-impresion-estimar-tintas-hud__btn--calibrate"
                              disabled={isCalculating}
                              onClick={() => void handleRecalculateWithCalibratedFactor()}
                            >
                              {isCalculating
                                ? estimarCopy.calibration.applying
                                : estimarCopy.calibration.apply}
                            </button>
                          </div>
                        ) : null}

                        {calibrationPreview ? (
                          <div className="production-impresion-estimar-tintas-hud__calibration-preview">
                            <h6>{estimarCopy.calibration.previewTitle}</h6>
                            <dl className="production-impresion-estimar-tintas-hud__calibration-compare">
                              <div>
                                <dt>{estimarCopy.calibration.currentFactorLabel}</dt>
                                <dd>
                                  {formatConversionFactorForInput(calibrationPreview.currentFactorG)}{' '}
                                  {estimarCopy.params.factorUnit}
                                </dd>
                              </div>
                              <div className="production-impresion-estimar-tintas-hud__calibration-compare--highlight">
                                <dt>{estimarCopy.calibration.projectedFactorLabel}</dt>
                                <dd>
                                  {formatConversionFactorForInput(calibrationPreview.projectedFactorG)}{' '}
                                  {estimarCopy.params.factorUnit}
                                  <span className="production-impresion-estimar-tintas-hud__calibration-delta">
                                    {formatCalibrationDeltaPercent(calibrationPreview.factorChangePercent)}
                                  </span>
                                </dd>
                              </div>
                              <div>
                                <dt>{estimarCopy.calibration.measuredTotalLabel}</dt>
                                <dd>{formatEstimarTintasWeightG(calibrationPreview.measuredTotalG)}</dd>
                              </div>
                              <div>
                                <dt>{estimarCopy.calibration.deviationLabel}</dt>
                                <dd>
                                  {formatCalibrationDeltaPercent(calibrationPreview.deviationPercent)}
                                </dd>
                              </div>
                            </dl>
                          </div>
                        ) : null}

                        {calibrationSummary ? (
                          <div className="production-impresion-estimar-tintas-hud__calibration-applied">
                            <h6>{estimarCopy.calibration.appliedTitle}</h6>
                            <dl className="production-impresion-estimar-tintas-hud__calibration-compare">
                              <div>
                                <dt>{estimarCopy.calibration.currentFactorLabel}</dt>
                                <dd>
                                  {formatConversionFactorForInput(calibrationSummary.currentFactorG)}{' '}
                                  {estimarCopy.params.factorUnit}
                                </dd>
                              </div>
                              <div className="production-impresion-estimar-tintas-hud__calibration-compare--highlight">
                                <dt>{estimarCopy.calibration.projectedFactorLabel}</dt>
                                <dd>
                                  {calibrationSummary.appliedFactorInput} {estimarCopy.params.factorUnit}
                                </dd>
                              </div>
                              <div>
                                <dt>{estimarCopy.calibration.deviationLabel}</dt>
                                <dd>
                                  {formatCalibrationDeltaPercent(calibrationSummary.deviationPercent)}
                                </dd>
                              </div>
                            </dl>
                            <p>{estimarCopy.calibration.appliedHint}</p>
                          </div>
                        ) : null}

                        {calibrationError ? (
                          <p
                            className="production-impresion-estimar-tintas-hud__alert production-impresion-estimar-tintas-hud__alert--error"
                            role="alert"
                          >
                            {calibrationError}
                          </p>
                        ) : null}
                        </div>
                      </div>
                    </details>

                    {showComposerActions ? (
                      <div className="production-impresion-estimar-tintas-hud__save">
                        <div className="production-impresion-estimar-tintas-hud__save-actions">
                          <button
                            type="button"
                            className="production-impresion-estimar-tintas-hud__btn production-impresion-estimar-tintas-hud__btn--ghost"
                            onClick={handleDiscardEstimate}
                          >
                            {estimarCopy.results.discardEstimate}
                          </button>
                          {editingEntradaId ? (
                            <button
                              type="button"
                              className="production-impresion-estimar-tintas-hud__btn production-impresion-estimar-tintas-hud__btn--ghost"
                              onClick={handleCancelEdit}
                            >
                              {entradasCopy.cancelEdit}
                            </button>
                          ) : null}
                          <button
                            type="button"
                            className="production-impresion-estimar-tintas-hud__btn production-impresion-estimar-tintas-hud__btn--primary"
                            disabled={!canSaveDraft}
                            onClick={() => void handleSaveRegistro()}
                          >
                            {editingEntradaId ? entradasCopy.saveEdit : entradasCopy.addButton}
                          </button>
                        </div>
                        {registroDraftError ? (
                          <p
                            className="production-impresion-estimar-tintas-hud__alert production-impresion-estimar-tintas-hud__alert--error"
                            role="alert"
                          >
                            {registroDraftError}
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </EstimarTintasShell>
              </EstimarTintasReveal>
            ) : null}

            {!hasPlanchaSelected ? (
              <p className="production-impresion-estimar-tintas-next-hint">{estimarCopy.pending.plancha}</p>
            ) : null}
            {showEstimarTintasComposer && hasPlanchaSelected && !hasFileLoaded ? (
              <p className="production-impresion-estimar-tintas-next-hint">{estimarCopy.pending.area}</p>
            ) : null}
            {showEstimarTintasComposer && canShowParamsSection && !result ? (
              <p className="production-impresion-estimar-tintas-next-hint">{estimarCopy.pending.resultado}</p>
            ) : null}
          </div>
        </div>

        {showRegistrosSection ? (
          <section
            className="production-plancha-workspace__list"
            aria-labelledby={registrosLabelId}
          >
            <span className="production-plancha-workspace__zone-label" id={registrosLabelId}>
              {entradasCopy.pasoRegistros}
            </span>
            <EstimarTintasEntradasList
              rows={tableRows}
              activeColorPlanchaId={activeColorPlanchaId}
              editingEntradaId={editingEntradaId}
              onEdit={handleEditEntrada}
              onRemove={handleRemoveEntrada}
            />
          </section>
        ) : null}
      </ProductionWorkspaceSection>

      {showRegistrosSection ? (
        <ProductionImpresionEstimarTintasResumen
          rows={tableRows}
          coloresPlanchasCount={coloresPlanchas.length}
        />
      ) : null}
    </>
  )
}

export default ProductionImpresionMuestraPanel
