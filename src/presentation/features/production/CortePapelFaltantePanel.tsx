import React, { useMemo } from 'react'
import type { PaperRow } from '../../../core/domain/entities/Order'
import type { DisenoColorPlanchaItem } from '../../../core/domain/entities/PreprensaDiseno'
import { CORTE_PAPEL_COPY as copy } from './constants/cortePapelCopy'
import { findFaltanteRowForParent } from './utils/cortePapelFaltante'

interface CortePapelFaltantePanelProps {
  row: PaperRow
  coloresPlanchas: DisenoColorPlanchaItem[]
  paperRows: PaperRow[]
  /** Cantidad hojas de «Cantidad y valor» (misma fuente que Calculadas). */
  cantidadHojas: number
  onAgregarFaltante: (hojasFaltante: number) => void
  onEditarFaltante: (corteRowId: string) => void
}

const fmtHojas = (value: number): string => value.toLocaleString('es-CO')

const CortePapelFaltantePanel: React.FC<CortePapelFaltantePanelProps> = ({
  row,
  coloresPlanchas,
  paperRows,
  cantidadHojas,
  onAgregarFaltante,
  onEditarFaltante,
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

  const faltanteExistente = useMemo(
    () =>
      row.colorPlanchaId ? findFaltanteRowForParent(paperRows, row.colorPlanchaId) : undefined,
    [paperRows, row.colorPlanchaId]
  )

  const puedeAgregar = tieneDespiece && tieneEntregadas && hojasFaltante > 0 && !faltanteExistente

  if (hojasFaltante <= 0 && !faltanteExistente) return null

  return (
    <div className="production-corte-faltante" role="region" aria-label={faltante.title}>
      <header className="production-corte-faltante__head">
        <div className="production-corte-faltante__head-text">
          <span className="production-corte-faltante__tag">{faltante.tag}</span>
          <h4 className="production-corte-faltante__title">{faltante.title}</h4>
          <p className="production-corte-faltante__hint">{faltante.hint}</p>
        </div>
      </header>

      <div className="production-corte-faltante__equation" aria-label={faltante.formulaAria}>
        <div className="production-corte-faltante__step">
          <span className="production-corte-faltante__step-label">{faltante.calculadasLabel}</span>
          <strong className="production-corte-faltante__step-value">
            {tieneDespiece ? fmtHojas(calculadas) : '—'}
          </strong>
          <span className="production-corte-faltante__step-note">
            {tieneDespiece ? faltante.calculadasNota : faltante.pendienteDespiece}
          </span>
        </div>

        <span className="production-corte-faltante__operator" aria-hidden>
          −
        </span>

        <div className="production-corte-faltante__step production-corte-faltante__step--entregadas">
          <span className="production-corte-faltante__step-label">{faltante.entregadasLabel}</span>
          <strong className="production-corte-faltante__step-value">
            {tieneEntregadas ? fmtHojas(entregadas) : '—'}
          </strong>
          <span className="production-corte-faltante__step-note">
            {tieneEntregadas ? faltante.entregadasNota : faltante.pendienteEntregadas}
          </span>
        </div>

        <span className="production-corte-faltante__operator production-corte-faltante__operator--eq" aria-hidden>
          =
        </span>

        <div
          className={[
            'production-corte-faltante__step',
            'production-corte-faltante__step--result',
            hojasFaltante > 0 ? 'production-corte-faltante__step--alert' : '',
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
              : hojasFaltante > 0
                ? faltante.faltanteNota
                : faltante.sinFaltante}
          </span>
        </div>
      </div>

      <footer className="production-corte-faltante__footer">
        {faltanteExistente?.corteRowId ? (
          <>
            <p className="production-corte-faltante__footer-msg">{faltante.yaExiste}</p>
            <button
              type="button"
              className="production-btn-secondary"
              onClick={() => onEditarFaltante(faltanteExistente.corteRowId!)}
            >
              {faltante.editarRegistro}
            </button>
          </>
        ) : (
          <>
            <p className="production-corte-faltante__footer-msg">
              {puedeAgregar
                ? faltante.agregarLead(hojasFaltante.toLocaleString('es-CO'))
                : !tieneDespiece
                  ? faltante.requiereDespiece
                  : !tieneEntregadas
                    ? faltante.pendienteEntregadas
                    : faltante.sinFaltante}
            </p>
            <button
              type="button"
              className="production-btn-secondary production-btn-secondary--accent"
              disabled={!puedeAgregar}
              onClick={() => onAgregarFaltante(hojasFaltante)}
            >
              {faltante.agregarRegistro}
            </button>
          </>
        )}
      </footer>
    </div>
  )
}

export default CortePapelFaltantePanel
