import {
  DisenoColorPlanchaItem,
  DisenoColoresOption,
  PreprensaDisenoSpecs,
} from '../../../../core/domain/entities/PreprensaDiseno'
import { DISENO_COLORES_OPTIONS_LEGACY } from '../constants/preprensaDisenoColors'

const COLORES_BY_INDEX: DisenoColoresOption[] = [
  '1-color',
  '2-colores',
  '3-colores',
  '4-colores',
  '5-colores',
  '6-colores',
  '7-colores-o-mas',
]

export const getColoresCount = (colores: DisenoColoresOption | ''): number => {
  if (!colores) return 0
  return DISENO_COLORES_OPTIONS_LEGACY.find(o => o.value === colores)?.dotCount ?? 0
}

export const getColoresOptionMeta = (colores: DisenoColoresOption) =>
  DISENO_COLORES_OPTIONS_LEGACY.find(o => o.value === colores)

/** Resumen guardado en `colores` (mayor cantidad de tintas de la lista). */
export const deriveColoresSummary = (
  items: DisenoColorPlanchaItem[]
): DisenoColoresOption | '' => {
  if (!items.length) return ''
  return items.reduce((best, item) => {
    const bestCount = getColoresCount(best.colores)
    const itemCount = getColoresCount(item.colores)
    return itemCount > bestCount ? item : best
  }).colores
}

export const deriveCavidadesSummary = (items: DisenoColorPlanchaItem[]): number => {
  if (!items.length) return 0
  return Math.max(...items.map(i => i.numeroCavidades))
}

export const legacyPlanchaFromList = (
  items: DisenoColorPlanchaItem[]
): Pick<PreprensaDisenoSpecs, 'planchaId' | 'planchaNombreMedida' | 'planchaValor'> => {
  const first = items[0]
  if (!first) {
    return { planchaId: '', planchaNombreMedida: '', planchaValor: 0 }
  }
  return {
    planchaId: first.planchaId,
    planchaNombreMedida: first.planchaNombreMedida,
    planchaValor: first.planchaValor,
  }
}

const migrateItem = (
  item: DisenoColorPlanchaItem & { colorIndex?: number; numeroCavidades?: number },
  fallbackColores: DisenoColoresOption | '',
  fallbackCavidades: number
): DisenoColorPlanchaItem => {
  const colores =
    item.colores ??
    (item.colorIndex != null && item.colorIndex >= 1
      ? COLORES_BY_INDEX[item.colorIndex - 1]
      : undefined) ??
    (fallbackColores || '1-color')

  return {
    id: item.id,
    colores,
    planchaId: item.planchaId,
    planchaNombreMedida: item.planchaNombreMedida,
    planchaValor: item.planchaValor,
    numeroCavidades: item.numeroCavidades ?? fallbackCavidades,
    detalle: item.detalle ?? '',
    observacion: item.observacion ?? '',
  }
}

/** Al reutilizar un trabajo anterior: conserva datos técnicos pero valores de plancha en cero. */
export const applyColoresPlanchasForHistorialReuse = (
  raw: Partial<PreprensaDisenoSpecs>
): DisenoColorPlanchaItem[] =>
  normalizeColoresPlanchas(raw).map(item => ({
    ...item,
    planchaValor: 0,
    observacion: '',
  }))

/** Migra plancha única legacy → lista por selección de color. */
export const normalizeColoresPlanchas = (
  raw: Partial<PreprensaDisenoSpecs>
): DisenoColorPlanchaItem[] => {
  const fallbackCavidades = raw.numeroCavidades ?? 0
  if (raw.coloresPlanchas?.length) {
    return raw.coloresPlanchas.map(item =>
      migrateItem(
        item as DisenoColorPlanchaItem & { colorIndex?: number },
        raw.colores ?? '',
        fallbackCavidades
      )
    )
  }
  if (raw.planchaId?.trim() && raw.colores) {
    return [
      {
        id: crypto.randomUUID(),
        colores: raw.colores,
        planchaId: raw.planchaId,
        planchaNombreMedida: raw.planchaNombreMedida ?? '',
        planchaValor: raw.planchaValor ?? 0,
        numeroCavidades: fallbackCavidades,
        detalle: '',
        observacion: '',
      },
    ]
  }
  if (raw.planchaId?.trim()) {
    return [
      {
        id: crypto.randomUUID(),
        colores: '1-color',
        planchaId: raw.planchaId,
        planchaNombreMedida: raw.planchaNombreMedida ?? '',
        planchaValor: raw.planchaValor ?? 0,
        numeroCavidades: fallbackCavidades,
        detalle: '',
        observacion: '',
      },
    ]
  }
  return []
}

export const buildColoresPlanchasPatch = (
  items: DisenoColorPlanchaItem[]
): Pick<
  PreprensaDisenoSpecs,
  'coloresPlanchas' | 'colores' | 'numeroCavidades' | 'planchaId' | 'planchaNombreMedida' | 'planchaValor'
> => ({
  coloresPlanchas: items,
  colores: deriveColoresSummary(items),
  numeroCavidades: deriveCavidadesSummary(items),
  ...legacyPlanchaFromList(items),
})
