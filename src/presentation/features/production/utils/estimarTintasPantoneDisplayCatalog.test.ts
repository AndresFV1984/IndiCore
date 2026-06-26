import { describe, expect, it } from 'vitest'
import {
  parsePantoneDisplayCatalogKey,
  resolvePantoneDisplayHexFromName,
} from './estimarTintasPantoneDisplayCatalog'

describe('estimarTintasPantoneDisplayCatalog', () => {
  it('parsea claves de catálogo desde nombres Pantone', () => {
    expect(parsePantoneDisplayCatalogKey('PANTONE 187 C')).toBe('187 c')
    expect(parsePantoneDisplayCatalogKey('Pantone Yellow C')).toBe('yellow c')
    expect(parsePantoneDisplayCatalogKey('PANTONE 1655 C')).toBe('1655 c')
    expect(parsePantoneDisplayCatalogKey('PANTONE 187 U')).toBe('187 u')
    expect(parsePantoneDisplayCatalogKey('PANTONE 187')).toBe('187 c')
    expect(parsePantoneDisplayCatalogKey('PANTONE Raster Spot 1')).toBeNull()
  })

  it('resuelve color de UI desde el nombre Pantone, no desde el archivo', () => {
    expect(resolvePantoneDisplayHexFromName('PANTONE 187 C')).toBe('#a6192e')
    expect(resolvePantoneDisplayHexFromName('Pantone 485 C')).toBe('#da291c')
    expect(resolvePantoneDisplayHexFromName('PANTONE Yellow C')).toBe('#fedd00')
    expect(resolvePantoneDisplayHexFromName('PANTONE 7628 C')).toBe('#3d0c14')
    expect(resolvePantoneDisplayHexFromName('PANTONE 375 C')).toBe('#86318f')
    expect(resolvePantoneDisplayHexFromName('PANTONE 187 U')).toBe('#a6192e')
    expect(resolvePantoneDisplayHexFromName('PANTONE 187')).toBe('#a6192e')
  })
})
