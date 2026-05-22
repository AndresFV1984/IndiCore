import React, { useState } from 'react'
import ActionIcon from '../../components/ui/ActionIcon'
import Pagination from '../../components/ui/Pagination'
import { usePagination } from '../../hooks/usePagination'
import CatalogRecordModal from './CatalogRecordModal'
import type { CatalogRecord, CatalogRecordFormValues } from './catalogRecord'
import { normalizeCatalogUnitCost } from './catalogRecord'
import { OPERACIONES_SEED } from './catalogSeeds'
import CatalogRecordCost from './CatalogRecordCost'
import {
  confirmDelete,
  confirmExport,
  confirmSave,
  notifySuccess,
} from '../../utils/actionFeedback'
import './Catalog.css'
import '../remissions/Remissions.css'

function toRecord(values: CatalogRecordFormValues, id?: string): CatalogRecord {
  const cost = normalizeCatalogUnitCost(values.cost)
  return {
    id: id ?? `o-${crypto.randomUUID()}`,
    name: values.name.trim(),
    ...(values.quickAccess ? { quickAccess: true } : {}),
    cost: cost || '—',
  }
}

interface OperationCardProps {
  item: CatalogRecord
  onEdit: (item: CatalogRecord) => void
  onExport: (item: CatalogRecord) => void
  onDelete: (item: CatalogRecord) => void
}

const OperationCard: React.FC<OperationCardProps> = ({ item, onEdit, onExport, onDelete }) => (
  <article className="catalog-card catalog-card--purple">
    <div className="catalog-card-accent" aria-hidden />
    <div className="catalog-card-top">
      <div className="catalog-card-info">
        <h3 className="catalog-card-name">{item.name}</h3>
        <CatalogRecordCost cost={item.cost} variant="purple" />
        {item.quickAccess ? (
          <span className="catalog-quick-access-badge catalog-quick-access-badge--purple">
            <span className="catalog-quick-access-badge__icon" aria-hidden>
              ⚡
            </span>
            Acceso rápido
          </span>
        ) : null}
      </div>
    </div>
    <div className="catalog-card-actions">
      <button
        type="button"
        className="catalog-card-btn catalog-card-btn--export"
        title="Exportar"
        aria-label={`Exportar ${item.name}`}
        onClick={() => onExport(item)}
      >
        <ActionIcon name="export" size={12} />
        Exportar
      </button>
      <button
        type="button"
        className="catalog-card-btn"
        title="Editar"
        aria-label={`Editar ${item.name}`}
        onClick={() => onEdit(item)}
      >
        <ActionIcon name="edit" size={12} />
        Editar
      </button>
      <button
        type="button"
        className="catalog-card-btn catalog-card-btn--danger"
        title="Eliminar"
        aria-label={`Eliminar ${item.name}`}
        onClick={() => onDelete(item)}
      >
        <ActionIcon name="delete" size={12} />
        Borrar
      </button>
    </div>
  </article>
)

const OperationsCatalog: React.FC = () => {
  const [items, setItems] = useState<CatalogRecord[]>(OPERACIONES_SEED)
  const [isNewOpen, setIsNewOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<CatalogRecord | null>(null)

  const {
    page,
    setPage,
    totalPages,
    paginatedItems,
    totalItems,
    startIndex,
    endIndex,
  } = usePagination(items)

  const handleNew = () => {
    setEditingItem(null)
    setIsNewOpen(true)
  }

  const handleEdit = (item: CatalogRecord) => {
    setEditingItem(item)
    setIsNewOpen(false)
  }

  const handleCloseModal = () => {
    setIsNewOpen(false)
    setEditingItem(null)
  }

  const handleSubmit = async (values: CatalogRecordFormValues) => {
    const name = values.name.trim()
    const isEditing = Boolean(editingItem)
    if (!(await confirmSave(name, isEditing))) return
    if (editingItem) {
      setItems(prev =>
        prev.map(i => (i.id === editingItem.id ? toRecord(values, editingItem.id) : i))
      )
      notifySuccess('Operación actualizada correctamente.')
    } else {
      setItems(prev => [...prev, toRecord(values)])
      notifySuccess('Operación creada correctamente.')
    }
  }

  const handleDelete = async (item: CatalogRecord) => {
    if (!(await confirmDelete(item.name))) return
    setItems(prev => prev.filter(i => i.id !== item.id))
    notifySuccess(`Operación «${item.name}» eliminada.`)
  }

  const handleExportList = async () => {
    if (!(await confirmExport('el listado de operaciones'))) return
    void import('../../utils/catalogExports').then(m => m.exportCatalogOperaciones(items, 'listado'))
  }

  const handleExportOne = async (item: CatalogRecord) => {
    if (!(await confirmExport(`la operación «${item.name}»`))) return
    void import('../../utils/catalogExports').then(m => m.exportCatalogOperaciones([item], item.name))
  }

  const modalOpen = isNewOpen || editingItem !== null

  return (
    <div className="catalog-page">
      <div className="catalog-header">
        <div>
          <h2 className="catalog-title">Catálogo de Operaciones de acabado</h2>
          <p className="catalog-sub">
            Operaciones disponibles para asignar en órdenes de producción
          </p>
        </div>
        <div className="catalog-header-actions">
          <button type="button" className="remissions-btn-export" onClick={handleExportList}>
            Exportar
          </button>
          <button
            type="button"
            className="btn btn-primary btn-md catalog-btn-new--purple"
            onClick={handleNew}
          >
            + Nueva operación
          </button>
        </div>
      </div>

      <div className="catalog-grid">
        {paginatedItems.map(i => (
          <OperationCard
            key={i.id}
            item={i}
            onEdit={handleEdit}
            onExport={handleExportOne}
            onDelete={handleDelete}
          />
        ))}
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        startIndex={startIndex}
        endIndex={endIndex}
        totalItems={totalItems}
        itemLabel="operaciones"
        footerClassName="catalog-footer list-footer"
        countClassName="list-footer-count"
      />

      <CatalogRecordModal
        variant="operacion"
        isOpen={modalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        item={editingItem}
      />
    </div>
  )
}

export default OperationsCatalog
