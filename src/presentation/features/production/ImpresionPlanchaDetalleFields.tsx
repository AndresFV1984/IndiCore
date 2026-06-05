import React, { useId, useMemo } from 'react'
import type { ImpresionTipoBifronte } from '../../../core/domain/entities/Order'
import type { TarifaMillar } from '../../../core/domain/entities/TarifaMillar'
import { TARIFA_MILLAR_UNIDAD } from '../../../core/domain/entities/TarifaMillar'
import { IMPRESION_COPY as copy } from './constants/impresionCopy'
import {
  IMPRESION_VOLTEO_TIPO_OPTIONS,
  isImpresionConVolteo,
  resolveImpresionConVolteoEnabled,
} from './constants/impresionTipoBifronte'
import {
  formatPrecioMillar,
  formatUnidadMillar,
  resolveTarifaVolteoMillar,
} from './utils/impresionVolteoTarifaUtils'
import { computeTamanosBuenos } from './utils/coloresPlanchasUtils'

const detalleCopy = copy.tintas.planchaDetalle

interface ImpresionPlanchaDetalleFieldsProps {
  cantidad: number
  numeroCavidades: number
  tipoBifronte: ImpresionTipoBifronte | ''
  precioVolteoMillar?: number
  tarifasMillar: TarifaMillar[]
  tarifasMillarLoading?: boolean
  onTipoBifronteChange: (value: ImpresionTipoBifronte | '') => void
}

const ImpresionPlanchaDetalleFields: React.FC<ImpresionPlanchaDetalleFieldsProps> = ({
  cantidad,
  numeroCavidades,
  tipoBifronte,
  precioVolteoMillar = 0,
  tarifasMillar,
  tarifasMillarLoading = false,
  onTipoBifronteChange,
}) => {
  const cavidadesId = useId()
  const tamanosBuenosId = useId()
  const volteoSwitchId = useId()
  const tipoVolteoId = useId()
  const precioMillarId = useId()
  const unidadMedidaId = useId()
  const conVolteo = isImpresionConVolteo(tipoBifronte)
  const tipoVolteoValue = conVolteo ? tipoBifronte : 'volteo-pinza'

  const tarifaVolteo = useMemo(
    () => resolveTarifaVolteoMillar(tarifasMillar, tipoBifronte),
    [tarifasMillar, tipoBifronte]
  )

  const precioDisplay = tarifaVolteo
    ? formatPrecioMillar(tarifaVolteo.precio)
    : precioVolteoMillar > 0
      ? formatPrecioMillar(precioVolteoMillar)
      : null

  const unidadDisplay = tarifaVolteo
    ? formatUnidadMillar(tarifaVolteo.unidadMedida)
    : precioVolteoMillar > 0
      ? formatUnidadMillar(TARIFA_MILLAR_UNIDAD)
      : null

  const sinTarifa = conVolteo && !tarifasMillarLoading && !precioDisplay
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

      <section className="production-impresion-plancha-detalle__section">
        <header className="production-impresion-plancha-detalle__section-head">
          <h5 className="production-impresion-plancha-detalle__section-title">
            {detalleCopy.sectionVolteo}
          </h5>
        </header>

        <div
          className={[
            'production-impresion-plancha-detalle__volteo-grid',
            conVolteo ? 'production-impresion-plancha-detalle__volteo-grid--active' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <div className="production-form-field production-impresion-plancha-detalle__field production-impresion-plancha-detalle__field--volteo-switch">
            <span className="production-form-label" id={volteoSwitchId}>
              {detalleCopy.impresionConVolteoLabel}
            </span>
            <label className="production-impresion-volteo-switch" htmlFor={`${volteoSwitchId}-input`}>
              <input
                id={`${volteoSwitchId}-input`}
                type="checkbox"
                className="production-impresion-volteo-switch__input"
                checked={conVolteo}
                onChange={e =>
                  onTipoBifronteChange(resolveImpresionConVolteoEnabled(e.target.checked, tipoBifronte))
                }
                aria-labelledby={volteoSwitchId}
              />
              <span className="production-impresion-volteo-switch__track" aria-hidden />
              <span className="production-impresion-volteo-switch__state" aria-hidden>
                {conVolteo ? detalleCopy.impresionConVolteoOn : detalleCopy.impresionConVolteoOff}
              </span>
            </label>
            <span className="production-plancha-draft__field-hint">
              {detalleCopy.impresionConVolteoHint}
            </span>
          </div>

          {conVolteo ? (
            <>
              <div className="production-form-field production-impresion-plancha-detalle__field production-impresion-plancha-detalle__field--tipo">
                <label className="production-form-label" htmlFor={tipoVolteoId}>
                  {detalleCopy.tipoVolteoLabel}
                </label>
                <select
                  id={tipoVolteoId}
                  className="production-form-input production-form-select"
                  value={tipoVolteoValue}
                  onChange={e => onTipoBifronteChange(e.target.value as ImpresionTipoBifronte)}
                >
                  {IMPRESION_VOLTEO_TIPO_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="production-impresion-plancha-detalle__tarifa-row">
                <div className="production-form-field production-impresion-plancha-detalle__field">
                  <span className="production-form-label" id={precioMillarId}>
                    {detalleCopy.precioMillarLabel}
                  </span>
                  <p
                    className={[
                      'production-impresion-plancha-detalle__value',
                      'production-impresion-plancha-detalle__value--precio',
                      sinTarifa ? 'production-impresion-plancha-detalle__value--empty' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    aria-labelledby={precioMillarId}
                    role="status"
                  >
                    {tarifasMillarLoading
                      ? 'Cargando…'
                      : precioDisplay ?? detalleCopy.precioMillarEmpty}
                  </p>
                </div>

                <div className="production-form-field production-impresion-plancha-detalle__field">
                  <span className="production-form-label" id={unidadMedidaId}>
                    {detalleCopy.unidadMedidaLabel}
                  </span>
                  <p
                    className={[
                      'production-impresion-plancha-detalle__value',
                      sinTarifa ? 'production-impresion-plancha-detalle__value--empty' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    aria-labelledby={unidadMedidaId}
                    role="status"
                  >
                    {tarifasMillarLoading
                      ? 'Cargando…'
                      : unidadDisplay ?? detalleCopy.unidadMedidaEmpty}
                  </p>
                </div>
              </div>

              {sinTarifa ? (
                <p className="production-impresion-plancha-detalle__tarifa-aviso">
                  {detalleCopy.precioMillarNoTarifa}
                </p>
              ) : (
                <span className="production-plancha-draft__field-hint production-impresion-plancha-detalle__tarifa-hint">
                  {detalleCopy.precioMillarHint}
                </span>
              )}
            </>
          ) : null}
        </div>
      </section>
    </div>
  )
}

export default ImpresionPlanchaDetalleFields
