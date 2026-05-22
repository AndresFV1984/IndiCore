import React, { useEffect, useState } from 'react'
import Modal from '../../components/ui/Modal'
import FormSection from '../../components/directory/FormSection'
import FormField from '../../components/directory/FormField'
import { validateMedidaDimension } from '../../../core/domain/value-objects/MedidaDimensions'
import { CreateTamanoPlanchaDTO, TamanoPlancha } from '../../../core/domain/entities/TamanoPlancha'
import MedidaFields, {
  defaultMedidaFormValues,
  medidaDimensionToForm,
  type MedidaFormValues,
} from './MedidaFields'
import './Catalog.css'

export interface TamanoPlanchaFormValues {
  name: string
  medida: MedidaFormValues
  valor: string
  active: boolean
}

const defaultValues: TamanoPlanchaFormValues = {
  name: '',
  medida: defaultMedidaFormValues,
  valor: '',
  active: true,
}

interface TamanoPlanchaModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (dto: CreateTamanoPlanchaDTO) => Promise<void>
  item?: TamanoPlancha | null
}

const TamanoPlanchaModal: React.FC<TamanoPlanchaModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  item,
}) => {
  const isEditing = Boolean(item)
  const [values, setValues] = useState<TamanoPlanchaFormValues>(defaultValues)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    setValues(
      item
        ? {
            name: item.name,
            medida: medidaDimensionToForm(item.medidaDimension),
            valor: String(item.valor),
            active: item.active,
          }
        : defaultValues
    )
    setError(null)
    setSubmitting(false)
  }, [isOpen, item])

  const handleChange = (field: keyof Omit<TamanoPlanchaFormValues, 'medida'>) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setValues(prev => ({ ...prev, [field]: e.target.value }))
    if (error) setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const name = values.name.trim()
    const valor = Number(values.valor)
    const medidaErr = validateMedidaDimension(values.medida)

    if (!name) {
      setError('El nombre es obligatorio.')
      return
    }
    if (medidaErr) {
      setError(medidaErr)
      return
    }
    if (values.valor.trim() === '' || Number.isNaN(valor) || valor < 0) {
      setError('Ingrese un valor válido (número mayor o igual a cero).')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      await onSubmit({
        id: item?.id,
        name,
        ancho: values.medida.ancho,
        alto: values.medida.alto,
        unidadMedida: values.medida.unidadMedida,
        valor,
        active: values.active,
      })
      onClose()
    } catch {
      setError(
        isEditing
          ? 'No se pudo actualizar el tipo de plancha. Intenta de nuevo.'
          : 'No se pudo guardar el tipo de plancha. Intenta de nuevo.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      title={isEditing ? 'Editar tipo de plancha' : 'Nuevo tipo de plancha'}
      subtitle={
        isEditing
          ? 'Modifique los datos y pulse Guardar'
          : 'Los campos con * son obligatorios'
      }
      onClose={onClose}
      maxWidth="640px"
      directoryTone="clients"
    >
      <form className="record-form" onSubmit={handleSubmit} noValidate>
        <FormSection title="Datos del tipo de plancha">
          <FormField id="plancha-name" label="Nombre" required fullWidth>
            <input
              id="plancha-name"
              type="text"
              className="record-form-input"
              value={values.name}
              onChange={handleChange('name')}
              placeholder="Ej. Plancha estándar"
              autoFocus
            />
          </FormField>
          <MedidaFields
            idPrefix="plancha"
            values={values.medida}
            onChange={medida => setValues(prev => ({ ...prev, medida }))}
          />
          <FormField
            id="plancha-valor"
            label="Valor"
            required
            hint="Valor en pesos colombianos (COP)"
            fullWidth
          >
            <input
              id="plancha-valor"
              type="number"
              min={0}
              step={1}
              className="record-form-input"
              value={values.valor}
              onChange={handleChange('valor')}
              placeholder="Ej. 185000"
            />
          </FormField>
          <FormField id="plancha-estado" label="Estado" required fullWidth>
            <select
              id="plancha-estado"
              className="record-form-input"
              value={values.active ? 'activo' : 'inactivo'}
              onChange={e =>
                setValues(prev => ({ ...prev, active: e.target.value === 'activo' }))
              }
            >
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </FormField>
        </FormSection>

        {error && (
          <p className="record-form-error" role="alert">
            {error}
          </p>
        )}

        <div className="record-form-footer">
          <button
            type="button"
            className="record-form-btn record-form-btn--cancel"
            onClick={onClose}
            disabled={submitting}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="record-form-btn record-form-btn--submit"
            disabled={submitting}
          >
            {submitting
              ? 'Guardando…'
              : isEditing
                ? 'Guardar'
                : 'Guardar tipo de plancha'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default TamanoPlanchaModal
