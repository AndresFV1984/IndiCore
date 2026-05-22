import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  DisenoColorPlanchaItem,
  PreprensaDisenoSpecs,
  YesNoChoice,
} from '../../../core/domain/entities/PreprensaDiseno'
import { Client } from '../../../core/domain/entities/Client'
import { TamanoPlancha } from '../../../core/domain/entities/TamanoPlancha'
import { PrecioMontaje } from '../../../core/domain/entities/PrecioMontaje'
import DisenoColoresPlanchasPanel from './DisenoColoresPlanchasPanel'
import { buildColoresPlanchasPatch } from './utils/coloresPlanchasUtils'
import DisenoModoSelector from './DisenoModoSelector'
import DisenoCrearCostoPanel from './DisenoCrearCostoPanel'
import DisenoClientePicker from './DisenoClientePicker'
import ProductionPrecioMontajePicker from './ProductionPrecioMontajePicker'
import { ClienteDisenoOption } from './utils/buildClienteDisenos'
import { clearPreprensaHistorialSelection } from './utils/applyPreprensaFromHistorial'

const MAX_PDF_MB = 15

const ACABADOS_OPTIONS = [
  { key: 'lineaTroquel' as const, label: 'Línea troquel' },
  { key: 'reservaUv' as const, label: 'Reserva UV' },
  { key: 'estampado' as const, label: 'Estampado' },
  { key: 'repuje' as const, label: 'Repuje' },
]

const parseDigits = (value: string): number => {
  const digits = value.replace(/\D/g, '')
  return digits ? Number(digits) : 0
}

const blockNonDigitKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return
  const allowed = [
    'Backspace',
    'Delete',
    'Tab',
    'Enter',
    'Escape',
    'ArrowLeft',
    'ArrowRight',
    'ArrowUp',
    'ArrowDown',
    'Home',
    'End',
  ]
  if (allowed.includes(e.key)) return
  if (!/^\d$/.test(e.key)) e.preventDefault()
}

export type DisenoSectionTone =
  | 'trabajo'
  | 'identidad'
  | 'costo'
  | 'archivo'
  | 'especificaciones'
  | 'acabados'
  | 'montaje'

const SECTION_TAG_LABELS: Record<DisenoSectionTone, string> = {
  trabajo: 'Historial',
  identidad: 'Nombre',
  costo: 'Costo',
  archivo: 'PDF',
  especificaciones: 'Técnico',
  acabados: 'Acabados',
  montaje: 'Montaje',
}

interface DisenoSectionProps {
  title?: string
  subtitle?: string
  tone?: DisenoSectionTone
  children: React.ReactNode
}

const DisenoSection: React.FC<DisenoSectionProps> = ({ title, subtitle, tone, children }) => {
  const showHead = Boolean(tone || title || subtitle)
  return (
    <div
      className={['production-diseno-block', tone ? `production-diseno-block--${tone}` : '']
        .filter(Boolean)
        .join(' ')}
    >
      {showHead && (
        <div className="production-diseno-block__head">
          <div className="production-diseno-block__head-row">
            {tone ? (
              <span className={`production-diseno-block__tag production-diseno-block__tag--${tone}`}>
                {SECTION_TAG_LABELS[tone]}
              </span>
            ) : null}
            {(title || subtitle) && (
              <div className="production-diseno-block__titles">
                {title ? <h4 className="production-diseno-block__title">{title}</h4> : null}
                {subtitle ? <p className="production-diseno-block__sub">{subtitle}</p> : null}
              </div>
            )}
          </div>
        </div>
      )}
      <div className="production-diseno-block__body">{children}</div>
    </div>
  )
}

const validatePdfFile = (file: File): string | null => {
  const isPdf =
    file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
  if (!isPdf) return 'Solo se permiten archivos PDF.'
  if (file.size > MAX_PDF_MB * 1024 * 1024) {
    return `El archivo no debe superar ${MAX_PDF_MB} MB.`
  }
  return null
}

