const normalizeCatalogKey = (value: string): string =>
  value.replace(/^PANTONE\s+/i, '').replace(/\s+/g, ' ').trim().toLowerCase()

const isRasterPantoneSpotName = (normalized: string): boolean =>
  /^PANTONE\s+Raster\s+Spot\s+\d+$/i.test(normalized)

export const parsePantoneDisplayCatalogKey = (name: string): string | null => {
  const normalized = name.replace(/^Pantone\s+/i, 'PANTONE ').trim()
  if (!/^PANTONE\b/i.test(normalized)) return null
  if (isRasterPantoneSpotName(normalized)) return null

  const numbered = normalized.match(/^PANTONE\s+(\d{1,4})\s+([A-Za-z]{1,3})$/i)
  if (numbered) {
    return `${Number.parseInt(numbered[1]!, 10)} ${numbered[2]!.toUpperCase()}`.toLowerCase()
  }

  const numberedWithoutSuffix = normalized.match(/^PANTONE\s+(\d{1,4})$/i)
  if (numberedWithoutSuffix) {
    return `${Number.parseInt(numberedWithoutSuffix[1]!, 10)} c`.toLowerCase()
  }

  const named = normalized.match(
    /^PANTONE\s+(Yellow|Violet|Rubine\s+Red|Strong\s+Red)\s+C$/i
  )
  if (named) {
    return `${named[1]!.replace(/\s+/g, ' ')} c`.toLowerCase()
  }

  const catalogKey = normalizeCatalogKey(normalized)
  if (/^raster\s+spot\s+\d+$/i.test(catalogKey)) return null
  return catalogKey
}

/** RGB aproximados Pantone Solid Coated para mostrar en UI (no para muestreo de píxeles). */
const PANTONE_SOLID_COATED_DISPLAY_HEX: Readonly<Record<string, string>> = {
  '100 c': '#f6eb61',
  '101 c': '#f7ea48',
  '102 c': '#fce300',
  '103 c': '#c5a900',
  '108 c': '#fed900',
  '109 c': '#ffd100',
  '110 c': '#d5a100',
  '115 c': '#fae053',
  '116 c': '#ffcd00',
  '120 c': '#fbd872',
  '123 c': '#ffc72c',
  '124 c': '#f0b310',
  '130 c': '#f2a900',
  '137 c': '#ff9e1b',
  '151 c': '#ff8200',
  '158 c': '#e87722',
  '165 c': '#ff671f',
  '1655 c': '#f87c14',
  '166 c': '#ff5f00',
  '172 c': '#fa4616',
  '1788 c': '#e4002b',
  '179 c': '#e03c31',
  '1795 c': '#e4002b',
  '180 c': '#c8102e',
  '1805 c': '#a6192e',
  '181 c': '#7f3030',
  '185 c': '#e4002b',
  '186 c': '#c8102e',
  '187 c': '#a6192e',
  '188 c': '#76232f',
  '199 c': '#d50032',
  '200 c': '#ba0c2f',
  '201 c': '#9d2235',
  '202 c': '#8b2332',
  '203 c': '#e0457b',
  '206 c': '#ce0058',
  '208 c': '#a50050',
  '211 c': '#f57eb6',
  '212 c': '#f04e98',
  '213 c': '#e31c79',
  '214 c': '#ce0f69',
  '219 c': '#da1884',
  '225 c': '#e10098',
  '234 c': '#e0006d',
  '239 c': '#f59bbb',
  '240 c': '#f277c6',
  '241 c': '#e0459a',
  '242 c': '#d0006f',
  '254 c': '#b580d1',
  '2583 c': '#5f259f',
  '260 c': '#6d2077',
  '261 c': '#6d2077',
  '262 c': '#512d6d',
  '266 c': '#753bbd',
  '268 c': '#582c83',
  '2685 c': '#4f2d7f',
  '2718 c': '#5a008f',
  '2738 c': '#1e0088',
  '2758 c': '#1a0052',
  '2768 c': '#1a0040',
  '286 c': '#0033a0',
  '287 c': '#003da5',
  '293 c': '#003da5',
  '294 c': '#002f6c',
  '295 c': '#002855',
  '296 c': '#051c2c',
  '299 c': '#00a3e0',
  '2995 c': '#00a5e0',
  '300 c': '#005eb8',
  '301 c': '#004b87',
  '302 c': '#003e51',
  '306 c': '#00b5e2',
  '313 c': '#0092bc',
  '314 c': '#0085ad',
  '315 c': '#00677f',
  '320 c': '#008c95',
  '327 c': '#006865',
  '334 c': '#00685e',
  '341 c': '#007749',
  '342 c': '#006747',
  '343 c': '#115740',
  '348 c': '#00843d',
  '349 c': '#046a38',
  '350 c': '#2c5234',
  '361 c': '#43b02a',
  '375 c': '#86318f',
  '376 c': '#84bd00',
  '382 c': '#c4d600',
  '394 c': '#e3e935',
  '485 c': '#da291c',
  '704 c': '#9b2743',
  '801 c': '#0095c8',
  '7467 c': '#005f61',
  '7628 c': '#3d0c14',
  'yellow c': '#fedd00',
  'violet c': '#440099',
  'rubine red c': '#ce0058',
  'strong red c': '#ff0090',
}

