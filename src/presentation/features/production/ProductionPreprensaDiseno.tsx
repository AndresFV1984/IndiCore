import React, { useCallback, useMemo } from 'react'
import {
  DisenoColorPlanchaItem,
  PreprensaDisenoSpecs,
  YesNoChoice,
} from '../../../core/domain/entities/PreprensaDiseno'
import { Client } from '../../../core/domain/entities/Client'
import { TamanoPlancha } from '../../../core/domain/entities/TamanoPlancha'
import { PrecioMontaje } from '../../../core/domain/entities/PrecioMontaje'
import DisenoColoresPlanchasPanel from './DisenoColoresPlanchasPanel'
import DisenoTotalesResumen from './DisenoTotalesResumen'
import { buildColoresPlanchasPatch } from './utils/coloresPlanchasUtils'
import DisenoCrearCostoPanel from './DisenoCrearCostoPanel'
import DisenoPdfUpload from './DisenoPdfUpload'
import DisenoClientePicker from './DisenoClientePicker'
import ProductionPrecioMontajePicker from './ProductionPrecioMontajePicker'
import { ClienteDisenoOption } from './utils/buildClienteDisenos'
import { clearPreprensaHistorialSelection } from './utils/applyPreprensaFromHistorial'
import ProductionWorkspaceSection from './ProductionWorkspaceSection'
import type { ProductionWorkspaceTone } from './constants/productionWorkspaceColors'
import { PREPRENSA_DISENO_COPY as copy } from './constants/preprensaDisenoCopy'

const MAX_PDF_MB = 15

const ACABADOS_OPTIONS = [
  { key: 'lineaTroquel' as const, label: copy.acabados.lineaTroquel },
  { key: 'reservaUv' as const, label: copy.acabados.reservaUv },
  { key: 'estampado' as const, label: copy.acabados.estampado },
  { key: 'repuje' as const, label: copy.acabados.repuje },
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
  trabajo: copy.sectionTags.trabajo,
  identidad: copy.sectionTags.identidad,
  costo: copy.sectionTags.costo,
  archivo: copy.sectionTags.archivo,
  especificaciones: copy.sectionTags.especificaciones,
  acabados: copy.sectionTags.acabados,
  montaje: copy.sectionTags.montaje,
}

const SECTION_TONE: Record<DisenoSectionTone, ProductionWorkspaceTone> = {
  trabajo: 0,
  identidad: 1,
  costo: 2,
  archivo: 0,
  especificaciones: 1,
  acabados: 2,
  montaje: 0,
}

interface DisenoSectionProps {
  title?: string
  subtitle?: string
  tone?: DisenoSectionTone
  children: React.ReactNode
}

const DisenoSection: React.FC<DisenoSectionProps> = ({ title, subtitle, tone, children }) => (
  <ProductionWorkspaceSection
    tag={tone ? SECTION_TAG_LABELS[tone] : undefined}
    title={title}
    subtitle={subtitle}
    tone={tone ? SECTION_TONE[tone] : 0}
  >
    {children}
  </ProductionWorkspaceSection>
)

interface ProductionPreprensaDisenoProps {
  diseno: PreprensaDisenoSpecs
  isNewOrder?: boolean
  /** Cantidad de Especificaciones › Detalle OP */
  orderQuantity?: number
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
  onGoToDetalleOpTab?: () => void
}

