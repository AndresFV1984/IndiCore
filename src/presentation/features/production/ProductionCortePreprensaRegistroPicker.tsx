import React, { useMemo } from 'react'
import type { PaperRow } from '../../../core/domain/entities/Order'
import type { DisenoColorPlanchaItem, YesNoChoice } from '../../../core/domain/entities/PreprensaDiseno'
import CortePlanchaDetalleFields from './CortePlanchaDetalleFields'
import { CORTE_PAPEL_COPY as copy } from './constants/cortePapelCopy'
import ProductionPreprensaRegistroPickerSection from './ProductionPreprensaRegistroPickerSection'
import type { ImpresionPlanchaSelectExtraOption } from './ImpresionPlanchaSelect'

export type CorteRegistroPickerOption = ImpresionPlanchaSelectExtraOption

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
  const completedPlanchaIds = useMemo(() => [...processedIds], [processedIds])

  return (
    <ProductionPreprensaRegistroPickerSection
      copy={copy.registroPreprensa}
      selectId="prod-corte-plancha-select"
      coloresPlanchas={coloresPlanchas}
      selectedId={selectedId}
      onChange={onChange}
      completedPlanchaIds={completedPlanchaIds}
      extraOptions={extraOptions}
      faltanteGroupLabel={copy.faltante.registroPickerGrupo}
    >
      {selectedId && datosPlancha ? (
        <CortePlanchaDetalleFields
          row={datosPlancha.row}
          coloresPlanchas={datosPlancha.coloresPlanchas}
          clienteSuministraPapel={datosPlancha.clienteSuministraPapel}
        />
      ) : null}
    </ProductionPreprensaRegistroPickerSection>
  )
}

export default ProductionCortePreprensaRegistroPicker
