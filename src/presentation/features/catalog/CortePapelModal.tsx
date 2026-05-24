import React, { useEffect, useMemo, useState } from 'react'
import Modal from '../../components/ui/Modal'
import FormSection from '../../components/directory/FormSection'
import FormField from '../../components/directory/FormField'
import { useDespiecePliegoHook } from '../../hooks/useDespiecePliego'
import { useTipoPapelHook } from '../../hooks/useTipoPapel'
import {
  formatTipoPapelOptionLabel,
} from '../production/utils/tipoPapelDisplay'
import {
  CreateCortePapelDTO,
  CortePapel,
  type DespieceAsociado,
} from '../../../core/domain/entities/CortePapel'
import type { DespiecePliego } from '../../../core/domain/entities/DespiecePliego'
import { formatDespiecePliegoOptionLabel } from './cortePapelUtils'
import { DespieceMetrics } from './DespieceAsociadoUI'
import './Catalog.css'

export interface CortePapelFormValues {
  name: string
  tipoPapelId: string
  despieceId: string
}

const defaultValues: CortePapelFormValues = {
  name: '',
  tipoPapelId: '',
  despieceId: '',
}

interface CortePapelModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (dto: CreateCortePapelDTO) => Promise<void>
  item?: CortePapel | null
}

const toAsociado = (item: DespiecePliego): DespieceAsociado => ({
  despieceId: item.id,
  name: item.name,
  ancho: item.ancho,
  alto: item.alto,
  unidadMedida: item.unidadMedida,
  piezasPorPliego: item.piezasPorPliego,
})

const CortePapelModal: React.FC<CortePapelModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  item,
}) => {
  const isEditing = Boolean(item)
  const { items: tiposPapelAll } = useTipoPapelHook()
  const tiposPapel = useMemo(
    () => tiposPapelAll.filter(t => t.active),
    [tiposPapelAll]
  )
  const { items: despiecesCatalogAll, loading: loadingDespieces } = useDespiecePliegoHook()
  const despiecesCatalog = useMemo(
    () => despiecesCatalogAll.filter(d => d.active),
    [despiecesCatalogAll]
  )
  const [values, setValues] = useState<CortePapelFormValues>(defaultValues)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    setValues(
      item
        ? {
            name: item.name,
            tipoPapelId: item.tipoPapelId,
            despieceId: item.despieces[0]?.despieceId ?? '',
          }
        : defaultValues
    )
    setError(null)
    setSubmitting(false)
  }, [isOpen, item])

  const selectedDespiece = useMemo(
    () => despiecesCatalog.find(d => d.id === values.despieceId) ?? null,
    [despiecesCatalog, values.despieceId]
  )

  const handleChange = (field: keyof CortePapelFormValues) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
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
    if (/\d\s*[x×]\s*\d/i.test(name)) {
      setError('El nombre no debe incluir medidas; use solo el nombre del corte.')
      return
    }
    if (!values.tipoPapelId) {
      setError('Seleccione un tipo de papel.')
      return
    }
    const tipoPapel = tiposPapel.find(t => t.id === values.tipoPapelId)
    if (!tipoPapel) {
      setError('Seleccione un tipo de papel válido.')
      return
    }
    if (!values.despieceId) {
      setError('Seleccione un despiece por pliego asociado.')
      return
    }
    const despiece = despiecesCatalog.find(d => d.id === values.despieceId)
    if (!despiece) {
      setError('Seleccione un despiece por pliego válido.')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      await onSubmit({
        id: item?.id,
        name,
        tipoPapelId: values.tipoPapelId,
        ancho: tipoPapel.ancho,
        alto: tipoPapel.alto,
        unidadMedida: tipoPapel.unidadMedida,
        despieces: [toAsociado(despiece)],
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
          : 'Registre el corte con su tipo de papel y un despiece por pliego'
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
            hint="Solo el nombre del corte; la medida del pliego se toma del tipo de papel."
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
          <FormField id="corte-tipo-papel" label="Tipo de papel" required fullWidth>
            {tiposPapel.length === 0 ? (
              <p className="catalog-corte-despiece-picker-empty">
                No hay tipos de papel activos. Regístrelos en Catálogos › Tipo de papel.
              </p>
            ) : (
              <select
                id="corte-tipo-papel"
                className="record-form-input"
                value={values.tipoPapelId}
                onChange={handleChange('tipoPapelId')}
              >
                <option value="">Seleccionar tipo de papel…</option>
                {tiposPapel.map(tipo => (
                  <option key={tipo.id} value={tipo.id}>
                    {formatTipoPapelOptionLabel(tipo)}
                  </option>
                ))}
              </select>
            )}
          </FormField>
          <FormField
            id="corte-despiece"
            label="Despiece por pliego asociado"
            required
            fullWidth
            hint="Obligatorio. Elija el despiece registrado en Catálogos › Despiece por pliego."
          >
            {loadingDespieces ? (
              <p className="catalog-corte-despiece-picker-empty">Cargando despieces…</p>
            ) : despiecesCatalog.length === 0 ? (
              <p className="catalog-corte-despiece-picker-empty">
                No hay despieces activos. Regístrelos en Catálogos › Despiece por pliego.
              </p>
            ) : (
              <select
                id="corte-despiece"
                className="record-form-input"
                value={values.despieceId}
                onChange={handleChange('despieceId')}
              >
                <option value="">Seleccionar despiece por pliego…</option>
                {despiecesCatalog.map(despiece => (
                  <option key={despiece.id} value={despiece.id}>
                    {formatDespiecePliegoOptionLabel(despiece)}
                  </option>
                ))}
              </select>
            )}
          </FormField>
          {selectedDespiece ? (
            <div className="record-form-field record-form-field--full">
              <p className="record-form-field__hint">
                Vista previa:{' '}
                <DespieceMetrics
                  ancho={selectedDespiece.ancho}
                  alto={selectedDespiece.alto}
                  unidadMedida={selectedDespiece.unidadMedida}
                  piezasPorPliego={selectedDespiece.piezasPorPliego}
                  name={selectedDespiece.name}
                  showName
                />
              </p>
            </div>
          ) : null}
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
            {submitting ? 'Guardando…' : isEditing ? 'Guardar' : 'Guardar corte'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default CortePapelModal
