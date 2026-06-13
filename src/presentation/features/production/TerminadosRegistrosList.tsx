import React from 'react'
import clsx from 'clsx'
import ActionIcon from '../../components/ui/ActionIcon'
import { TERMINADOS_COPY as copy } from './constants/terminadosCopy'
import {
  formatEntradaTerminadosResumen,
  resolveEntradaTerminadosTotal,
  type TerminadosAsignadosRow,
} from './utils/terminadosUtils'
import { formatTerminadoPrecioCop } from './utils/terminadoPricingUtils'

const registrosCopy = copy.asignacion.registros

interface TerminadosRegistrosListProps {
  rows: TerminadosAsignadosRow[]
  activeCorteRowKey: string
  editingEntradaId: string | null
  onEdit: (corteRowKey: string, entradaId: string) => void
  onRemove: (corteRowKey: string, entradaId: string) => void
}

const TABLE_COL_COUNT = 4

const TerminadosRegistrosList: React.FC<TerminadosRegistrosListProps> = ({
  rows,
  activeCorteRowKey,
  editingEntradaId,
  onEdit,
  onRemove,
}) => (
  <div className="production-terminados-registros-list">
    <div className="production-plancha-table-wrap">
      <table className="production-plancha-table production-terminados-registros-list__table">
        <thead>
          <tr>
            <th className="production-plancha-table__th production-plancha-table__th--desc">
              {registrosCopy.columns.plancha}
            </th>
            <th className="production-plancha-table__th production-plancha-table__th--desc">
              {registrosCopy.columns.terminados}
            </th>
            <th className="production-plancha-table__th production-plancha-table__th--num">
              {registrosCopy.columns.total}
            </th>
            <th className="production-plancha-table__th production-plancha-table__th--act">
              <span className="sr-only">{registrosCopy.columns.acciones}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr className="production-plancha-table__row production-plancha-table__row--empty">
              <td className="production-plancha-table__td" colSpan={TABLE_COL_COUNT}>
                <div className="production-terminados-registros-list__empty">
                  <strong>{registrosCopy.emptyTitle}</strong>
                  <span>{registrosCopy.empty}</span>
                </div>
              </td>
            </tr>
          ) : (
            rows.map(({ corteRowKey, planchaLabel, entrada }) => {
              const isEditing = editingEntradaId === entrada.id
              const isActivePlancha = corteRowKey === activeCorteRowKey
              const entradaTotal = resolveEntradaTerminadosTotal(entrada)
              const terminadosResumen = formatEntradaTerminadosResumen(entrada)

              return (
                <tr
                  key={`${corteRowKey}-${entrada.id}`}
                  className={clsx(
                    'production-plancha-table__row',
                    isActivePlancha && 'production-plancha-table__row--selected',
                    isEditing && 'production-terminados-registros-list__row--editing'
                  )}
                >
                  <td
                    className="production-plancha-table__td production-terminados-registros-list__plancha"
                    title={planchaLabel}
                  >
                    <span className="production-plancha-table__truncate">{planchaLabel}</span>
                  </td>
                  <td
                    className="production-plancha-table__td production-terminados-registros-list__terminados"
                    title={terminadosResumen}
                  >
                    <span className="production-terminados-registros-list__terminados-text">
                      {terminadosResumen}
                    </span>
                  </td>
                  <td className="production-plancha-table__td production-plancha-table__td--num production-plancha-table__td--total">
                    <strong className="production-terminados-registros-list__total">
                      {formatTerminadoPrecioCop(entradaTotal)}
                    </strong>
                  </td>
                  <td className="production-plancha-table__td production-plancha-table__td--act">
                    <div className="production-impresion-tintas-table__actions">
                      <button
                        type="button"
                        className={clsx(
                          'action-icon-button action-icon-edit production-impresion-tintas-table__edit',
                          isEditing && 'production-impresion-tintas-table__edit--active'
                        )}
                        onClick={() => onEdit(corteRowKey, entrada.id)}
                        title={isEditing ? registrosCopy.editing : registrosCopy.edit}
                        aria-label={isEditing ? registrosCopy.editing : registrosCopy.edit}
                        aria-pressed={isEditing}
                      >
                        <ActionIcon name="edit" size={14} />
                      </button>
                      <button
                        type="button"
                        className="action-icon-button action-icon-delete production-plancha-table__remove"
                        onClick={() => onRemove(corteRowKey, entrada.id)}
                        title={registrosCopy.remove}
                        aria-label={registrosCopy.remove}
                      >
                        <ActionIcon name="delete" size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  </div>
)

export default TerminadosRegistrosList
