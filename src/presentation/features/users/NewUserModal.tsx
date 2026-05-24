import React, { useEffect, useState } from 'react'
import Modal from '../../components/ui/Modal'
import { CreateUserDTO, DocumentType, User } from '../../../core/domain/entities/User'
import { hashPassword } from '../../utils/passwordHash'
import FormSection from '../../components/directory/FormSection'
import FormField from '../../components/directory/FormField'
import { DOCUMENT_TYPE_OPTIONS } from '../../constants/documentTypes'
import { resolveLocationFields } from '../../../core/utils/colombiaLocations'
import DepartmentCityFields, {
  type DepartmentCityValue,
} from '../../components/directory/DepartmentCityFields'

export interface NewUserFormValues {
  name: string
  document_type: DocumentType
  identification_number: string
  location: DepartmentCityValue
  address: string
  mail: string
  contact: string
  password: string
  state: boolean
}

const defaultValues: NewUserFormValues = {
  name: '',
  document_type: 'CC',
  identification_number: '',
  location: resolveLocationFields('Medellín'),
  address: '',
  mail: '',
  contact: '',
  password: '',
  state: true,
}

interface NewUserModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (dto: CreateUserDTO) => Promise<void>
  user?: User | null
}

const NewUserModal: React.FC<NewUserModalProps> = ({ isOpen, onClose, onSubmit, user }) => {
  const isEditing = Boolean(user)
  const [values, setValues] = useState<NewUserFormValues>(defaultValues)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    setValues(
      user
        ? {
            name: user.name,
            document_type: user.document_type,
            identification_number: user.identification_number,
            location: resolveLocationFields(user.city, user.department, user.cityCode),
            address: user.address,
            mail: user.mail,
            contact: user.contact,
            password: '',
            state: user.state,
          }
        : defaultValues
    )
    setError(null)
    setSubmitting(false)
  }, [isOpen, user])

  const handleChange =
    (field: keyof NewUserFormValues) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value =
        field === 'state' ? (e as React.ChangeEvent<HTMLInputElement>).target.checked : e.target.value
      setValues(prev => ({ ...prev, [field]: value }))
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
    if (!isEditing && !values.password.trim()) {
      setError('La contraseña es obligatoria al crear un usuario.')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      let password_hash = user?.password_hash ?? ''
      if (values.password.trim()) {
        password_hash = await hashPassword(values.password.trim())
      } else if (!isEditing) {
        setError('La contraseña es obligatoria al crear un usuario.')
        setSubmitting(false)
        return
      }

      await onSubmit({
        id: user?.id,
        name,
        document_type: values.document_type,
        identification_number,
        department: values.location.department,
        city: values.location.city,
        cityCode: values.location.cityCode,
        address: values.address.trim(),
        mail,
        contact: values.contact.trim(),
        password_hash,
        state: values.state,
      })
      onClose()
    } catch {
      setError(
        isEditing
          ? 'No se pudo actualizar el usuario. Intenta de nuevo.'
          : 'No se pudo guardar el usuario. Intenta de nuevo.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      title={isEditing ? 'Editar usuario' : 'Nuevo usuario'}
      subtitle={
        isEditing
          ? 'Modifique los datos y pulse Guardar'
          : 'Los campos con * son obligatorios'
      }
      onClose={onClose}
      maxWidth="640px"
      directoryTone="users"
    >
      <form className="record-form" onSubmit={handleSubmit} noValidate>
        <FormSection title="Datos personales">
          <FormField id="user-name" label="Nombre completo" required fullWidth>
            <input
              id="user-name"
              type="text"
              className="record-form-input"
              value={values.name}
              onChange={handleChange('name')}
              autoFocus
            />
          </FormField>
          <FormField id="user-document-type" label="Tipo de documento" required>
            <select
              id="user-document-type"
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
          <FormField id="user-identification" label="Número de identificación" required>
            <input
              id="user-identification"
              type="text"
              className="record-form-input"
              value={values.identification_number}
              onChange={handleChange('identification_number')}
            />
          </FormField>
          <FormField id="user-mail" label="Correo electrónico" required>
            <input
              id="user-mail"
              type="email"
              className="record-form-input"
              value={values.mail}
              onChange={handleChange('mail')}
              placeholder="usuario@empresa.com"
            />
          </FormField>
          <FormField id="user-contact" label="Teléfono / contacto">
            <input
              id="user-contact"
              type="text"
              className="record-form-input"
              value={values.contact}
              onChange={handleChange('contact')}
              placeholder="Ej. 300 123 4567"
            />
          </FormField>
          <DepartmentCityFields
            idPrefix="user"
            value={values.location}
            onChange={location => setValues(prev => ({ ...prev, location }))}
            disabled={submitting}
          />
          <FormField id="user-address" label="Dirección" fullWidth>
            <input
              id="user-address"
              type="text"
              className="record-form-input"
              value={values.address}
              onChange={handleChange('address')}
              placeholder="Calle, barrio, referencia"
            />
          </FormField>
        </FormSection>

        <FormSection title="Acceso al sistema">
          <FormField
            id="user-password"
            label="Contraseña"
            required={!isEditing}
            hint={isEditing ? 'Deje vacío para no cambiar la contraseña' : undefined}
          >
            <input
              id="user-password"
              type="password"
              className="record-form-input"
              value={values.password}
              onChange={handleChange('password')}
              autoComplete="new-password"
              placeholder={isEditing ? 'Sin cambios' : 'Mínimo 6 caracteres'}
            />
          </FormField>
          <FormField id="user-state" label="Estado" required>
            <select
              id="user-state"
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
            {submitting ? 'Guardando…' : isEditing ? 'Guardar' : 'Guardar usuario'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default NewUserModal
