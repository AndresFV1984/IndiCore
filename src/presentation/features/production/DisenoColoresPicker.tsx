import React from 'react'
import clsx from 'clsx'
import { DisenoColoresOption } from '../../../core/domain/entities/PreprensaDiseno'
import {
  DISENO_COLORES_COUNT_OPTIONS,
  DISENO_INK_COUNT_PALETTE_SIZE,
  DISENO_INK_PALETTE,
  DISENO_INK_PANTONE_MIX_COLORS,
  getDisenoColoresCountMeta,
  isDisenoInkPantoneMix,
  type DisenoColoresCountMeta,
} from './constants/preprensaDisenoColors'

const INK_LIGHT_SWATCHES = new Set(['#ffd400', '#FFD400'])

interface ColoresInkIconProps {
  swatch: string
  name: string
  size?: 'sm' | 'md'
}

const INK_DROP_PATH =
  'M10 2.25c-4.1 5.35-6.5 9.05-6.5 12.5a6.5 6.5 0 1 0 13 0C16.5 11.3 14.1 7.6 10 2.25z'

/** Icono de gota de tinta relleno con el color de la paleta */
export const ColoresInkIcon: React.FC<ColoresInkIconProps> = ({
  swatch,
  name,
  size = 'sm',
}) => {
  const gradientId = React.useId()
  const isMix = isDisenoInkPantoneMix(swatch)
  const light = !isMix && INK_LIGHT_SWATCHES.has(swatch)

  return (
    <span
      className={`production-colores-ink-icon production-colores-ink-icon--${size}${isMix ? ' production-colores-ink-icon--pantone-mix' : ''}`}
      title={name}
      aria-hidden
    >
      <svg viewBox="0 0 20 24" focusable="false">
        {isMix ? (
          <>
            <defs>
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                {DISENO_INK_PANTONE_MIX_COLORS.map((color, index, colors) => (
                  <stop
                    key={color}
                    offset={`${(index / (colors.length - 1)) * 100}%`}
                    stopColor={color}
                  />
                ))}
              </linearGradient>
            </defs>
            <path
              d={INK_DROP_PATH}
              fill={`url(#${gradientId})`}
              stroke="rgba(15, 23, 42, 0.18)"
              strokeWidth={0.6}
            />
          </>
        ) : (
          <path
            d={INK_DROP_PATH}
            fill={swatch}
            stroke={light ? '#64748b' : 'rgba(15, 23, 42, 0.12)'}
            strokeWidth={light ? 1.1 : 0.6}
          />
        )}
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

/** Muestra N iconos de tinta (Cian → Pantone) en fila; «+» si es 7 o más */
export const ColoresCountIcons: React.FC<ColoresCountIconsProps> = ({
  count,
  size = 'sm',
  showPlusSuffix = false,
}) => {
  const n = Math.min(Math.max(count, 0), DISENO_INK_COUNT_PALETTE_SIZE)
  if (n === 0) return null
  const showPlus = showPlusSuffix && n >= DISENO_INK_COUNT_PALETTE_SIZE

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
  /** @deprecated El selector ya no usa desplegable; se ignora. */
  defaultOpen?: boolean
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
  const excluded = new Set(excludeValues)
  const options = DISENO_COLORES_COUNT_OPTIONS.filter(option => !excluded.has(option.value))
  const selectedMeta = getDisenoColoresCountMeta(value)

  return (
    <div
      id={id}
      className={clsx(
        'production-colores-picker',
        disabled && 'production-colores-picker--disabled',
        selectedMeta && 'production-colores-picker--has-value'
      )}
      role="radiogroup"
      aria-labelledby={labelId}
    >
      {placeholder ? (
        <p className="production-colores-picker__lead">{placeholder}</p>
      ) : null}

      <div className="production-colores-picks production-colores-picks--grid">
        {options.map(option => {
          const isSelected = value === option.value
          const isSevenPlus = option.value === '7-colores-o-mas'

          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              className={clsx(
                'production-colores-pick production-colores-pick--grid-card',
                isSelected && 'production-colores-pick--selected'
              )}
              disabled={disabled}
              onClick={() => onChange(option.value)}
            >
              <span className="production-colores-pick__row">
                <span className="production-colores-pick__head">
                  <span className="production-colores-pick__label">{option.label}</span>
                </span>
                <span className="production-colores-pick__icons">
                  <ColoresCountIcons
                    count={option.count}
                    size="sm"
                    showPlusSuffix={isSevenPlus}
                  />
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export { getDisenoColoresCountMeta, type DisenoColoresCountMeta }

export default DisenoColoresPicker
