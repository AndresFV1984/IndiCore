import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import clsx from 'clsx'
import type { PaperRow } from '../../../core/domain/entities/Order'
import type { TipoPapel } from '../../../core/domain/entities/TipoPapel'
import { despieceAsociadoMedida } from '../../../core/domain/entities/CortePapel'
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
  computeEstimarTintasTotalPedidoG,
  buildEstimarTintasEstimateOptions,
  formatCalibrationDeltaPercent,
  formatConversionFactorForInput,
  parseConversionFactorInput,
  resolveConversionFactorG,
  type CmykChannel,
  type EstimarTintasCalibrationPreview,
  type EstimarTintasResult,
  estimateInkFromImageElement,
  formatEstimarTintasCoverage,
  formatEstimarTintasWeightG,
  formatEstimarTintasEntero,
  resolvePlanchaTotalPliegos,
  resolveDespiecePrintAreaCm,
  loadEstimarTintasImage,
  mapEstimarTintasErrorCode,
  sumCmykCoverage,
  validateEstimarTintasFile,
  type EstimarTintasSourceKind,
  getEstimarTintasSourceKind,
} from './utils/estimarTintasUtils'
import { prepareEstimarTintasPdfSource } from './utils/estimarTintasPdfUtils'
import EstimarTintasPdfAssetPreview from './EstimarTintasPdfAssetPreview'
import EstimarTintasEntradasList from './EstimarTintasEntradasList'
import ProductionImpresionEstimarTintasResumen from './ProductionImpresionEstimarTintasResumen'
import {
  buildEstimarTintasTableRows,
  createImpresionEstimarTintasEntrada,
  entradaToEstimarTintasResult,
} from './utils/estimarTintasRegistrosUtils'
import type { ImpresionEstimarTintasEntrada, ImpresionEstimarTintasRegistro } from '../../../core/domain/entities/Order'

const estimarCopy = copy.muestra
const planchaCopy = estimarCopy.plancha
const entradasCopy = estimarCopy.entradas

const CMYK_SWATCH: Record<CmykChannel, string> = {
  c: '#00a9e0',
  m: '#d6007a',
  y: '#ffd400',
  k: '#1a1a1a',
}

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

const ESTIMAR_TINTAS_RING_RADIUS = 26
const ESTIMAR_TINTAS_RING_SIZE = 64
const ESTIMAR_TINTAS_RING_STROKE = 5.5
const ESTIMAR_TINTAS_RING_CENTER = ESTIMAR_TINTAS_RING_SIZE / 2
const ESTIMAR_TINTAS_RING_CIRCUMFERENCE = 2 * Math.PI * ESTIMAR_TINTAS_RING_RADIUS

interface EstimarTintasChannelCardProps {
  channel: CmykChannel
  label: string
  coverage: number
  weightG: number
}

