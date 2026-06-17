import React, { useId } from 'react'
import clsx from 'clsx'
import { IMPRESION_COPY as copy } from './constants/impresionCopy'
import { computeTamanosBuenos, computeTamanosBuenosReferencia } from './utils/coloresPlanchasUtils'

const detalleCopy = copy.tintas.planchaDetalle

interface ImpresionPlanchaDetalleFieldsProps {
  cantidad: number
  numeroCavidades: number
  sobrante?: number
}

interface DatosMetricTileProps {
  labelId: string
  label: string
  value: string
  formula?: string
  note?: string
  accent?: boolean
  empty?: boolean
}

const DatosMetricTile: React.FC<DatosMetricTileProps> = ({
  labelId,
  label,
  value,
  formula,
  note,
  accent = false,
  empty = false,
}) => (
  <article
    className={clsx(
      'production-impresion-datos__tile',
      accent && 'production-impresion-datos__tile--accent',
      empty && 'production-impresion-datos__tile--empty'
    )}
  >
    <span className="production-impresion-datos__tile-label" id={labelId}>
      {label}
    </span>
    <p
      className="production-impresion-datos__tile-value"
      aria-labelledby={labelId}
      role="status"
      title={formula}
    >
      {value}
    </p>
    {formula && !empty ? (
      <span className="production-impresion-datos__tile-formula">{formula}</span>
    ) : note ? (
      <span className="production-impresion-datos__tile-note">{note}</span>
    ) : null}
  </article>
)

const ImpresionPlanchaDetalleFields: React.FC<ImpresionPlanchaDetalleFieldsProps> = ({
  cantidad,
  numeroCavidades,
  sobrante = 0,
}) => {
  const headId = useId()
  const cavidadesId = useId()
  const tamanosBuenosId = useId()
  const tamanosBuenosReferenciaId = useId()
  const tamanosBuenosCalc = computeTamanosBuenos(cantidad, numeroCavidades)
  const tamanosBuenosReferenciaCalc = computeTamanosBuenosReferencia(
    cantidad,
    numeroCavidades,
    sobrante
  )
  const tamanosBuenosPendingMessage = !tamanosBuenosCalc.ok
    ? tamanosBuenosCalc.reason === 'sin-cavidad'
      ? detalleCopy.tamanosBuenosNeedCavidades
      : detalleCopy.tamanosBuenosNeedCantidad
    : ''

  return (
    <section className="production-impresion-datos" aria-labelledby={headId}>
      <header className="production-impresion-datos__head">
        <div className="production-impresion-datos__head-main">
          <h4 className="production-impresion-datos__title" id={headId}>
            {detalleCopy.zoneLabel}
          </h4>
          <p className="production-impresion-datos__subtitle">{detalleCopy.sectionPlanchaHint}</p>
        </div>
        <span className="production-impresion-datos__source">{detalleCopy.sourceBadge}</span>
      </header>

      <div className="production-impresion-datos__grid">
        <DatosMetricTile
          labelId={cavidadesId}
          label={detalleCopy.cavidadesLabel}
          value={numeroCavidades > 0 ? numeroCavidades.toLocaleString('es-CO') : detalleCopy.cavidadesEmpty}
          note={numeroCavidades > 0 ? detalleCopy.cavidadesHint : undefined}
          empty={numeroCavidades <= 0}
        />

        <DatosMetricTile
          labelId={tamanosBuenosId}
          label={detalleCopy.tamanosBuenosLabel}
          value={
            tamanosBuenosCalc.ok
              ? tamanosBuenosCalc.value.toLocaleString('es-CO')
              : detalleCopy.tamanosBuenosEmpty
          }
          formula={tamanosBuenosCalc.ok ? detalleCopy.tamanosBuenosFormula : undefined}
          note={!tamanosBuenosCalc.ok ? tamanosBuenosPendingMessage : undefined}
          accent={tamanosBuenosCalc.ok}
          empty={!tamanosBuenosCalc.ok}
        />

        <DatosMetricTile
          labelId={tamanosBuenosReferenciaId}
          label={detalleCopy.tamanosBuenosReferenciaLabel}
          value={
            tamanosBuenosReferenciaCalc.ok
              ? tamanosBuenosReferenciaCalc.value.toLocaleString('es-CO')
              : detalleCopy.tamanosBuenosReferenciaEmpty
          }
          formula={
            tamanosBuenosReferenciaCalc.ok ? detalleCopy.tamanosBuenosReferenciaFormula : undefined
          }
          note={!tamanosBuenosReferenciaCalc.ok ? tamanosBuenosPendingMessage : undefined}
          accent={tamanosBuenosReferenciaCalc.ok}
          empty={!tamanosBuenosReferenciaCalc.ok}
        />
      </div>
    </section>
  )
}

export default ImpresionPlanchaDetalleFields
