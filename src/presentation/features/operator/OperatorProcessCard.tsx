import React from 'react'
import clsx from 'clsx'
import type { ProductionTracePauseReasonId } from '../../../core/domain/entities/ProductionTrace'
import { PRODUCTION_TRACE_PAUSE_REASONS } from '../../../core/domain/entities/ProductionTrace'
import type { ProductionOperatorProcessRow } from '../../../core/domain/services/productionOperatorWorkflow'
import { formatDurationMs } from '../trazabilidad/utils/buildOperarioTraceReport'
import type { OperatorProcessTraceMetrics } from './utils/operatorProcessTraceUtils'
import { OPERATOR_WORK_COPY as copy } from './constants/operatorWorkCopy'

const PAUSE_REASON_OPTIONS = Object.entries(PRODUCTION_TRACE_PAUSE_REASONS) as Array<
  [ProductionTracePauseReasonId, string]
>

export interface OperatorProcessCardProps {
  row: ProductionOperatorProcessRow
  trace: OperatorProcessTraceMetrics
  prerequisiteLabel?: string | null
  draftUnits: string
  draftNote: string
  draftPauseReason: ProductionTracePauseReasonId
  saving: boolean
  onDraftUnitsChange: (value: string) => void
  onDraftNoteChange: (value: string) => void
  onDraftPauseReasonChange: (value: ProductionTracePauseReasonId) => void
  onStartProcess: () => void
  onRegisterProgress: () => void
  onRegisterDelivery: () => void
  onPause: () => void
  onResume: () => void
}

