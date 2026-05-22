import React, { useMemo } from 'react'
import './Pagination.css'

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  startIndex: number
  endIndex: number
  totalItems: number
  itemLabel: string
  footerClassName?: string
  countClassName?: string
}

const Pagination: React.FC<PaginationProps> = ({
  page,
  totalPages,
  onPageChange,
  startIndex,
  endIndex,
  totalItems,
  itemLabel,
  footerClassName = 'list-footer',
  countClassName = 'list-footer-count',
}) => {
  const pages = useMemo(() => {
    const maxButtons = 5
    if (totalPages <= maxButtons) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
    let start = Math.max(1, page - 2)
    const end = Math.min(totalPages, start + maxButtons - 1)
    start = Math.max(1, end - maxButtons + 1)
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }, [page, totalPages])

  return (
    <div className={footerClassName}>
      <p className={countClassName}>
        {totalItems === 0
          ? `Sin ${itemLabel}`
          : `Mostrando ${startIndex}–${endIndex} de ${totalItems} ${itemLabel}`}
      </p>
      {totalItems > 0 && totalPages > 1 && (
        <nav className="pagination" aria-label={`Paginación de ${itemLabel}`}>
          <button
            type="button"
            className="pagination-btn"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            aria-label="Página anterior"
          >
            ‹
          </button>
          {pages.map((p) => (
            <button
              key={p}
              type="button"
              className={`pagination-btn${p === page ? ' pagination-btn--active' : ''}`}
              onClick={() => onPageChange(p)}
              aria-label={`Página ${p}`}
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </button>
          ))}
          <button
            type="button"
            className="pagination-btn"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            aria-label="Página siguiente"
          >
            ›
          </button>
        </nav>
      )}
    </div>
  )
}

export default Pagination
