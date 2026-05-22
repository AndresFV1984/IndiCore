import React, { useEffect, useState } from 'react'
import Modal from '../../components/ui/Modal'
import FormSection from '../../components/directory/FormSection'
import FormField from '../../components/directory/FormField'
import { CreatePrecioMontajeDTO, PrecioMontaje } from '../../../core/domain/entities/PrecioMontaje'

export interface PrecioMontajeFormValues {
  name: string
  cost: string
  state: boolean
}

const defaultValues: PrecioMontajeFormValues = {
  name: '',
  cost: '',
  state: true,
}

interface NewPrecioMontajeModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (dto: CreatePrecioMontajeDTO) => Promise<void>
  item?: PrecioMontaje | null
}

const NewPrecioMontajeModal: React.FC<NewPrecioMontajeModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  item,
}) => {
  const isEditing = Boolean(item)
  const [values, setValues] = useState<PrecioMontajeFormValues>(defaultValues)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    setValues(
      item
        ? {
            name: item.name,
            cost: String(item.cost),
            state: item.state,
          }
        : defaultValues
    )
    setError(null)
    setSubmitting(false)
  }, [isOpen, item])

  const handleChange = (field: keyof PrecioMontajeFormValues) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setValues(prev => ({ ...prev, [field]: e.target.value }))
    if (error) setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const name = values.name.trim()
    const cost = Number(values.cost)

    if (!name) {
      setError('El nombre es obligatorio.')
      return
    }
    if (values.cost.trim() === '' || Number.isNaN(cost) || cost < 0) {
      setError('Ingrese un costo válido (número mayor o igual a cero).')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      await onSubmit({
        id: item?.id,
        name,
        cost,
        state: values.state,
      })
      onClose()
    } catch {
      setError(
        isEditing
          ? 'No se pudo actualizar el precio de montaje. Intenta de nuevo.'
          : 'No se pudo guardar el precio de montaje. Intenta de nuevo.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      title={isEditing ? 'Editar precio de montaje' : 'Nuevo precio de montaje'}
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
        <FormSection title="Datos del precio de montaje">
          <FormField id="pm-name" label="Nombre" required fullWidth>
            <input
              id="pm-name"
              type="text"
              className="record-form-input"
              value={values.name}
              onChange={handleChange('name')}
              placeholder="Ej. Montaje estándar 4 tintas"
              autoFocus
            />
          </FormField>
          <FormField id="pm-costo" label="Costo" required fullWidth>
            <input
              id="pm-costo"
              type="number"
              min={0}
              step={1}
              className="record-form-input"
              value={values.cost}
              onChange={handleChange('cost')}
              placeholder="Ej. 85000"
            />
          </FormField>
          <FormField id="pm-estado" label="Estado" required fullWidth>
            <select
              id="pm-estado"
              className="record-form-input"
              value={values.state ? 'activo' : 'inactivo'}
              onChange={e =>
                setValues(prev => ({ ...prev, state: e.target.value === 'activo' }))
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
                : 'Guardar precio de montaje'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default NewPrecioMontajeModal
