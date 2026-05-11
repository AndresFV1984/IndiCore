import React from 'react'
import clsx from 'clsx'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: { value: string; label: string }[]
  error?: string
}

const Select: React.FC<SelectProps> = ({ label, options, error, className, ...props }) => {
  return (
    <div className="select-wrapper">
      {label && <label className="select-label">{label}</label>}
      <select className={clsx('select', { 'select-error': error }, className)} {...props}>
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <span className="select-error-text">{error}</span>}
    </div>
  )
}

export default Select
