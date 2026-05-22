import React from 'react'
import { YesNoChoice } from '../../../core/domain/entities/PreprensaDiseno'

interface DisenoSiNoChoiceProps {
  name: string
  value: YesNoChoice
  onChange: (value: YesNoChoice) => void
  className?: string
}

const DisenoSiNoChoice: React.FC<DisenoSiNoChoiceProps> = ({
  name,
  value,
  onChange,
  className,
}) => (
  <div
    className={`production-diseno-sino${className ? ` ${className}` : ''}`}
    role="radiogroup"
    aria-label={name}
  >
    <button
      type="button"
      role="radio"
      aria-checked={value === 'si'}
      className={`production-diseno-sino__btn${value === 'si' ? ' production-diseno-sino__btn--on' : ''}`}
      onClick={() => onChange('si')}
    >
      Sí
    </button>
    <button
      type="button"
      role="radio"
      aria-checked={value === 'no'}
      className={`production-diseno-sino__btn${value === 'no' ? ' production-diseno-sino__btn--on' : ''}`}
      onClick={() => onChange('no')}
    >
      No
    </button>
  </div>
)

export default DisenoSiNoChoice
