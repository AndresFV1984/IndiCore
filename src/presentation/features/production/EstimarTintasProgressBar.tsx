import React from 'react'
import clsx from 'clsx'

export interface EstimarTintasProgressBarProps {
  label: string
  percent: number
  indeterminate?: boolean
  className?: string
}

const EstimarTintasProgressBar: React.FC<EstimarTintasProgressBarProps> = ({
  label,
  percent,
  indeterminate = false,
  className,
}) => {
  const clampedPercent = Math.max(0, Math.min(100, percent))

  return (
    <div
      className={clsx('production-impresion-estimar-tintas-progress', className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={indeterminate ? undefined : clampedPercent}
      aria-valuetext={label}
    >
      <div className="production-impresion-estimar-tintas-progress__track">
        <div
          className={clsx(
            'production-impresion-estimar-tintas-progress__fill',
            indeterminate && 'production-impresion-estimar-tintas-progress__fill--indeterminate'
          )}
          style={indeterminate ? undefined : { width: `${clampedPercent}%` }}
        />
      </div>
      <p className="production-impresion-estimar-tintas-progress__label">{label}</p>
    </div>
  )
}

export default EstimarTintasProgressBar
