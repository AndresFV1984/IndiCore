import React, { useMemo } from 'react'
import FormField from './FormField'
import { listCitiesByDepartment, listDepartments } from '../../../core/utils/colombiaLocations'

export type DepartmentCityValue = {
  department: string
  city: string
  cityCode: string
}

type DepartmentCityFieldsProps = {
  idPrefix: string
  value: DepartmentCityValue
  onChange: (value: DepartmentCityValue) => void
  disabled?: boolean
}

const DepartmentCityFields: React.FC<DepartmentCityFieldsProps> = ({
  idPrefix,
  value,
  onChange,
  disabled = false,
}) => {
  const departments = useMemo(() => listDepartments(), [])
  const cities = useMemo(
    () => listCitiesByDepartment(value.department),
    [value.department],
  )

  const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ department: e.target.value, city: '', cityCode: '' })
  }

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value
    const city = cities.find(c => c.codigo === code)
    onChange({
      department: value.department,
      city: city?.nombre ?? '',
      cityCode: code,
    })
  }

  return (
    <>
      <FormField id={`${idPrefix}-department`} label="Departamento" required>
        <select
          id={`${idPrefix}-department`}
          className="record-form-input"
          value={value.department}
          onChange={handleDepartmentChange}
          disabled={disabled}
          required
        >
          <option value="">Seleccione departamento</option>
          {departments.map(d => (
            <option key={d.codigo} value={d.nombre}>
              {d.nombre}
            </option>
          ))}
        </select>
      </FormField>
      <FormField id={`${idPrefix}-city`} label="Ciudad / municipio" required>
        <select
          id={`${idPrefix}-city`}
          className="record-form-input"
          value={value.cityCode}
          onChange={handleCityChange}
          disabled={disabled || !value.department}
          required
        >
          <option value="">
            {value.department ? 'Seleccione ciudad' : 'Primero elija departamento'}
          </option>
          {cities.map(c => (
            <option key={c.codigo} value={c.codigo}>
              {c.nombre}
            </option>
          ))}
        </select>
      </FormField>
    </>
  )
}

export default DepartmentCityFields
