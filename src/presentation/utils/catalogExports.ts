import { TamanoPlancha } from '../../core/domain/entities/TamanoPlancha'
import { TipoPapel } from '../../core/domain/entities/TipoPapel'
import { DespiecePliego } from '../../core/domain/entities/DespiecePliego'
import { CortePapel } from '../../core/domain/entities/CortePapel'
import { formatDespieceBadge, formatDespieceMedidaPiezas, formatMedidaDisplay } from '../features/catalog/cortePapelUtils'
import { formatUnidadEmpaqueDisplay } from '../../core/domain/value-objects/UnidadEmpaque'
import { PrecioMontaje } from '../../core/domain/entities/PrecioMontaje'
import { TarifaMillar } from '../../core/domain/entities/TarifaMillar'
import {
  resolveTarifaMillarPrecioVolteoEscuadra,
  resolveTarifaMillarPrecioVolteoPinza,
} from '../features/production/constants/impresionTarifaMillar'
import type { CatalogRecord } from '../features/catalog/catalogRecord'
import {
  CATALOG_COSTO_MINIMO_LABEL,
  CATALOG_VALOR_CM2_LABEL,
  displayCatalogUnitCost,
  displayCatalogValorCmCuadrado,
} from '../features/catalog/catalogRecord'
import type { ExportField } from './exportFields'
import { slugifyFilename, todayExportSuffix } from './exportFields'
import { downloadCsv } from './exportCsv'

const estadoLabel = (active: boolean) => (active ? 'Activo' : 'Inactivo')

const formatCop = (value: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value)

async function exportRows<T>(
  prefix: string,
  title: string,
  fields: ExportField<T>[],
  rows: T[],
  scope: 'listado' | string,
  subtitle?: (row: T) => string
): Promise<void> {
  const suffix = scope === 'listado' ? `listado-${todayExportSuffix()}` : slugifyFilename(scope)
  if (scope !== 'listado' && rows.length === 1) {
    const row = rows[0]
    const { downloadRecordPdf } = await import('./exportPdf')
    await downloadRecordPdf({
      filename: `${prefix}-${suffix}`,
      title,
      subtitle: subtitle?.(row) ?? suffix,
      fields,
      row,
    })
    return
  }
  downloadCsv(`${prefix}-${suffix}`, fields, rows)
}

const tamanoPlanchaFields: ExportField<TamanoPlancha>[] = [
  { label: 'ID', value: r => r.id },
  { label: 'Nombre', value: r => r.name, width: 32 },
  { label: 'Medida', value: r => formatMedidaDisplay(r.medidaDimension) },
  { label: 'Valor', value: r => formatCop(r.valor) },
  { label: 'Estado', value: r => estadoLabel(r.active) },
]

const tipoPapelFields: ExportField<TipoPapel>[] = [
  { label: 'ID', value: r => r.id },
  { label: 'Nombre', value: r => r.name, width: 32 },
  { label: 'Medida', value: r => formatMedidaDisplay(r.medidaDimension) },
  {
    label: 'Despiece pliego',
    value: r =>
      r.despiecesPliego.length > 0
        ? r.despiecesPliego.map(d => formatDespieceMedidaPiezas(d)).join('; ')
        : '—',
  },
  { label: 'Valor hoja', value: r => formatCop(r.valorHoja) },
  { label: 'Unidad empaque', value: r => formatUnidadEmpaqueDisplay(r.unidadEmpaque) },
  { label: 'Estado', value: r => estadoLabel(r.active) },
]

const despiecePliegoFields: ExportField<DespiecePliego>[] = [
  { label: 'ID', value: r => r.id },
  { label: 'Nombre', value: r => r.name, width: 28 },
  { label: 'Medida', value: r => formatMedidaDisplay(r.medidaDimension) },
  { label: 'Piezas por pliego', value: r => String(r.piezasPorPliego) },
  { label: 'Estado', value: r => estadoLabel(r.active) },
]

const precioMontajeFields: ExportField<PrecioMontaje>[] = [
  { label: 'ID', value: r => r.id },
  { label: 'Nombre', value: r => r.name, width: 32 },
  { label: 'Costo', value: r => formatCop(r.cost) },
  { label: 'Estado', value: r => estadoLabel(r.state) },
]

const tarifasMillarFields: ExportField<TarifaMillar>[] = [
  { label: 'ID', value: r => r.id },
  { label: 'Nombre', value: r => r.name, width: 32 },
  { label: 'Unidad millar', value: r => String(r.unidadMedida) },
  { label: 'Precio', value: r => formatCop(r.precio) },
  { label: 'Millar mínimo venta', value: r => String(r.millarMinimoVenta) },
  { label: 'Tope mínimo millar', value: r => String(r.topeMinimoMillar) },
  { label: 'Umbral decimal', value: r => String(r.umbralDecimalMillar) },
  {
    label: 'Volteo por pinza',
    value: r => {
      const precio = resolveTarifaMillarPrecioVolteoPinza(r)
      return precio !== null ? formatCop(precio) : '—'
    },
  },
  {
    label: 'Volteo por escuadra',
    value: r => {
      const precio = resolveTarifaMillarPrecioVolteoEscuadra(r)
      return precio !== null ? formatCop(precio) : '—'
    },
  },
  { label: 'Estado', value: r => estadoLabel(r.state) },
]

