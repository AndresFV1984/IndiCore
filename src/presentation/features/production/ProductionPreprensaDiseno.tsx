import React, { useCallback } from 'react'
import {
  DisenoColorPlanchaItem,
  PreprensaDisenoSpecs,
  YesNoChoice,
} from '../../../core/domain/entities/PreprensaDiseno'
import { Client } from '../../../core/domain/entities/Client'
import { TamanoPlancha } from '../../../core/domain/entities/TamanoPlancha'
import { PrecioMontaje } from '../../../core/domain/entities/PrecioMontaje'
import DisenoAcabadosPicker from './DisenoAcabadosPicker'
import DisenoColoresPlanchasPanel from './DisenoColoresPlanchasPanel'
import DisenoTotalesResumen from './DisenoTotalesResumen'
import { buildColoresPlanchasPatch } from './utils/coloresPlanchasUtils'
import DisenoCrearCostoPanel from './DisenoCrearCostoPanel'
import DisenoPdfUpload from './DisenoPdfUpload'
import DisenoClientePicker from './DisenoClientePicker'
import PreprensaPlanchaSuministroShell from './PreprensaPlanchaSuministroShell'
import ProductionPrecioMontajePicker from './ProductionPrecioMontajePicker'
import { ClienteDisenoOption } from './utils/buildClienteDisenos'
import { clearPreprensaHistorialSelection } from './utils/applyPreprensaFromHistorial'
import { patchPreprensaClienteSuministraPlanchas } from './utils/preprensaClienteSuministraPlanchasChange'
import ProductionWorkspaceSection from './ProductionWorkspaceSection'
import type { ProductionWorkspaceTone } from './constants/productionWorkspaceColors'
import { PREPRENSA_DISENO_COPY as copy } from './constants/preprensaDisenoCopy'

const MAX_PDF_MB = 15

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
  variant?: 'card' | 'flat'
  hideHead?: boolean
  children: React.ReactNode
}

