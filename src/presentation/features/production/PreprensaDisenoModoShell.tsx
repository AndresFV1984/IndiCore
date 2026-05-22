import React from 'react'
import { YesNoChoice } from '../../../core/domain/entities/PreprensaDiseno'
import DisenoModoSelector from './DisenoModoSelector'

interface PreprensaDisenoModoShellProps {
  value: YesNoChoice
  onChange: (value: YesNoChoice) => void
  className?: string
}

const PreprensaDisenoModoShell: React.FC<PreprensaDisenoModoShellProps> = ({
  value,
  onChange,
  className,
}) => (
  <div
    className={['production-diseno-modo-shell', className].filter(Boolean).join(' ')}
    role="region"
    aria-label="Tipo de diseño"
  >
    <header className="production-diseno-modo-shell__head">
      <span className="production-diseno-modo-shell__tag">Inicio</span>
      <div className="production-diseno-modo-shell__titles">
        <h3 className="production-diseno-modo-shell__title">Tipo de diseño</h3>
        <p className="production-diseno-modo-shell__sub">
          Elija si esta orden requiere crear arte nuevo o reutilizar un diseño ya registrado.
        </p>
      </div>
    </header>
    <DisenoModoSelector value={value} onChange={onChange} hideLead />
  </div>
)

export default PreprensaDisenoModoShell
