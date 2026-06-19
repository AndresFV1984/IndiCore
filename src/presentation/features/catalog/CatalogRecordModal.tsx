import React, { useEffect, useState } from 'react'
import Modal from '../../components/ui/Modal'
import FormSection from '../../components/directory/FormSection'
import FormField from '../../components/directory/FormField'
import type { CatalogRecord, CatalogRecordFormValues, CatalogRecordVariant } from './catalogRecord'
import {
  CATALOG_COSTO_MINIMO_LABEL,
  CATALOG_VALOR_CM2_HINT,
  CATALOG_VALOR_CM2_LABEL,
  DEFAULT_CATALOG_VALOR_CM_CUADRADO,
  isReservaUvTerminado,
  isEstampadoTerminado,
  normalizeCatalogIntegerField,
  normalizeCatalogUnitCost,
  normalizeCatalogValorCmCuadrado,
} from './catalogRecord'
import './Catalog.css'

const defaultValues: CatalogRecordFormValues = {
  name: '',
  quickAccess: false,
  cost: '',
  valorCmCuadrado: DEFAULT_CATALOG_VALOR_CM_CUADRADO,
  positivo: '0',
  clise: '0',
}

const COPY: Record<
  CatalogRecordVariant,
  {
    newTitle: string
    editTitle: string
    sectionTitle: string
    submitNew: string
    submitEdit: string
  }
> = {
  terminado: {
    newTitle: 'Nuevo terminado',
    editTitle: 'Editar terminado',
    sectionTitle: 'Datos del terminado',
    submitNew: 'Guardar terminado',
    submitEdit: 'Guardar',
  },
  operacion: {
    newTitle: 'Nueva operación de acabado',
    editTitle: 'Editar operación de acabado',
    sectionTitle: 'Datos de la operación',
    submitNew: 'Guardar operación',
    submitEdit: 'Guardar',
  },
}

interface CatalogRecordModalProps {
  variant: CatalogRecordVariant
  isOpen: boolean
  onClose: () => void
  onSubmit: (values: CatalogRecordFormValues) => void | Promise<void>
  item?: CatalogRecord | null
}

const CatalogRecordModal: React.FC<CatalogRecordModalProps> = ({
  variant,
  isOpen,
  onClose,
  onSubmit,
  item,
}) => {
  const isEditing = Boolean(item)
  const copy = COPY[variant]
  const showReservaUvPositivoField =
    variant === 'terminado' && Boolean(item && isReservaUvTerminado(item))
  const showEstampadoCliseField =
    variant === 'terminado' && Boolean(item && isEstampadoTerminado(item))
  const [values, setValues] = useState<CatalogRecordFormValues>(defaultValues)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    setValues(
      item
        ? {
            name: item.name,
            quickAccess: item.quickAccess ?? false,
            cost:
              item.cost && item.cost !== '—' ? normalizeCatalogUnitCost(item.cost) : '',
            valorCmCuadrado: normalizeCatalogValorCmCuadrado(item.valorCmCuadrado),
            positivo: normalizeCatalogIntegerField(item.positivo),
            clise: normalizeCatalogIntegerField(item.clise),
          }
        : defaultValues
    )
    setError(null)
    setSubmitting(false)
  }, [isOpen, item])

  const handleChange = (field: 'name' | 'cost' | 'valorCmCuadrado' | 'positivo' | 'clise') => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setValues(prev => ({ ...prev, [field]: e.target.value }))
    if (error) setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const name = values.name.trim()
    if (!name) {
      setError('El nombre es obligatorio.')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      await onSubmit({
        name,
        quickAccess: values.quickAccess,
        cost: normalizeCatalogUnitCost(values.cost),
        valorCmCuadrado: normalizeCatalogValorCmCuadrado(values.valorCmCuadrado),
        positivo: normalizeCatalogIntegerField(values.positivo),
        clise: normalizeCatalogIntegerField(values.clise),
      })
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      title={isEditing ? copy.editTitle : copy.newTitle}
      subtitle={
        isEditing
          ? 'Modifique los datos y pulse Guardar'
          : 'Los campos con * son obligatorios'
      }
      onClose={onClose}
      maxWidth="560px"
      directoryTone="clients"
    >
      <form className="record-form" onSubmit={handleSubmit} noValidate>
        <FormSection title={copy.sectionTitle}>
          <FormField id={`${variant}-name`} label="Nombre" required fullWidth>
            <input
              id={`${variant}-name`}
              type="text"
              className="record-form-input"
              value={values.name}
              onChange={handleChange('name')}
              placeholder={
                variant === 'terminado'
                  ? 'Ej. Laminado mate'
                  : 'Ej. Plegar, Embolcar'
              }
              autoFocus
            />
          </FormField>
          <FormField
            id={`${variant}-cost`}
            label={CATALOG_COSTO_MINIMO_LABEL}
            hint="Valor numérico sin símbolo $ (deje vacío si no aplica)"
            fullWidth
          >
            <input
              id={`${variant}-cost`}
              type="text"
              className="record-form-input"
              value={values.cost}
              onChange={handleChange('cost')}
              placeholder="Ej. 18.000"
            />
          </FormField>
          <FormField
            id={`${variant}-valor-cm-cuadrado`}
            label={CATALOG_VALOR_CM2_LABEL}
            hint={CATALOG_VALOR_CM2_HINT}
            fullWidth
          >
            <input
              id={`${variant}-valor-cm-cuadrado`}
              type="text"
              className="record-form-input"
              value={values.valorCmCuadrado}
              onChange={handleChange('valorCmCuadrado')}
              placeholder="Ej. 5000"
            />
          </FormField>
          {showReservaUvPositivoField ? (
            <FormField
              id={`${variant}-positivo`}
              label="Positivo"
              hint="Valor al asignar Reserva UV en producción (0 si no aplica)."
              fullWidth
            >
              <input
                id={`${variant}-positivo`}
                type="number"
                min={0}
                step={1}
                className="record-form-input"
                value={values.positivo}
                onChange={handleChange('positivo')}
                placeholder="0"
              />
            </FormField>
          ) : null}
          {showEstampadoCliseField ? (
            <FormField
              id={`${variant}-clise`}
              label="Clise"
              hint="Valor al asignar Estampado en producción (0 si no aplica)."
              fullWidth
            >
              <input
                id={`${variant}-clise`}
                type="number"
                min={0}
                step={1}
                className="record-form-input"
                value={values.clise}
                onChange={handleChange('clise')}
                placeholder="0"
              />
            </FormField>
          ) : null}
          <div
            className={`record-form-field record-form-field--full catalog-quick-access-field catalog-quick-access-field--${variant}`}
          >
            <label
              className="catalog-quick-access-option"
              htmlFor={`${variant}-quick-access`}
            >
              <input
                id={`${variant}-quick-access`}
                type="checkbox"
                className="catalog-quick-access-option__checkbox"
                checked={values.quickAccess}
                onChange={e =>
                  setValues(prev => ({ ...prev, quickAccess: e.target.checked }))
                }
              />
              <span className="catalog-quick-access-option__content">
                <span className="catalog-quick-access-option__title">Acceso rápido</span>
                <span className="catalog-quick-access-option__description">
                  {variant === 'terminado'
                    ? 'Muestra este terminado en la barra de selección rápida al configurar una orden de producción.'
                    : 'Muestra esta operación en la barra de selección rápida al configurar una orden de producción.'}
                </span>
              </span>
            </label>
          </div>
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
                ? copy.submitEdit
                : copy.submitNew}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default CatalogRecordModal