const EstimarTintasHudChannelCard: React.FC<EstimarTintasChannelCardProps> = ({
  channel,
  label,
  coverage,
  weightG,
}) => {
  const coveragePercent = Math.min(100, Math.max(0, coverage * 100))
  const ringOffset = ESTIMAR_TINTAS_RING_CIRCUMFERENCE * (1 - coveragePercent / 100)

  return (
    <article
      className={clsx(
        'production-impresion-estimar-tintas-hud__ring-card',
        `production-impresion-estimar-tintas-hud__ring-card--${channel}`
      )}
      role="listitem"
      aria-label={`${label}: ${formatEstimarTintasCoverage(coverage)}, ${formatEstimarTintasWeightG(weightG)}`}
    >
      <div className="production-impresion-estimar-tintas-hud__ring-card-head">
        <span
          className="production-impresion-estimar-tintas-hud__ring-card-badge"
          style={{ backgroundColor: CMYK_SWATCH[channel] }}
          aria-hidden
        >
          {channel.toUpperCase()}
        </span>
        <span className="production-impresion-estimar-tintas-hud__ring-card-name">{label}</span>
      </div>

      <div className="production-impresion-estimar-tintas-hud__ring-card-viz">
        <svg
          className="production-impresion-estimar-tintas-hud__ring-card-svg"
          viewBox={`0 0 ${ESTIMAR_TINTAS_RING_SIZE} ${ESTIMAR_TINTAS_RING_SIZE}`}
          role="presentation"
          aria-hidden
        >
          <circle
            className="production-impresion-estimar-tintas-hud__ring-card-track"
            cx={ESTIMAR_TINTAS_RING_CENTER}
            cy={ESTIMAR_TINTAS_RING_CENTER}
            r={ESTIMAR_TINTAS_RING_RADIUS}
            fill="none"
            strokeWidth={ESTIMAR_TINTAS_RING_STROKE}
          />
          <circle
            className="production-impresion-estimar-tintas-hud__ring-card-progress"
            cx={ESTIMAR_TINTAS_RING_CENTER}
            cy={ESTIMAR_TINTAS_RING_CENTER}
            r={ESTIMAR_TINTAS_RING_RADIUS}
            fill="none"
            strokeWidth={ESTIMAR_TINTAS_RING_STROKE}
            strokeLinecap="round"
            strokeDasharray={ESTIMAR_TINTAS_RING_CIRCUMFERENCE}
            strokeDashoffset={ringOffset}
            transform={`rotate(-90 ${ESTIMAR_TINTAS_RING_CENTER} ${ESTIMAR_TINTAS_RING_CENTER})`}
          />
        </svg>
        <span className="production-impresion-estimar-tintas-hud__ring-card-pct">
          {formatEstimarTintasCoverage(coverage)}
        </span>
      </div>

      <div className="production-impresion-estimar-tintas-hud__ring-card-foot">
        <span className="production-impresion-estimar-tintas-hud__ring-card-foot-label">Consumo</span>
        <p className="production-impresion-estimar-tintas-hud__ring-card-grams">
          {formatEstimarTintasWeightG(weightG)}
        </p>
      </div>
    </article>
  )
}

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
  const dragDepthRef = useRef(0)
  const pdfAnalysisRef = useRef<(() => Promise<HTMLImageElement>) | null>(null)
  const conversionFactorRef = useRef(formatConversionFactorForInput(ESTIMAR_TINTAS_DEFAULT_CONVERSION_FACTOR_G))
  const conversionFactorManuallyEditedRef = useRef(false)
  const skipResetOnPlanchaChangeRef = useRef(false)
  const skipReloadAfterSaveRef = useRef(false)

  const [fileName, setFileName] = useState('')
  const [fileSize, setFileSize] = useState<number | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [sourceKind, setSourceKind] = useState<EstimarTintasSourceKind | null>(null)
  const [pdfPageCount, setPdfPageCount] = useState<number | null>(null)
  const [pdfPhysicalSize, setPdfPhysicalSize] = useState<{ widthCm: number; heightCm: number } | null>(
    null
  )
  const [imageMeta, setImageMeta] = useState<{ width: number; height: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [fileError, setFileError] = useState<string | null>(null)
  const [estimateError, setEstimateError] = useState<string | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [result, setResult] = useState<EstimarTintasResult | null>(null)
  const [dimensionsTouched, setDimensionsTouched] = useState(false)
  const [measuredGInput, setMeasuredGInput] = useState('')
  const [calibrationBaseline, setCalibrationBaseline] = useState<{
    factorG: number
    totalG: number
  } | null>(null)
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
      ? `${despiece.name?.trim() || '—'} · ${despieceAsociadoMedida(despiece)}`
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
  const hasFileLoaded = Boolean(fileName && previewUrl)
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
    setFileName('')
    setFileSize(null)
    setImageMeta(null)
    setSourceKind(null)
    setPdfPageCount(null)
    setPdfPhysicalSize(null)
    pdfAnalysisRef.current = null
    setFileError(null)
  }, [revokePreview])

  const clearDraft = useCallback(() => {
    setEditingEntradaId(null)
    setRegistroDraftError(null)
    resetEstimate()
    setMeasuredGInput('')
    setCalibrationBaseline(null)
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
    setResult(entradaToEstimarTintasResult(entrada))
    setEditingEntradaId(entrada.id)
    setMeasuredGInput('')
    setCalibrationBaseline(null)
    setCalibrationSummary(null)
    setCalibrationError(null)
    setRegistroDraftError(null)
  }, [updateConversionFactor])

  useEffect(() => {
    if (dimensionsTouched) return
    applyDespiecePrintArea()
  }, [applyDespiecePrintArea, dimensionsTouched])

  const loadImageMeta = useCallback(async (url: string) => {
    const img = await loadEstimarTintasImage(url)
    const meta = { width: img.naturalWidth, height: img.naturalHeight }
    setImageMeta(meta)
    return meta
  }, [])

  const loadAnalysisImage = useCallback(async (): Promise<HTMLImageElement> => {
    if (sourceKind === 'pdf') {
      if (!pdfAnalysisRef.current) throw new Error('pdf-load-failed')
      return pdfAnalysisRef.current()
    }

    if (!previewUrl) throw new Error('image-load-failed')
    return loadEstimarTintasImage(previewUrl)
  }, [previewUrl, sourceKind])

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
      setFileName(file.name)
      setFileSize(file.size)
      setSourceKind(kind)
      setPdfPageCount(null)
      setPdfPhysicalSize(null)
      pdfAnalysisRef.current = null

      revokePreview()

      const url = URL.createObjectURL(file)
      blobUrlRef.current = url
      setPreviewUrl(url)

      try {
        if (kind === 'pdf') {
          const pdfSource = await prepareEstimarTintasPdfSource(url)
          pdfAnalysisRef.current = pdfSource.getAnalysisImage
          setPdfPageCount(pdfSource.meta.pageCount)
          setPdfPhysicalSize({
            widthCm: pdfSource.meta.widthCm,
            heightCm: pdfSource.meta.heightCm,
          })
          setImageMeta({
            width: pdfSource.meta.widthPx,
            height: pdfSource.meta.heightPx,
          })
          return
        }

        await loadImageMeta(url)
      } catch (error) {
        revokePreview()
        setFileName('')
        setFileSize(null)
        setImageMeta(null)
        setSourceKind(null)
        setPdfPageCount(null)
        setPdfPhysicalSize(null)
        setFileError(
          resolveErrorMessage(
            mapEstimarTintasErrorCode(error instanceof Error ? error.message : 'unknown')
          )
        )
      }
    },
    [canUploadFile, loadImageMeta, revokePreview]
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

    const img = await loadAnalysisImage()
    return estimateInkFromImageElement(img, buildEstimarTintasEstimateOptions(params))
  }, [getEstimateParams, loadAnalysisImage, previewUrl])

  const runEstimate = useCallback(async (): Promise<EstimarTintasResult | null> => {
    if (!previewUrl) return null

    setEstimateError(null)
    setIsCalculating(true)

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
    }
  }, [computeEstimateFromPreview, previewUrl])

  const handleMeasuredGInputChange = useCallback((value: string) => {
    setMeasuredGInput(value)
    setCalibrationSummary(null)
    setCalibrationError(null)
  }, [])

  const canCalculate = Boolean(canUploadFile && previewUrl && fileName && !isCalculating)
  const canSaveDraft = Boolean(
    result && activePlancha && activeRegistro && fileName && sourceKind && !isCalculating
  )
  const defaultFactorInput = formatConversionFactorForInput(ESTIMAR_TINTAS_DEFAULT_CONVERSION_FACTOR_G)
  const totalInkG = result ? sumCmykCoverage(result.inkG) : 0

  const totalInkPedidoG = useMemo(() => {
    const totalPliegos = planchaPliegos?.totalPliegos ?? 0
    if (!result || totalPliegos <= 0) return null
    return computeEstimarTintasTotalPedidoG(totalInkG, totalPliegos)
  }, [planchaPliegos?.totalPliegos, result, totalInkG])
  const isUsingDefaultFactor =
    parseConversionFactorInput(conversionFactorInput) === ESTIMAR_TINTAS_DEFAULT_CONVERSION_FACTOR_G

  const calibrationPreview = useMemo(() => {
    if (!result || calibrationSummary) return null

    const measuredGTotal = parsePositiveNumber(measuredGInput)
    if (measuredGTotal <= 0) return null

    const widthCm = parsePositiveNumber(widthCmInput)
    const heightCm = parsePositiveNumber(heightCmInput)
    const currentFactorG =
      calibrationBaseline?.factorG ??
      (parseConversionFactorInput(conversionFactorRef.current) ||
        ESTIMAR_TINTAS_DEFAULT_CONVERSION_FACTOR_G)
    const currentTotalG = calibrationBaseline?.totalG ?? sumCmykCoverage(result.inkG)

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
    calibrationBaseline,
    calibrationSummary,
    heightCmInput,
    measuredGInput,
    result,
    widthCmInput,
    conversionFactorInput,
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
      },
      editingEntradaId ?? activeEntrada?.id
    )

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
    result,
    sourceKind,
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
    },
    [activeColorPlanchaId, loadDraftFromEntrada, onActiveColorPlanchaIdChange, registros]
  )

  const handleRemoveEntrada = useCallback(
    (colorPlanchaId: string, entradaId: string) => {
      const registro = registros.find(item => item.colorPlanchaId === colorPlanchaId)
      if (!registro) return

      persistRegistro({
        ...registro,
        entradas: registro.entradas.filter(item => item.id !== entradaId),
      })

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
    const stepArchivoComplete = Boolean(fileName && previewUrl)
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
                      ) : previewUrl ? (
                        <img
                          src={previewUrl}
                          alt={estimarCopy.upload.previewAlt}
                          className="production-impresion-estimar-tintas__asset-image"
                        />
                      ) : null}
                    </div>
                    <div className="production-impresion-estimar-tintas__asset-body">
                      <strong className="production-impresion-estimar-tintas__asset-name" title={fileName}>
                        {fileName}
                      </strong>
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
                  subtitle={estimarCopy.results.subtitle}
                  status={flowSteps[3]?.state ?? 'complete'}
                  className="production-impresion-estimar-tintas-step--result"
                >
                  <div className="production-impresion-estimar-tintas-hud" aria-live="polite">
                    <div className="production-impresion-estimar-tintas-hud__fx" aria-hidden />
                    <div className="production-impresion-estimar-tintas-hud__rings" role="list">
                      {CMYK_CHANNELS.map(channel => (
                        <EstimarTintasHudChannelCard
                          key={channel}
                          channel={channel}
                          label={estimarCopy.channelNames[channel]}
                          coverage={result.coverage[channel]}
                          weightG={result.inkG[channel]}
                        />
                      ))}
                    </div>

                    <div className="production-impresion-estimar-tintas-hud__totals-row">
                      <div className="production-impresion-estimar-tintas-hud__total production-impresion-estimar-tintas-hud__total--sample">
                        <span className="production-impresion-estimar-tintas-hud__total-label">
                          {estimarCopy.results.totalLabel}
                        </span>
                        <strong className="production-impresion-estimar-tintas-hud__total-value">
                          {formatEstimarTintasWeightG(totalInkG)}
                        </strong>
                        <span className="production-impresion-estimar-tintas-hud__total-hint">
                          {estimarCopy.results.totalLabelHint}
                        </span>
                      </div>

                      <div className="production-impresion-estimar-tintas-hud__total production-impresion-estimar-tintas-hud__total--pedido">
                        <span className="production-impresion-estimar-tintas-hud__total-label">
                          {estimarCopy.results.totalPedidoLabel}
                        </span>
                        <strong className="production-impresion-estimar-tintas-hud__total-value production-impresion-estimar-tintas-hud__total-value--pedido">
                          {totalInkPedidoG != null
                            ? formatEstimarTintasWeightG(totalInkPedidoG)
                            : '—'}
                        </strong>
                        {totalInkPedidoG != null && planchaPliegos ? (
                          <>
                            <span className="production-impresion-estimar-tintas-hud__total-hint">
                              {estimarCopy.results.totalPedidoHint}
                            </span>
                            <EstimarTintasTotalPedidoFormula
                              tamanosBuenos={planchaPliegos.tamanosBuenos}
                              sobrante={planchaPliegos.sobrante}
                              totalPliegos={planchaPliegos.totalPliegos}
                              totalInkG={totalInkG}
                              totalPedidoG={totalInkPedidoG}
                            />
                          </>
                        ) : (
                          <span className="production-impresion-estimar-tintas-hud__total-hint">
                            {estimarCopy.results.totalPedidoEmpty}
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="production-impresion-estimar-tintas-hud__total-meta">
                      {estimarCopy.results.sampleHint(
                        result.sampleWidth,
                        result.sampleHeight,
                        result.sampledPixels,
                        result.inkedPixels,
                        result.averageTac
                      )}
                    </p>

                    <section className="production-impresion-estimar-tintas-hud__calibration">
                      <header className="production-impresion-estimar-tintas-hud__calibration-head">
                        <span className="production-impresion-estimar-tintas-hud__calibration-tag">
                          {estimarCopy.calibration.tag}
                        </span>
                        <div>
                          <h5 className="production-impresion-estimar-tintas-hud__calibration-title">
                            {estimarCopy.calibration.title}
                          </h5>
                          <p className="production-impresion-estimar-tintas-hud__calibration-sub">
                            {estimarCopy.calibration.subtitle}
                          </p>
                        </div>
                      </header>

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
                    </section>

                    {showComposerActions ? (
                      <div className="production-impresion-estimar-tintas-hud__save">
                        <div className="production-impresion-estimar-tintas-hud__save-toolbar">
                          <p className="production-impresion-estimar-tintas-hud__save-hint">
                            {editingEntradaId
                              ? entradasCopy.editAfterCalculateHint
                              : entradasCopy.saveAfterCalculateHint}
                          </p>
                          <div className="production-impresion-estimar-tintas-hud__save-actions">
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
                              {editingEntradaId
                                ? entradasCopy.saveEdit
                                : entradasCopy.addButton}
                            </button>
                          </div>
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

                    <p className="production-impresion-estimar-tintas-hud__note">
                      {estimarCopy.results.estimationNote}
                    </p>
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
