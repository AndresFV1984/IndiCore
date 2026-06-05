import React, { useEffect, useId, useRef, useState } from 'react'
import clsx from 'clsx'
import {
  DISENO_INK_PALETTE,
  DISENO_INK_PALETTE_SECTIONS,
  isDisenoInkPantoneMix,
} from './constants/preprensaDisenoColors'
import { IMPRESION_COPY as copy } from './constants/impresionCopy'
import { normalizeImpresionInkIndex } from './utils/impresionTintasUtils'

const ladoCopy = copy.tintas.lado

const SECTION_LABELS: Record<(typeof DISENO_INK_PALETTE_SECTIONS)[number]['id'], string> = {
  primarios: ladoCopy.colorPickerPrimarios,
  secundarios: ladoCopy.colorPickerSecundarios,
  pantone: ladoCopy.colorPickerPantone,
}

const LIGHT_SWATCHES = new Set(['#ffd400', '#FFD400'])

interface ImpresionTintaSlotPickerProps {
  id: string
  slotIndex: number
  value: number
  onChange: (inkIndex: number) => void
}

const ImpresionTintaSlotPicker: React.FC<ImpresionTintaSlotPickerProps> = ({
  id,
  slotIndex,
  value,
  onChange,
}) => {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const listId = useId()
  const normalizedValue = normalizeImpresionInkIndex(value)
  const selected = normalizedValue >= 0 ? DISENO_INK_PALETTE[normalizedValue] : null

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

  const renderPaletteSwatch = (inkIndex: number) => {
    const ink = DISENO_INK_PALETTE[inkIndex]!
    const isMix = isDisenoInkPantoneMix(ink.swatch)

    return (
      <span
        className={clsx(
          'production-impresion-tinta-chip__palette-swatch',
          isMix && 'production-impresion-tinta-chip__palette-swatch--pantone-mix'
        )}
        style={
          isMix
            ? undefined
            : ({
                '--impresion-tinta-color': ink.swatch,
                '--impresion-tinta-border': LIGHT_SWATCHES.has(ink.swatch)
                  ? '#94a3b8'
                  : 'color-mix(in srgb, var(--impresion-tinta-color) 55%, #fff)',
              } as React.CSSProperties)
        }
        aria-hidden
      />
    )
  }

  return (
    <div
      ref={rootRef}
      className={clsx(
        'production-impresion-tinta-chip',
        open && 'production-impresion-tinta-chip--open',
        selected && 'production-impresion-tinta-chip--filled'
      )}
    >
      <button
        type="button"
        id={id}
        className="production-impresion-tinta-chip__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={
          selected
            ? `${ladoCopy.slotLabel(slotIndex + 1)}: ${selected.name}. ${open ? 'Cerrar' : 'Cambiar'}`
            : `${ladoCopy.slotLabel(slotIndex + 1)}: ${ladoCopy.slotPlaceholder}`
        }
        onClick={() => setOpen(prev => !prev)}
      >
        <span
          className={clsx(
            'production-impresion-tinta-chip__swatch',
            !selected && 'production-impresion-tinta-chip__swatch--empty',
            selected &&
              isDisenoInkPantoneMix(selected.swatch) &&
              'production-impresion-tinta-chip__swatch--pantone-mix'
          )}
          style={
            selected && !isDisenoInkPantoneMix(selected.swatch)
              ? ({
                  '--impresion-tinta-color': selected.swatch,
                  '--impresion-tinta-border': LIGHT_SWATCHES.has(selected.swatch)
                    ? '#94a3b8'
                    : 'color-mix(in srgb, var(--impresion-tinta-color) 55%, #fff)',
                } as React.CSSProperties)
              : undefined
          }
          aria-hidden
        >
          <span className="production-impresion-tinta-chip__index">{slotIndex + 1}</span>
        </span>
        <span className="production-impresion-tinta-chip__meta">
          <span
            className={clsx(
              'production-impresion-tinta-chip__name',
              !selected && 'production-impresion-tinta-chip__name--empty'
            )}
            title={selected?.name}
          >
            {selected?.name ?? ladoCopy.slotPlaceholder}
          </span>
        </span>
        <span className="production-impresion-tinta-chip__chevron" aria-hidden />
      </button>

      {open && (
        <div className="production-impresion-tinta-chip__palette-wrap">
          <p className="production-impresion-tinta-chip__palette-title">{ladoCopy.colorPickerTitle}</p>
          <ul
            id={listId}
            className="production-impresion-tinta-chip__palette"
            role="listbox"
            aria-label={ladoCopy.slotLabel(slotIndex + 1)}
          >
            {DISENO_INK_PALETTE_SECTIONS.map(section => (
              <li key={section.id} className="production-impresion-tinta-chip__palette-section">
                <p className="production-impresion-tinta-chip__palette-section-title">
                  {SECTION_LABELS[section.id]}
                </p>
                <ul className="production-impresion-tinta-chip__palette-section-list">
                  {section.indices.map(inkIndex => {
                    const ink = DISENO_INK_PALETTE[inkIndex]!
                    const isSelected = normalizedValue === inkIndex
                    return (
                      <li key={inkIndex} role="presentation">
                        <button
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          aria-label={ink.name}
                          className={clsx(
                            'production-impresion-tinta-chip__palette-item',
                            isSelected && 'production-impresion-tinta-chip__palette-item--selected'
                          )}
                          onClick={() => {
                            onChange(inkIndex)
                            setOpen(false)
                          }}
                        >
                          {renderPaletteSwatch(inkIndex)}
                          <span className="production-impresion-tinta-chip__palette-name">
                            {ink.name}
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default ImpresionTintaSlotPicker
