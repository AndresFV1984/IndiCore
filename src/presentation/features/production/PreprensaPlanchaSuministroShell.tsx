import React from 'react'
import { YesNoChoice } from '../../../core/domain/entities/PreprensaDiseno'
import { PREPRENSA_DISENO_COPY as copy } from './constants/preprensaDisenoCopy'
import PreprensaPlanchaSuministroSelector from './PreprensaPlanchaSuministroSelector'

interface PreprensaPlanchaSuministroShellProps {
  value: YesNoChoice
  onChange: (value: YesNoChoice) => void
}

const PreprensaPlanchaSuministroShell: React.FC<PreprensaPlanchaSuministroShellProps> = ({
  value,
  onChange,
}) => (
  <div
    className="production-diseno-modo-shell production-corte-suministro-shell"
    role="region"
    aria-label={copy.planchaSuministro.ariaLabel}
  >
    <header className="production-diseno-modo-shell__head">
      <span className="production-diseno-modo-shell__tag">{copy.planchaSuministro.tag}</span>
      <div className="production-diseno-modo-shell__titles">
        <h3 className="production-diseno-modo-shell__title">{copy.planchaSuministro.title}</h3>
        <p className="production-diseno-modo-shell__sub">{copy.planchaSuministro.subtitle}</p>
      </div>
    </header>
    <PreprensaPlanchaSuministroSelector value={value} onChange={onChange} />
    {value === 'si' && (
      <p className="production-diseno-cliente-hint production-diseno-cliente-hint--aviso">
        {copy.planchaSuministro.avisoCliente}
      </p>
    )}
  </div>
)

export default PreprensaPlanchaSuministroShell
