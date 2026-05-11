import React from 'react'
import clsx from 'clsx'

interface DataTableProps<T> {
  columns: { key: keyof T; header: string; render?: (value: any, row: T) => React.ReactNode }[]
  data: T[]
  onRowClick?: (row: T) => void
  emptyMessage: string
}

function DataTable<T>({ columns, data, onRowClick, emptyMessage }: DataTableProps<T>) {
  if (data.length === 0) {
    return <div className="data-table-empty">{emptyMessage}</div>
  }

  return (
    <div className="data-table-container">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key as string} className="data-table-header">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr
              key={index}
              className={clsx('data-table-row', { 'data-table-row-clickable': onRowClick })}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map(col => (
                <td key={col.key as string} className="data-table-cell">
                  {col.render ? col.render(row[col.key], row) : String(row[col.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default DataTable
