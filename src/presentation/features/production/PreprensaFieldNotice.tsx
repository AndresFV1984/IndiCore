import React from 'react'

export type PreprensaNoticeVariant = 'info' | 'warning' | 'error'

interface PreprensaFieldNoticeProps {
  variant?: PreprensaNoticeVariant
  children: React.ReactNode
  id?: string
}

export const PreprensaFieldNotice: React.FC<PreprensaFieldNoticeProps> = ({
  variant = 'warning',
  children,
  id,
}) => (
  <p
    id={id}
    className={[
      'production-preprensa-field-notice',
      `production-preprensa-field-notice--${variant}`,
    ].join(' ')}
    role="status"
  >
    {children}
  </p>
)

interface PreprensaValidationNoticeProps {
  title?: string
  message: string
}

export const PreprensaValidationNotice: React.FC<PreprensaValidationNoticeProps> = ({
  title,
  message,
}) => (
  <p className="production-preprensa-message production-preprensa-message--error" role="alert">
    {title ? (
      <>
        <strong>{title}</strong>
        <br />
      </>
    ) : null}
    {message}
  </p>
)
