import React from 'react'
import { YesNoChoice } from '../../../core/domain/entities/PreprensaDiseno'
import { CORTE_PAPEL_COPY as copy } from './constants/cortePapelCopy'
import CortePapelSuministroSelector from './CortePapelSuministroSelector'

interface CortePapelSuministroShellProps {
  value: YesNoChoice
  onChange: (value: YesNoChoice) => void | Promise<void>
  className?: string
}

const CortePapelSuministroShell: React.FC<CortePapelSuministroShellProps> = ({
  value,
  onChange,
  className,
}) => (
  <div
    className={['production-diseno-modo-shell production-corte-suministro-shell', className]
      .filter(Boolean)
      .join(' ')}
    role="region"
    aria-label={copy.suministro.ariaLabel}
  >
    <header className="production-diseno-modo-shell__head">
      <span className="production-diseno-modo-shell__tag">{copy.suministro.tag}</span>
      <div className="production-diseno-modo-shell__titles">
        <h3 className="production-diseno-modo-shell__title">{copy.suministro.title}</h3>
        <p className="production-diseno-modo-shell__sub">{copy.suministro.subtitle}</p>
      </div>
    </header>
    <CortePapelSuministroSelector value={value} onChange={onChange} hideLead />
  </div>
)

export default CortePapelSuministroShell
