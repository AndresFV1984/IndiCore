import React from 'react'
import clsx from 'clsx'

export type ConversionImagenStepState = 'locked' | 'active' | 'complete'

export interface ConversionImagenFlowShellProps {
  sectionId: string
  title: string
  subtitle?: string
  status?: ConversionImagenStepState
  children: React.ReactNode
  className?: string
}

const ConversionImagenFlowShell: React.FC<ConversionImagenFlowShellProps> = ({
  sectionId,
  title,
  subtitle,
  status = 'active',
  children,
  className,
}) => (
  <section
    id={`conversion-imagen-step-${sectionId}`}
    className={clsx(
      'production-impresion-estimar-tintas-step',
      `production-impresion-estimar-tintas-step--${status}`,
      className
    )}
    aria-labelledby={`conversion-imagen-step-title-${sectionId}`}
  >
    <header className="production-impresion-estimar-tintas-step__head">
      <div className="production-impresion-estimar-tintas-step__titles">
        <h3
          className="production-impresion-estimar-tintas-step__title"
          id={`conversion-imagen-step-title-${sectionId}`}
        >
          {title}
        </h3>
        {subtitle ? <p className="production-impresion-estimar-tintas-step__sub">{subtitle}</p> : null}
      </div>
    </header>
    <div className="production-impresion-estimar-tintas-step__body">{children}</div>
  </section>
)

export default ConversionImagenFlowShell
