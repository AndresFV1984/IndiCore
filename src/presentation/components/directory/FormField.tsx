import React from 'react'
const FormField: React.FC<{ id: string; label: string; required?: boolean; fullWidth?: boolean; children: React.ReactNode }> = ({ id, label, required, fullWidth, children }) => (
  <div className={fullWidth ? 'record-form-field record-form-field--full' : 'record-form-field'}>
    <label htmlFor={id}>{label}{required && ' *'}</label>{children}</div>
)
export default FormField
