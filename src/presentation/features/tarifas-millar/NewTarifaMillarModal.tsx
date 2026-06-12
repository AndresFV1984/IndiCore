import React, { useEffect, useState } from 'react'
import Modal from '../../components/ui/Modal'
import FormSection from '../../components/directory/FormSection'
import FormField from '../../components/directory/FormField'
import {
  CreateTarifaMillarDTO,
  DEFAULT_MILLAR_MINIMO_VENTA,
  DEFAULT_TARIFA_MILLAR_CATEGORIA,
  DEFAULT_TOPE_MINIMO_MILLAR,
  DEFAULT_UMBRAL_DECIMAL_MILLAR,
  describeTarifaMillarReglaDecimales,
  TARIFA_MILLAR_UNIDAD,
  TarifaMillar,
} from '../../../core/domain/entities/TarifaMillar'

export interface TarifaMillarFormValues {
  name: string
  precio: string
  millarMinimoVenta: string
  topeMinimoMillar: string
  umbralDecimalMillar: string
  precioVolteoPinza: string
  precioVolteoEscuadra: string
  state: boolean
}

const defaultValues: TarifaMillarFormValues = {
  name: '',
  precio: '',
  millarMinimoVenta: String(DEFAULT_MILLAR_MINIMO_VENTA),
  topeMinimoMillar: String(DEFAULT_TOPE_MINIMO_MILLAR),
  umbralDecimalMillar: String(DEFAULT_UMBRAL_DECIMAL_MILLAR),
  precioVolteoPinza: '',
  precioVolteoEscuadra: '',
  state: true,
}

const parseNonNegativeInteger = (raw: string): number | null => {
  const normalized = raw.trim()
  if (!normalized) return null
  const value = Number(normalized)
  if (!Number.isInteger(value) || value < 0) return null
  return value
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
            millarMinimoVenta: String(item.millarMinimoVenta),
            topeMinimoMillar: String(item.topeMinimoMillar),
            umbralDecimalMillar: String(item.umbralDecimalMillar),
            precioVolteoPinza:
              item.precioVolteoPinza > 0 ? String(item.precioVolteoPinza) : '',
            precioVolteoEscuadra:
              item.precioVolteoEscuadra > 0 ? String(item.precioVolteoEscuadra) : '',
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
    const precio = Number(values.precio)
    const umbralDecimalMillar = Number(values.umbralDecimalMillar.replace(',', '.'))
    const millarMinimoVenta = parseNonNegativeInteger(values.millarMinimoVenta)
    const topeMinimoMillar = parseNonNegativeInteger(values.topeMinimoMillar)
    const precioVolteoPinzaRaw = values.precioVolteoPinza.trim()
    const precioVolteoEscuadraRaw = values.precioVolteoEscuadra.trim()
    const precioVolteoPinza =
      precioVolteoPinzaRaw === '' ? 0 : Number(precioVolteoPinzaRaw)
    const precioVolteoEscuadra =
      precioVolteoEscuadraRaw === '' ? 0 : Number(precioVolteoEscuadraRaw)

    if (!name) {
      setError('El nombre es obligatorio.')
      return
    }
    if (values.precio.trim() === '' || Number.isNaN(precio) || precio < 0) {
      setError('Ingrese un precio válido (número mayor o igual a cero).')
      return
    }
    if (millarMinimoVenta === null) {
      setError('Ingrese un millar mínimo válido (entero mayor o igual a cero).')
      return
    }
    if (topeMinimoMillar === null) {
      setError('Ingrese un tope mínimo millar válido (entero mayor o igual a cero).')
      return
    }
    if (
      values.umbralDecimalMillar.trim() === '' ||
      Number.isNaN(umbralDecimalMillar) ||
      umbralDecimalMillar < 0 ||
      umbralDecimalMillar > 1
    ) {
      setError('Ingrese un umbral decimal válido entre 0 y 1 (ej. 0,2).')
      return
    }
    if (
      precioVolteoPinzaRaw !== '' &&
      (Number.isNaN(precioVolteoPinza) || precioVolteoPinza < 0)
    ) {
      setError('Ingrese un precio de volteo por pinza válido (número mayor o igual a cero).')
      return
    }
    if (
      precioVolteoEscuadraRaw !== '' &&
      (Number.isNaN(precioVolteoEscuadra) || precioVolteoEscuadra < 0)
    ) {
      setError('Ingrese un precio de volteo por escuadra válido (número mayor o igual a cero).')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      await onSubmit({
        id: item?.id,
        name,
        precio,
        categoria: item?.categoria ?? DEFAULT_TARIFA_MILLAR_CATEGORIA,
        descripcion: item?.descripcion ?? '',
        millarMinimoVenta,
        topeMinimoMillar,
        umbralDecimalMillar,
        precioVolteoPinza,
        precioVolteoEscuadra,
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

  const umbralHint = describeTarifaMillarReglaDecimales(
    Number(values.umbralDecimalMillar.replace(',', '.')) || DEFAULT_UMBRAL_DECIMAL_MILLAR
  )

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

        <FormSection title="Reglas de millar y volteo">
          <FormField
            id="tm-tope-minimo"
            label="Tope mínimo millar"
            required
            fullWidth
            hint="Cantidad mínima en unidades para aplicar reglas de cobro por millar."
          >
            <input
              id="tm-tope-minimo"
              type="number"
              min={0}
              step={1}
              className="record-form-input"
              value={values.topeMinimoMillar}
              onChange={handleChange('topeMinimoMillar')}
              placeholder={`Ej. ${DEFAULT_TOPE_MINIMO_MILLAR}`}
            />
          </FormField>
          <FormField
            id="tm-millar-minimo"
            label="Millar mínimo"
            required
            fullWidth
            hint="Millar mínimo de venta asociado a la tarifa."
          >
            <input
              id="tm-millar-minimo"
              type="number"
              min={0}
              step={1}
              className="record-form-input"
              value={values.millarMinimoVenta}
              onChange={handleChange('millarMinimoVenta')}
              placeholder={`Ej. ${DEFAULT_MILLAR_MINIMO_VENTA}`}
            />
          </FormField>
          <FormField
            id="tm-umbral-decimal"
            label="Umbral decimal"
            required
            fullWidth
            hint={umbralHint}
          >
            <input
              id="tm-umbral-decimal"
              type="number"
              min={0}
              max={1}
              step={0.1}
              className="record-form-input"
              value={values.umbralDecimalMillar}
              onChange={handleChange('umbralDecimalMillar')}
              placeholder="Ej. 0,2"
            />
          </FormField>
          <FormField
            id="tm-volteo-pinza"
            label="Volteo por pinza"
            fullWidth
            hint="Precio por millar con volteo por pinza. Déjelo vacío si no aplica."
          >
            <input
              id="tm-volteo-pinza"
              type="number"
              min={0}
              step={1}
              className="record-form-input"
              value={values.precioVolteoPinza}
              onChange={handleChange('precioVolteoPinza')}
              placeholder="Ej. 20000"
            />
          </FormField>
          <FormField
            id="tm-volteo-escuadra"
            label="Volteo por escuadra"
            fullWidth
            hint="Precio por millar con volteo por escuadra. Déjelo vacío si no aplica."
          >
            <input
              id="tm-volteo-escuadra"
              type="number"
              min={0}
              step={1}
              className="record-form-input"
              value={values.precioVolteoEscuadra}
              onChange={handleChange('precioVolteoEscuadra')}
              placeholder="Ej. 20000"
            />
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
