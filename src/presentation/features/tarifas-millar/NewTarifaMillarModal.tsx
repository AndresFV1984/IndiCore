import React, { useEffect, useState } from 'react'
import Modal from '../../components/ui/Modal'
import FormSection from '../../components/directory/FormSection'
import FormField from '../../components/directory/FormField'
import {
  CreateTarifaMillarDTO,
  DEFAULT_TARIFA_MILLAR_CATEGORIA,
  TARIFA_MILLAR_CATEGORIAS,
  TARIFA_MILLAR_UNIDAD,
  TarifaMillar,
} from '../../../core/domain/entities/TarifaMillar'

export interface TarifaMillarFormValues {
  name: string
  precio: string
  categoria: string
  descripcion: string
  state: boolean
}

const defaultValues: TarifaMillarFormValues = {
  name: '',
  precio: '',
  categoria: DEFAULT_TARIFA_MILLAR_CATEGORIA,
  descripcion: '',
  state: true,
}

interface NewTarifaMillarModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (dto: CreateTarifaMillarDTO) => Promise<void>
  item?: TarifaMillar | null
}

const NewTarifaMillarModal: React.FC<NewTarifaMillarModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  item,
}) => {
  const isEditing = Boolean(item)
  const [values, setValues] = useState<TarifaMillarFormValues>(defaultValues)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    setValues(
      item
        ? {
            name: item.name,
            precio: String(item.precio),
            categoria: item.categoria,
            descripcion: item.descripcion,
            state: item.state,
          }
        : defaultValues
    )
    setError(null)
    setSubmitting(false)
  }, [isOpen, item])

  const handleChange =
    (field: keyof Omit<TarifaMillarFormValues, 'state'>) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setValues(prev => ({ ...prev, [field]: e.target.value }))
      if (error) setError(null)
    }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const name = values.name.trim()
    const categoria = values.categoria.trim()
    const descripcion = values.descripcion.trim()
    const precio = Number(values.precio)

    if (!name) {
      setError('El nombre es obligatorio.')
      return
    }
    if (!categoria) {
      setError('La categoría es obligatoria.')
      return
    }
    if (values.precio.trim() === '' || Number.isNaN(precio) || precio < 0) {
      setError('Ingrese un precio válido (número mayor o igual a cero).')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      await onSubmit({
        id: item?.id,
        name,
        precio,
        categoria,
        descripcion,
        state: values.state,
      })
      onClose()
    } catch {
      setError(
        isEditing
          ? 'No se pudo actualizar la tarifa por millar. Intenta de nuevo.'
          : 'No se pudo guardar la tarifa por millar. Intenta de nuevo.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      title={isEditing ? 'Editar tarifa por millar' : 'Nueva tarifa por millar'}
      subtitle={
        isEditing
          ? 'Modifique los datos y pulse Guardar'
          : 'Los campos con * son obligatorios'
      }
      onClose={onClose}
      maxWidth="720px"
      directoryTone="clients"
    >
      <form className="record-form" onSubmit={handleSubmit} noValidate>
        <FormSection title="Datos de la tarifa">
          <FormField id="tm-name" label="Nombre" required fullWidth>
            <input
              id="tm-name"
              type="text"
              className="record-form-input"
              value={values.name}
              onChange={handleChange('name')}
              placeholder="Ej. Color básico"
              autoFocus
            />
          </FormField>
          <FormField id="tm-unidad" label="Unidad millar" fullWidth>
            <input
              id="tm-unidad"
              type="text"
              className="record-form-input"
              value={String(TARIFA_MILLAR_UNIDAD)}
              readOnly
              aria-readonly
            />
          </FormField>
          <FormField id="tm-precio" label="Precio" required fullWidth>
            <input
              id="tm-precio"
              type="number"
              min={0}
              step={1}
              className="record-form-input"
              value={values.precio}
              onChange={handleChange('precio')}
              placeholder="Ej. 17500"
            />
          </FormField>
          <FormField id="tm-categoria" label="Categoría" required fullWidth>
            <select
              id="tm-categoria"
              className="record-form-input"
              value={values.categoria}
              onChange={handleChange('categoria')}
            >
              {TARIFA_MILLAR_CATEGORIAS.map(categoria => (
                <option key={categoria} value={categoria}>
                  {categoria}
                </option>
              ))}
            </select>
          </FormField>
          <FormField id="tm-descripcion" label="Descripción" fullWidth>
            <textarea
              id="tm-descripcion"
              className="record-form-input"
              value={values.descripcion}
              onChange={handleChange('descripcion')}
              placeholder="Descripción opcional de la tarifa"
              rows={3}
            />
          </FormField>
          <FormField id="tm-estado" label="Estado" required fullWidth>
            <select
              id="tm-estado"
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
                : 'Guardar tarifa por millar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default NewTarifaMillarModal
