import React, { useMemo, useState } from 'react'
import clsx from 'clsx'
import type { CobroDescuentoModo, OrderSpecs } from '../../../core/domain/entities/Order'
import type { TipoPapel } from '../../../core/domain/entities/TipoPapel'
import { ProductionSubNavIcon } from './ProductionSubNav'
import { PRODUCTION_COBRO_COPY as copy } from './constants/productionCobroCopy'
import {
  buildProductionOrderCobroResumen,
  type ProductionOrderCobroSection,
  type ProductionOrderCobroSectionId,
} from './utils/productionOrderCobroResumen'
import { normalizeMargenRedondeo } from './utils/cortePapelCalculations'
import { normalizePreprensaSnapshot } from './utils/applyPreprensaFromHistorial'
import { computeCobroDescuento } from './utils/cobroDescuentoUtils'

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

const formatValor = (value: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(Math.max(0, value))

const SECTION_ICON_ID: Record<ProductionOrderCobroSectionId, string> = {
  preprensa: 'diseno',
  'corte-papel': 'corte',
  impresion: 'tintas',
  terminados: 'asignacion',
  acabados: 'acabado',
}

interface ProductionOrderCobroPanelProps {
  clientName: string
  workName: string
  quantity: number
  specs: OrderSpecs
  tiposPapel: TipoPapel[]
  cobroDescuentoModo: CobroDescuentoModo
  cobroDescuentoValor: number
  onCobroDescuentoChange: (patch: {
    cobroDescuentoModo?: CobroDescuentoModo
    cobroDescuentoValor?: number
  }) => void
}

const scrollToSection = (sectionId: ProductionOrderCobroSectionId) => {
  document
    .getElementById(`production-cobro-breakdown-${sectionId}`)
    ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
}

const CobroMetaCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="production-order-cobro-meta-card">
    <span className="production-order-cobro-meta-card__label">{label}</span>
    <strong className="production-order-cobro-meta-card__value" title={value}>
      {value}
    </strong>
  </div>
)

const CobroStageCard: React.FC<{
  section: ProductionOrderCobroSection
  active: boolean
  onSelect: () => void
}> = ({ section, active, onSelect }) => {
  const hasCharges = section.subtotal > 0

  return (
    <button
      type="button"
      className={clsx(
        'production-order-cobro-stage-card',
        hasCharges && 'production-order-cobro-stage-card--active',
        active && 'production-order-cobro-stage-card--selected'
      )}
      onClick={onSelect}
      aria-pressed={active}
    >
      <span className="production-order-cobro-stage-card__icon" aria-hidden>
        <ProductionSubNavIcon id={SECTION_ICON_ID[section.id]} />
      </span>
      <span className="production-order-cobro-stage-card__body">
        <span className="production-order-cobro-stage-card__title">{section.title}</span>
        <span className="production-order-cobro-stage-card__meta">
          {hasCharges
            ? copy.overview.conceptos(section.lines.length)
            : copy.overview.sinCargos}
        </span>
      </span>
      <strong className="production-order-cobro-stage-card__amount">
        {hasCharges ? formatValor(section.subtotal) : copy.overview.sinCargos}
      </strong>
    </button>
  )
}

