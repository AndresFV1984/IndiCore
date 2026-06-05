import React from 'react'

interface CorteFormPanelProps {
  step: string
  title: string
  subtitle?: string
  children: React.ReactNode
  className?: string
}

export const CorteFormPanel: React.FC<CorteFormPanelProps> = ({
  step,
  title,
  subtitle,
  children,
  className,
}) => (
  <section
    className={['production-corte-panel', className].filter(Boolean).join(' ')}
    aria-labelledby={`corte-panel-${step}-title`}
  >
    <header className="production-corte-panel__head">
      <span className="production-corte-panel__step" aria-hidden>
        {step}
      </span>
      <div className="production-corte-panel__titles">
        <h3 className="production-corte-panel__title" id={`corte-panel-${step}-title`}>
          {title}
        </h3>
        {subtitle ? <p className="production-corte-panel__sub">{subtitle}</p> : null}
      </div>
    </header>
    <div className="production-corte-panel__body">{children}</div>
  </section>
)

export const CorteFormGroupLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="production-corte-panel__group-label">{children}</p>
)

interface CorteFormDatumProps {
  label: string
  value: string
  emphasize?: boolean
  muted?: boolean
}

export const CorteFormDatum: React.FC<CorteFormDatumProps> = ({
  label,
  value,
  emphasize = false,
  muted = false,
}) => (
  <div
    className={[
      'production-corte-datum',
      emphasize ? 'production-corte-datum--emphasize' : '',
      muted ? 'production-corte-datum--muted' : '',
    ]
      .filter(Boolean)
      .join(' ')}
  >
    <dt>{label}</dt>
    <dd>{value || '—'}</dd>
  </div>
)

export const CorteFormDatumList: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <dl className="production-corte-datum-list">{children}</dl>
)
