import React, { useEffect, useMemo } from 'react'
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
  getCorteRowActiveId,
  isFaltanteLitografiaRow,
  listFaltantePaperRows,
} from './utils/cortePapelFaltante'
import {
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
  onPaperRowChange: (row: PaperRow) => void
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
  onPaperRowChange,
  onMargenRedondeoChange,
  onClienteSuministraPapelChange,
  onAddFaltanteLitografia,
}) => {
  const esFaltanteLitografia = isFaltanteLitografiaRow(row)
  const clienteSuministra = clienteSuministraPapel === 'si' && !esFaltanteLitografia
  const papelSinCortar = isPapelSinCortarClienteSuministro(clienteSuministraPapel, row)
  const registroActivo = useMemo(() => {
    if (esFaltanteLitografia && row.faltanteDeColorPlanchaId) {
      return coloresPlanchas.find(item => item.id === row.faltanteDeColorPlanchaId) ?? null
    }
    return coloresPlanchas.find(item => item.id === activeColorPlanchaId) ?? null
  }, [coloresPlanchas, activeColorPlanchaId, esFaltanteLitografia, row.faltanteDeColorPlanchaId])
  const registroIndex = useMemo(() => {
    if (!registroActivo) return -1
    return coloresPlanchas.findIndex(item => item.id === registroActivo.id)
  }, [coloresPlanchas, registroActivo])

  const catalogTipos = useMemo(() => normalizeTipoPapelList(tiposPapel), [tiposPapel])

  const selectedTipo = useMemo(
    () => (row.tipoPapelId ? catalogTipos.find(t => t.id === row.tipoPapelId) ?? null : null),
    [row.tipoPapelId, catalogTipos]
  )

  useEffect(() => {
    if (!row.tipoPapelId || tiposPapel.length === 0) return
    const synced = syncPaperRowWithTipoPapelCatalog(row, tiposPapel)
    const syncedValor = synced.valorCorteUnitario ?? synced.despiece?.valorCorte ?? 0
    const rowValor = row.valorCorteUnitario ?? row.despiece?.valorCorte ?? 0
    if (syncedValor === rowValor && synced.despiece?.valorCorte === row.despiece?.valorCorte) {
      return
    }
    onPaperRowChange(synced)
  }, [row, tiposPapel, onPaperRowChange])

  const valores = useMemo(
    () =>
      computeCortePapelValores({
        coloresPlanchas,
        row,
        tipoPapel: selectedTipo,
        margenRedondeo,
        clienteSuministraPapel,
      }),
    [coloresPlanchas, row, selectedTipo, margenRedondeo, clienteSuministraPapel]
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
      ? !row.despiece?.piezasPorPliego
        ? copy.sections.cantidadHojas.emptySinDespiece
        : (clienteSuministra || esFaltanteLitografia) && (row.tamanosBuenosManual ?? 0) <= 0
          ? copy.sections.cantidadHojas.emptySinTamanosBuenos
          : !registroActivo && !esFaltanteLitografia
                ? copy.registroPreprensa.placeholder
                : coloresPlanchas.length === 0
                  ? copy.sections.cantidadHojas.emptySinPreprensa
                  : copy.sections.cantidadHojas.empty
      : null

  const despieceSeleccionado = Boolean(
    row.despiece?.despieceId &&
      selectedTipo?.despiecesPliego.some(d => d.despieceId === row.despiece?.despieceId)
  )

  const valorCorteEmpty =
    !registroActivo && !esFaltanteLitografia
      ? copy.registroPreprensa.placeholder
      : !row.tipoPapelId
      ? copy.sections.valorCorte.emptySinTipo
      : !despieceSeleccionado
        ? copy.sections.valorCorte.emptySinDespiece
        : clienteSuministra && !papelSinCortar
          ? copy.sections.valorCorte.emptyNoAplicaCortado
          : clienteSuministra && papelSinCortar && (row.tamanosBuenosManual ?? 0) <= 0
            ? copy.sections.valorCorte.emptySinTamanosBuenos
          : valores.valorCorteUnitario <= 0
            ? copy.sections.valorCorte.emptySinValorUnitario
            : valores.unidadEmpaqueCantidad <= 0
              ? copy.sections.valorCorte.emptySinUnidad
              : valores.cantidadHojas <= 0
                ? copy.sections.valorCorte.emptySinHojas
                : null

  const showRegistroForm = Boolean(registroActivo) || esFaltanteLitografia

  const cantidadHojasDisplay =
    cantidadHojasEmpty ?? (valores.cantidadHojas > 0 ? valores.cantidadHojas.toLocaleString('es-CO') : '—')

  const valorCorteDisplay =
    valorCorteEmpty ??
    (valores.valorCorte > 0 ? formatValorHojaDisplay(valores.valorCorte) : '$ 0')

  const valoresSection = showRegistroForm ? (
    <CorteFormPanel
      step="2"
      title={copy.sections.valores.title}
      subtitle={copy.sections.valores.subtitle}
      className="production-corte-panel--valores"
    >
      <ProductionCorteValoresSection
        row={row}
        coloresPlanchas={coloresPlanchas}
        despieceSeleccionado={despieceSeleccionado}
        tipoPapelSeleccionado={Boolean(row.tipoPapelId)}
        valores={valores}
        cantidadHojasDisplay={cantidadHojasDisplay}
        valorCorteDisplay={valorCorteDisplay}
        margenRedondeo={margenRedondeo}
        onMargenRedondeoChange={onMargenRedondeoChange}
        clienteSuministra={clienteSuministra}
        esFaltanteLitografia={esFaltanteLitografia}
        papelSinCortar={papelSinCortar}
        registroActivo={registroActivo}
        registroIndex={registroIndex}
      />
    </CorteFormPanel>
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
      row.colorPlanchaId ? (
        <>
          <CortePapelEstadoCorteShell row={row} onChange={onPaperRowChange} />
          <CortePapelFaltantePanel
            row={row}
            coloresPlanchas={coloresPlanchas}
            paperRows={paperRows}
            cantidadHojas={valores.cantidadHojas}
            onAgregarFaltante={hojasFaltante => {
              if (row.colorPlanchaId && onAddFaltanteLitografia && hojasFaltante > 0) {
                onAddFaltanteLitografia(row, hojasFaltante)
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
          <CortePapelFaltanteLitografiaBar row={row} />
          <CortePapelEstadoCorteShell
            row={row}
            onChange={onPaperRowChange}
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
                  row={row}
                  tiposPapel={catalogTipos}
                  loadingTiposPapel={loadingTiposPapel}
                  onChange={onPaperRowChange}
                />
              </CorteFormPanel>
            ) : null}

            {valoresSection}
          </div>

          {coloresPlanchas.length > 0 ? (
            <ProductionCorteResumenConsolidado
              coloresPlanchas={coloresPlanchas}
              paperRows={paperRows}
              tiposPapel={catalogTipos}
              margenRedondeo={margenRedondeo}
              clienteSuministraPapel={clienteSuministraPapel}
              activeColorPlanchaId={activeColorPlanchaId}
              onSelectRegistro={onActiveColorPlanchaIdChange}
            />
          ) : null}
        </section>
      </div>
    </div>
  )
}

export default ProductionCortePapelForm
