import React, { useEffect, useMemo } from 'react'
import type { PaperRow } from '../../../core/domain/entities/Order'
import type { DisenoColorPlanchaItem } from '../../../core/domain/entities/PreprensaDiseno'
import { TipoPapel } from '../../../core/domain/entities/TipoPapel'
import ProductionWorkspaceSection from './ProductionWorkspaceSection'
import type { ProductionWorkspaceTone } from './constants/productionWorkspaceColors'
import { CORTE_PAPEL_COPY as copy } from './constants/cortePapelCopy'
import ProductionCorteTipoPapelFields from './ProductionCorteTipoPapelFields'
import ProductionCorteResumen from './ProductionCorteResumen'
import { formatValorHojaDisplay, syncPaperRowWithTipoPapelCatalog } from './utils/tipoPapelDisplay'
import {
  computeCortePapelValores,
  parseMargenRedondeoInput,
} from './utils/cortePapelCalculations'

type CorteSectionTone = 'papel' | 'valores'

const SECTION_TONE: Record<CorteSectionTone, ProductionWorkspaceTone> = {
  papel: 1,
  valores: 2,
}

interface CorteSectionProps {
  tone: CorteSectionTone
  title: string
  subtitle: string
  tag: string
  children: React.ReactNode
}

const CorteSection: React.FC<CorteSectionProps> = ({ tone, title, subtitle, tag, children }) => (
  <ProductionWorkspaceSection
    tag={tag}
    title={title}
    subtitle={subtitle}
    tone={SECTION_TONE[tone]}
  >
    {children}
  </ProductionWorkspaceSection>
)

interface ProductionCortePapelFormProps {
  row: PaperRow
  tiposPapel: TipoPapel[]
  coloresPlanchas: DisenoColorPlanchaItem[]
  margenRedondeo: number
  loadingTiposPapel?: boolean
  onPaperRowChange: (row: PaperRow) => void
  onMargenRedondeoChange: (value: number) => void
  onCorteMetricsChange: (metrics: { cantidadHojas: number; valorCorte: number }) => void
}

