import React, { useId } from 'react'
import { IMPRESION_COPY as copy } from './constants/impresionCopy'
import { computeTamanosBuenos } from './utils/coloresPlanchasUtils'

const detalleCopy = copy.tintas.planchaDetalle

interface ImpresionPlanchaDetalleFieldsProps {
  cantidad: number
  numeroCavidades: number
}

const ImpresionPlanchaDetalleFields: React.FC<ImpresionPlanchaDetalleFieldsProps> = ({
  cantidad,
  numeroCavidades,
}) => {
  const cavidadesId = useId()
  const tamanosBuenosId = useId()
  const tamanosBuenosCalc = computeTamanosBuenos(cantidad, numeroCavidades)
  const tamanosBuenosPendingMessage = !tamanosBuenosCalc.ok
    ? tamanosBuenosCalc.reason === 'sin-cavidad'
      ? detalleCopy.tamanosBuenosNeedCavidades
      : detalleCopy.tamanosBuenosNeedCantidad
    : ''

  return (
    <div className="production-impresion-plancha-detalle">
      <section className="production-impresion-plancha-detalle__section">
        <header className="production-impresion-plancha-detalle__section-head">
          <h5 className="production-impresion-plancha-detalle__section-title">
            {detalleCopy.sectionPlancha}
          </h5>
          <p className="production-impresion-plancha-detalle__section-hint">
            {detalleCopy.sectionPlanchaHint}
          </p>
        </header>

        <div className="production-impresion-plancha-detalle__metrics">
          <div className="production-form-field production-impresion-plancha-detalle__field">
            <span className="production-form-label" id={cavidadesId}>
              {detalleCopy.cavidadesLabel}
            </span>
            <p
              className="production-impresion-plancha-detalle__value"
              aria-labelledby={cavidadesId}
              role="status"
            >
              {numeroCavidades > 0 ? numeroCavidades : detalleCopy.cavidadesEmpty}
            </p>
            <span className="production-plancha-draft__field-hint">{detalleCopy.cavidadesHint}</span>
          </div>

          <div className="production-form-field production-impresion-plancha-detalle__field">
            <span className="production-form-label" id={tamanosBuenosId}>
              {detalleCopy.tamanosBuenosLabel}
            </span>
            <p
              className={[
                'production-impresion-plancha-detalle__value',
                !tamanosBuenosCalc.ok ? 'production-impresion-plancha-detalle__value--empty' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              aria-labelledby={tamanosBuenosId}
              role="status"
              title={detalleCopy.tamanosBuenosFormula}
            >
              {tamanosBuenosCalc.ok
                ? tamanosBuenosCalc.value.toLocaleString('es-CO')
                : detalleCopy.tamanosBuenosEmpty}
            </p>
            <span className="production-plancha-draft__field-hint">
              {tamanosBuenosCalc.ok ? detalleCopy.tamanosBuenosFormula : tamanosBuenosPendingMessage}
            </span>
          </div>
        </div>
      </section>
    </div>
  )
}

export default ImpresionPlanchaDetalleFields