const DisenoSection: React.FC<DisenoSectionProps> = ({
  title,
  subtitle,
  tone,
  variant = 'card',
  hideHead = false,
  children,
}) => (
  <ProductionWorkspaceSection
    tag={variant === 'card' && tone ? SECTION_TAG_LABELS[tone] : undefined}
    title={title}
    subtitle={subtitle}
    hideHead={hideHead}
    tone={variant === 'card' && tone ? SECTION_TONE[tone] : 0}
    className={variant === 'flat' ? 'production-ws-section--diseno-flat' : undefined}
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
  const showFormularioDisenoCompleto =
    diseno.designNuevo === 'si' || detalleDesdeTrabajoAnterior
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
    onChange(
      buildColoresPlanchasPatch(coloresPlanchas, {
        historialMode: detalleDesdeTrabajoAnterior,
        clienteSuministraPlanchas: diseno.clienteSuministraPlanchas,
      })
    )
  }

  const handleClienteSuministraPlanchasChange = (value: YesNoChoice) => {
    onChange(
      patchPreprensaClienteSuministraPlanchas(
        value,
        diseno.coloresPlanchas,
        detalleDesdeTrabajoAnterior
      )
    )
  }

  const costoIncluirValue: YesNoChoice = diseno.aplicaCostoDiseno ? 'si' : 'no'

  const handleCostoIncluir = (value: YesNoChoice) => {
    if (value === 'no') {
      onChange({ aplicaCostoDiseno: false, crearDisenoCost: 0 })
      return
    }
    onChange({ aplicaCostoDiseno: true })
  }

  const toggleAcabado = (
    key: 'lineaTroquel' | 'reservaUv' | 'estampado' | 'repuje'
  ) => {
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

  const especificacionesTecnicasSection = (
    historialMode: boolean,
    subtitle?: string,
    variant: 'card' | 'flat' = 'card'
  ) => (
    <DisenoSection
      title={variant === 'flat' ? undefined : n.specsTitulo}
      subtitle={variant === 'flat' ? undefined : subtitle}
      tone="especificaciones"
      variant={variant}
      hideHead={variant === 'flat'}
    >
      {isNewOrder ? (
        <PreprensaPlanchaSuministroShell
          value={diseno.clienteSuministraPlanchas ?? 'no'}
          onChange={handleClienteSuministraPlanchasChange}
        />
      ) : null}
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
          clienteSuministraPlanchas={diseno.clienteSuministraPlanchas}
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
          <DisenoSection title={copy.existente.clienteTitle} tone="trabajo">
            <DisenoClientePicker
              part="client"
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

          {clientId.trim() ? (
            <DisenoSection title={copy.existente.trabajoTitle} tone="trabajo">
              <DisenoClientePicker
                part="trabajo"
                clientId={clientId}
                clientName={clientName}
                clients={clients}
                options={disenosCliente}
                ordersLoading={ordersLoading}
                selectedId={diseno.disenoExistenteId}
                onClientSelect={onClientSelect}
                onSelect={handleClienteDisenoSelect}
              />
            </DisenoSection>
          ) : null}
        </section>
      )}

      {showFormularioDisenoCompleto && (
        <section
          className="production-diseno-detail production-diseno-detail--nuevo"
          aria-label={n.ariaNuevo}
        >
          {!detalleDesdeTrabajoAnterior ? (
            <header className="production-diseno-detail__header">
              <h3 className="production-diseno-detail__title">{n.tituloNuevo}</h3>
            </header>
          ) : null}

          <div className="production-diseno-nuevo-panels">
            <div className="production-diseno-nuevo-panel">
              <header className="production-diseno-nuevo-panel__head">
                <span className="production-diseno-nuevo-panel__step" aria-hidden>
                  1
                </span>
                <h4 className="production-diseno-nuevo-panel__title">{n.panelBasicoTitulo}</h4>
              </header>

              <div className="production-diseno-nuevo-panel__body">
              <div className="production-diseno-nuevo-field">
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
              </div>

              <DisenoSection variant="flat" hideHead>
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

              <DisenoSection title={n.pdfTitulo} variant="flat">
                <DisenoPdfUpload
                  fileName={diseno.designPdfFileName}
                  maxMb={MAX_PDF_MB}
                  historialSinPreview={detalleDesdeTrabajoAnterior}
                  onFileNameChange={handlePdfFileNameChange}
                />
              </DisenoSection>
              </div>
            </div>

            <div className="production-diseno-nuevo-panel production-diseno-nuevo-panel--focus">
              <header className="production-diseno-nuevo-panel__head">
                <span className="production-diseno-nuevo-panel__step" aria-hidden>
                  2
                </span>
                <h4 className="production-diseno-nuevo-panel__title">{n.specsTitulo}</h4>
              </header>
              <div className="production-diseno-nuevo-panel__body">
                {especificacionesTecnicasSection(
                  detalleDesdeTrabajoAnterior,
                  detalleDesdeTrabajoAnterior ? n.specsSubHistorial : undefined,
                  'flat'
                )}
              </div>
            </div>

            <div className="production-diseno-nuevo-panel production-diseno-nuevo-panel--produccion">
              <header className="production-diseno-nuevo-panel__head">
                <span className="production-diseno-nuevo-panel__step" aria-hidden>
                  3
                </span>
                <h4 className="production-diseno-nuevo-panel__title">{n.panelProduccionTitulo}</h4>
              </header>

              <div className="production-diseno-produccion-layout">
                <section
                  className="production-diseno-produccion-block production-diseno-produccion-block--acabados"
                  aria-labelledby="diseno-produccion-acabados-title"
                >
                  <header className="production-diseno-produccion-block__head">
                    <h5
                      id="diseno-produccion-acabados-title"
                      className="production-diseno-produccion-block__title"
                    >
                      {n.acabadosTitulo}
                    </h5>
                    <p className="production-diseno-produccion-block__sub">{n.acabadosSubtitle}</p>
                  </header>
                  <DisenoAcabadosPicker
                    values={{
                      lineaTroquel: diseno.lineaTroquel,
                      reservaUv: diseno.reservaUv,
                      estampado: diseno.estampado,
                      repuje: diseno.repuje,
                    }}
                    onToggle={toggleAcabado}
                    ariaLabel={n.acabadosAria}
                  />
                </section>

                <section
                  className="production-diseno-produccion-block production-diseno-produccion-block--montaje"
                  aria-labelledby="diseno-produccion-montaje-title"
                >
                  <header className="production-diseno-produccion-block__head">
                    <h5
                      id="diseno-produccion-montaje-title"
                      className="production-diseno-produccion-block__title"
                    >
                      {n.montajeTitulo}
                    </h5>
                  </header>
                  <ProductionPrecioMontajePicker
                    items={preciosMontaje}
                    selectedId={diseno.precioMontajeId}
                    onSelect={handlePrecioMontajeSelect}
                  />
                </section>
              </div>
            </div>

            <DisenoTotalesResumen diseno={diseno} />
          </div>
        </section>
      )}
    </div>
  )
}

export default ProductionPreprensaDiseno
