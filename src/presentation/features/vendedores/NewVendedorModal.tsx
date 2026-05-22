import React, { useEffect, useState } from 'react'
import Modal from '../../components/ui/Modal'
import { CreateVendedorDTO, DocumentType, Vendedor } from '../../../core/domain/entities/Vendedor'
import FormSection from '../../components/directory/FormSection'
import FormField from '../../components/directory/FormField'
import { DOCUMENT_TYPE_OPTIONS } from '../../constants/documentTypes'
import { resolveLocationFields } from '../../../core/utils/colombiaLocations'
import DepartmentCityFields, {
  type DepartmentCityValue,
} from '../../components/directory/DepartmentCityFields'

export interface NewVendedorFormValues {
  name: string
  document_type: DocumentType
  identification_number: string
  location: DepartmentCityValue
  address: string
  mail: string
  contact: string
  state: boolean
}

const defaultValues: NewVendedorFormValues = {
  name: '',
  document_type: 'CC',
  identification_number: '',
  location: resolveLocationFields('Medellín'),
  address: '',
  mail: '',
  contact: '',
  state: true,
}

interface NewVendedorModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (dto: CreateVendedorDTO) => Promise<void>
  vendedor?: Vendedor | null
}

const NewVendedorModal: React.FC<NewVendedorModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  vendedor,
}) => {
  const isEditing = Boolean(vendedor)
  const [values, setValues] = useState<NewVendedorFormValues>(defaultValues)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    setValues(
      vendedor
        ? {
            name: vendedor.name,
            document_type: vendedor.document_type,
            identification_number: vendedor.identification_number,
            location: resolveLocationFields(
              vendedor.city,
              vendedor.department,
              vendedor.cityCode,
            ),
            address: vendedor.address,
            mail: vendedor.mail,
            contact: vendedor.contact,
            state: vendedor.state,
          }
        : defaultValues
    )
    setError(null)
    setSubmitting(false)
  }, [isOpen, vendedor])

  const handleChange =
    (field: keyof NewVendedorFormValues) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setValues(prev => ({ ...prev, [field]: e.target.value }))
      if (error) setError(null)
    }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const name = values.name.trim()
    const identification_number = values.identification_number.trim()
    const mail = values.mail.trim()

    if (!name) {
      setError('El nombre es obligatorio.')
      return
    }
    if (!identification_number) {
      setError('El número de identificación es obligatorio.')
      return
    }
    if (!mail) {
      setError('El correo es obligatorio.')
      return
    }
    if (!values.location.department || !values.location.cityCode) {
      setError('Seleccione departamento y ciudad.')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      await onSubmit({
        id: vendedor?.id,
        name,
        document_type: values.document_type,
        identification_number,
        department: values.location.department,
        city: values.location.city,
        cityCode: values.location.cityCode,
        address: values.address.trim(),
        mail,
        contact: values.contact.trim(),
        state: values.state,
      })
      onClose()
    } catch {
      setError(
        isEditing
          ? 'No se pudo actualizar el vendedor. Intenta de nuevo.'
          : 'No se pudo guardar el vendedor. Intenta de nuevo.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      title={isEditing ? 'Editar vendedor' : 'Nuevo vendedor'}
      subtitle={
        isEditing
          ? 'Modifique los datos y pulse Guardar'
          : 'Los campos con * son obligatorios'
      }
      onClose={onClose}
      maxWidth="640px"
      directoryTone="vendedores"
    >
      <form className="record-form" onSubmit={handleSubmit} noValidate>
        <FormSection title="Datos del vendedor">
          <FormField id="vendedor-name" label="Nombre completo" required fullWidth>
            <input
              id="vendedor-name"
              type="text"
              className="record-form-input"
              value={values.name}
              onChange={handleChange('name')}
              autoFocus
            />
          </FormField>
          <FormField id="vendedor-document-type" label="Tipo de documento" required>
            <select
              id="vendedor-document-type"
              className="record-form-input"
              value={values.document_type}
              onChange={handleChange('document_type')}
            >
              {DOCUMENT_TYPE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </FormField>
          <FormField id="vendedor-identification" label="Número de identificación" required>
            <input
              id="vendedor-identification"
              type="text"
              className="record-form-input"
              value={values.identification_number}
              onChange={handleChange('identification_number')}
            />
          </FormField>
          <FormField id="vendedor-mail" label="Correo electrónico" required>
            <input
              id="vendedor-mail"
              type="email"
              className="record-form-input"
              value={values.mail}
              onChange={handleChange('mail')}
              placeholder="vendedor@empresa.com"
            />
          </FormField>
          <FormField id="vendedor-contact" label="Teléfono / contacto">
            <input
              id="vendedor-contact"
              type="text"
              className="record-form-input"
              value={values.contact}
              onChange={handleChange('contact')}
              placeholder="Ej. 300 123 4567"
            />
          </FormField>
          <DepartmentCityFields
            idPrefix="vendedor"
            value={values.location}
            onChange={location => setValues(prev => ({ ...prev, location }))}
            disabled={submitting}
          />
          <FormField id="vendedor-address" label="Dirección" fullWidth>
            <input
              id="vendedor-address"
              type="text"
              className="record-form-input"
              value={values.address}
              onChange={handleChange('address')}
              placeholder="Calle, barrio, referencia"
            />
          </FormField>
          <FormField id="vendedor-state" label="Estado" required>
            <select
              id="vendedor-state"
              className="record-form-input"
              value={values.state ? 'activo' : 'inactivo'}
              onChange={e => setValues(prev => ({ ...prev, state: e.target.value === 'activo' }))}
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
            {submitting ? 'Guardando…' : isEditing ? 'Guardar' : 'Guardar vendedor'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default NewVendedorModal
