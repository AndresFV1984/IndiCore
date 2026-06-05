import React, { useId } from 'react'
import clsx from 'clsx'
import type { TarifaMillar } from '../../../core/domain/entities/TarifaMillar'
import { TARIFA_MILLAR_UNIDAD } from '../../../core/domain/entities/TarifaMillar'
import { IMPRESION_COPY as copy } from './constants/impresionCopy'
import { formatPrecioMillar, formatUnidadMillar } from './utils/impresionVolteoTarifaUtils'

export type ImpresionTintasTarifaVariant = 'colorBasico' | 'pantone'

const VARIANT_CLASS: Record<ImpresionTintasTarifaVariant, string> = {
  colorBasico: 'production-impresion-color-basico-tarifa',
  pantone: 'production-impresion-pantone-tarifa',
}

interface ImpresionTintasTarifaFieldsProps {
  variant: ImpresionTintasTarifaVariant
  tarifa: TarifaMillar | null
  precioMillar?: number
  tarifasMillarLoading?: boolean
}

const ImpresionTintasTarifaFields: React.FC<ImpresionTintasTarifaFieldsProps> = ({
  variant,
  tarifa,
  precioMillar = 0,
  tarifasMillarLoading = false,
}) => {
  const tarifaCopy = copy.tintas[variant]
  const precioId = useId()
  const unidadId = useId()
  const rootClass = VARIANT_CLASS[variant]

  const precioDisplay = tarifa
    ? formatPrecioMillar(tarifa.precio)
    : precioMillar > 0
      ? formatPrecioMillar(precioMillar)
      : null

  const unidadDisplay = tarifa
    ? formatUnidadMillar(tarifa.unidadMedida)
    : precioMillar > 0
      ? formatUnidadMillar(TARIFA_MILLAR_UNIDAD)
      : null

  const sinTarifa = !tarifasMillarLoading && !precioDisplay

  return (
    <section className={clsx(rootClass, 'production-impresion-tintas-tarifa')} aria-labelledby={precioId}>
      <header className="production-impresion-tintas-tarifa__head">
        <h5 className="production-impresion-tintas-tarifa__title" id={precioId}>
          {tarifaCopy.sectionTitle}
        </h5>
        <p className="production-impresion-tintas-tarifa__hint">{tarifaCopy.sectionHint}</p>
      </header>

      <div className="production-impresion-tintas-tarifa__metrics">
        <div className="production-form-field production-impresion-plancha-detalle__field">
          <span className="production-form-label">{tarifaCopy.precioMillarLabel}</span>
          <p
            className={[
              'production-impresion-plancha-detalle__value',
              'production-impresion-plancha-detalle__value--precio',
              sinTarifa ? 'production-impresion-plancha-detalle__value--empty' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            role="status"
          >
            {tarifasMillarLoading
              ? 'Cargando…'
              : precioDisplay ?? tarifaCopy.precioMillarEmpty}
          </p>
        </div>

        <div className="production-form-field production-impresion-plancha-detalle__field">
          <span className="production-form-label" id={unidadId}>
            {tarifaCopy.unidadMedidaLabel}
          </span>
          <p
            className={[
              'production-impresion-plancha-detalle__value',
              sinTarifa ? 'production-impresion-plancha-detalle__value--empty' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            aria-labelledby={unidadId}
            role="status"
          >
            {tarifasMillarLoading
              ? 'Cargando…'
              : unidadDisplay ?? tarifaCopy.unidadMedidaEmpty}
          </p>
        </div>
      </div>

      {sinTarifa ? (
        <p className="production-impresion-plancha-detalle__tarifa-aviso">
          {tarifaCopy.precioMillarNoTarifa}
        </p>
      ) : (
        <span className="production-plancha-draft__field-hint production-impresion-plancha-detalle__tarifa-hint">
          {tarifaCopy.precioMillarHint}
        </span>
      )}
    </section>
  )
}

export default ImpresionTintasTarifaFields