const CobroBreakdownSection: React.FC<{ section: ProductionOrderCobroSection }> = ({ section }) => {
  const hasCharges = section.subtotal > 0

  return (
    <section
      id={`production-cobro-breakdown-${section.id}`}
      className={clsx(
        'production-order-cobro-breakdown-section',
        hasCharges && 'production-order-cobro-breakdown-section--active'
      )}
      aria-labelledby={`production-cobro-breakdown-title-${section.id}`}
    >
      <header className="production-order-cobro-breakdown-section__head">
        <div className="production-order-cobro-breakdown-section__title-wrap">
          <span className="production-order-cobro-breakdown-section__icon" aria-hidden>
            <ProductionSubNavIcon id={SECTION_ICON_ID[section.id]} />
          </span>
          <div>
            <h4
              className="production-order-cobro-breakdown-section__title"
              id={`production-cobro-breakdown-title-${section.id}`}
            >
              {section.title}
            </h4>
            <p className="production-order-cobro-breakdown-section__meta">
              {hasCharges
                ? copy.overview.conceptos(section.lines.length)
                : copy.breakdown.emptySection}
            </p>
          </div>
        </div>
        <span className="production-order-cobro-breakdown-section__subtotal">
          {hasCharges ? formatValor(section.subtotal) : copy.overview.sinCargos}
        </span>
      </header>

      {hasCharges ? (
        <div className="production-order-cobro-breakdown-section__table-wrap">
          <table className="production-order-cobro-breakdown-section__table">
            <thead>
              <tr>
                <th scope="col">{copy.breakdown.columnConcepto}</th>
                <th scope="col">{copy.breakdown.columnValor}</th>
              </tr>
            </thead>
            <tbody>
              {section.lines.map(line => (
                <tr key={line.key}>
                  <td>{line.label}</td>
                  <td>{formatValor(line.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="production-order-cobro-breakdown-section__empty">{copy.breakdown.emptySection}</p>
      )}
    </section>
  )
}

const CobroDescuentoSection: React.FC<{
  modo: CobroDescuentoModo
  valor: number
  descuentoAplicado: number
  onModoChange: (modo: CobroDescuentoModo) => void
  onValorChange: (valor: number) => void
}> = ({ modo, valor, descuentoAplicado, onModoChange, onValorChange }) => {
  const discountCopy = copy.discount
  const inputLabel =
    modo === 'porcentaje' ? discountCopy.inputPorcentajeLabel : discountCopy.inputValorLabel
  const inputPlaceholder =
    modo === 'porcentaje'
      ? discountCopy.inputPorcentajePlaceholder
      : discountCopy.inputValorPlaceholder

  return (
    <section
      className="production-order-cobro-discount"
      aria-labelledby="production-cobro-discount-title"
    >
      <header className="production-order-cobro-discount__head">
        <h5 className="production-order-cobro-discount__title" id="production-cobro-discount-title">
          {discountCopy.title}
        </h5>
        <p className="production-order-cobro-discount__hint">{discountCopy.hint}</p>
      </header>

      <div
        className="production-order-cobro-discount__modes"
        role="radiogroup"
        aria-label={discountCopy.ariaModo}
      >
        <button
          type="button"
          role="radio"
          aria-checked={modo === 'porcentaje'}
          className={clsx(
            'production-order-cobro-discount__mode',
            modo === 'porcentaje' && 'production-order-cobro-discount__mode--active'
          )}
          onClick={() => onModoChange('porcentaje')}
        >
          {discountCopy.modoPorcentaje}
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={modo === 'valor'}
          className={clsx(
            'production-order-cobro-discount__mode',
            modo === 'valor' && 'production-order-cobro-discount__mode--active'
          )}
          onClick={() => onModoChange('valor')}
        >
          {discountCopy.modoValor}
        </button>
      </div>

      <label className="production-order-cobro-discount__field">
        <span className="production-order-cobro-discount__field-label">{inputLabel}</span>
        <input
          type="text"
          inputMode="numeric"
          className="production-form-input production-order-cobro-discount__input"
          value={valor > 0 ? String(valor) : ''}
          placeholder={inputPlaceholder}
          onChange={e => onValorChange(parseDigits(e.target.value))}
          onKeyDown={blockNonDigitKey}
          onPaste={e => {
            e.preventDefault()
            onValorChange(parseDigits(e.clipboardData.getData('text')))
          }}
        />
      </label>

      <p className="production-order-cobro-discount__applied" aria-live="polite">
        <span>{discountCopy.aplicado}</span>
        <strong>
          {descuentoAplicado > 0
            ? `−${formatValor(descuentoAplicado)}`
            : discountCopy.sinDescuento}
        </strong>
      </p>
    </section>
  )
}

const ProductionOrderCobroPanel: React.FC<ProductionOrderCobroPanelProps> = ({
  clientName,
  workName,
  quantity,
  specs,
  tiposPapel,
  cobroDescuentoModo,
  cobroDescuentoValor,
  onCobroDescuentoChange,
}) => {
  const [selectedSectionId, setSelectedSectionId] = useState<ProductionOrderCobroSectionId | null>(
    null
  )

  const preprensaDiseno = useMemo(
    () => normalizePreprensaSnapshot(specs.preprensaDiseno),
    [specs.preprensaDiseno]
  )

  const cobro = useMemo(
    () =>
      buildProductionOrderCobroResumen({
        preprensaDiseno,
        coloresPlanchas: preprensaDiseno.coloresPlanchas,
        paperRows: specs.paperRows,
        tiposPapel,
        margenRedondeo: normalizeMargenRedondeo(specs.margenRedondeo),
        clienteSuministraPapel: specs.clienteSuministraPapel ?? 'no',
        impresionTintasRegistros: specs.impresionTintasRegistros ?? [],
        terminadosRegistros: specs.terminadosRegistros ?? [],
        acabadosRegistros: specs.acabadosRegistros ?? [],
      }),
    [
      preprensaDiseno,
      specs.paperRows,
      specs.margenRedondeo,
      specs.clienteSuministraPapel,
      specs.impresionTintasRegistros,
      specs.terminadosRegistros,
      specs.acabadosRegistros,
      tiposPapel,
    ]
  )

  const activeSections = useMemo(
    () => cobro.sections.filter(section => section.subtotal > 0),
    [cobro.sections]
  )

  const totalConceptos = useMemo(
    () => cobro.sections.reduce((acc, section) => acc + section.lines.length, 0),
    [cobro.sections]
  )

  const descuento = useMemo(
    () =>
      computeCobroDescuento({
        modo: cobroDescuentoModo,
        valor: cobroDescuentoValor,
        subtotal: cobro.grandTotal,
      }),
    [cobroDescuentoModo, cobroDescuentoValor, cobro.grandTotal]
  )

  const cantidadLabel =
    quantity > 0 ? quantity.toLocaleString('es-CO') : copy.header.sinCantidad

  const handleStageSelect = (sectionId: ProductionOrderCobroSectionId) => {
    setSelectedSectionId(current => (current === sectionId ? null : sectionId))
    scrollToSection(sectionId)
  }

  return (
    <div className="production-order-cobro-panel">
      <p className="production-workspace-panel-desc">{copy.panelDesc}</p>

      <div className="production-order-cobro-layout">
        <div className="production-order-cobro-main">
          <article className="production-order-cobro-doc" aria-label={copy.title}>
            <header className="production-order-cobro-doc__head">
              <div className="production-order-cobro-doc__identity">
                <span className="production-order-cobro-doc__eyebrow">{copy.title}</span>
                <h3 className="production-order-cobro-doc__title">
                  {workName.trim() || copy.header.sinTrabajo}
                </h3>
                <p className="production-order-cobro-doc__subtitle">{copy.subtitle}</p>
              </div>
              <span
                className={clsx(
                  'production-order-cobro-doc__status',
                  cobro.hasCharges
                    ? 'production-order-cobro-doc__status--ready'
                    : 'production-order-cobro-doc__status--pending'
                )}
              >
                {cobro.hasCharges ? copy.status.ready : copy.status.pending}
              </span>
            </header>

            <div className="production-order-cobro-doc__meta-grid">
              <CobroMetaCard
                label={copy.header.cliente}
                value={clientName.trim() || copy.header.sinCliente}
              />
              <CobroMetaCard
                label={copy.header.trabajo}
                value={workName.trim() || copy.header.sinTrabajo}
              />
              <CobroMetaCard label={copy.header.cantidad} value={cantidadLabel} />
            </div>
          </article>

          <section className="production-order-cobro-overview" aria-labelledby="production-cobro-overview-title">
            <div className="production-order-cobro-overview__head">
              <h4 className="production-order-cobro-overview__title" id="production-cobro-overview-title">
                {copy.overview.title}
              </h4>
              <p className="production-order-cobro-overview__hint">{copy.overview.hint}</p>
            </div>
            <div className="production-order-cobro-overview__grid">
              {cobro.sections.map(section => (
                <CobroStageCard
                  key={section.id}
                  section={section}
                  active={selectedSectionId === section.id}
                  onSelect={() => handleStageSelect(section.id)}
                />
              ))}
            </div>
          </section>

          {!cobro.hasCharges ? (
            <div className="production-order-cobro-empty">
              <strong>{copy.emptyInvoice}</strong>
              <span>{copy.emptyInvoiceHint}</span>
              <div className="production-order-cobro-empty__checklist">
                <span className="production-order-cobro-empty__checklist-title">
                  {copy.emptyChecklistTitle}
                </span>
                <ul className="production-order-cobro-empty__checklist-list">
                  {cobro.sections.map(section => (
                    <li
                      key={section.id}
                      className={clsx(
                        'production-order-cobro-empty__checklist-item',
                        section.subtotal > 0 && 'production-order-cobro-empty__checklist-item--done'
                      )}
                    >
                      <span className="production-order-cobro-empty__checklist-icon" aria-hidden>
                        <ProductionSubNavIcon id={SECTION_ICON_ID[section.id]} />
                      </span>
                      <span>{section.title}</span>
                      <span className="production-order-cobro-empty__checklist-state">
                        {section.subtotal > 0
                          ? formatValor(section.subtotal)
                          : copy.overview.sinCargos}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <section
              className="production-order-cobro-breakdown"
              aria-labelledby="production-cobro-breakdown-title"
            >
              <div className="production-order-cobro-breakdown__head">
                <div>
                  <h4 className="production-order-cobro-breakdown__title" id="production-cobro-breakdown-title">
                    {copy.breakdown.title}
                  </h4>
                  <p className="production-order-cobro-breakdown__hint">
                    {selectedSectionId
                      ? copy.breakdown.filtrando(
                          cobro.sections.find(section => section.id === selectedSectionId)?.title ??
                            ''
                        )
                      : copy.breakdown.hint}
                  </p>
                </div>
                {selectedSectionId ? (
                  <button
                    type="button"
                    className="production-order-cobro-breakdown__clear-filter"
                    onClick={() => setSelectedSectionId(null)}
                  >
                    {copy.breakdown.verTodas}
                  </button>
                ) : null}
              </div>
              <div className="production-order-cobro-breakdown__sections">
                {(selectedSectionId
                  ? cobro.sections.filter(section => section.id === selectedSectionId)
                  : activeSections.length > 0
                    ? activeSections
                    : cobro.sections
                ).map(section => (
                  <CobroBreakdownSection key={section.id} section={section} />
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="production-order-cobro-aside" aria-labelledby="production-cobro-summary-title">
          <div className="production-order-cobro-summary">
            <header className="production-order-cobro-summary__head">
              <h4 className="production-order-cobro-summary__title" id="production-cobro-summary-title">
                {copy.summary.title}
              </h4>
              <p className="production-order-cobro-summary__hint">{copy.summary.hint}</p>
            </header>

            <div className="production-order-cobro-summary__stats">
              <span>{copy.summary.etapasActivas(activeSections.length, cobro.sections.length)}</span>
              <span>{copy.summary.conceptosTotales(totalConceptos)}</span>
            </div>

            <ul className="production-order-cobro-summary__lines">
              {cobro.sections.map(section => (
                <li
                  key={section.id}
                  className={clsx(
                    'production-order-cobro-summary__line',
                    section.subtotal <= 0 && 'production-order-cobro-summary__line--inactive'
                  )}
                >
                  <span>{section.title}</span>
                  <strong>
                    {section.subtotal > 0 ? formatValor(section.subtotal) : copy.overview.sinCargos}
                  </strong>
                </li>
              ))}
            </ul>

            <CobroDescuentoSection
              modo={cobroDescuentoModo}
              valor={cobroDescuentoValor}
              descuentoAplicado={descuento.descuentoAplicado}
              onModoChange={modo => onCobroDescuentoChange({ cobroDescuentoModo: modo })}
              onValorChange={valor =>
                onCobroDescuentoChange({
                  cobroDescuentoValor:
                    cobroDescuentoModo === 'porcentaje' ? Math.min(100, valor) : valor,
                })
              }
            />

            <div className="production-order-cobro-summary__total" aria-live="polite">
              <span className="production-order-cobro-summary__total-label">{copy.grandTotal}</span>
              <strong className="production-order-cobro-summary__total-value">
                {formatValor(cobro.grandTotal)}
              </strong>
            </div>

            <div
              className={clsx(
                'production-order-cobro-summary__total',
                'production-order-cobro-summary__total--discounted',
                descuento.hasDescuento && 'production-order-cobro-summary__total--discounted-active'
              )}
              aria-live="polite"
            >
              <span className="production-order-cobro-summary__total-label">
                {copy.discount.totalConDescuento}
              </span>
              <strong className="production-order-cobro-summary__total-value">
                {formatValor(descuento.totalConDescuento)}
              </strong>
            </div>

            <p className="production-order-cobro-summary__footer-hint">{copy.summary.generarHint}</p>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default ProductionOrderCobroPanel
