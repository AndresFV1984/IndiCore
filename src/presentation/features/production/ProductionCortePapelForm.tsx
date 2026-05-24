import React from 'react'
import type { PaperRow } from '../../../core/domain/entities/Order'
import { TipoPapel } from '../../../core/domain/entities/TipoPapel'
import ProductionWorkspaceSection from './ProductionWorkspaceSection'
import type { ProductionWorkspaceTone } from './constants/productionWorkspaceColors'
import { CORTE_PAPEL_COPY as copy } from './constants/cortePapelCopy'
import ProductionCorteTipoPapelFields from './ProductionCorteTipoPapelFields'
import ProductionCorteResumen from './ProductionCorteResumen'

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
  cantidadHojas: number
  valorCorte: number
  onPaperRowChange: (row: PaperRow) => void
  onCantidadHojasChange: (value: number) => void
  onValorCorteChange: (value: number) => void
}

const ProductionCortePapelForm: React.FC<ProductionCortePapelFormProps> = ({
  row,
  tiposPapel,
  cantidadHojas,
  valorCorte,
  onPaperRowChange,
  onCantidadHojasChange,
  onValorCorteChange,
}) => (
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
              <label className="production-form-label" htmlFor="prod-cantidad-hojas">
                Cantidad Hojas
              </label>
              <input
                id="prod-cantidad-hojas"
                type="number"
                min={0}
                className="production-form-input"
                value={cantidadHojas || ''}
                onChange={e => onCantidadHojasChange(Number(e.target.value) || 0)}
              />
            </div>
            <div className="production-form-field">
              <label className="production-form-label" htmlFor="prod-valor-corte">
                Valor Corte
              </label>
              <input
                id="prod-valor-corte"
                type="number"
                min={0}
                className="production-form-input"
                value={valorCorte || ''}
                onChange={e => onValorCorteChange(Number(e.target.value) || 0)}
              />
            </div>
          </div>
        </CorteSection>

        <ProductionCorteResumen
          row={row}
          cantidadHojas={cantidadHojas}
          valorCorte={valorCorte}
        />
      </section>
    </div>
  </div>
)

export default ProductionCortePapelForm
