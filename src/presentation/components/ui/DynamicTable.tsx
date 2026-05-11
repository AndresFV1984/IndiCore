import React from 'react'
import Button from './Button'
import Input from './Input'
import Select from './Select'

interface DynamicTableProps {
  columns: { key: string; header: string; type?: 'text' | 'number' | 'select'; options?: string[] }[]
  rows: Record<string, any>[]
  onAddRow: () => void
  onRemoveRow: (index: number) => void
  onChangeRow: (index: number, key: string, value: any) => void
}

const DynamicTable: React.FC<DynamicTableProps> = ({ columns, rows, onAddRow, onRemoveRow, onChangeRow }) => {
  return (
    <div className="dynamic-table">
      <table className="dynamic-table-table">
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key} className="dynamic-table-header">
                {col.header}
              </th>
            ))}
            <th className="dynamic-table-header">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="dynamic-table-row">
              {columns.map(col => (
                <td key={col.key} className="dynamic-table-cell">
                  {col.type === 'select' ? (
                    <Select
                      options={col.options?.map(opt => ({ value: opt, label: opt })) || []}
                      value={row[col.key] || ''}
                      onChange={(e) => onChangeRow(index, col.key, e.target.value)}
                    />
                  ) : (
                    <Input
                      type={col.type || 'text'}
                      value={row[col.key] || ''}
                      onChange={(e) => onChangeRow(index, col.key, e.target.value)}
                    />
                  )}
                </td>
              ))}
              <td className="dynamic-table-cell">
                <Button variant="danger" size="sm" onClick={() => onRemoveRow(index)}>
                  Eliminar
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <Button variant="secondary" onClick={onAddRow}>
        Agregar fila
      </Button>
    </div>
  )
}

export default DynamicTable
