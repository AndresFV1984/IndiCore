import React from 'react'
import { Client } from '../../../core/domain/entities/Client'
import ProductionClientPicker from './ProductionClientPicker'
import { ClienteDisenoOption } from './utils/buildClienteDisenos'

interface DisenoClientePickerProps {
  clientId: string
  clientName?: string
  clients: Client[]
  options: ClienteDisenoOption[]
  ordersLoading?: boolean
  selectedId: string
  onClientSelect: (client: Client | null) => void
  onSelect: (option: ClienteDisenoOption | null) => void
  onGoToClienteTab?: () => void
}

const formatTrabajoOptionLabel = (opt: ClienteDisenoOption) =>
  `${opt.workName} — ${opt.nombreDiseno || 'Sin nombre de diseño'}`

const DisenoClientePicker: React.FC<DisenoClientePickerProps> = ({
  clientId,
  clientName,
  clients,
  options,
  ordersLoading = false,
  selectedId,
  onClientSelect,
  onSelect,
  onGoToClienteTab,
}) => {
  const handleTrabajoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value
    if (!id) {
      onSelect(null)
      return
    }
    const option = options.find(o => o.sourceOrderId === id)
    if (option) onSelect(option)
  }

  if (!clientId.trim()) {
    return (
      <div className="production-diseno-cliente-picker production-diseno-cliente-picker--no-client">
        <p className="production-diseno-cliente-hint">
          Elija el cliente de esta orden para listar sus trabajos anteriores. También puede
          hacerlo en <strong>Especificaciones › Cliente</strong>.
        </p>
        <ProductionClientPicker
          clients={clients}
          selectedId={clientId}
          onSelect={onClientSelect}
        />
        {onGoToClienteTab && (
          <button
            type="button"
            className="production-diseno-cliente-picker__link-btn"
            onClick={onGoToClienteTab}
          >
            Ir a Especificaciones › Cliente
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="production-diseno-cliente-picker">
      <div className="production-diseno-cliente-picker__client-bar">
        <span className="production-diseno-cliente-picker__client-label">Cliente</span>
        <span className="production-diseno-cliente-picker__client-name">
          {clientName || clientId}
        </span>
        <button
          type="button"
          className="production-diseno-cliente-picker__change-client"
          onClick={() => onClientSelect(null)}
        >
          Cambiar
        </button>
      </div>

      {ordersLoading ? (
        <p className="production-diseno-cliente-hint">Cargando trabajos del cliente…</p>
      ) : options.length === 0 ? (
        <p className="production-diseno-cliente-hint">
          <strong>{clientName || 'Este cliente'}</strong> aún no tiene órdenes de producción
          anteriores.
        </p>
      ) : (
        <div className="production-form-field production-diseno-cliente-picker__select-field">
          <label className="production-form-label" htmlFor="diseno-cliente-trabajo-select">
            Trabajo y Diseño anterior del cliente
          </label>
          <select
            id="diseno-cliente-trabajo-select"
            className="production-form-input production-form-select production-diseno-cliente-picker__select"
            value={selectedId}
            onChange={handleTrabajoChange}
          >
            <option value="">Elegir trabajo ya realizado…</option>
            {options.map(opt => (
              <option key={opt.sourceOrderId} value={opt.sourceOrderId}>
                {formatTrabajoOptionLabel(opt)}
              </option>
            ))}
          </select>
          <p className="production-diseno-cliente-picker__count" aria-live="polite">
            {options.length} trabajo{options.length === 1 ? '' : 's'} disponibles (más reciente
            primero)
          </p>
        </div>
      )}
    </div>
  )
}

export default DisenoClientePicker
