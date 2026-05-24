import React from 'react'

interface FormFieldProps {
  id: string
  label: string
  required?: boolean
  fullWidth?: boolean
  hint?: string
  children: React.ReactNode
}

const FormField: React.FC<FormFieldProps> = ({
  id,
  label,
  required,
  fullWidth,
  hint,
  children,
}) => (
  <div className={fullWidth ? 'record-form-field record-form-field--full' : 'record-form-field'}>
    <label className="record-form-field__label" htmlFor={id}>
      {label}
      {required ? <span className="record-form-field__required">*</span> : null}
    </label>
    {children}
    {hint ? <p className="record-form-field__hint">{hint}</p> : null}
  </div>
)

export default FormField
