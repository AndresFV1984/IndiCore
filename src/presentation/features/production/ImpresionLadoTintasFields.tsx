import React from 'react'
import clsx from 'clsx'
import type { ImpresionLadoTintas } from '../../../core/domain/entities/Order'
import { IMPRESION_COPY as copy } from './constants/impresionCopy'
import ImpresionTintaSlotPicker from './ImpresionTintaSlotPicker'
import {
  applyImpresionLadoCantidadWithLimit,
  shouldUsePrimaryInks,
  updateImpresionLadoTinta,
} from './utils/impresionTintasUtils'

const ladoCopy = copy.tintas.lado

const CANTIDAD_CHIPS = [0, 1, 2, 3, 4, 5, 6, 7] as const

interface ImpresionLadoTintasFieldsProps {
  idPrefix: string
  title: string
  hint: string
  lado: ImpresionLadoTintas
  maxColoresPlancha: number
  otherLadoCantidad: number
  onChange: (lado: ImpresionLadoTintas) => void
}

const ImpresionLadoTintasFields: React.FC<ImpresionLadoTintasFieldsProps> = ({
  idPrefix,
  title,
  hint,
  lado,
  maxColoresPlancha,
  otherLadoCantidad,
  onChange,
}) => {
  const cantidadId = `${idPrefix}-cantidad`
  const maxCantidadLado = Math.max(0, maxColoresPlancha - otherLadoCantidad)

  const setCantidad = (next: number) => {
    onChange(
      applyImpresionLadoCantidadWithLimit(lado, next, maxColoresPlancha, otherLadoCantidad)
    )
  }

  const isChipActive = (chip: number) =>
    chip < 7 ? lado.cantidad === chip : lado.cantidad >= 7

  const isChipDisabled = (chip: number): boolean => {
    if (maxCantidadLado <= 0) return chip > 0
    if (chip < 7) return chip > maxCantidadLado
    return maxCantidadLado < 7
  }

  return (
    <section className="production-impresion-lado-tintas" aria-labelledby={`${idPrefix}-title`}>
      <header className="production-impresion-lado-tintas__head">
        <div className="production-impresion-lado-tintas__title-row">
          <h4 className="production-impresion-lado-tintas__title" id={`${idPrefix}-title`}>
            {title}
          </h4>
          {lado.cantidad > 0 ? (
            <span className="production-impresion-lado-tintas__badge">
              {lado.cantidad} tinta{lado.cantidad === 1 ? '' : 's'}
            </span>
          ) : null}
        </div>
        <p className="production-impresion-lado-tintas__hint">{hint}</p>
      </header>

      <div className="production-impresion-cantidad-picker">
        <span className="production-form-label production-impresion-cantidad-picker__label">
          {ladoCopy.cantidadLabel}
        </span>

        <div className="production-impresion-cantidad-picker__controls">
          <div className="production-impresion-cantidad-stepper">
            <button
              type="button"
              className="production-impresion-cantidad-stepper__btn"
              aria-label={`Reducir ${title.toLowerCase()}`}
              disabled={lado.cantidad <= 0}
              onClick={() => setCantidad(lado.cantidad - 1)}
            >
              −
            </button>
            <input
              id={cantidadId}
              type="number"
              min={0}
              max={maxCantidadLado}
              className={clsx(
                'production-impresion-cantidad-stepper__value',
                lado.cantidad > 0 && 'production-impresion-cantidad-stepper__value--filled'
              )}
              value={lado.cantidad}
              onChange={e => setCantidad(Number(e.target.value) || 0)}
              aria-label={`${ladoCopy.cantidadLabel} ${title}`}
            />
            <button
              type="button"
              className="production-impresion-cantidad-stepper__btn"
              aria-label={`Aumentar ${title.toLowerCase()}`}
              disabled={lado.cantidad >= maxCantidadLado}
              onClick={() => setCantidad(lado.cantidad + 1)}
            >
              +
            </button>
          </div>

          <div className="production-impresion-cantidad-chips" role="group" aria-label={ladoCopy.cantidadLabel}>
            {CANTIDAD_CHIPS.map(chip => {
              const disabled = isChipDisabled(chip)
              const chipValue = chip === 7 ? Math.min(Math.max(lado.cantidad, 7), maxCantidadLado) : chip
              return (
                <button
                  key={chip}
                  type="button"
                  data-chip={chip === 7 ? 'plus' : String(chip)}
                  className={clsx(
                    'production-impresion-cantidad-chip',
                    isChipActive(chip) && 'production-impresion-cantidad-chip--active',
                    disabled && 'production-impresion-cantidad-chip--disabled'
                  )}
                  aria-pressed={isChipActive(chip)}
                  disabled={disabled}
                  onClick={() => !disabled && setCantidad(chipValue)}
                >
                  {chip === 7 ? '7+' : chip}
                </button>
              )
            })}
          </div>
        </div>

        <span className="production-plancha-draft__field-hint production-impresion-lado-tintas__limite">
          {ladoCopy.limiteLado(maxCantidadLado, maxColoresPlancha)}
        </span>
      </div>

      {lado.cantidad > 0 ? (
        <div className="production-impresion-lado-tintas__slots">
          <p className="production-impresion-lado-tintas__slots-hint">
            {shouldUsePrimaryInks(lado.cantidad)
              ? ladoCopy.tintasPrimariosHint
              : ladoCopy.tintasAsignacionHint}
          </p>
          <div className="production-impresion-lado-tintas__chips-row">
            {Array.from({ length: lado.cantidad }, (_, slotIndex) => (
              <ImpresionTintaSlotPicker
                key={slotIndex}
                id={`${idPrefix}-slot-${slotIndex}`}
                slotIndex={slotIndex}
                value={lado.tintas[slotIndex] ?? -1}
                onChange={inkIndex =>
                  onChange(updateImpresionLadoTinta(lado, slotIndex, inkIndex))
                }
              />
            ))}
          </div>
        </div>
      ) : (
        <p className="production-impresion-lado-tintas__empty" role="status">
          Sin tintas en {title.toLowerCase()}. Elija una cantidad para asignar colores.
        </p>
      )}
    </section>
  )
}

export default ImpresionLadoTintasFields
