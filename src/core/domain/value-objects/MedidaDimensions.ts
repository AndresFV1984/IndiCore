export interface MedidaDimension {
  ancho: string
  alto: string
  unidadMedida: string
}

export const DEFAULT_UNIDAD_MEDIDA = 'cm'

export const MEDIDA_UNIDADES = ['cm', 'mm', 'm', 'in'] as const

export type MedidaUnidad = (typeof MEDIDA_UNIDADES)[number]

export function parseMedidaString(medida: string): MedidaDimension {
  const raw = medida.trim()
  const unitMatch = raw.match(/\s*(cm|mm|m|in)\s*$/i)
  const unidadMedida = unitMatch ? unitMatch[1].toLowerCase() : DEFAULT_UNIDAD_MEDIDA
  const dimPart =
    unitMatch && unitMatch.index != null ? raw.slice(0, unitMatch.index).trim() : raw
  const parts = dimPart.split(/\s*[x×]\s*/i).map(p => p.trim()).filter(Boolean)

  if (parts.length >= 2) {
    return {
      ancho: parts[0].replace(',', '.'),
      alto: parts[1].replace(',', '.'),
      unidadMedida,
    }
  }

  return {
    ancho: dimPart.replace(',', '.'),
    alto: '',
    unidadMedida,
  }
}

/** Cadena compacta almacenada (ej. `10x5` o `10x5 mm`). */
export function composeMedida(
  ancho: string,
  alto: string,
  unidadMedida: string = DEFAULT_UNIDAD_MEDIDA
): string {
  const a = ancho.trim().replace(',', '.')
  const b = alto.trim().replace(',', '.')
  const u = (unidadMedida || DEFAULT_UNIDAD_MEDIDA).trim().toLowerCase()
  if (!a) return ''
  if (!b) return u === DEFAULT_UNIDAD_MEDIDA ? a : `${a} ${u}`
  const core = `${a}x${b}`
  return u === DEFAULT_UNIDAD_MEDIDA ? core : `${core} ${u}`
}

export function resolveMedidaInput(input: {
  medida?: string
  ancho?: string
  alto?: string
  unidadMedida?: string
}): MedidaDimension {
  if (input.ancho?.trim() && input.alto?.trim()) {
    return {
      ancho: input.ancho.trim().replace(',', '.'),
      alto: input.alto.trim().replace(',', '.'),
      unidadMedida: (input.unidadMedida || DEFAULT_UNIDAD_MEDIDA).trim().toLowerCase(),
    }
  }
  if (input.medida?.trim()) {
    return parseMedidaString(input.medida)
  }
  return { ancho: '', alto: '', unidadMedida: DEFAULT_UNIDAD_MEDIDA }
}

export function formatMedidaDisplay(dim: MedidaDimension): string {
  const value = `${dim.ancho}×${dim.alto}`
  return `${value} ${dim.unidadMedida.toLowerCase()}`
}

export function validateMedidaDimension(dim: MedidaDimension): string | null {
  if (!dim.ancho.trim()) return 'El ancho es obligatorio.'
  if (!dim.alto.trim()) return 'El alto es obligatorio.'
  const num = /^[0-9]+([.,][0-9]+)?$/
  if (!num.test(dim.ancho.replace(',', '.'))) return 'Ingrese un ancho válido.'
  if (!num.test(dim.alto.replace(',', '.'))) return 'Ingrese un alto válido.'
  if (!MEDIDA_UNIDADES.includes(dim.unidadMedida as MedidaUnidad)) {
    return 'Seleccione una unidad de medida válida.'
  }
  return null
}