const catalogRecordFields: ExportField<CatalogRecord>[] = [
  { label: 'ID', value: r => r.id },
  { label: 'Nombre', value: r => r.name, width: 32 },
  { label: CATALOG_COSTO_MINIMO_LABEL, value: r => displayCatalogUnitCost(r.cost) },
  { label: CATALOG_VALOR_CM2_LABEL, value: r => displayCatalogValorCmCuadrado(r.valorCmCuadrado) },
  { label: 'Acceso rápido', value: r => (r.quickAccess ? 'Sí' : 'No') },
]

const catalogTerminadosFields = catalogRecordFields

export function exportTamanoPlancha(rows: TamanoPlancha[], scope: 'listado' | string): Promise<void> {
  return exportRows('tipo-plancha', 'Tipo de plancha', tamanoPlanchaFields, rows, scope, r => r.name)
}

export function exportTipoPapel(rows: TipoPapel[], scope: 'listado' | string): Promise<void> {
  return exportRows('tipo-papel', 'Tipo de papel', tipoPapelFields, rows, scope, r => r.name)
}

export function exportDespiecePliego(rows: DespiecePliego[], scope: 'listado' | string): Promise<void> {
  return exportRows('despiece-pliego', 'Despiece por pliego', despiecePliegoFields, rows, scope, r => r.name)
}

export function exportPrecioMontaje(rows: PrecioMontaje[], scope: 'listado' | string): Promise<void> {
  return exportRows('precio-montaje', 'Precio de montaje', precioMontajeFields, rows, scope, r => r.name)
}

export function exportTarifasMillar(rows: TarifaMillar[], scope: 'listado' | string): Promise<void> {
  return exportRows('tarifas-millar', 'Tarifa por millar', tarifasMillarFields, rows, scope, r => r.name)
}

const tarifasMillarListadoFields: ExportField<TarifaMillar>[] = [
  { label: 'Nombre', value: r => r.name, width: 32 },
  { label: 'Unidad millar', value: r => String(r.unidadMedida) },
  { label: 'Precio', value: r => formatCop(r.precio) },
  {
    label: 'Volteo por pinza',
    value: r => {
      const precio = resolveTarifaMillarPrecioVolteoPinza(r)
      return precio !== null ? formatCop(precio) : '—'
    },
  },
  {
    label: 'Volteo por escuadra',
    value: r => {
      const precio = resolveTarifaMillarPrecioVolteoEscuadra(r)
      return precio !== null ? formatCop(precio) : '—'
    },
  },
  { label: 'Tope mínimo millar', value: r => String(r.topeMinimoMillar) },
  { label: 'Millar mínimo', value: r => String(r.millarMinimoVenta) },
  { label: 'Umbral decimal', value: r => String(r.umbralDecimalMillar) },
  { label: 'Estado', value: r => estadoLabel(r.state) },
]

export function exportTarifasMillarListado(
  rows: TarifaMillar[],
  scope: 'listado' | string
): Promise<void> {
  return exportRows(
    'tarifas-millar',
    'Tarifa por millar',
    tarifasMillarListadoFields,
    rows,
    scope,
    r => r.name
  )
}

export function exportCatalogTerminados(rows: CatalogRecord[], scope: 'listado' | string): Promise<void> {
  return exportRows('terminados', 'Terminado', catalogTerminadosFields, rows, scope, r => r.name)
}

export function exportCatalogOperaciones(rows: CatalogRecord[], scope: 'listado' | string): Promise<void> {
  return exportRows('operaciones', 'Operación de acabado', catalogRecordFields, rows, scope, r => r.name)
}

const buildCortePapelFields = (
  tiposPapelById: Map<string, TipoPapel>
): ExportField<CortePapel>[] => [
  { label: 'ID', value: r => r.id },
  { label: 'Nombre', value: r => r.name, width: 32 },
  {
    label: 'Despiece pliego',
    value: r =>
      r.despieces.length > 0
        ? r.despieces.map(d => formatDespieceBadge(d)).join('; ')
        : '—',
    width: 44,
  },
  {
    label: 'Medida papel',
    value: r => {
      const tipo = tiposPapelById.get(r.tipoPapelId)
      return tipo ? formatMedidaDisplay(tipo.medidaDimension) : '—'
    },
  },
  {
    label: 'Nombre papel',
    value: r => tiposPapelById.get(r.tipoPapelId)?.name ?? '—',
    width: 28,
  },
]

export function exportCortePapel(
  rows: CortePapel[],
  scope: 'listado' | string,
  tiposPapel: TipoPapel[] = []
): Promise<void> {
  const tiposPapelById = new Map(tiposPapel.map(t => [t.id, t]))
  return exportRows(
    'corte-papel',
    'Corte de papel',
    buildCortePapelFields(tiposPapelById),
    rows,
    scope,
    r => r.name
  )
}
