import React from 'react'
import { Client } from '../../../core/domain/entities/Client'
import ProductionClientPicker from './ProductionClientPicker'
import { ClienteDisenoOption } from './utils/buildClienteDisenos'

export type DisenoClientePickerPart = 'client' | 'trabajo'

interface DisenoClientePickerProps {
  part: DisenoClientePickerPart
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
  part,
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

  if (part === 'client') {
    if (!clientId.trim()) {
      return (
        <div className="production-diseno-cliente-picker production-diseno-cliente-picker--no-client">
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
              Ir a Cliente
            </button>
          )}
        </div>
      )
    }

    return (
      <div className="production-diseno-cliente-picker production-diseno-cliente-picker--client-only">
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
      </div>
    )
  }

  if (ordersLoading) {
    return <p className="production-diseno-cliente-hint">Cargando trabajos…</p>
  }

  if (options.length === 0) {
    return (
      <p className="production-diseno-cliente-hint">
        Sin trabajos anteriores para este cliente.
      </p>
    )
  }

  return (
    <div className="production-diseno-cliente-picker production-diseno-cliente-picker--trabajo-only">
      <div className="production-form-field production-diseno-cliente-picker__select-field">
        <select
          id="diseno-cliente-trabajo-select"
          className="production-form-input production-form-select production-diseno-cliente-picker__select"
          value={selectedId}
          onChange={handleTrabajoChange}
          aria-label="Trabajo y diseño anterior del cliente"
        >
          <option value="">Elegir trabajo…</option>
          {options.map(opt => (
            <option key={opt.sourceOrderId} value={opt.sourceOrderId}>
              {formatTrabajoOptionLabel(opt)}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

export default DisenoClientePicker
