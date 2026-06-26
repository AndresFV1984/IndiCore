import React, { useId } from 'react'
import type { DisenoColorPlanchaItem } from '../../../core/domain/entities/PreprensaDiseno'
import ProductionWorkspaceSection from './ProductionWorkspaceSection'
import ImpresionPlanchaSelect, {
  type ImpresionPlanchaSelectExtraOption,
} from './ImpresionPlanchaSelect'

export interface PreprensaRegistroPickerCopy {
  tag: string
  title: string
  label: string
  placeholder: string
  hint: string
  emptySinRegistros: string
  completado: string
}

interface ProductionPreprensaRegistroPickerSectionProps {
  copy: PreprensaRegistroPickerCopy
  selectId: string
  coloresPlanchas: DisenoColorPlanchaItem[]
  selectedId: string
  onChange: (id: string) => void
  completedPlanchaIds?: string[]
  extraOptions?: ImpresionPlanchaSelectExtraOption[]
  faltanteGroupLabel?: string
  children?: React.ReactNode
}

const ProductionPreprensaRegistroPickerSection: React.FC<
  ProductionPreprensaRegistroPickerSectionProps
> = ({
  copy,
  selectId,
  coloresPlanchas,
  selectedId,
  onChange,
  completedPlanchaIds = [],
  extraOptions = [],
  faltanteGroupLabel,
  children,
}) => {
  const planchaLabelId = useId()
  const hasOptions = coloresPlanchas.length > 0 || extraOptions.length > 0

  return (
    <ProductionWorkspaceSection tag={copy.tag} title={copy.title} tone={0}>
      {!hasOptions ? (
        <p className="production-diseno-cliente-hint">{copy.emptySinRegistros}</p>
      ) : (
        <div className="production-plancha-workspace production-impresion-tintas-workspace">
          <section
            className="production-plancha-workspace__picker-zone production-plancha-workspace__picker-zone--selected"
            aria-labelledby={planchaLabelId}
          >
            <label className="production-form-label" id={planchaLabelId} htmlFor={selectId}>
              {copy.label}
            </label>
            <ImpresionPlanchaSelect
              id={selectId}
              labelId={planchaLabelId}
              coloresPlanchas={coloresPlanchas}
              extraOptions={extraOptions}
              completedPlanchaIds={completedPlanchaIds}
              completedLabel={copy.completado}
              value={selectedId}
              onChange={onChange}
              placeholder={copy.placeholder}
              faltanteGroupLabel={faltanteGroupLabel}
            />
            <span className="production-plancha-workspace__hint">{copy.hint}</span>
          </section>
          {children}
        </div>
      )}
    </ProductionWorkspaceSection>
  )
}

export default ProductionPreprensaRegistroPickerSection
