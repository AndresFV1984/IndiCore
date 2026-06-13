import React, { useId } from 'react'
import { TERMINADOS_COPY as copy } from './constants/terminadosCopy'
import type { TerminadosCorteContext } from './utils/terminadosUtils'

const detalleCopy = copy.asignacion.planchaDetalle
const contextoCopy = copy.asignacion.contexto

interface TerminadosPlanchaDetalleFieldsProps {
  context: TerminadosCorteContext
}

const TerminadosPlanchaDetalleFields: React.FC<TerminadosPlanchaDetalleFieldsProps> = ({
  context,
}) => {
  const tipoPapelId = useId()
  const despieceId = useId()
  const tamanosBuenosId = useId()
  const despieceLabel =
    context.despieceMedida !== '—'
      ? `${context.despieceNombre} · ${context.despieceMedida}`
      : context.despieceNombre

  return (
    <div className="production-impresion-plancha-detalle">
      <section className="production-impresion-plancha-detalle__section">
        <header className="production-impresion-plancha-detalle__section-head">
          <h5 className="production-impresion-plancha-detalle__section-title">
            {detalleCopy.sectionCorte}
          </h5>
          <p className="production-impresion-plancha-detalle__section-hint">
            {detalleCopy.sectionCorteHint}
          </p>
        </header>

        <div className="production-impresion-plancha-detalle__metrics">
          <div className="production-form-field production-impresion-plancha-detalle__field">
            <span className="production-form-label" id={tipoPapelId}>
              {contextoCopy.tipoPapel}
            </span>
            <p
              className="production-impresion-plancha-detalle__value"
              aria-labelledby={tipoPapelId}
              role="status"
            >
              {context.tipoPapel || '—'}
            </p>
            <span className="production-plancha-draft__field-hint">{detalleCopy.tipoPapelHint}</span>
          </div>

          <div className="production-form-field production-impresion-plancha-detalle__field">
            <span className="production-form-label" id={despieceId}>
              {contextoCopy.despiece}
            </span>
            <p
              className="production-impresion-plancha-detalle__value"
              aria-labelledby={despieceId}
              role="status"
            >
              {despieceLabel || '—'}
            </p>
            <span className="production-plancha-draft__field-hint">{detalleCopy.despieceHint}</span>
          </div>

          <div className="production-form-field production-impresion-plancha-detalle__field">
            <span className="production-form-label" id={tamanosBuenosId}>
              {contextoCopy.tamanosBuenos}
            </span>
            <p
              className="production-impresion-plancha-detalle__value"
              aria-labelledby={tamanosBuenosId}
              role="status"
            >
              {context.tamanosBuenos > 0
                ? context.tamanosBuenos.toLocaleString('es-CO')
                : '—'}
            </p>
            <span className="production-plancha-draft__field-hint">
              {detalleCopy.tamanosBuenosHint}
            </span>
          </div>
        </div>
      </section>
    </div>
  )
}

export default TerminadosPlanchaDetalleFields