const ProductionPreprensaDiseno: React.FC<ProductionPreprensaDisenoProps> = ({
  diseno,
  isNewOrder = false,
  orderQuantity = 0,
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
  onGoToDetalleOpTab,
}) => {
  const clearPdfSelection = useCallback(() => {
    onChange({ designPdfFileName: '' })
  }, [onChange])

  const showDetalleExistente = diseno.designNuevo === 'no'
  const historialSeleccionado = Boolean(diseno.disenoExistenteId.trim())
  const detalleDesdeTrabajoAnterior = showDetalleExistente && historialSeleccionado
  const trabajoHistorial = useMemo(
    () => disenosCliente.find(d => d.sourceOrderId === diseno.disenoExistenteId) ?? null,
    [disenosCliente, diseno.disenoExistenteId]
  )
  const showFormularioDisenoCompleto =
    diseno.designNuevo === 'si' || detalleDesdeTrabajoAnterior
  const showEspecificacionesExistente =
    showDetalleExistente && !detalleDesdeTrabajoAnterior

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

  const handlePdfFileNameChange = useCallback(
    (designPdfFileName: string) => onChange({ designPdfFileName }),
    [onChange]
  )

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

  const n = copy.nuevo

  const especificacionesTecnicasSection = (historialMode: boolean, subtitle?: string) => (
    <DisenoSection
      title={n.specsTitulo}
      subtitle={subtitle}
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
          isNewOrder={isNewOrder}
          orderQuantity={orderQuantity}
          historialMode={historialMode}
          onGoToDetalleOpTab={onGoToDetalleOpTab}
        />
      </div>
    </DisenoSection>
  )

  return (
    <div className="production-diseno-form">
      {showDetalleExistente && (
        <section
          className="production-diseno-detail production-diseno-detail--existente"
          aria-label={copy.existente.ariaLabel}
        >
          <p className="production-diseno-detail__mode-label production-diseno-detail__mode-label--existente">
            {copy.existente.modeLabel}
          </p>

          <DisenoSection
            title={copy.existente.trabajoTitle}
            subtitle={copy.existente.trabajoSubtitle}
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

          {showEspecificacionesExistente &&
            especificacionesTecnicasSection(false, copy.existente.specsSubtitle)}
        </section>
      )}

      {showFormularioDisenoCompleto && (
        <section
          className="production-diseno-detail production-diseno-detail--nuevo"
          aria-label={n.ariaNuevo}
        >
          <header className="production-diseno-detail__header">
            {detalleDesdeTrabajoAnterior && (
              <p className="production-diseno-detail__mode-label production-diseno-detail__mode-label--existente">
                {copy.existente.modeLabel}
              </p>
            )}
            <h3 className="production-diseno-detail__title">{n.tituloNuevo}</h3>
            <p className="production-diseno-detail__lead">
              {detalleDesdeTrabajoAnterior ? n.leadHistorial : n.leadNuevo}
            </p>
          </header>

          {trabajoHistorial && (
            <div className="production-diseno-historial-banner">
              <h4 className="production-diseno-historial-banner__title">
                {n.bannerTitulo}
              </h4>
              <p className="production-diseno-historial-banner__ref">
                <span className="production-diseno-historial-banner__ref-label">Trabajo</span>
                <span>{trabajoHistorial.workName}</span>
                <span className="production-diseno-historial-banner__sep" aria-hidden>
                  {' › '}
                </span>
                <span className="production-diseno-historial-banner__ref-label">
                  {n.refDiseno}
                </span>
                <span>
                  {trabajoHistorial.nombreDiseno ||
                    diseno.nombreDiseno ||
                    n.sinNombreDiseno}
                </span>
              </p>
              <p className="production-diseno-historial-banner__desc">{n.bannerDesc}</p>
            </div>
          )}

          <DisenoSection title={n.nombreTitulo} subtitle={n.nombreSub} tone="identidad">
            <label className="production-form-label" htmlFor="diseno-nombre">
              {n.nombreLabel}
            </label>
            <input
              id="diseno-nombre"
              type="text"
              className="production-form-input"
              value={diseno.nombreDiseno}
              onChange={e => onChange({ nombreDiseno: e.target.value })}
              placeholder={n.nombrePlaceholder}
              autoFocus={!detalleDesdeTrabajoAnterior}
            />
          </DisenoSection>

          <DisenoSection title={n.servicioTitulo} subtitle={n.servicioSub} tone="costo">
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
            subtitle={n.pdfSub(MAX_PDF_MB)}
            tone="archivo"
          >
            <DisenoPdfUpload
              fileName={diseno.designPdfFileName}
              maxMb={MAX_PDF_MB}
              historialSinPreview={detalleDesdeTrabajoAnterior}
              onFileNameChange={handlePdfFileNameChange}
            />
          </DisenoSection>

          {especificacionesTecnicasSection(
            detalleDesdeTrabajoAnterior,
            detalleDesdeTrabajoAnterior ? n.specsSubHistorial : undefined
          )}

          <DisenoSection
            title={n.acabadosTitulo}
            subtitle={n.acabadosSub}
            tone="acabados"
          >
            <div className="production-diseno-chips" role="group" aria-label={n.acabadosAria}>
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
            title={n.montajeTitulo}
            subtitle={n.montajeSub}
            tone="montaje"
          >
            <ProductionPrecioMontajePicker
              items={preciosMontaje}
              selectedId={diseno.precioMontajeId}
              onSelect={handlePrecioMontajeSelect}
            />
          </DisenoSection>

          <DisenoTotalesResumen diseno={diseno} />
        </section>
      )}
    </div>
  )
}

export default ProductionPreprensaDiseno
