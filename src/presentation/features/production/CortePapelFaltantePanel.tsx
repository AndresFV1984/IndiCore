import React, { useMemo } from 'react'
import type { PaperRow } from '../../../core/domain/entities/Order'
import { CORTE_PAPEL_COPY as copy } from './constants/cortePapelCopy'

interface CortePapelFaltantePanelProps {
  row: PaperRow
  /** Cantidad hojas de «Cantidad y valor» (misma fuente que Calculadas). */
  cantidadHojas: number
  /** Dentro de «Datos del corte de papel» (más compacto). */
  embedded?: boolean
}

const fmtHojas = (value: number): string => value.toLocaleString('es-CO')

const CortePapelFaltantePanel: React.FC<CortePapelFaltantePanelProps> = ({
  row,
  cantidadHojas,
  embedded = false,
}) => {
  const faltante = copy.faltante
  const tieneDespiece = Boolean(row.despiece?.despieceId && (row.despiece?.piezasPorPliego ?? 0) > 0)
  const entregadas = Math.max(0, row.hojasEntregadasCliente ?? 0)
  const tieneEntregadas = entregadas > 0

  const { calculadas, hojasFaltante } = useMemo(() => {
    const calculadasVal = tieneDespiece ? Math.max(0, cantidadHojas) : 0
    return {
      calculadas: calculadasVal,
      hojasFaltante:
        tieneDespiece && tieneEntregadas
          ? Math.max(0, calculadasVal - entregadas)
          : 0,
    }
  }, [cantidadHojas, entregadas, tieneDespiece, tieneEntregadas])

  if (hojasFaltante <= 0) return null

  return (
    <div
      className={[
        'production-corte-faltante',
        embedded ? 'production-corte-faltante--embedded' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      role="region"
      aria-label={faltante.title}
    >
      <header className="production-corte-faltante__head">
        <div className="production-corte-faltante__head-text">
          <span className="production-corte-faltante__tag">{faltante.tag}</span>
          <h4 className="production-corte-faltante__title">{faltante.title}</h4>
          {!embedded ? <p className="production-corte-faltante__hint">{faltante.hint}</p> : null}
        </div>
      </header>

      <div className="production-corte-faltante__equation" aria-label={faltante.formulaAria}>
        <div className="production-corte-faltante__step">
          <span className="production-corte-faltante__step-label">{faltante.calculadasLabel}</span>
          <strong className="production-corte-faltante__step-value">
            {tieneDespiece ? fmtHojas(calculadas) : '—'}
          </strong>
          {!embedded ? (
            <span className="production-corte-faltante__step-note">
              {tieneDespiece ? faltante.calculadasNota : faltante.pendienteDespiece}
            </span>
          ) : null}
        </div>

        <span className="production-corte-faltante__operator" aria-hidden>
          −
        </span>

        <div className="production-corte-faltante__step production-corte-faltante__step--entregadas">
          <span className="production-corte-faltante__step-label">{faltante.entregadasLabel}</span>
          <strong className="production-corte-faltante__step-value">
            {tieneEntregadas ? fmtHojas(entregadas) : '—'}
          </strong>
          {!embedded ? (
            <span className="production-corte-faltante__step-note">
              {tieneEntregadas ? faltante.entregadasNota : faltante.pendienteEntregadas}
            </span>
          ) : null}
        </div>

        <span className="production-corte-faltante__operator production-corte-faltante__operator--eq" aria-hidden>
          =
        </span>

        <div
          className={[
            'production-corte-faltante__step',
            'production-corte-faltante__step--result',
            'production-corte-faltante__step--alert',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <span className="production-corte-faltante__step-label">{faltante.faltanteLabel}</span>
          <strong className="production-corte-faltante__step-value">
            {tieneDespiece && tieneEntregadas ? fmtHojas(hojasFaltante) : '—'}
          </strong>
          <span className="production-corte-faltante__step-note">
            {!tieneDespiece || !tieneEntregadas
              ? faltante.completarParaComparar
              : faltante.faltanteNota}
          </span>
        </div>
      </div>
    </div>
  )
}

export default CortePapelFaltantePanel
