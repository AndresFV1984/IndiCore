import React, { useMemo } from 'react'
import { TipoPapel } from '../../../core/domain/entities/TipoPapel'
import type { PaperRow } from '../../../core/domain/entities/Order'
import ProductionWorkspaceSection from './ProductionWorkspaceSection'
import {
  CatalogReadonlyField,
  DespiecePliegoReadonlySection,
  ProductionCatalogDetail,
  ProductionCatalogDetailGrid,
} from './ProductionCatalogDetail'
import {
  buildTipoPapelNameCounts,
  clearTipoPapelFromRow,
  despiecePliegoSelectOptionLabel,
  formatValorHojaDisplay,
  mergeDespiecePliegoIntoRow,
  mergeTipoPapelIntoRow,
  tipoPapelSelectOptionLabel,
} from './utils/tipoPapelDisplay'

interface ProductionCorteTipoPapelFieldsProps {
  row: PaperRow
  tiposPapel: TipoPapel[]
  onChange: (row: PaperRow) => void
  embedded?: boolean
}

const ProductionCorteTipoPapelFields: React.FC<ProductionCorteTipoPapelFieldsProps> = ({
  row,
  tiposPapel,
  onChange,
  embedded = false,
}) => {
  const activeTipos = useMemo(
    () =>
      [...tiposPapel.filter(t => t.active)].sort((a, b) =>
        a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
      ),
    [tiposPapel]
  )

  const nameCounts = useMemo(() => buildTipoPapelNameCounts(activeTipos), [activeTipos])

  const selected = useMemo(
    () => tiposPapel.find(t => t.id === row.tipoPapelId) ?? null,
    [tiposPapel, row.tipoPapelId]
  )

  const selectedDespieceId = row.despiece?.despieceId ?? ''

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value
    if (!id) {
      onChange(clearTipoPapelFromRow(row))
      return
    }
    const item = tiposPapel.find(t => t.id === id)
    if (item) onChange(mergeTipoPapelIntoRow(row, item))
  }

  const handleDespieceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value
    if (!id || !selected) {
      onChange({ ...row, despiece: undefined })
      return
    }
    const despiece = selected.despiecesPliego.find(d => d.despieceId === id)
    if (despiece) onChange(mergeDespiecePliegoIntoRow(row, despiece))
  }

  const body = (
    <>
      {activeTipos.length === 0 ? (
        <p className="production-diseno-cliente-hint">
          No hay tipos de papel activos. Regístrelos en Catálogos › Tipo de papel.
        </p>
      ) : (
        <>
          <label className="production-form-label" htmlFor="prod-tipo-papel-select">
            Tipo de papel
          </label>
          <select
            id="prod-tipo-papel-select"
            className={`production-form-input production-form-select production-diseno-cliente-picker__select${
              row.tipoPapelId ? '' : ' production-form-select--placeholder'
            }`}
            value={row.tipoPapelId ?? ''}
            onChange={handleSelectChange}
          >
            <option value="">Seleccionar tipo de papel…</option>
            {activeTipos.map(item => (
              <option key={item.id} value={item.id}>
                {tipoPapelSelectOptionLabel(item, nameCounts)}
              </option>
            ))}
          </select>

          {selected ? (
            selected.despiecesPliego.length === 0 ? (
              <p className="production-diseno-cliente-hint">
                Este tipo de papel no tiene despieces asociados en el catálogo.
              </p>
            ) : (
              <>
                <label className="production-form-label" htmlFor="prod-despiece-pliego-select">
                  Despiece por pliego
                </label>
                <select
                  id="prod-despiece-pliego-select"
                  className={`production-form-input production-form-select production-diseno-cliente-picker__select${
                    selectedDespieceId ? '' : ' production-form-select--placeholder'
                  }`}
                  value={selectedDespieceId}
                  onChange={handleDespieceChange}
                >
                  <option value="">Seleccionar despiece por pliego…</option>
                  {selected.despiecesPliego.map(despiece => (
                    <option key={despiece.despieceId} value={despiece.despieceId}>
                      {despiecePliegoSelectOptionLabel(despiece)}
                    </option>
                  ))}
                </select>
              </>
            )
          ) : null}
        </>
      )}

      {selected && (
        <ProductionCatalogDetail title="Datos del tipo de papel" tone={1}>
          <ProductionCatalogDetailGrid>
            <CatalogReadonlyField label="Nombre" value={selected.name} />
            <CatalogReadonlyField label="Ancho" value={selected.ancho} />
            <CatalogReadonlyField label="Alto" value={selected.alto} />
            <CatalogReadonlyField label="Unidad de medida" value={selected.unidadMedida} />
            <CatalogReadonlyField
              label="Valor hoja"
              value={formatValorHojaDisplay(selected.valorHoja)}
            />
            <CatalogReadonlyField label="Unidad empaque" value={selected.unidadEmpaque} />
          </ProductionCatalogDetailGrid>

          {row.despiece ? (
            <DespiecePliegoReadonlySection despiece={row.despiece} />
          ) : selected.despiecesPliego.length > 0 ? (
            <p className="production-diseno-cliente-hint production-catalog-detail__note">
              Seleccione un despiece por pliego asociado al tipo de papel.
            </p>
          ) : null}
        </ProductionCatalogDetail>
      )}
    </>
  )

  if (embedded) return body

  return (
    <ProductionWorkspaceSection tag="Catálogo" title="Tipo de papel" tone={0}>
      {body}
    </ProductionWorkspaceSection>
  )
}

export default ProductionCorteTipoPapelFields
