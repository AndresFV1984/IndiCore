import React, { useEffect, useMemo, useState } from 'react'
import Modal from '../../components/ui/Modal'
import FormSection from '../../components/directory/FormSection'
import FormField from '../../components/directory/FormField'
import { validateMedidaDimension } from '../../../core/domain/value-objects/MedidaDimensions'
import { useDespiecePliegoHook } from '../../hooks/useDespiecePliego'
import {
  CreateCortePapelDTO,
  CortePapel,
  type DespieceAsociado,
} from '../../../core/domain/entities/CortePapel'
import { DespieceAsociadoPicker } from './DespieceAsociadoUI'
import MedidaFields, {
  defaultMedidaFormValues,
  medidaDimensionToForm,
  type MedidaFormValues,
} from './MedidaFields'
import './Catalog.css'

export interface CortePapelFormValues {
  name: string
  medida: MedidaFormValues
}

const defaultValues: CortePapelFormValues = {
  name: '',
  medida: defaultMedidaFormValues,
}

interface CortePapelModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (dto: CreateCortePapelDTO) => Promise<void>
  item?: CortePapel | null
}

const CortePapelModal: React.FC<CortePapelModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  item,
}) => {
  const isEditing = Boolean(item)
  const { items: despiecesCatalogAll } = useDespiecePliegoHook()
  const despiecesCatalog = useMemo(
    () => despiecesCatalogAll.filter(d => d.active),
    [despiecesCatalogAll]
  )
  const [values, setValues] = useState<CortePapelFormValues>(defaultValues)
  const [selectedDespieces, setSelectedDespieces] = useState<DespieceAsociado[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    setValues(
      item
        ? { name: item.name, medida: medidaDimensionToForm(item.medidaDimension) }
        : defaultValues
    )
    setSelectedDespieces(item?.despieces?.length ? [item.despieces[0]] : [])
    setError(null)
    setSubmitting(false)
  }, [isOpen, item])

  const handleChange = (field: keyof Omit<CortePapelFormValues, 'medida'>) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setValues(prev => ({ ...prev, [field]: e.target.value }))
    if (error) setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const name = values.name.trim()
    const medidaErr = validateMedidaDimension(values.medida)

    if (!name) {
      setError('El nombre es obligatorio.')
      return
    }
    if (/\d\s*[x×]\s*\d/i.test(name)) {
      setError('El nombre no debe incluir medidas; indíquelas en «Medida del pliego» y en los despieces.')
      return
    }
    if (medidaErr) {
      setError(medidaErr)
      return
    }
    if (selectedDespieces.length !== 1) {
      setError('Seleccione un despiece por pliego asociado.')
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
        despieces: selectedDespieces.slice(0, 1),
      })
      onClose()
    } catch {
      setError(
        isEditing
          ? 'No se pudo actualizar el corte. Intenta de nuevo.'
          : 'No se pudo guardar el corte. Intenta de nuevo.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      title={isEditing ? 'Editar corte de papel' : 'Nuevo corte de papel'}
      subtitle={
        isEditing
          ? 'Modifique los datos y pulse Guardar'
          : 'Registre el corte con su medida y un despiece por pliego'
      }
      onClose={onClose}
      maxWidth="680px"
      directoryTone="clients"
    >
      <form className="record-form" onSubmit={handleSubmit} noValidate>
        <FormSection title="Datos del corte">
          <FormField
            id="corte-name"
            label="Nombre"
            required
            hint="Solo el tipo de corte; las medidas van en los campos siguientes."
            fullWidth
          >
            <input
              id="corte-name"
              type="text"
              className="record-form-input"
              value={values.name}
              onChange={handleChange('name')}
              placeholder="Ej. Corte etiqueta"
              autoFocus
            />
          </FormField>
          <MedidaFields
            idPrefix="corte"
            label="Medida del pliego"
            values={values.medida}
            onChange={medida => setValues(prev => ({ ...prev, medida }))}
          />
        </FormSection>

        <FormSection title="Despiece por pliego asociado">
          <DespieceAsociadoPicker
            catalog={despiecesCatalog}
            selected={selectedDespieces}
            onChange={setSelectedDespieces}
            single
          />
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
            {submitting ? 'Guardando…' : isEditing ? 'Guardar' : 'Guardar corte'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default CortePapelModal
