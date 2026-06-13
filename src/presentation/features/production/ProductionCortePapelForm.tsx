import React, { useEffect, useMemo, useRef, useState } from 'react'
import type { PaperRow } from '../../../core/domain/entities/Order'
import type { DisenoColorPlanchaItem, YesNoChoice } from '../../../core/domain/entities/PreprensaDiseno'
import { TipoPapel } from '../../../core/domain/entities/TipoPapel'
import CortePapelSuministroShell from './CortePapelSuministroShell'
import { CorteFormPanel } from './CorteFormPanel'
import ProductionCorteValoresSection from './ProductionCorteValoresSection'
import { CORTE_PAPEL_COPY as copy } from './constants/cortePapelCopy'
import ProductionCortePreprensaRegistroPicker from './ProductionCortePreprensaRegistroPicker'
import ProductionCorteTipoPapelFields from './ProductionCorteTipoPapelFields'
import CortePapelEstadoCorteShell from './CortePapelEstadoCorteShell'
import ProductionCorteResumenConsolidado from './ProductionCorteResumenConsolidado'
import CortePapelFaltantePanel from './CortePapelFaltantePanel'
import CortePapelFaltanteLitografiaBar from './CortePapelFaltanteLitografiaBar'
import CortePapelFaltanteMarca from './CortePapelFaltanteMarca'
import type { CorteRegistroPickerOption } from './ProductionCortePreprensaRegistroPicker'
import {
  findPaperRowForActiveId,
  getCorteRowActiveId,
  isFaltanteLitografiaRow,
  listFaltantePaperRows,
} from './utils/cortePapelFaltante'
import {
  clearTipoPapelFromRow,
  emptyPaperRow,
  formatValorHojaDisplay,
  normalizeTipoPapelList,
  syncPaperRowWithTipoPapelCatalog,
} from './utils/tipoPapelDisplay'
import {
  computeCortePapelValores,
  isPapelSinCortarClienteSuministro,
} from './utils/cortePapelCalculations'
import {
  formatColoresPlanchaRegistroSelectLabel,
  isCorteRegistroCompleto,
  syncPaperRowsWithColoresPlanchas,
} from './utils/paperRowsSync'

interface ProductionCortePapelFormProps {
  row: PaperRow
  paperRows: PaperRow[]
  tiposPapel: TipoPapel[]
  coloresPlanchas: DisenoColorPlanchaItem[]
  margenRedondeo: number
  clienteSuministraPapel: YesNoChoice
  activeColorPlanchaId: string
  onActiveColorPlanchaIdChange: (id: string) => void
  loadingTiposPapel?: boolean
  onPaperRowCommit: (row: PaperRow) => void
  onPaperRowDelete: (activeId: string) => void
  onMargenRedondeoChange: (value: number) => void
  onClienteSuministraPapelChange: (value: YesNoChoice) => void
  onAddFaltanteLitografia?: (parent: PaperRow, hojasFaltante: number) => void
}

