import React, { useEffect, useId, useRef, useState } from 'react'
import { DisenoColoresOption } from '../../../core/domain/entities/PreprensaDiseno'
import {
  DISENO_COLORES_COUNT_OPTIONS,
  DISENO_INK_PALETTE,
  getDisenoColoresCountMeta,
  type DisenoColoresCountMeta,
} from './constants/preprensaDisenoColors'

const INK_LIGHT_SWATCHES = new Set(['#ffd400', '#FFD400'])

interface ColoresInkIconProps {
  swatch: string
  name: string
  size?: 'sm' | 'md'
}

/** Icono de gota de tinta relleno con el color de la paleta */
export const ColoresInkIcon: React.FC<ColoresInkIconProps> = ({
  swatch,
  name,
  size = 'sm',
}) => {
  const light = INK_LIGHT_SWATCHES.has(swatch)
  return (
    <span
      className={`production-colores-ink-icon production-colores-ink-icon--${size}`}
      title={name}
      aria-hidden
    >
      <svg viewBox="0 0 20 24" focusable="false">
        <path
          d="M10 2.25c-4.1 5.35-6.5 9.05-6.5 12.5a6.5 6.5 0 1 0 13 0C16.5 11.3 14.1 7.6 10 2.25z"
          fill={swatch}
          stroke={light ? '#64748b' : 'rgba(15, 23, 42, 0.12)'}
          strokeWidth={light ? 1.1 : 0.6}
        />
      </svg>
    </span>
  )
}

interface ColoresCountIconsProps {
  count: number
  size?: 'sm' | 'md'
  /** Muestra «+» tras los 7 iconos (opción 7-Colores o más) */
  showPlusSuffix?: boolean
}

/** Muestra N iconos de tinta (Cian → Verde Pantone) en fila; «+» si es 7 o más */
export const ColoresCountIcons: React.FC<ColoresCountIconsProps> = ({
  count,
  size = 'sm',
  showPlusSuffix = false,
}) => {
  const n = Math.min(Math.max(count, 0), DISENO_INK_PALETTE.length)
  if (n === 0) return null
  const showPlus = showPlusSuffix && n >= DISENO_INK_PALETTE.length

  return (
    <span
      className={`production-colores-icons production-colores-icons--${size}${showPlus ? ' production-colores-icons--with-plus' : ''}`}
      aria-hidden
    >
      {DISENO_INK_PALETTE.slice(0, n).map((ink, i) => (
        <ColoresInkIcon key={i} swatch={ink.swatch} name={ink.name} size={size} />
      ))}
      {showPlus && <span className="production-colores-icons__plus">+</span>}
    </span>
  )
}

/** @deprecated Usar ColoresCountIcons */
export const ColoresCountDots = ColoresCountIcons

interface DisenoColoresPickerProps {
  id: string
  labelId: string
  value: DisenoColoresOption | ''
  onChange: (value: DisenoColoresOption) => void
  excludeValues?: DisenoColoresOption[]
  placeholder?: string
  disabled?: boolean
}

const DisenoColoresPicker: React.FC<DisenoColoresPickerProps> = ({
  id,
  labelId,
  value,
  onChange,
  excludeValues = [],
  placeholder = 'Seleccione cantidad de colores…',
  disabled = false,
}) => {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const listboxId = useId()
  const excluded = new Set(excludeValues)
  const options = DISENO_COLORES_COUNT_OPTIONS.filter(o => !excluded.has(o.value))
  const selectedMeta = getDisenoColoresCountMeta(value)

  useEffect(() => {
    if (disabled) setOpen(false)
  }, [disabled])

  useEffect(() => {
    setOpen(false)
  }, [value])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const handleSelect = (next: DisenoColoresOption) => {
    onChange(next)
    setOpen(false)
  }

  return (
    <div
      ref={rootRef}
      id={id}
      className={[
        'production-colores-select',
        disabled ? 'production-colores-select--disabled' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="production-colores-select__row">
        <button
          type="button"
          className="production-colores-select__trigger"
          aria-haspopup="listbox"
          aria-expanded={open && !disabled}
          aria-controls={listboxId}
          aria-labelledby={selectedMeta ? labelId : undefined}
          aria-label={selectedMeta ? undefined : placeholder}
          aria-disabled={disabled}
          disabled={disabled}
          onClick={() => {
            if (disabled) return
            setOpen(prev => !prev)
          }}
        >
          <span className="production-colores-select__trigger-inner">
            {selectedMeta ? (
              <span className="production-colores-select__content">
                <span className="production-colores-select__option-label">
                  {selectedMeta.label}
                </span>
                <span className="production-colores-select__icons">
                  <ColoresCountIcons
                    count={selectedMeta.count}
                    size="sm"
                    showPlusSuffix={selectedMeta.value === '7-colores-o-mas'}
                  />
                </span>
              </span>
            ) : (
              <span className="production-colores-select__placeholder">{placeholder}</span>
            )}
          </span>
          <span className="production-colores-select__chevron" aria-hidden />
        </button>
      </div>

      {open && !disabled && (
        <ul
          id={listboxId}
          className="production-colores-select__list"
          role="listbox"
          aria-labelledby={labelId}
        >
          {options.map(opt => {
            const isCurrent = value === opt.value
            return (
              <li key={opt.value} role="presentation">
                <button
                  type="button"
                  role="option"
                  aria-selected={isCurrent}
                  className={[
                    'production-colores-select__option',
                    isCurrent ? 'production-colores-select__option--current' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => handleSelect(opt.value)}
                >
                  <span className="production-colores-select__content">
                    <span className="production-colores-select__option-label">{opt.label}</span>
                    <span className="production-colores-select__icons">
                      <ColoresCountIcons
                        count={opt.count}
                        size="sm"
                        showPlusSuffix={opt.value === '7-colores-o-mas'}
                      />
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export { getDisenoColoresCountMeta, type DisenoColoresCountMeta }

export default DisenoColoresPicker
