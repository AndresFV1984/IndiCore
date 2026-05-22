import React from 'react'
import { YesNoChoice } from '../../../core/domain/entities/PreprensaDiseno'
import DisenoSiNoChoice from './DisenoSiNoChoice'

interface DisenoCrearCostoPanelProps {
  incluir: YesNoChoice
  costo: number
  onIncluirChange: (value: YesNoChoice) => void
  onCostoInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onCostoKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
}

const DisenoCrearCostoPanel: React.FC<DisenoCrearCostoPanelProps> = ({
  incluir,
  costo,
  onIncluirChange,
  onCostoInputChange,
  onCostoKeyDown,
}) => (
  <div
    className={`production-diseno-cost-panel${incluir === 'si' ? ' production-diseno-cost-panel--on' : ''}`}
  >
    <div className="production-diseno-cost-panel__header">
      <div className="production-diseno-cost-panel__intro">
        <span className="production-diseno-cost-panel__icon" aria-hidden>
          $
        </span>
        <span className="production-diseno-cost-panel__copy">
          <span className="production-diseno-cost-panel__title">
            Registrar costo del diseño
          </span>
          <span className="production-diseno-cost-panel__desc">
            ¿Incluir el costo del diseño en esta orden?
          </span>
        </span>
      </div>
      <DisenoSiNoChoice
        className="production-diseno-cost-panel__sino"
        name="Incluir costo del diseño"
        value={incluir}
        onChange={onIncluirChange}
      />
    </div>

    {incluir === 'si' && (
      <div className="production-diseno-cost-panel__valor">
        <label className="production-diseno-cost-panel__label" htmlFor="diseno-costo">
          Valor (COP)
        </label>
        <div className="production-diseno-cost-input-wrap">
          <span className="production-diseno-cost-input-wrap__prefix" aria-hidden>
            $
          </span>
          <input
            id="diseno-costo"
            type="text"
            inputMode="numeric"
            className="production-diseno-cost-input-wrap__input"
            value={costo > 0 ? String(costo) : ''}
            onChange={onCostoInputChange}
            onKeyDown={onCostoKeyDown}
            placeholder="0"
            autoFocus
          />
        </div>
      </div>
    )}
  </div>
)

export default DisenoCrearCostoPanel
