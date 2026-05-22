import React from 'react'
import FormField from '../../components/directory/FormField'
import {
  DEFAULT_UNIDAD_MEDIDA,
  MEDIDA_UNIDADES,
  type MedidaDimension,
  parseMedidaString,
} from '../../../core/domain/value-objects/MedidaDimensions'
import './Catalog.css'

export interface MedidaFormValues {
  ancho: string
  alto: string
  unidadMedida: string
}

export const defaultMedidaFormValues: MedidaFormValues = {
  ancho: '',
  alto: '',
  unidadMedida: DEFAULT_UNIDAD_MEDIDA,
}

export const medidaDimensionToForm = (dim: MedidaDimension): MedidaFormValues => ({
  ancho: dim.ancho,
  alto: dim.alto,
  unidadMedida: dim.unidadMedida,
})

export const medidaLegacyToForm = (medida: string): MedidaFormValues =>
  medidaDimensionToForm(parseMedidaString(medida))

interface MedidaFieldsProps {
  idPrefix: string
  values: MedidaFormValues
  onChange: (next: MedidaFormValues) => void
  label?: string
  required?: boolean
}

const MedidaFields: React.FC<MedidaFieldsProps> = ({
  idPrefix,
  values,
  onChange,
  label = 'Medida',
  required = true,
}) => {
  const patch = (field: keyof MedidaFormValues, value: string) => {
    onChange({ ...values, [field]: value })
  }

  return (
    <FormField id={`${idPrefix}-medida`} label={label} required={required} fullWidth>
      <div className="medida-fields">
        <div className="medida-fields__dim">
          <label className="medida-fields__sub-label" htmlFor={`${idPrefix}-ancho`}>
            Ancho
          </label>
          <input
            id={`${idPrefix}-ancho`}
            type="text"
            inputMode="decimal"
            className="record-form-input"
            value={values.ancho}
            onChange={e => patch('ancho', e.target.value)}
            placeholder="10"
          />
        </div>
        <span className="medida-fields__times" aria-hidden>
          ×
        </span>
        <div className="medida-fields__dim">
          <label className="medida-fields__sub-label" htmlFor={`${idPrefix}-alto`}>
            Alto
          </label>
          <input
            id={`${idPrefix}-alto`}
            type="text"
            inputMode="decimal"
            className="record-form-input"
            value={values.alto}
            onChange={e => patch('alto', e.target.value)}
            placeholder="5"
          />
        </div>
        <div className="medida-fields__unit">
          <label className="medida-fields__sub-label" htmlFor={`${idPrefix}-unidad`}>
            Unidad
          </label>
          <select
            id={`${idPrefix}-unidad`}
            className="record-form-input"
            value={values.unidadMedida}
            onChange={e => patch('unidadMedida', e.target.value)}
          >
            {MEDIDA_UNIDADES.map(u => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>
      </div>
      <p className="record-form-field__hint">
        Se mostrará como {values.ancho && values.alto ? `${values.ancho}×${values.alto} ${values.unidadMedida}` : 'ancho×alto unidad'}
      </p>
    </FormField>
  )
}

export default MedidaFields
