import React from 'react'
import clsx from 'clsx'

export interface ProduccionCobroFormulaCopy {
  summary: string
  pasoCostoTitulo: string
  pasoCobroTitulo: string
  pasoTotalTitulo: string
  costoCalculadoRule: string
  cobroRule: string
  totalRule: string
  hint: string
}

interface TerminadosCobroFormulaDetailsProps {
  formulaCopy: ProduccionCobroFormulaCopy
  className?: string
  showTotalStep?: boolean
}

const TerminadosCobroFormulaDetails: React.FC<TerminadosCobroFormulaDetailsProps> = ({
  formulaCopy,
  className,
  showTotalStep = false,
}) => {
  const steps = [
    { stepRule: formulaCopy.costoCalculadoRule },
    { stepRule: formulaCopy.cobroRule },
    ...(showTotalStep ? [{ stepRule: formulaCopy.totalRule }] : []),
  ]

  return (
    <details className={clsx('production-terminados-cobro-formula', className)}>
      <summary>{formulaCopy.summary}</summary>
      <ol className="production-terminados-cobro-formula__steps">
        {steps.map((step, index) => (
          <li key={step.stepRule} className="production-terminados-cobro-formula__step">
            <span className="production-terminados-cobro-formula__step-tag">
              {index === 0
                ? formulaCopy.pasoCostoTitulo
                : index === 1
                  ? formulaCopy.pasoCobroTitulo
                  : formulaCopy.pasoTotalTitulo}
            </span>
            <span className="production-terminados-cobro-formula__step-rule">{step.stepRule}</span>
          </li>
        ))}
      </ol>
      <p className="production-terminados-cobro-formula__hint">{formulaCopy.hint}</p>
    </details>
  )
}

export default TerminadosCobroFormulaDetails
