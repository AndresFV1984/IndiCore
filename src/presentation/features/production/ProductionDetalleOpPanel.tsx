import React, { useMemo } from 'react'
import type { Vendedor } from '../../../core/domain/entities/Vendedor'
import ProductionWorkspaceSection from './ProductionWorkspaceSection'
import ProductionVendedorPicker from './ProductionVendedorPicker'
import { DETALLE_OP_COPY as copy } from './constants/detalleOpCopy'

interface ProductionDetalleOpPanelProps {
  workName: string
  onWorkNameChange: (value: string) => void
  quantity: number
  onQuantityChange: (value: number) => void
  onQuantityPaste: (text: string) => void
  onQuantityKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
  vendedores: Vendedor[]
  vendedorId: string
  onVendedorSelect: (vendedor: Vendedor | null) => void
}

const ProductionDetalleOpPanel: React.FC<ProductionDetalleOpPanelProps> = ({
  workName,
  onWorkNameChange,
  quantity,
  onQuantityChange,
  onQuantityPaste,
  onQuantityKeyDown,
  vendedores,
  vendedorId,
  onVendedorSelect,
}) => {
  const progress = useMemo(
    () => [
      { id: 'trabajo', label: copy.progress.trabajo, done: workName.trim().length > 0 },
      { id: 'cantidad', label: copy.progress.cantidad, done: quantity > 0 },
      { id: 'vendedor', label: copy.progress.vendedor, done: Boolean(vendedorId) },
    ],
    [workName, quantity, vendedorId]
  )

  const completedCount = progress.filter(item => item.done).length

  return (
    <div className="production-detalle-op">
      <header className="production-detalle-op__hero">
        <p className="production-detalle-op__intro">{copy.intro}</p>
        <div className="production-detalle-op__progress" aria-label="Progreso del detalle OP">
          <div className="production-detalle-op__progress-track" aria-hidden>
            <span
              className="production-detalle-op__progress-fill"
              style={{ width: `${(completedCount / progress.length) * 100}%` }}
            />
          </div>
          <ul className="production-detalle-op__progress-list">
            {progress.map(item => (
              <li
                key={item.id}
                className={[
                  'production-detalle-op__progress-pill',
                  item.done ? 'production-detalle-op__progress-pill--done' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <span className="production-detalle-op__progress-pill-icon" aria-hidden>
                  {item.done ? '✓' : '○'}
                </span>
                {item.label}
              </li>
            ))}
          </ul>
        </div>
      </header>

      <div className="production-ws-sections-stack">
        <ProductionWorkspaceSection
          tag={copy.trabajo.tag}
          title={copy.trabajo.title}
          subtitle={copy.trabajo.subtitle}
          tone={0}
          className="production-detalle-op__section"
        >
          <div className="production-detalle-op__fields">
            <div className="production-detalle-op__field-card production-detalle-op__field-card--work">
              <label className="production-detalle-op__field-label" htmlFor="prod-work">
                <span className="production-detalle-op__field-icon" aria-hidden>
                  <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
                    <path
                      d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                {copy.trabajo.workLabel}
              </label>
              <input
                id="prod-work"
                className="production-detalle-op__input"
                value={workName}
                onChange={e => onWorkNameChange(e.target.value)}
                placeholder={copy.trabajo.workPlaceholder}
              />
              <span className="production-detalle-op__field-hint">{copy.trabajo.workHint}</span>
            </div>

            <div className="production-detalle-op__field-card production-detalle-op__field-card--qty">
              <label className="production-detalle-op__field-label" htmlFor="prod-qty">
                <span className="production-detalle-op__field-icon" aria-hidden>
                  <svg viewBox="0 0 24 24" fill="none" width="18" height="18">
                    <path
                      d="M20 7H4M20 12H4M20 17H4"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                    />
                    <path
                      d="M8 7v10M16 7v10"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                {copy.trabajo.qtyLabel}
              </label>
              <div className="production-detalle-op__qty-wrap">
                <input
                  id="prod-qty"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="production-detalle-op__input production-detalle-op__input--qty"
                  value={quantity > 0 ? String(quantity) : ''}
                  onChange={e => onQuantityChange(Number(e.target.value.replace(/\D/g, '') || 0))}
                  onKeyDown={onQuantityKeyDown}
                  onPaste={e => {
                    e.preventDefault()
                    onQuantityPaste(e.clipboardData.getData('text'))
                  }}
                  placeholder={copy.trabajo.qtyPlaceholder}
                  aria-label="Cantidad numérica"
                />
                <span className="production-detalle-op__qty-unit">{copy.trabajo.qtyUnit}</span>
              </div>
              <span className="production-detalle-op__field-hint">{copy.trabajo.qtyHint}</span>
            </div>
          </div>
        </ProductionWorkspaceSection>

        <ProductionWorkspaceSection
          tag={copy.vendedor.tag}
          title={copy.vendedor.title}
          subtitle={copy.vendedor.subtitle}
          tone={0}
          className={[
            'production-detalle-op__section',
            'production-detalle-op__section--vendedor',
            vendedorId ? 'production-detalle-op__section--vendedor-filled' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <ProductionVendedorPicker
            vendedores={vendedores}
            selectedId={vendedorId}
            onSelect={onVendedorSelect}
          />
        </ProductionWorkspaceSection>
      </div>
    </div>
  )
}

export default ProductionDetalleOpPanel
