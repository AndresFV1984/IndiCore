import React from 'react'

interface CellValueProps {
  children: React.ReactNode
  className?: string
}

/** Texto en celdas de tabla; evita desbordes en móvil (correos, direcciones, etc.). */
const CellValue: React.FC<CellValueProps> = ({ children, className }) => (
  <span className={['cell-value', className].filter(Boolean).join(' ')}>{children}</span>
)

export default CellValue
