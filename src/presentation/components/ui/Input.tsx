import React from 'react'
import clsx from 'clsx'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Input: React.FC<InputProps> = ({ label, error, className, ...props }) => {
  return (
    <div className="input-wrapper">
      {label && <label className="input-label">{label}</label>}
      <input className={clsx('input', { 'input-error': error }, className)} {...props} />
      {error && <span className="input-error-text">{error}</span>}
    </div>
  )
}

export default Input
