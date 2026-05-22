import React, { useEffect, useState } from 'react'
import Modal from '../../components/ui/Modal'
import { Client, CreateClientDTO } from '../../../core/domain/entities/Client'
import { resolveLocationFields } from '../../../core/utils/colombiaLocations'
import FormSection from '../../components/directory/FormSection'
import FormField from '../../components/directory/FormField'
import DepartmentCityFields, {
  type DepartmentCityValue,
} from '../../components/directory/DepartmentCityFields'

export interface NewClientFormValues {
  name: string
  nit: string
  phone: string
  location: DepartmentCityValue
  address: string
  email: string
  contact: string
}

const defaultLocation = resolveLocationFields('Medellín')

const defaultValues: NewClientFormValues = {
  name: '',
  nit: '',
  phone: '',
  location: defaultLocation,
  address: '',
  email: '',
  contact: '',
}

interface NewClientModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (dto: CreateClientDTO) => Promise<void>
  client?: Client | null
}

const NewClientModal: React.FC<NewClientModalProps> = ({ isOpen, onClose, onSubmit, client }) => {
  const isEditing = Boolean(client)
  const [values, setValues] = useState<NewClientFormValues>(defaultValues)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    setValues(
      client
        ? {
            name: client.name,
            nit: client.nit,
            phone: client.phone,
            location: resolveLocationFields(client.city, client.department, client.cityCode),
            address: client.address,
            email: client.email,
            contact: client.contact,
          }
        : defaultValues
    )
    setError(null)
    setSubmitting(false)
  }, [isOpen, client])

  const handleChange = (field: keyof Omit<NewClientFormValues, 'location'>) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setValues(prev => ({ ...prev, [field]: e.target.value }))
    if (error) setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const name = values.name.trim()
    if (!name) {
      setError('El nombre o razón social es obligatorio.')
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
        id: client?.id,
        name,
        nit: values.nit.trim(),
        phone: values.phone.trim(),
        department: values.location.department,
        city: values.location.city,
        cityCode: values.location.cityCode,
        address: values.address.trim(),
        email: values.email.trim(),
        contact: values.contact.trim(),
        active: client?.active ?? true,
      })
      onClose()
    } catch {
      setError(
        isEditing
          ? 'No se pudo actualizar el cliente. Intenta de nuevo.'
          : 'No se pudo guardar el cliente. Intenta de nuevo.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      title={isEditing ? 'Editar cliente' : 'Nuevo cliente'}
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
        <FormSection title="Datos del cliente">
          <FormField id="client-name" label="Nombre o razón social" required fullWidth>
            <input
              id="client-name"
              type="text"
              className="record-form-input"
              value={values.name}
              onChange={handleChange('name')}
              autoFocus
            />
          </FormField>
          <FormField id="client-nit" label="NIT / C.C.">
            <input
              id="client-nit"
              type="text"
              className="record-form-input"
              value={values.nit}
              onChange={handleChange('nit')}
              placeholder="Ej. 900123456-1"
            />
          </FormField>
          <DepartmentCityFields
            idPrefix="client"
            value={values.location}
            onChange={location => setValues(prev => ({ ...prev, location }))}
            disabled={submitting}
          />
          <FormField id="client-address" label="Dirección" fullWidth>
            <input
              id="client-address"
              type="text"
              className="record-form-input"
              value={values.address}
              onChange={handleChange('address')}
              placeholder="Calle, barrio, referencia"
            />
          </FormField>
        </FormSection>

        <FormSection title="Contacto">
          <FormField id="client-phone" label="Teléfono">
            <input
              id="client-phone"
              type="tel"
              className="record-form-input"
              value={values.phone}
              onChange={handleChange('phone')}
              placeholder="Ej. 604 123 4567"
            />
          </FormField>
          <FormField id="client-email" label="Correo electrónico">
            <input
              id="client-email"
              type="email"
              className="record-form-input"
              value={values.email}
              onChange={handleChange('email')}
              placeholder="correo@empresa.com"
            />
          </FormField>
          <FormField id="client-contact" label="Persona de contacto" fullWidth>
            <input
              id="client-contact"
              type="text"
              className="record-form-input"
              value={values.contact}
              onChange={handleChange('contact')}
              placeholder="Nombre del contacto principal"
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
            {submitting ? 'Guardando…' : isEditing ? 'Guardar' : 'Guardar cliente'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default NewClientModal