const OperatorProcessCard: React.FC<OperatorProcessCardProps> = ({
  row,
  trace,
  prerequisiteLabel,
  draftUnits,
  draftNote,
  draftPauseReason,
  saving,
  onDraftUnitsChange,
  onDraftNoteChange,
  onDraftPauseReasonChange,
  onStartProcess,
  onRegisterProgress,
  onRegisterDelivery,
  onPause,
  onResume,
}) => {
  const pct = row.totalUnits > 0 ? Math.round((row.completedUnits / row.totalUnits) * 100) : 0
  const progressBlocked = !row.canRegisterProgress && row.completedUnits < row.totalUnits
  const maxProgress = Math.max(0, Math.min(row.totalUnits, row.availableUnits) - row.completedUnits)

  const statusLabel =
    row.status === 'terminado'
      ? copy.status.done
      : progressBlocked
        ? copy.status.blocked
        : row.status === 'en-proceso'
          ? copy.status.inProcess
          : copy.status.pending

  return (
    <article
      className={clsx(
        'operator-process-card',
        row.status === 'terminado' && 'operator-process-card--done',
        row.status === 'en-proceso' && 'operator-process-card--active',
        progressBlocked && 'operator-process-card--blocked',
        trace.isPausedNow && 'operator-process-card--paused'
      )}
    >
      <header className="operator-process-card__head">
        <div className="operator-process-card__title-wrap">
          <h4 className="operator-process-card__title">{row.label}</h4>
          <p className="operator-process-card__meta">
            {pct}% · {row.completedUnits.toLocaleString('es-CO')} de{' '}
            {row.totalUnits.toLocaleString('es-CO')} u
            {row.status === 'en-proceso' ? ` · ${copy.workspace.remaining}: ${row.pendingUnits.toLocaleString('es-CO')}` : ''}
          </p>
        </div>
        <span
          className={clsx(
            'operator-process-card__badge',
            row.status === 'terminado' && 'operator-process-card__badge--done',
            row.status === 'en-proceso' && 'operator-process-card__badge--active',
            progressBlocked && 'operator-process-card__badge--blocked'
          )}
        >
          {statusLabel}
        </span>
      </header>

      <div className="operator-process-card__progress" aria-hidden>
        <span style={{ width: `${pct}%` }} />
      </div>

      <div className="operator-process-card__stats operator-process-card__stats--four">
        <div>
          <span>{copy.table.total}</span>
          <strong>{row.totalUnits.toLocaleString('es-CO')}</strong>
        </div>
        <div>
          <span>{copy.table.completed}</span>
          <strong>{row.completedUnits.toLocaleString('es-CO')}</strong>
        </div>
        <div>
          <span>{copy.table.delivered}</span>
          <strong>{(row.deliveredUnits ?? 0).toLocaleString('es-CO')}</strong>
        </div>
        <div>
          <span>{copy.table.pending}</span>
          <strong>{row.pendingUnits.toLocaleString('es-CO')}</strong>
        </div>
      </div>

      {row.assignedToUser ? (
        <div className="operator-process-card__actions">
          {progressBlocked ? (
            <p className="operator-process-card__hint">
              {copy.alerts.prerequisite(prerequisiteLabel ?? copy.status.pending)}
            </p>
          ) : null}

          <div className="operator-process-card__action-row">
            <button
              type="button"
              className="operator-process-card__btn operator-process-card__btn--ghost"
              disabled={saving || row.status === 'terminado' || progressBlocked}
              onClick={onStartProcess}
            >
              {copy.actions.startProcess}
            </button>

            <div className="operator-process-card__qty">
              <input
                type="text"
                inputMode="numeric"
                className="operator-process-card__qty-input"
                placeholder={copy.actions.unitsPlaceholder}
                value={draftUnits}
                disabled={saving || row.status === 'terminado' || !row.canRegisterProgress}
                onChange={event => onDraftUnitsChange(event.target.value.replace(/\D/g, ''))}
              />
              <button
                type="button"
                className="operator-process-card__btn operator-process-card__btn--primary"
                disabled={saving || row.status === 'terminado' || !row.canRegisterProgress}
                onClick={onRegisterProgress}
                aria-label={copy.actions.registerUnits}
              >
                ✓
              </button>
            </div>

            <button
              type="button"
              className="operator-process-card__btn operator-process-card__btn--delivery"
              disabled={saving || row.status === 'terminado' || !row.canRegisterDelivery}
              onClick={onRegisterDelivery}
            >
              {copy.actions.registerDelivery}
            </button>
          </div>

          {row.canRegisterProgress ? (
            <div className="operator-process-card__quick">
              <span>{copy.workspace.quickAdd}</span>
              {[100, 500].map(amount => (
                <button
                  key={amount}
                  type="button"
                  className="operator-process-card__quick-btn"
                  disabled={saving || maxProgress <= 0}
                  onClick={() => onDraftUnitsChange(String(Math.min(amount, maxProgress)))}
                >
                  +{amount.toLocaleString('es-CO')}
                </button>
              ))}
              <button
                type="button"
                className="operator-process-card__quick-btn"
                disabled={saving || maxProgress <= 0}
                onClick={() => onDraftUnitsChange(String(maxProgress))}
              >
                Máx
              </button>
            </div>
          ) : null}

          <div className="operator-process-card__pause-row">
                {trace.isPausedNow ? (
                  <button
                    type="button"
                    className="operator-process-card__btn operator-process-card__btn--resume"
                    disabled={saving}
                    onClick={onResume}
                  >
                    {copy.workspace.registerResume}
                  </button>
                ) : (
                  <>
                    <label className="operator-process-card__pause-select">
                      <span>{copy.workspace.pauseReason}</span>
                      <select
                        value={draftPauseReason}
                        disabled={saving || row.status === 'terminado'}
                        onChange={event =>
                          onDraftPauseReasonChange(event.target.value as ProductionTracePauseReasonId)
                        }
                      >
                        {PAUSE_REASON_OPTIONS.map(([id, label]) => (
                          <option key={id} value={id}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      type="button"
                      className="operator-process-card__btn operator-process-card__btn--pause"
                      disabled={saving || row.status === 'terminado'}
                      onClick={onPause}
                    >
                      {copy.workspace.registerPause}
                    </button>
                  </>
                )}
              </div>

          <input
            type="text"
            className="operator-process-card__note"
            placeholder={copy.actions.notePlaceholder}
            value={draftNote}
            onChange={event => onDraftNoteChange(event.target.value)}
          />

          <div className="operator-process-card__times">
            <span>
              {copy.workspace.laborProcess}: <strong>{formatDurationMs(trace.laborTimeMs)}</strong>
            </span>
            <span>
              {copy.workspace.pausedProcess}: <strong>{formatDurationMs(trace.pausedTimeMs)}</strong>
            </span>
            <span>
              {copy.workspace.pauseCount}: <strong>{trace.pauseCount}</strong>
              {trace.isPausedNow ? ` · ${copy.workspace.pauseNow}` : ''}
            </span>
          </div>

          {trace.pauses.length > 0 ? (
            <details className="operator-process-card__pauses">
              <summary>{copy.workspace.pauseHistory}</summary>
              <ul>
                {trace.pauses.map(pause => (
                  <li key={pause.id}>
                    {pause.reasonLabel} · {formatDurationMs(pause.durationMs)}
                    {pause.isOpen ? ` · ${copy.workspace.pauseNow}` : ''}
                  </li>
                ))}
              </ul>
            </details>
          ) : (
            <p className="operator-process-card__pauses-empty">{copy.workspace.noPauses}</p>
          )}
        </div>
      ) : (
        <p className="operator-process-card__hint">{copy.workspace.notAssigned}</p>
      )}
    </article>
  )
}

export default OperatorProcessCard
