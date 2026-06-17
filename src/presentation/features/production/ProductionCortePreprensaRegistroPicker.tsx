import React, { useMemo } from 'react'
import type { DisenoColorPlanchaItem } from '../../../core/domain/entities/PreprensaDiseno'
import { CORTE_PAPEL_COPY as copy } from './constants/cortePapelCopy'
import { formatColoresPlanchaRegistroSelectLabel } from './utils/paperRowsSync'

export interface CorteRegistroPickerOption {
  id: string
  label: string
  completo: boolean
  esFaltanteLitografia?: boolean
}

interface ProductionCortePreprensaRegistroPickerProps {
  coloresPlanchas: DisenoColorPlanchaItem[]
  selectedId: string
  processedIds: ReadonlySet<string>
  extraOptions?: CorteRegistroPickerOption[]
  onChange: (colorPlanchaId: string) => void
}

const ProductionCortePreprensaRegistroPicker: React.FC<
  ProductionCortePreprensaRegistroPickerProps
> = ({ coloresPlanchas, selectedId, processedIds, extraOptions = [], onChange }) => {
  const registro = copy.registroPreprensa
  const options = useMemo(() => {
    const preprensa = coloresPlanchas.map(item => {
      const completo = processedIds.has(item.id)
      return {
        id: item.id,
        label: formatColoresPlanchaRegistroSelectLabel(item),
        completo,
        esFaltanteLitografia: false as const,
      }
    })
    return [...preprensa, ...extraOptions]
  }, [coloresPlanchas, processedIds, extraOptions])

  const preprensaOptions = options.filter(opt => !opt.esFaltanteLitografia)
  const faltanteOptions = options.filter(opt => opt.esFaltanteLitografia)

  const selectedOption = options.find(opt => opt.id === selectedId)
  const selectedCompleto = Boolean(selectedOption?.completo)
  const completadosCount = options.filter(opt => opt.completo).length

  return (
    <div
      className="production-diseno-modo-shell production-corte-registro-shell"
      role="region"
      aria-label={registro.ariaLabel}
    >
      <header className="production-diseno-modo-shell__head">
        <span className="production-diseno-modo-shell__tag">{registro.tag}</span>
        <div className="production-diseno-modo-shell__titles">
          <h3 className="production-diseno-modo-shell__title">{registro.title}</h3>
          <p className="production-diseno-modo-shell__sub">{registro.subtitle}</p>
        </div>
      </header>

      {coloresPlanchas.length === 0 ? (
        <p className="production-diseno-cliente-hint production-corte-registro-picker__empty">
          {registro.emptySinRegistros}
        </p>
      ) : (
        <div className="production-corte-registro-picker">
          <label className="production-form-label" htmlFor="prod-corte-registro-preprensa">
            {registro.label}
          </label>
          <div
            className={[
              'production-corte-registro-picker__select-wrap',
              selectedCompleto ? 'production-corte-registro-picker__select-wrap--completo' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <select
              id="prod-corte-registro-preprensa"
              className={[
                'production-form-input',
                'production-form-select',
                'production-diseno-cliente-picker__select',
                'production-corte-registro-picker__select',
                selectedId ? '' : 'production-form-select--placeholder',
              ]
                .filter(Boolean)
                .join(' ')}
              value={selectedId}
              onChange={e => onChange(e.target.value)}
              aria-label={registro.label}
            >
              <option value="">{registro.placeholder}</option>
              {preprensaOptions.length > 0 ? (
                <optgroup label={registro.title}>
                  {preprensaOptions.map(opt => (
                    <option
                      key={opt.id}
                      value={opt.id}
                      className={
                        opt.completo ? 'production-corte-registro-picker__option--completo' : undefined
                      }
                    >
                      {opt.completo
                        ? `${opt.label}${registro.completadoSeparador}${registro.estadoCompletado}`
                        : opt.label}
                    </option>
                  ))}
                </optgroup>
              ) : null}
              {faltanteOptions.length > 0 ? (
                <optgroup label={copy.faltante.registroPickerGrupo}>
                  {faltanteOptions.map(opt => (
                    <option
                      key={opt.id}
                      value={opt.id}
                      className={[
                        'production-corte-registro-picker__option--faltante',
                        opt.completo ? 'production-corte-registro-picker__option--completo' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      {opt.completo
                        ? `${opt.label}${registro.completadoSeparador}${registro.estadoCompletado}`
                        : opt.label}
                    </option>
                  ))}
                </optgroup>
              ) : null}
            </select>
            {selectedCompleto && selectedOption ? (
              <span className="production-corte-registro-picker__select-display" aria-hidden>
                <span className="production-corte-registro-picker__select-label">
                  {selectedOption.label}
                </span>
                <span className="production-corte-registro-picker__select-completado">
                  {registro.estadoCompletado}
                </span>
              </span>
            ) : null}
          </div>
          <span className="production-plancha-draft__field-hint">
            {registro.hint}
            {completadosCount > 0
              ? ` (${completadosCount} de ${options.length} completado${
                  completadosCount === 1 ? '' : 's'
                }).`
              : ''}
          </span>
        </div>
      )}
    </div>
  )
}

export default ProductionCortePreprensaRegistroPicker
