import React from 'react'
import { YesNoChoice } from '../../../core/domain/entities/PreprensaDiseno'
import { PREPRENSA_DISENO_COPY as copy } from './constants/preprensaDisenoCopy'
import PreprensaPlanchaSuministroSelector from './PreprensaPlanchaSuministroSelector'

interface PreprensaPlanchaSuministroShellProps {
  value: YesNoChoice
  onChange: (value: YesNoChoice) => void
  disabledValues?: YesNoChoice[]
  variant?: 'default' | 'compact'
}

const PreprensaPlanchaSuministroShell: React.FC<PreprensaPlanchaSuministroShellProps> = ({
  value,
  onChange,
  disabledValues,
  variant = 'default',
}) => (
  <div
    className={[
      'production-diseno-modo-shell production-corte-suministro-shell',
      variant === 'compact' ? 'production-diseno-modo-shell--compact' : '',
    ]
      .filter(Boolean)
      .join(' ')}
    role="region"
    aria-label={copy.planchaSuministro.ariaLabel}
  >
    {variant === 'default' ? (
      <header className="production-diseno-modo-shell__head">
        <span className="production-diseno-modo-shell__tag">{copy.planchaSuministro.tag}</span>
        <div className="production-diseno-modo-shell__titles">
          <h3 className="production-diseno-modo-shell__title">{copy.planchaSuministro.title}</h3>
          <p className="production-diseno-modo-shell__sub">{copy.planchaSuministro.subtitle}</p>
        </div>
      </header>
    ) : (
      <p className="production-diseno-modo-shell__compact-title">{copy.planchaSuministro.title}</p>
    )}
    <PreprensaPlanchaSuministroSelector
      value={value}
      onChange={onChange}
      disabledValues={disabledValues}
    />
    {value === 'si' && (
      <p className="production-diseno-cliente-hint production-diseno-cliente-hint--aviso">
        {copy.planchaSuministro.avisoCliente}
      </p>
    )}
  </div>
)

export default PreprensaPlanchaSuministroShell