const DISPLAY_SUFFIX_FALLBACKS = ['c', 'u', 'm', 'cp'] as const

const lookupCatalogHex = (catalogKey: string): string | undefined => {
  const direct = PANTONE_SOLID_COATED_DISPLAY_HEX[catalogKey]
  if (direct) return direct

  const numericOnly = catalogKey.match(/^(\d{1,4})$/)
  if (numericOnly) {
    return PANTONE_SOLID_COATED_DISPLAY_HEX[`${Number.parseInt(numericOnly[1]!, 10)} c`]
  }

  const withoutSuffix = catalogKey.replace(/\s+[a-z]{1,3}$/i, '')
  const numeric = Number.parseInt(withoutSuffix, 10)
  if (!Number.isFinite(numeric)) return undefined

  const suffix = catalogKey.split(' ').slice(-1)[0]?.toLowerCase()
  if (suffix && DISPLAY_SUFFIX_FALLBACKS.includes(suffix as (typeof DISPLAY_SUFFIX_FALLBACKS)[number])) {
    const coatedKey = `${numeric} c`
    const coatedHex = PANTONE_SOLID_COATED_DISPLAY_HEX[coatedKey]
    if (coatedHex) return coatedHex
  }

  const parts = catalogKey.split(' ')
  const fallbackSuffix = parts.length === 1 ? 'c' : (parts[parts.length - 1] ?? 'c')
  const normalizedNumericKey = `${numeric} ${fallbackSuffix}`.toLowerCase()
  return PANTONE_SOLID_COATED_DISPLAY_HEX[normalizedNumericKey]
}

/** Color de UI para un Pantone identificado por nombre. Nunca usa píxeles del archivo. */
export const resolvePantoneDisplayHexFromName = (name: string): string | undefined => {
  const catalogKey = parsePantoneDisplayCatalogKey(name)
  if (!catalogKey) return undefined
  return lookupCatalogHex(catalogKey)
}

const hexToRgbChannels = (hex: string): [number, number, number] => {
  const normalized = hex.replace('#', '')
  const value = Number.parseInt(normalized, 16)
  if (!Number.isFinite(value)) return [0, 0, 0]
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255]
}

const formatNumberedCatalogKeyAsPantoneName = (key: string): string => {
  const match = key.match(/^(\d{1,4})\s+([a-z]{1,3})$/i)
  if (match) return `PANTONE ${match[1]} ${match[2]!.toUpperCase()}`
  return `PANTONE ${key}`
}

const NAMED_CATALOG_KEY_TO_PANTONE_NAME: Readonly<Record<string, string>> = {
  'yellow c': 'PANTONE Yellow C',
  'violet c': 'PANTONE Violet C',
  'rubine red c': 'PANTONE Rubine Red C',
  'strong red c': 'PANTONE Strong Red C',
}

const CATALOG_SPOT_NAME_MATCH_DISTANCE_SQUARED = 95 * 95

/** Empareja un RGB de archivo con el Pantone de catálogo más cercano (solo UI). */
export const resolvePantoneDisplayCatalogNameForRgb = (
  r: number,
  g: number,
  b: number
): string | null => {
  let bestKey: string | null = null
  let bestScore = Number.POSITIVE_INFINITY

  for (const [key, hex] of Object.entries(PANTONE_SOLID_COATED_DISPLAY_HEX)) {
    const [cr, cg, cb] = hexToRgbChannels(hex)
    const dr = r - cr
    const dg = g - cg
    const db = b - cb
    const score = dr * dr + dg * dg + db * db
    if (score < bestScore) {
      bestScore = score
      bestKey = key
    }
  }

  if (!bestKey || bestScore > CATALOG_SPOT_NAME_MATCH_DISTANCE_SQUARED) return null

  return (
    NAMED_CATALOG_KEY_TO_PANTONE_NAME[bestKey] ?? formatNumberedCatalogKeyAsPantoneName(bestKey)
  )
}