const ProductionCortePapelForm: React.FC<ProductionCortePapelFormProps> = ({
  row,
  paperRows,
  tiposPapel,
  coloresPlanchas,
  margenRedondeo,
  clienteSuministraPapel,
  activeColorPlanchaId,
  onActiveColorPlanchaIdChange,
  loadingTiposPapel = false,
  onPaperRowCommit,
  onPaperRowDelete,
  onMargenRedondeoChange,
  onClienteSuministraPapelChange,
  onAddFaltanteLitografia,
}) => {
  const [draftRow, setDraftRow] = useState<PaperRow>(row)
  const lastActiveRegistroId = useRef(activeColorPlanchaId)

  const esFaltanteLitografia = isFaltanteLitografiaRow(draftRow)
  const clienteSuministra = clienteSuministraPapel === 'si' && !esFaltanteLitografia
  const papelSinCortar = isPapelSinCortarClienteSuministro(clienteSuministraPapel, draftRow)
  const registroActivo = useMemo(() => {
    if (esFaltanteLitografia && draftRow.faltanteDeColorPlanchaId) {
      return coloresPlanchas.find(item => item.id === draftRow.faltanteDeColorPlanchaId) ?? null
    }
    return coloresPlanchas.find(item => item.id === activeColorPlanchaId) ?? null
  }, [coloresPlanchas, activeColorPlanchaId, esFaltanteLitografia, draftRow.faltanteDeColorPlanchaId])
  const registroIndex = useMemo(() => {
    if (!registroActivo) return -1
    return coloresPlanchas.findIndex(item => item.id === registroActivo.id)
  }, [coloresPlanchas, registroActivo])

  const catalogTipos = useMemo(() => normalizeTipoPapelList(tiposPapel), [tiposPapel])

  const selectedTipo = useMemo(
    () =>
      draftRow.tipoPapelId
        ? catalogTipos.find(t => t.id === draftRow.tipoPapelId) ?? null
        : null,
    [draftRow.tipoPapelId, catalogTipos]
  )

  useEffect(() => {
    if (lastActiveRegistroId.current === activeColorPlanchaId) return
    lastActiveRegistroId.current = activeColorPlanchaId

    if (!activeColorPlanchaId) {
      setDraftRow(emptyPaperRow())
      return
    }

    const saved = findPaperRowForActiveId(paperRows, activeColorPlanchaId)
    const savedCompleto = isCorteRegistroCompleto(
      saved,
      coloresPlanchas,
      catalogTipos,
      margenRedondeo,
      clienteSuministraPapel
    )

    if (savedCompleto) {
      setDraftRow(saved)
      return
    }

    setDraftRow(
      clearTipoPapelFromRow({
        ...emptyPaperRow(activeColorPlanchaId),
        colorPlanchaId: activeColorPlanchaId,
        papelCortado: saved.papelCortado ?? 'si',
        hojasEntregadasCliente: saved.hojasEntregadasCliente ?? 0,
        tamanosBuenosManual: saved.tamanosBuenosManual ?? 0,
        sobranteManual: saved.sobranteManual ?? 0,
      })
    )
  }, [activeColorPlanchaId, coloresPlanchas, catalogTipos, margenRedondeo, clienteSuministraPapel])

  useEffect(() => {
    if (!draftRow.tipoPapelId || tiposPapel.length === 0) return
    setDraftRow(prev => {
      const synced = syncPaperRowWithTipoPapelCatalog(prev, tiposPapel)
      const syncedValor = synced.valorCorteUnitario ?? synced.despiece?.valorCorte ?? 0
      const rowValor = prev.valorCorteUnitario ?? prev.despiece?.valorCorte ?? 0
      if (syncedValor === rowValor && synced.despiece?.valorCorte === prev.despiece?.valorCorte) {
        return prev
      }
      return synced
    })
  }, [draftRow.tipoPapelId, draftRow.despiece?.despieceId, tiposPapel])

  const valores = useMemo(
    () =>
      computeCortePapelValores({
        coloresPlanchas,
        row: draftRow,
        tipoPapel: selectedTipo,
        margenRedondeo,
        clienteSuministraPapel,
      }),
    [coloresPlanchas, draftRow, selectedTipo, margenRedondeo, clienteSuministraPapel]
  )

  const processedRegistroIds = useMemo(() => {
    const ids = new Set<string>()
    const rowsToCheck = [
      ...syncPaperRowsWithColoresPlanchas(coloresPlanchas, paperRows),
      ...listFaltantePaperRows(paperRows),
    ]
    for (const paperRow of rowsToCheck) {
      if (
        isCorteRegistroCompleto(
          paperRow,
          coloresPlanchas,
          catalogTipos,
          margenRedondeo,
          clienteSuministraPapel
        )
      ) {
        const id = getCorteRowActiveId(paperRow)
        if (id) ids.add(id)
      }
    }
    return ids
  }, [coloresPlanchas, paperRows, catalogTipos, margenRedondeo, clienteSuministraPapel])

  const pickerExtraOptions = useMemo((): CorteRegistroPickerOption[] => {
    return listFaltantePaperRows(paperRows).map(faltante => {
      const parent = faltante.faltanteDeColorPlanchaId
        ? coloresPlanchas.find(item => item.id === faltante.faltanteDeColorPlanchaId)
        : undefined
      const parentLabel = parent ? formatColoresPlanchaRegistroSelectLabel(parent) : ''
      const id = getCorteRowActiveId(faltante)
      return {
        id,
        label: copy.faltante.registroPickerLabel(parentLabel),
        completo: processedRegistroIds.has(id),
      }
    })
  }, [paperRows, coloresPlanchas, processedRegistroIds])

  const cantidadHojasEmpty =
    valores.cantidadHojas <= 0
      ? !draftRow.despiece?.piezasPorPliego
        ? copy.sections.cantidadHojas.emptySinDespiece
        : (clienteSuministra || esFaltanteLitografia) && (draftRow.tamanosBuenosManual ?? 0) <= 0
          ? copy.sections.cantidadHojas.emptySinTamanosBuenos
          : !registroActivo && !esFaltanteLitografia
                ? copy.registroPreprensa.placeholder
                : coloresPlanchas.length === 0
                  ? copy.sections.cantidadHojas.emptySinPreprensa
                  : copy.sections.cantidadHojas.empty
      : null

  const despieceSeleccionado = Boolean(
    draftRow.despiece?.despieceId &&
      selectedTipo?.despiecesPliego.some(d => d.despieceId === draftRow.despiece?.despieceId)
  )

  const valorCorteEmpty =
    !registroActivo && !esFaltanteLitografia
      ? copy.registroPreprensa.placeholder
      : !draftRow.tipoPapelId
      ? copy.sections.valorCorte.emptySinTipo
      : !despieceSeleccionado
        ? copy.sections.valorCorte.emptySinDespiece
        : clienteSuministra && !papelSinCortar
          ? copy.sections.valorCorte.emptyNoAplicaCortado
          : clienteSuministra && papelSinCortar && (draftRow.tamanosBuenosManual ?? 0) <= 0
            ? copy.sections.valorCorte.emptySinTamanosBuenos
          : valores.valorCorteUnitario <= 0
            ? copy.sections.valorCorte.emptySinValorUnitario
            : valores.unidadEmpaqueCantidad <= 0
              ? copy.sections.valorCorte.emptySinUnidad
              : valores.cantidadHojas <= 0
                ? copy.sections.valorCorte.emptySinHojas
                : null

  const showRegistroForm = Boolean(registroActivo) || esFaltanteLitografia

  const savedRowCompleto = useMemo(() => {
    if (!activeColorPlanchaId) return false
    const saved = findPaperRowForActiveId(paperRows, activeColorPlanchaId)
    return isCorteRegistroCompleto(
      saved,
      coloresPlanchas,
      catalogTipos,
      margenRedondeo,
      clienteSuministraPapel
    )
  }, [
    activeColorPlanchaId,
    paperRows,
    coloresPlanchas,
    catalogTipos,
    margenRedondeo,
    clienteSuministraPapel,
  ])

  const canCommitRegistro = isCorteRegistroCompleto(
    draftRow,
    coloresPlanchas,
    catalogTipos,
    margenRedondeo,
    clienteSuministraPapel
  )

  const handleDraftChange = (next: PaperRow) => {
    setDraftRow(next)
  }

  const handleCancelRegistro = () => {
    onActiveColorPlanchaIdChange('')
  }

  const resetDraftAfterCommit = () => {
    lastActiveRegistroId.current = ''
    setDraftRow(clearTipoPapelFromRow(emptyPaperRow()))
    onActiveColorPlanchaIdChange('')
  }

  const handleCommitRegistro = () => {
    if (!canCommitRegistro) return
    onPaperRowCommit(draftRow)
    resetDraftAfterCommit()
  }

  const cantidadHojasDisplay =
    cantidadHojasEmpty ?? (valores.cantidadHojas > 0 ? valores.cantidadHojas.toLocaleString('es-CO') : '—')

  const valorCorteDisplay =
    valorCorteEmpty ??
    (valores.valorCorte > 0 ? formatValorHojaDisplay(valores.valorCorte) : '$ 0')

  const valoresSection =
    showRegistroForm && despieceSeleccionado ? (
      <CorteFormPanel
        step="2"
        title={copy.sections.valores.title}
        subtitle={copy.sections.valores.subtitle}
        className="production-corte-panel--valores"
      >
        <ProductionCorteValoresSection
          row={draftRow}
          coloresPlanchas={coloresPlanchas}
          valores={valores}
          cantidadHojasDisplay={cantidadHojasDisplay}
          valorCorteDisplay={valorCorteDisplay}
          margenRedondeo={margenRedondeo}
          onMargenRedondeoChange={onMargenRedondeoChange}
          clienteSuministra={clienteSuministra}
          esFaltanteLitografia={esFaltanteLitografia}
          papelSinCortar={papelSinCortar}
        />
      </CorteFormPanel>
    ) : null

  const valoresAwaitHint =
    showRegistroForm && !despieceSeleccionado ? (
      <p className="production-diseno-cliente-hint production-corte-valores__await">
        {copy.sections.valores.awaitDespiece}
      </p>
    ) : null

  return (
    <div className="production-preprensa-diseno-detail">
      <p className="production-workspace-panel-desc production-preprensa-diseno-desc">
        {copy.panelDesc}
      </p>

      <CortePapelSuministroShell
        value={clienteSuministraPapel}
        onChange={onClienteSuministraPapelChange}
      />

      {clienteSuministra ? (
        <p className="production-diseno-cliente-hint production-corte-suministro-aviso">
          {copy.suministro.avisoCliente}
        </p>
      ) : null}

      {clienteSuministra &&
      !esFaltanteLitografia &&
      registroActivo &&
      draftRow.colorPlanchaId ? (
        <>
          <CortePapelEstadoCorteShell row={draftRow} onChange={handleDraftChange} />
          <CortePapelFaltantePanel
            row={draftRow}
            coloresPlanchas={coloresPlanchas}
            paperRows={paperRows}
            cantidadHojas={valores.cantidadHojas}
            onAgregarFaltante={hojasFaltante => {
              if (draftRow.colorPlanchaId && onAddFaltanteLitografia && hojasFaltante > 0) {
                onAddFaltanteLitografia(draftRow, hojasFaltante)
              }
            }}
            onEditarFaltante={onActiveColorPlanchaIdChange}
          />
        </>
      ) : null}

      <ProductionCortePreprensaRegistroPicker
        coloresPlanchas={coloresPlanchas}
        selectedId={activeColorPlanchaId}
        processedIds={processedRegistroIds}
        extraOptions={pickerExtraOptions}
        onChange={onActiveColorPlanchaIdChange}
      />

      {esFaltanteLitografia ? (
        <>
          <CortePapelFaltanteLitografiaBar row={draftRow} />
          <CortePapelEstadoCorteShell
            row={draftRow}
            onChange={handleDraftChange}
            variant="faltanteLitografia"
          />
        </>
      ) : null}

      <div className="production-diseno-form">
        <section
          className={[
            'production-diseno-detail production-diseno-detail--nuevo production-diseno-detail--corte',
            esFaltanteLitografia ? 'production-diseno-detail--corte-faltante' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          aria-label={copy.detailAria}
        >
          <header className="production-diseno-detail__header">
            {esFaltanteLitografia ? (
              <div className="production-diseno-detail__header-marca">
                <CortePapelFaltanteMarca />
                <p className="production-diseno-detail__header-marca-hint">
                  {copy.faltante.registroMarcaHint}
                </p>
              </div>
            ) : null}
            <h3 className="production-diseno-detail__title">{copy.titulo}</h3>
            <p className="production-diseno-detail__lead">{copy.lead}</p>
          </header>

          <div
            className={[
              'production-corte-registro-activo-shell',
              showRegistroForm ? 'production-corte-registro-activo-shell--on' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {showRegistroForm ? (
              <CorteFormPanel
                step="1"
                title={copy.sections.papel.title}
                subtitle={copy.sections.papel.subtitle}
                className="production-corte-panel--papel"
              >
                <ProductionCorteTipoPapelFields
                  embedded
                  row={draftRow}
                  tiposPapel={catalogTipos}
                  loadingTiposPapel={loadingTiposPapel}
                  onChange={handleDraftChange}
                />
              </CorteFormPanel>
            ) : null}

            {valoresAwaitHint}
            {valoresSection}

            {showRegistroForm ? (
              <footer className="production-plancha-draft__footer production-corte-registro-actions">
                <button
                  type="button"
                  className="production-plancha-draft__btn production-plancha-draft__btn--ghost"
                  onClick={handleCancelRegistro}
                >
                  {copy.registroAcciones.cancelar}
                </button>
                <button
                  type="button"
                  className="production-plancha-draft__btn production-plancha-draft__btn--primary"
                  onClick={handleCommitRegistro}
                  disabled={!canCommitRegistro}
                >
                  {savedRowCompleto
                    ? copy.registroAcciones.guardar
                    : copy.registroAcciones.agregar}
                </button>
              </footer>
            ) : null}
          </div>

          {processedRegistroIds.size > 0 ? (
            <ProductionCorteResumenConsolidado
              coloresPlanchas={coloresPlanchas}
              paperRows={paperRows}
              tiposPapel={catalogTipos}
              margenRedondeo={margenRedondeo}
              clienteSuministraPapel={clienteSuministraPapel}
              activeColorPlanchaId={activeColorPlanchaId}
              onSelectRegistro={onActiveColorPlanchaIdChange}
              onDeleteRegistro={onPaperRowDelete}
            />
          ) : null}
        </section>
      </div>
    </div>
  )
}

export default ProductionCortePapelForm
