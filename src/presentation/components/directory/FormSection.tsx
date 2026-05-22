import React from 'react'

interface FormSectionProps {
  title: string
  children: React.ReactNode
}

const FormSection: React.FC<FormSectionProps> = ({ title, children }) => (
  <section className="record-form-section">
    <h3 className="record-form-section__title">{title}</h3>
    <div className="record-form-grid">{children}</div>
  </section>
)

export default FormSection
