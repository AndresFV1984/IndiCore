import React, { useId, useMemo } from 'react'
import type { PaperRow } from '../../../core/domain/entities/Order'
import type { DisenoColorPlanchaItem, YesNoChoice } from '../../../core/domain/entities/PreprensaDiseno'
import CortePlanchaDetalleFields from './CortePlanchaDetalleFields'
import CortePlanchaSelect, { type CortePlanchaSelectOption } from './CortePlanchaSelect'
import { CORTE_PAPEL_COPY as copy } from './constants/cortePapelCopy'
import ProductionWorkspaceSection from './ProductionWorkspaceSection'
import { formatImpresionPlanchaSelectLabel } from './utils/impresionTintasUtils'

export interface CorteRegistroPickerOption {
  id: string
  label: string
  completo: boolean
  esFaltanteLitografia?: boolean
  plancha?: DisenoColorPlanchaItem
}

interface ProductionCortePreprensaRegistroPickerProps {
  coloresPlanchas: DisenoColorPlanchaItem[]
  selectedId: string
  processedIds: ReadonlySet<string>
  extraOptions?: CorteRegistroPickerOption[]
  onChange: (colorPlanchaId: string) => void
  datosPlancha?: {
    row: PaperRow
    coloresPlanchas: DisenoColorPlanchaItem[]
    clienteSuministraPapel: YesNoChoice
  } | null
}

const ProductionCortePreprensaRegistroPicker: React.FC<
  ProductionCortePreprensaRegistroPickerProps
> = ({ coloresPlanchas, selectedId, processedIds, extraOptions = [], onChange, datosPlancha }) => {
  const registro = copy.registroPreprensa
  const planchaLabelId = useId()

  const options = useMemo((): CortePlanchaSelectOption[] => {
    const preprensa = coloresPlanchas.map(item => {
      const completo = processedIds.has(item.id)
      return {
        id: item.id,
        label: formatImpresionPlanchaSelectLabel(item),
        completo,
        esFaltanteLitografia: false as const,
        plancha: item,
      }
    })
    return [...preprensa, ...extraOptions]
  }, [coloresPlanchas, processedIds, extraOptions])

  const hasOptions = options.length > 0

  return (
    <ProductionWorkspaceSection tag={registro.tag} title={registro.title} tone={0}>
      {!hasOptions ? (
        <p className="production-diseno-cliente-hint">{registro.emptySinRegistros}</p>
      ) : (
        <div className="production-plancha-workspace production-impresion-tintas-workspace">
          <section
            className="production-plancha-workspace__picker-zone production-plancha-workspace__picker-zone--selected"
            aria-labelledby={planchaLabelId}
          >
            <label
              className="production-form-label"
              id={planchaLabelId}
              htmlFor="prod-corte-plancha-select"
            >
              {registro.label}
            </label>
            <CortePlanchaSelect
              id="prod-corte-plancha-select"
              labelId={planchaLabelId}
              options={options}
              value={selectedId}
              onChange={onChange}
              placeholder={registro.placeholder}
              faltanteGroupLabel={copy.faltante.registroPickerGrupo}
            />
            <span className="production-plancha-workspace__hint">{registro.hint}</span>
          </section>

          {selectedId && datosPlancha ? (
            <CortePlanchaDetalleFields
              row={datosPlancha.row}
              coloresPlanchas={datosPlancha.coloresPlanchas}
              clienteSuministraPapel={datosPlancha.clienteSuministraPapel}
            />
          ) : null}
        </div>
      )}
    </ProductionWorkspaceSection>
  )
}

export default ProductionCortePreprensaRegistroPicker
