import React from 'react'
import clsx from 'clsx'
import { DisenoColoresOption } from '../../../core/domain/entities/PreprensaDiseno'
import {
  DISENO_COLORES_COUNT_OPTIONS,
  DISENO_INK_COUNT_PALETTE_SIZE,
  DISENO_INK_PALETTE,
  getDisenoColoresCountMeta,
  isDisenoInkPantoneMix,
  type DisenoColoresCountMeta,
} from './constants/preprensaDisenoColors'

const LIGHT_SWATCHES = new Set(['#ffd400', '#FFD400'])

interface ColoresSwatchIconProps {
  swatch: string
  name: string
  size?: 'xs' | 'sm' | 'md'
}

const swatchBorder = (swatch: string): string =>
  LIGHT_SWATCHES.has(swatch) ? '#94a3b8' : `color-mix(in srgb, ${swatch} 55%, #fff)`

/** Muestra un color de la paleta como pastilla redondeada (sin icono de gota). */
export const ColoresSwatchIcon: React.FC<ColoresSwatchIconProps> = ({
  swatch,
  name,
  size = 'sm',
}) => {
  const isMix = isDisenoInkPantoneMix(swatch)

  return (
    <span
      className={clsx(
        'production-colores-swatch-icon',
        `production-colores-swatch-icon--${size}`,
        isMix && 'production-colores-swatch-icon--pantone-mix'
      )}
      style={
        isMix
          ? undefined
          : ({
              '--colores-swatch-color': swatch,
              '--colores-swatch-border': swatchBorder(swatch),
            } as React.CSSProperties)
      }
      title={name}
      aria-hidden
    />
  )
}

/** @deprecated Usar ColoresSwatchIcon */
export const ColoresInkIcon = ColoresSwatchIcon

interface ColoresCountIconsProps {
  count: number
  size?: 'xs' | 'sm' | 'md'
  /** Muestra «+» tras los 7 iconos (opción 7-Colores o más) */
  showPlusSuffix?: boolean
}

/** Muestra N swatches de tinta (Cian → Pantone) en fila; «+» si es 7 o más */
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
      className={clsx(
        'production-colores-icons',
        `production-colores-icons--${size}`,
        showPlus && 'production-colores-icons--with-plus'
      )}
      aria-hidden
    >
      {DISENO_INK_PALETTE.slice(0, n).map((ink, i) => (
        <ColoresSwatchIcon key={i} swatch={ink.swatch} name={ink.name} size={size} />
      ))}
      {showPlus && <span className="production-colores-icons__plus">+</span>}
    </span>
  )
}

/** @deprecated Usar ColoresCountIcons */
export const ColoresCountDots = ColoresCountIcons

interface ColoresSpectrumBarProps {
  count: number
  /** Muestra indicador «+» para 7 colores o más */
  showPlusSuffix?: boolean
  compact?: boolean
}

/** Barra continua segmentada por tinta — visualización moderna para el selector */
export const ColoresSpectrumBar: React.FC<ColoresSpectrumBarProps> = ({
  count,
  showPlusSuffix = false,
  compact = false,
}) => {
  const n = Math.min(Math.max(count, 0), DISENO_INK_COUNT_PALETTE_SIZE)
  if (n === 0) return null

  return (
    <span
      className={clsx(
        'production-colores-spectrum',
        compact && 'production-colores-spectrum--compact',
        showPlusSuffix && 'production-colores-spectrum--extended'
      )}
      aria-hidden
    >
      <span className="production-colores-spectrum__track">
        {DISENO_INK_PALETTE.slice(0, n).map((ink, i) => {
          const isMix = isDisenoInkPantoneMix(ink.swatch)
          return (
            <span
              key={i}
              className={clsx(
                'production-colores-spectrum__segment',
                isMix && 'production-colores-spectrum__segment--pantone-mix'
              )}
              style={
                isMix
                  ? undefined
                  : ({ '--colores-spectrum-color': ink.swatch } as React.CSSProperties)
              }
              title={ink.name}
            />
          )
        })}
      </span>
      {showPlusSuffix ? (
        <span className="production-colores-spectrum__more" title="7 colores o más">
          +
        </span>
      ) : null}
    </span>
  )
}

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

      <div className="production-colores-picks production-colores-picks--modern">
        {options.map(option => {
          const isSelected = value === option.value
          const isSevenPlus = option.value === '7-colores-o-mas'

          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={`${option.label}${isSelected ? ', seleccionado' : ''}`}
              className={clsx(
                'production-colores-pick production-colores-pick--modern-card',
                isSelected && 'production-colores-pick--selected'
              )}
              disabled={disabled}
              onClick={() => onChange(option.value)}
            >
              <span className="production-colores-pick__headline" aria-hidden>
                <span className="production-colores-pick__count">{option.shortLabel}</span>
                <ColoresSpectrumBar count={option.count} showPlusSuffix={isSevenPlus} />
              </span>
              <span className="production-colores-pick__label">{option.label}</span>
              {isSelected ? (
                <span className="production-colores-pick__check" aria-hidden>
                  <svg viewBox="0 0 12 12" focusable="false">
                    <path
                      d="M2.25 6.25 4.75 8.75 9.75 3.75"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              ) : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export { getDisenoColoresCountMeta, type DisenoColoresCountMeta }

export default DisenoColoresPicker