interface ProductionPreprensaDisenoProps {
  diseno: PreprensaDisenoSpecs
  isNewOrder?: boolean
  clientId: string
  clientName?: string
  clients: Client[]
  disenosCliente: ClienteDisenoOption[]
  ordersLoading?: boolean
  planchas: TamanoPlancha[]
  preciosMontaje: PrecioMontaje[]
  onChange: (patch: Partial<PreprensaDisenoSpecs>) => void
  onHistorialSelect: (option: ClienteDisenoOption) => void
  onClientSelect: (client: Client | null) => void
  onGoToClienteTab?: () => void
}

const ProductionPreprensaDiseno: React.FC<ProductionPreprensaDisenoProps> = ({
  diseno,
  isNewOrder = false,
  clientId,
  clientName,
  clients,
  disenosCliente,
  ordersLoading,
  planchas,
  preciosMontaje,
  onChange,
  onHistorialSelect,
  onClientSelect,
  onGoToClienteTab,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pdfPreviewUrlRef = useRef<string | null>(null)
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)

  const revokePdfPreviewUrl = () => {
    if (pdfPreviewUrlRef.current) {
      URL.revokeObjectURL(pdfPreviewUrlRef.current)
      pdfPreviewUrlRef.current = null
    }
    setPdfPreviewUrl(null)
  }

  const clearPdfSelection = () => {
    revokePdfPreviewUrl()
    if (fileInputRef.current) fileInputRef.current.value = ''
    setFileError(null)
  }

  useEffect(() => {
    return () => revokePdfPreviewUrl()
  }, [])

  useEffect(() => {
    if (!diseno.designPdfFileName) revokePdfPreviewUrl()
  }, [diseno.designPdfFileName])

  const showDetalleExistente = diseno.designNuevo === 'no'
  const historialSeleccionado = Boolean(diseno.disenoExistenteId.trim())
  const trabajoHistorial = useMemo(
    () => disenosCliente.find(d => d.sourceOrderId === diseno.disenoExistenteId) ?? null,
    [disenosCliente, diseno.disenoExistenteId]
  )
  const showDisenoNuevoDetalle =
    diseno.designNuevo === 'si' || (showDetalleExistente && historialSeleccionado)

  const handleDesignNuevo = (value: YesNoChoice) => {
    if (value === 'no') {
      onChange({
        designNuevo: 'no',
        nombreDiseno: '',
        disenoExistenteId: '',
        disenoExistenteNombre: '',
        aplicaCostoDiseno: false,
        crearDisenoCost: 0,
        designPdfFileName: '',
        numeroCavidades: 0,
        colores: '',
        coloresPlanchas: [],
        planchaId: '',
        planchaNombreMedida: '',
        planchaValor: 0,
        planchaClienteTipo: '',
        planchaNuevaCosto: 0,
        lineaTroquel: false,
        reservaUv: false,
        estampado: false,
        repuje: false,
        precioMontajeId: '',
        precioMontajeNombre: '',
        precioMontajeCosto: 0,
      })
      clearPdfSelection()
      return
    }
    onChange({
      designNuevo: 'si',
      disenoExistenteId: '',
      disenoExistenteNombre: '',
      planchaClienteTipo: '',
      planchaNuevaCosto: 0,
    })
  }

  const handleClienteDisenoSelect = (option: ClienteDisenoOption | null) => {
    if (!option) {
      clearPdfSelection()
      onChange(clearPreprensaHistorialSelection())
      return
    }
    clearPdfSelection()
    onHistorialSelect(option)
  }

  const handleColoresPlanchasChange = (coloresPlanchas: DisenoColorPlanchaItem[]) => {
    onChange(buildColoresPlanchasPatch(coloresPlanchas))
  }

  const costoIncluirValue: YesNoChoice = diseno.aplicaCostoDiseno ? 'si' : 'no'

  const handleCostoIncluir = (value: YesNoChoice) => {
    if (value === 'no') {
      onChange({ aplicaCostoDiseno: false, crearDisenoCost: 0 })
      return
    }
    onChange({ aplicaCostoDiseno: true })
  }

  const toggleAcabado = (key: (typeof ACABADOS_OPTIONS)[number]['key']) => {
    onChange({ [key]: !diseno[key] })
  }

  const handlePdfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const err = validatePdfFile(file)
    if (err) {
      setFileError(err)
      e.target.value = ''
      return
    }
    setFileError(null)
    revokePdfPreviewUrl()
    const url = URL.createObjectURL(file)
    pdfPreviewUrlRef.current = url
    setPdfPreviewUrl(url)
    onChange({ designPdfFileName: file.name })
  }

  const handlePdfRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    clearPdfSelection()
    onChange({ designPdfFileName: '' })
  }

  const handlePrecioMontajeSelect = (item: PrecioMontaje | null) => {
    if (!item) {
      onChange({
        precioMontajeId: '',
        precioMontajeNombre: '',
        precioMontajeCosto: 0,
      })
      return
    }
    onChange({
      precioMontajeId: item.id,
      precioMontajeNombre: item.name,
      precioMontajeCosto: item.cost,
    })
  }

  return (
    <div className="production-diseno-form">
      <div className="production-diseno-intro">
        <DisenoModoSelector value={diseno.designNuevo} onChange={handleDesignNuevo} />
      </div>

      {showDetalleExistente && (
        <section
          className="production-diseno-detail production-diseno-detail--existente"
          aria-label="Configuración del diseño existente"
        >
          <p className="production-diseno-detail__mode-label production-diseno-detail__mode-label--existente">
            Diseño existente
          </p>

          <DisenoSection
            title="Trabajo ya realizado"
            subtitle="Seleccione una orden anterior de este cliente para reutilizar su información"
            tone="trabajo"
          >
            <DisenoClientePicker
              clientId={clientId}
              clientName={clientName}
              clients={clients}
              options={disenosCliente}
              ordersLoading={ordersLoading}
              selectedId={diseno.disenoExistenteId}
              onClientSelect={onClientSelect}
              onSelect={handleClienteDisenoSelect}
              onGoToClienteTab={onGoToClienteTab}
            />
          </DisenoSection>
        </section>
      )}

      {showDisenoNuevoDetalle && (
        <section
          className={[
            'production-diseno-detail',
            'production-diseno-detail--nuevo',
            historialSeleccionado ? 'production-diseno-detail--historial' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          aria-label={
            historialSeleccionado
              ? 'Información del trabajo ya realizado'
              : 'Configuración del diseño nuevo'
          }
        >
          <header className="production-diseno-detail__header">
            <h3 className="production-diseno-detail__title">
              {historialSeleccionado ? 'Datos del trabajo anterior' : 'Datos del diseño nuevo'}
            </h3>
            <p className="production-diseno-detail__lead">
              {historialSeleccionado
                ? 'Revise la información importada y ajuste solo lo que cambie en esta orden.'
                : 'Complete las secciones en orden. Cada bloque agrupa un aspecto del arte y la producción.'}
            </p>
          </header>

          {trabajoHistorial && (
            <div className="production-diseno-historial-banner">
              <h4 className="production-diseno-historial-banner__title">
                Información del trabajo ya realizado
              </h4>
              <p className="production-diseno-historial-banner__ref">
                <span className="production-diseno-historial-banner__ref-label">Trabajo</span>
                <span>{trabajoHistorial.workName}</span>
                <span className="production-diseno-historial-banner__sep" aria-hidden>
                  ·
                </span>
                <span className="production-diseno-historial-banner__ref-label">Diseño</span>
                <span>
                  {trabajoHistorial.nombreDiseno ||
                    diseno.nombreDiseno ||
                    'Sin nombre de diseño'}
                </span>
              </p>
              <p className="production-diseno-historial-banner__desc">
                Los campos siguientes se completaron con los datos registrados en esa orden
                anterior. Revise y ajuste solo lo que cambie en esta producción.
              </p>
            </div>
          )}

          <DisenoSection
            title={historialSeleccionado ? 'Nombre del diseño' : 'Nombre'}
            subtitle={
              historialSeleccionado
                ? 'Registrado en el trabajo anterior'
                : 'Nombre del trabajo gráfico'
            }
            tone="identidad"
          >
            <input
              id="diseno-nombre"
              type="text"
              className="production-form-input"
              value={diseno.nombreDiseno}
              onChange={e => onChange({ nombreDiseno: e.target.value })}
              placeholder="Ej. Empaque caja premium 2026"
              autoFocus={!historialSeleccionado}
            />
          </DisenoSection>

          <DisenoSection
            title="Servicio de diseño"
            subtitle={
              historialSeleccionado
                ? 'Costo registrado en el trabajo anterior'
                : 'Valor del servicio de diseño'
            }
            tone="costo"
          >
            <DisenoCrearCostoPanel
              incluir={costoIncluirValue}
              costo={diseno.crearDisenoCost}
              onIncluirChange={handleCostoIncluir}
              onCostoInputChange={e =>
                onChange({ crearDisenoCost: parseDigits(e.target.value) })
              }
              onCostoKeyDown={blockNonDigitKey}
            />
          </DisenoSection>

          <DisenoSection
            title="Archivo PDF"
            subtitle={`Máximo ${MAX_PDF_MB} MB`}
            tone="archivo"
          >
            <label
              className={`production-diseno-dropzone${diseno.designPdfFileName ? ' production-diseno-dropzone--has-file' : ''}`}
            >
              <input
                ref={fileInputRef}
                id="diseno-pdf"
                type="file"
                accept="application/pdf,.pdf"
                className="production-diseno-dropzone__file"
                onChange={handlePdfChange}
              />
              <span className="production-diseno-dropzone__surface">
                <span className="production-diseno-dropzone__icon" aria-hidden>
                  PDF
                </span>
                <span className="production-diseno-dropzone__label">
                  {diseno.designPdfFileName || 'Haga clic para seleccionar archivo'}
                </span>
                <span className="production-diseno-dropzone__action">Examinar</span>
              </span>
            </label>
            {fileError && <p className="production-form-error">{fileError}</p>}
            {historialSeleccionado && diseno.designPdfFileName && !pdfPreviewUrl && (
              <p className="production-diseno-cliente-hint">
                Archivo registrado: <strong>{diseno.designPdfFileName}</strong>. Vuelva a cargar
                el PDF si lo necesita en esta orden.
              </p>
            )}
            {pdfPreviewUrl && diseno.designPdfFileName && (
              <div className="production-diseno-pdf-preview">
                <div className="production-diseno-pdf-preview__head">
                  <p className="production-diseno-pdf-preview__name">{diseno.designPdfFileName}</p>
                  <button
                    type="button"
                    className="production-diseno-pdf-preview__remove"
                    onClick={handlePdfRemove}
                  >
                    Quitar
                  </button>
                </div>
                <iframe
                  src={pdfPreviewUrl}
                  title={`Vista previa: ${diseno.designPdfFileName}`}
                  className="production-diseno-pdf-preview__frame"
                />
              </div>
            )}
          </DisenoSection>

          <DisenoSection
            title="Especificaciones técnicas"
            subtitle={
              historialSeleccionado ? 'Datos técnicos del trabajo anterior' : undefined
            }
            tone="especificaciones"
          >
            <div
              className={[
                'production-diseno-specs-grid',
                isNewOrder ? 'production-diseno-specs-grid--colores' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <DisenoColoresPlanchasPanel
                items={diseno.coloresPlanchas}
                planchas={planchas}
                onChange={handleColoresPlanchasChange}
                historialMode={showDetalleExistente && historialSeleccionado}
              />
            </div>
          </DisenoSection>

          <DisenoSection
            title="Acabados de diseño"
            subtitle="Seleccione los que apliquen"
            tone="acabados"
          >
            <div className="production-diseno-chips" role="group" aria-label="Acabados">
              {ACABADOS_OPTIONS.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  className={`production-diseno-chip${diseno[key] ? ' production-diseno-chip--on' : ''}`}
                  onClick={() => toggleAcabado(key)}
                  aria-pressed={diseno[key]}
                >
                  {label}
                </button>
              ))}
            </div>
          </DisenoSection>

          <DisenoSection
            title="Precio de montaje"
            subtitle="Seleccione la tarifa que aplica a esta orden"
            tone="montaje"
          >
            <ProductionPrecioMontajePicker
              items={preciosMontaje}
              selectedId={diseno.precioMontajeId}
              onSelect={handlePrecioMontajeSelect}
            />
          </DisenoSection>
        </section>
      )}
    </div>
  )
}

export default ProductionPreprensaDiseno
