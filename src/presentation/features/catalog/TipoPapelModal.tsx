import React, { useEffect, useMemo, useState } from 'react'
import Modal from '../../components/ui/Modal'
import FormSection from '../../components/directory/FormSection'
import FormField from '../../components/directory/FormField'
import { validateMedidaDimension } from '../../../core/domain/value-objects/MedidaDimensions'
import { CreateTipoPapelDTO, TipoPapel } from '../../../core/domain/entities/TipoPapel'
import type { DespieceAsociado } from '../../../core/domain/entities/CortePapel'
import { useDespiecePliegoHook } from '../../hooks/useDespiecePliego'
import MedidaFields, {
  defaultMedidaFormValues,
  medidaDimensionToForm,
  type MedidaFormValues,
} from './MedidaFields'
import { DespieceAsociadoPicker } from './DespieceAsociadoUI'
import './Catalog.css'

export interface TipoPapelFormValues {
  name: string
  medida: MedidaFormValues
  valorHoja: string
  unidadEmpaque: string
  active: boolean
}

const defaultValues: TipoPapelFormValues = {
  name: '',
  medida: defaultMedidaFormValues,
  valorHoja: '',
  unidadEmpaque: '',
  active: true,
}

interface TipoPapelModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (dto: CreateTipoPapelDTO) => Promise<void>
  item?: TipoPapel | null
}

const TipoPapelModal: React.FC<TipoPapelModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  item,
}) => {
  const isEditing = Boolean(item)
  const { items: despiecesCatalogAll, loading: loadingDespieces } = useDespiecePliegoHook()
  const despiecesCatalog = useMemo(
    () => despiecesCatalogAll.filter(d => d.active),
    [despiecesCatalogAll]
  )
  const [values, setValues] = useState<TipoPapelFormValues>(defaultValues)
  const [selectedDespieces, setSelectedDespieces] = useState<DespieceAsociado[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    setValues(
      item
        ? {
            name: item.name,
            medida: medidaDimensionToForm(item.medidaDimension),
            valorHoja: String(item.valorHoja),
            unidadEmpaque: item.unidadEmpaque,
            active: item.active,
          }
        : defaultValues
    )
    setSelectedDespieces(item?.despiecesPliego?.length ? [...item.despiecesPliego] : [])
    setError(null)
    setSubmitting(false)
  }, [isOpen, item])

  const handleChange = (field: keyof Omit<TipoPapelFormValues, 'medida'>) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setValues(prev => ({ ...prev, [field]: e.target.value }))
    if (error) setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const name = values.name.trim()
    const unidadEmpaque = values.unidadEmpaque.trim()
    const valorHoja = Number(values.valorHoja)
    const medidaErr = validateMedidaDimension(values.medida)

    if (!name) {
      setError('El nombre es obligatorio.')
      return
    }
    if (medidaErr) {
      setError(medidaErr)
      return
    }
    if (!unidadEmpaque) {
      setError('La unidad de empaque es obligatoria.')
      return
    }
    if (values.valorHoja.trim() === '' || Number.isNaN(valorHoja) || valorHoja < 0) {
      setError('Ingrese un valor hoja válido (número mayor o igual a cero).')
      return
    }
    if (selectedDespieces.length === 0) {
      setError('Seleccione al menos un despiece por pliego asociado.')
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
        valorHoja,
        unidadEmpaque,
        active: values.active,
        despiecesPliego: selectedDespieces,
      })
      onClose()
    } catch {
      setError(
        isEditing
          ? 'No se pudo actualizar el tipo de papel. Intenta de nuevo.'
          : 'No se pudo guardar el tipo de papel. Intenta de nuevo.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      title={isEditing ? 'Editar tipo de papel' : 'Nuevo tipo de papel'}
      subtitle={
        isEditing
          ? 'Modifique los datos y pulse Guardar'
          : 'Registre el tipo de papel y asocie uno o más despieces por pliego'
      }
      onClose={onClose}
      maxWidth="680px"
      directoryTone="clients"
    >
      <form className="record-form" onSubmit={handleSubmit} noValidate>
        <FormSection title="Datos del tipo de papel">
          <FormField id="papel-name" label="Nombre" required fullWidth>
            <input
              id="papel-name"
              type="text"
              className="record-form-input"
              value={values.name}
              onChange={handleChange('name')}
              placeholder="Ej. Couché brillante"
              autoFocus
            />
          </FormField>
          <MedidaFields
            idPrefix="papel"
            values={values.medida}
            onChange={medida => setValues(prev => ({ ...prev, medida }))}
          />
          <FormField id="papel-valor-hoja" label="Valor hoja" required fullWidth>
            <input
              id="papel-valor-hoja"
              type="number"
              min={0}
              step={1}
              className="record-form-input"
              value={values.valorHoja}
              onChange={handleChange('valorHoja')}
              placeholder="Ej. 1250"
            />
          </FormField>
          <FormField id="papel-unidad" label="Unidad empaque" required fullWidth>
            <input
              id="papel-unidad"
              type="text"
              className="record-form-input"
              value={values.unidadEmpaque}
              onChange={handleChange('unidadEmpaque')}
              placeholder="Ej. Resma 250 hojas"
            />
          </FormField>
          <FormField id="papel-estado" label="Estado" required fullWidth>
            <select
              id="papel-estado"
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

        <FormSection title="Despieces por pliego asociados">
          <FormField
            id="papel-despiece"
            label="Despiece por pliego asociado"
            required
            fullWidth
            hint="Seleccione del listado. Puede agregar varios; use × para quitar."
          >
            {loadingDespieces ? (
              <p className="catalog-corte-despiece-picker-empty">Cargando despieces…</p>
            ) : despiecesCatalog.length === 0 ? (
              <p className="catalog-corte-despiece-picker-empty">
                No hay despieces activos. Regístrelos en Catálogos › Despiece por pliego.
              </p>
            ) : (
              <DespieceAsociadoPicker
                selectId="papel-despiece"
                catalog={despiecesCatalog}
                selected={selectedDespieces}
                onChange={next => {
                  setSelectedDespieces(next)
                  if (error) setError(null)
                }}
              />
            )}
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
            disabled={submitting || loadingDespieces}
          >
            {submitting
              ? 'Guardando…'
              : isEditing
                ? 'Guardar'
                : 'Guardar tipo de papel'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default TipoPapelModal
