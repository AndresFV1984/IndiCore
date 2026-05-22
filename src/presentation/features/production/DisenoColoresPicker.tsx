import React from 'react'
import { DisenoColoresOption } from '../../../core/domain/entities/PreprensaDiseno'
import {
  COLORES_DOT_PALETTE,
  DISENO_COLORES_OPTIONS,
} from './constants/preprensaDisenoColors'

interface ColoresCountIconProps {
  dotCount: number
  showPlus?: boolean
  size?: 'sm' | 'md'
}

export const ColoresCountIcon: React.FC<ColoresCountIconProps> = ({
  dotCount,
  showPlus,
  size = 'sm',
}) => {
  const visibleDots = Math.min(dotCount, COLORES_DOT_PALETTE.length)

  return (
    <span
      className={`production-colores-icon production-colores-icon--${size}`}
      aria-hidden
    >
      {Array.from({ length: visibleDots }, (_, index) => (
        <span
          key={index}
          className={`production-colores-icon__dot production-colores-icon__dot--${index}`}
        />
      ))}
      {showPlus && <span className="production-colores-icon__more">+</span>}
    </span>
  )
}

interface DisenoColoresPickerProps {
  id: string
  labelId: string
  value: DisenoColoresOption | ''
  onChange: (value: DisenoColoresOption) => void
}

const DisenoColoresPicker: React.FC<DisenoColoresPickerProps> = ({
  id,
  labelId,
  value,
  onChange,
}) => {
  return (
    <div
      id={id}
      className="production-colores-picks"
      role="listbox"
      aria-labelledby={labelId}
    >
      {DISENO_COLORES_OPTIONS.map((opt, optionIndex) => {
        const selected = value === opt.value
        const accent = COLORES_DOT_PALETTE[optionIndex] ?? COLORES_DOT_PALETTE[0]

        return (
          <button
            key={opt.value}
            type="button"
            role="option"
            aria-selected={selected}
            className={`production-colores-pick${selected ? ' production-colores-pick--selected' : ''}`}
            style={{ '--colores-pick-accent': accent } as React.CSSProperties}
            onClick={() => onChange(opt.value)}
          >
            <ColoresCountIcon dotCount={opt.dotCount} size="md" />
            <span className="production-colores-pick__label">{opt.label}</span>
            <span className="production-colores-pick__num">{opt.numericValue}</span>
          </button>
        )
      })}
    </div>
  )
}

export default DisenoColoresPicker
