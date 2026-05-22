import React, { useEffect, useState } from 'react'
import Modal from '../../components/ui/Modal'
import FormSection from '../../components/directory/FormSection'
import FormField from '../../components/directory/FormField'
import { validateMedidaDimension } from '../../../core/domain/value-objects/MedidaDimensions'
import { CreateDespiecePliegoDTO, DespiecePliego } from '../../../core/domain/entities/DespiecePliego'
import MedidaFields, {
  defaultMedidaFormValues,
  medidaDimensionToForm,
  type MedidaFormValues,
} from './MedidaFields'
import './Catalog.css'

export interface DespiecePliegoFormValues {
  name: string
  medida: MedidaFormValues
  piezasPorPliego: string
  active: boolean
}

const defaultValues: DespiecePliegoFormValues = {
  name: '',
  medida: defaultMedidaFormValues,
  piezasPorPliego: '',
  active: true,
}

interface DespiecePliegoModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (dto: CreateDespiecePliegoDTO) => Promise<void>
  item?: DespiecePliego | null
}

const DespiecePliegoModal: React.FC<DespiecePliegoModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  item,
}) => {
  const isEditing = Boolean(item)
  const [values, setValues] = useState<DespiecePliegoFormValues>(defaultValues)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    setValues(
      item
        ? {
            name: item.name,
            medida: medidaDimensionToForm(item.medidaDimension),
            piezasPorPliego: String(item.piezasPorPliego),
            active: item.active,
          }
        : defaultValues
    )
    setError(null)
    setSubmitting(false)
  }, [isOpen, item])

  const handleChange = (field: keyof Omit<DespiecePliegoFormValues, 'medida'>) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setValues(prev => ({ ...prev, [field]: e.target.value }))
    if (error) setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const name = values.name.trim()
    const piezasPorPliego = Number(values.piezasPorPliego)
    const medidaErr = validateMedidaDimension(values.medida)

    if (!name) {
      setError('El nombre es obligatorio.')
      return
    }
    if (/\d\s*[x×]\s*\d/i.test(name)) {
      setError('El nombre no debe incluir medidas; indíquelas en ancho y alto.')
      return
    }
    if (medidaErr) {
      setError(medidaErr)
      return
    }
    if (
      values.piezasPorPliego.trim() === '' ||
      Number.isNaN(piezasPorPliego) ||
      piezasPorPliego < 1 ||
      !Number.isInteger(piezasPorPliego)
    ) {
      setError('Ingrese piezas por pliego válidas (entero mayor a cero).')
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
        piezasPorPliego,
        active: values.active,
      })
      onClose()
    } catch {
      setError(
        isEditing
          ? 'No se pudo actualizar el despiece. Intenta de nuevo.'
          : 'No se pudo guardar el despiece. Intenta de nuevo.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      title={isEditing ? 'Editar despiece' : 'Nuevo despiece'}
      subtitle={
        isEditing
          ? 'Actualice datos y estado del despiece'
          : 'Nombre, medida, piezas por pliego y estado'
      }
      onClose={onClose}
      maxWidth="520px"
      directoryTone="clients"
    >
      <form className="record-form catalog-despiece-modal" onSubmit={handleSubmit} noValidate>
        <FormSection title="Datos del despiece">
          <FormField id="dp-name" label="Nombre" required fullWidth>
            <input
              id="dp-name"
              type="text"
              className="record-form-input"
              value={values.name}
              onChange={handleChange('name')}
              placeholder="Ej. Etiqueta"
              autoFocus
            />
            <p className="record-form-field__hint">Sin medidas; use ancho y alto a continuación.</p>
          </FormField>
          <MedidaFields
            idPrefix="dp"
            values={values.medida}
            onChange={medida => setValues(prev => ({ ...prev, medida }))}
          />
          <FormField id="dp-piezas" label="Piezas por pliego" required fullWidth>
            <input
              id="dp-piezas"
              type="number"
              min={1}
              step={1}
              className="record-form-input"
              value={values.piezasPorPliego}
              onChange={handleChange('piezasPorPliego')}
              placeholder="24"
            />
            <p className="record-form-field__hint">Cantidad de piezas que caben en un pliego</p>
          </FormField>
          <FormField id="dp-estado" label="Estado" required fullWidth>
            <select
              id="dp-estado"
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
            {submitting ? 'Guardando…' : isEditing ? 'Guardar' : 'Guardar despiece'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default DespiecePliegoModal
