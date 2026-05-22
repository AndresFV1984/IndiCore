import React from 'react'
import ActionIcon from './ActionIcon'
import { LIST_RECORD_ACTION_ICON_SIZE } from '@/presentation/constants/listRecordActions'

interface ListRecordActionsProps {
  recordName: string
  isActive?: boolean
  onView?: () => void
  onEdit?: () => void
  onExport?: () => void | Promise<void>
  onPrint?: () => void
  onInactivate?: () => void
  /** Elimina el registro (icono de papelera, distinto de inactivar/activar). */
  onDelete?: () => void
}

const ListRecordActions: React.FC<ListRecordActionsProps> = ({
  recordName,
  isActive = true,
  onView,
  onEdit,
  onExport,
  onPrint,
  onInactivate,
  onDelete,
}) => {
  const inactivateLabel = isActive ? 'Inactivar' : 'Activar'
  const iconSize = LIST_RECORD_ACTION_ICON_SIZE

  return (
    <div className="list-record-actions">
      {onView && (
        <button
          type="button"
          className="action-icon-button action-icon-view"
          title="Ver"
          aria-label={`Ver ${recordName}`}
          onClick={onView}
        >
          <ActionIcon name="view" size={iconSize} />
        </button>
      )}
      {onEdit && (
        <button
          type="button"
          className="action-icon-button action-icon-edit"
          title="Editar"
          aria-label={`Editar ${recordName}`}
          onClick={onEdit}
        >
          <ActionIcon name="edit" size={iconSize} />
        </button>
      )}
      {onExport && (
        <button
          type="button"
          className="action-icon-button action-icon-export"
          title="Exportar PDF"
          aria-label={`Exportar PDF de ${recordName}`}
          onClick={onExport}
        >
          <ActionIcon name="export" size={iconSize} />
        </button>
      )}
      {onPrint && (
        <button
          type="button"
          className="action-icon-button action-icon-print"
          title="Imprimir"
          aria-label={`Imprimir ${recordName}`}
          onClick={onPrint}
        >
          <ActionIcon name="print" size={iconSize} />
        </button>
      )}
      {onDelete && (
        <button
          type="button"
          className="action-icon-button action-icon-inactivate"
          title="Eliminar"
          aria-label={`Eliminar ${recordName}`}
          onClick={onDelete}
        >
          <ActionIcon name="delete" size={iconSize} />
        </button>
      )}
      {onInactivate && (
        <button
          type="button"
          className={`action-icon-button ${isActive ? 'action-icon-inactivate' : 'action-icon-activate action-icon-record-inactive'}`}
          title={isActive ? 'Inactivar' : 'Activar'}
          aria-label={`${inactivateLabel} ${recordName}`}
          onClick={onInactivate}
        >
          <ActionIcon name="delete" size={iconSize} />
        </button>
      )}
    </div>
  )
}

export default ListRecordActions