const ProductionCortePapelForm: React.FC<ProductionCortePapelFormProps> = ({
  row,
  tiposPapel,
  coloresPlanchas,
  margenRedondeo,
  loadingTiposPapel = false,
  onPaperRowChange,
  onMargenRedondeoChange,
  onCorteMetricsChange,
}) => {
  const selectedTipo = useMemo(
    () => (row.tipoPapelId ? tiposPapel.find(t => t.id === row.tipoPapelId) ?? null : null),
    [row.tipoPapelId, tiposPapel]
  )

  useEffect(() => {
    if (!row.tipoPapelId || tiposPapel.length === 0) return
    const synced = syncPaperRowWithTipoPapelCatalog(row, tiposPapel)
    const syncedValor = synced.valorCorteUnitario ?? synced.despiece?.valorCorte ?? 0
    const rowValor = row.valorCorteUnitario ?? row.despiece?.valorCorte ?? 0
    if (syncedValor === rowValor && synced.despiece?.valorCorte === row.despiece?.valorCorte) {
      return
    }
    onPaperRowChange(synced)
  }, [row, tiposPapel, onPaperRowChange])

  const valores = useMemo(
    () =>
      computeCortePapelValores({
        coloresPlanchas,
        row,
        tipoPapel: selectedTipo,
        margenRedondeo,
      }),
    [coloresPlanchas, row, selectedTipo, margenRedondeo]
  )

  useEffect(() => {
    onCorteMetricsChange({
      cantidadHojas: valores.cantidadHojas,
      valorCorte: valores.valorCorte,
    })
  }, [valores.cantidadHojas, valores.valorCorte, onCorteMetricsChange])

  const cantidadHojasEmpty =
    valores.cantidadHojas <= 0
      ? !row.despiece?.piezasPorPliego
        ? copy.sections.cantidadHojas.emptySinDespiece
        : coloresPlanchas.length === 0
          ? copy.sections.cantidadHojas.emptySinPreprensa
          : copy.sections.cantidadHojas.empty
      : null

  const valorCorteEmpty = !row.tipoPapelId
    ? copy.sections.valorCorte.emptySinTipo
    : valores.valorCorteUnitario <= 0
      ? copy.sections.valorCorte.emptySinValorUnitario
      : valores.unidadEmpaqueCantidad <= 0
        ? copy.sections.valorCorte.emptySinUnidad
        : valores.cantidadHojas <= 0
          ? copy.sections.valorCorte.emptySinHojas
          : null

  return (
    <div className="production-preprensa-diseno-detail">
      <p className="production-workspace-panel-desc production-preprensa-diseno-desc">
        {copy.panelDesc}
      </p>

      <div className="production-diseno-form">
        <section
          className="production-diseno-detail production-diseno-detail--nuevo"
          aria-label={copy.detailAria}
        >
          <header className="production-diseno-detail__header">
            <h3 className="production-diseno-detail__title">{copy.titulo}</h3>
            <p className="production-diseno-detail__lead">{copy.lead}</p>
          </header>

          <CorteSection
            tone="papel"
            tag={copy.sectionTags.papel}
            title={copy.sections.papel.title}
            subtitle={copy.sections.papel.subtitle}
          >
            <ProductionCorteTipoPapelFields
              embedded
              row={row}
              tiposPapel={tiposPapel}
              loadingTiposPapel={loadingTiposPapel}
              onChange={onPaperRowChange}
            />
          </CorteSection>

          <CorteSection
            tone="valores"
            tag={copy.sectionTags.valores}
            title={copy.sections.valores.title}
            subtitle={copy.sections.valores.subtitle}
          >
            <div className="production-corte-valores-fields">
              <div className="production-form-field">
                <label className="production-form-label" htmlFor="prod-unidad-empaque">
                  Unidad empaque
                </label>
                <input
                  id="prod-unidad-empaque"
                  type="text"
                  inputMode="numeric"
                  className="production-form-input production-form-input--readonly"
                  value={
                    valores.unidadEmpaqueCantidad > 0
                      ? valores.unidadEmpaqueCantidad.toLocaleString('es-CO')
                      : copy.sections.unidadEmpaque.empty
                  }
                  readOnly
                  tabIndex={-1}
                />
                {valores.unidadEmpaqueCantidad > 0 ? (
                  <span className="production-plancha-draft__field-hint">
                    {copy.sections.unidadEmpaque.hintCantidad}
                  </span>
                ) : null}
              </div>

              <div className="production-form-field">
                <label className="production-form-label" htmlFor="prod-valor-corte-unitario">
                  Valor corte (seleccionado)
                </label>
                <input
                  id="prod-valor-corte-unitario"
                  type="text"
                  className="production-form-input production-form-input--readonly"
                  value={
                    valores.valorCorteUnitario > 0
                      ? formatValorHojaDisplay(valores.valorCorteUnitario)
                      : copy.sections.valorCorteUnitario.empty
                  }
                  readOnly
                  tabIndex={-1}
                />
              </div>

              <div className="production-form-field">
                <label className="production-form-label" htmlFor="prod-cantidad-hojas">
                  {copy.sections.cantidadHojas.label}
                </label>
                <input
                  id="prod-cantidad-hojas"
                  type="text"
                  inputMode="numeric"
                  className="production-form-input production-form-input--readonly"
                  value={
                    cantidadHojasEmpty ??
                    valores.cantidadHojas.toLocaleString('es-CO')
                  }
                  readOnly
                  tabIndex={-1}
                  aria-label={copy.sections.cantidadHojas.label}
                />
                <span className="production-plancha-draft__field-hint">
                  {copy.sections.cantidadHojas.hint}
                </span>
              </div>

              <div className="production-form-field">
                <label className="production-form-label" htmlFor="prod-margen-redondeo">
                  {copy.sections.margenRedondeo.label}
                </label>
                <input
                  id="prod-margen-redondeo"
                  type="number"
                  min={0}
                  step={1}
                  className="production-form-input"
                  value={margenRedondeo}
                  onChange={e =>
                    onMargenRedondeoChange(parseMargenRedondeoInput(e.target.value))
                  }
                  aria-label={copy.sections.margenRedondeo.label}
                />
                <span className="production-plancha-draft__field-hint">
                  {copy.sections.margenRedondeo.hint}
                </span>
              </div>

              <div className="production-form-field">
                <label className="production-form-label" htmlFor="prod-valor-corte">
                  {copy.sections.valorCorte.label}
                </label>
                <input
                  id="prod-valor-corte"
                  type="text"
                  className="production-form-input production-form-input--readonly"
                  value={
                    valorCorteEmpty ??
                    (valores.valorCorte > 0
                      ? formatValorHojaDisplay(valores.valorCorte)
                      : '$ 0')
                  }
                  readOnly
                  tabIndex={-1}
                  aria-label={copy.sections.valorCorte.label}
                />
                <span className="production-plancha-draft__field-hint">
                  {valores.unidadEmpaqueCantidad > 0 && valores.cantidadHojas > 0
                    ? `${copy.sections.valorCorte.hint} ${copy.sections.valorCorte.hintCociente.replace(
                        '{cociente}',
                        valores.cocienteHojasPorEmpaque.toLocaleString('es-CO', {
                          maximumFractionDigits: 4,
                        })
                      )}`
                    : copy.sections.valorCorte.hint}
                </span>
              </div>
            </div>
          </CorteSection>

          <ProductionCorteResumen
            row={row}
            cantidadHojas={valores.cantidadHojas}
            valorPapel={valores.valorPapel}
            valorCorte={valores.valorCorte}
          />
        </section>
      </div>
    </div>
  )
}

export default ProductionCortePapelForm
