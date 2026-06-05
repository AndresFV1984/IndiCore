import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { TipoPapel } from '../../../core/domain/entities/TipoPapel'
import type { PaperRow } from '../../../core/domain/entities/Order'
import { formatUnidadEmpaqueDisplay } from '../../../core/domain/value-objects/UnidadEmpaque'
import ProductionCorteCatalogSnapshot from './ProductionCorteCatalogSnapshot'
import {
  buildTipoPapelNameCounts,
  clearTipoPapelFromRow,
  despiecePliegoSelectOptionLabel,
  findDespieceInTipoPapel,
  listActiveTiposPapel,
  mergeDespiecePliegoIntoRow,
  mergeTipoPapelIntoRow,
  normalizeTipoPapelList,
  tipoPapelSelectOptionLabel,
} from './utils/tipoPapelDisplay'
import { buildTipoPapelCatalogEditUrl } from './utils/tipoPapelCatalogNavigation'
import { CORTE_PAPEL_COPY } from './constants/cortePapelCopy'

const papelCopy = CORTE_PAPEL_COPY.sections.papel

interface ProductionCorteTipoPapelFieldsProps {
  row: PaperRow
  tiposPapel: TipoPapel[]
  loadingTiposPapel?: boolean
  onChange: (row: PaperRow) => void
  embedded?: boolean
}

const ProductionCorteTipoPapelFields: React.FC<ProductionCorteTipoPapelFieldsProps> = ({
  row,
  tiposPapel,
  loadingTiposPapel = false,
  onChange,
  embedded = false,
}) => {
  const navigate = useNavigate()
  const catalog = useMemo(() => normalizeTipoPapelList(tiposPapel), [tiposPapel])
  const activeTipos = useMemo(() => listActiveTiposPapel(catalog), [catalog])
  const nameCounts = useMemo(() => buildTipoPapelNameCounts(activeTipos), [activeTipos])
  const selected = useMemo(
    () => catalog.find(t => t.id === row.tipoPapelId) ?? null,
    [catalog, row.tipoPapelId]
  )
  const selectedDespieceId = row.despiece?.despieceId ?? ''
  const despieceCatalogo = useMemo(
    () => findDespieceInTipoPapel(selected, selectedDespieceId) ?? row.despiece ?? null,
    [selected, selectedDespieceId, row.despiece]
  )

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value
    if (!id) {
      onChange(clearTipoPapelFromRow(row))
      return
    }
    const item = catalog.find(t => t.id === id)
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

  const goToTipoPapelCatalog = () => {
    if (!selected) return
    navigate(buildTipoPapelCatalogEditUrl(selected.id))
  }

  const body = (
    <div className="production-corte-tipo-papel">
      {loadingTiposPapel ? (
        <p className="production-diseno-cliente-hint" role="status">
          Cargando tipos de papel del catálogo…
        </p>
      ) : activeTipos.length === 0 ? (
        <p className="production-diseno-cliente-hint">
          No hay tipos de papel activos. Regístrelos en Catálogos › Tipo de papel y asocie al
          menos un despiece por pliego.
        </p>
      ) : (
        <>
          <div className="production-corte-tipo-papel__selects">
            <div className="production-form-field production-corte-field">
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
            </div>

            {selected ? (
              selected.despiecesPliego.length === 0 ? (
                <div className="production-corte-tipo-papel__catalog-action production-corte-tipo-papel__hint-span">
                  <p className="production-diseno-cliente-hint production-corte-tipo-papel__catalog-action-text">
                    {papelCopy.sinDespieces}
                  </p>
                  <p className="production-diseno-cliente-hint production-corte-tipo-papel__catalog-action-hint">
                    {papelCopy.agregarDespiecesHint(selected.name)}
                  </p>
                  <button
                    type="button"
                    className="production-plancha-detalle-op-gate__btn production-corte-tipo-papel__catalog-btn"
                    onClick={goToTipoPapelCatalog}
                  >
                    {papelCopy.agregarDespieces}
                  </button>
                </div>
              ) : (
                <>
                  <div className="production-form-field production-corte-field">
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
                  </div>
                  <div className="production-corte-tipo-papel__catalog-link-wrap production-corte-tipo-papel__hint-span">
                    <button
                      type="button"
                      className="production-corte-tipo-papel__catalog-link"
                      onClick={goToTipoPapelCatalog}
                    >
                      {papelCopy.gestionarDespieces}
                    </button>
                  </div>
                </>
              )
            ) : null}
          </div>

          {selected ? (
            <div className="production-corte-tipo-papel__catalog">
              <ProductionCorteCatalogSnapshot
                tipoPapel={selected}
                despiece={despieceCatalogo}
                inline
              />
            </div>
          ) : null}
        </>
      )}
    </div>
  )

  if (embedded) return body

  return (
    <section className="production-ws-section production-ws-section--tone-0">
      <div className="production-ws-section__body">{body}</div>
    </section>
  )
}

export default ProductionCorteTipoPapelFields
