import { describe, expect, it } from 'vitest'
import {
  applyColoresPlanchasForHistorialReuse,
  buildClienteSuministraPlanchaDetalle,
  extractDescripcionUsuarioClienteSuministra,
  buildPrecioPatchFromCatalog,
  buildColoresPlanchasPatch,
  computeTamanosBuenos,
  deriveCantidadHojas,
  hasDuplicateColoresPlanchaRegistro,
  resolvePrecioPlanchaDisplay,
  roundDivision,
  sumTamanosBuenosYSobrante,
  resolveTamanosBuenosValue,
  sumValorTotalPlanchas,
  syncColoresPlanchasCantidadFromOrder,
} from './coloresPlanchasUtils'
import type { DisenoColorPlanchaItem } from '../../../../core/domain/entities/PreprensaDiseno'
import type { TamanoPlancha } from '../../../../core/domain/entities/TamanoPlancha'

const baseItem = (): DisenoColorPlanchaItem => ({
  id: '1',
  colores: '2-colores',
  planchaId: 'tp1',
  planchaNombreMedida: 'Plancha — 70x100',
  planchaValor: 0,
  cantidad: 0,
  numeroPlanchas: 2,
  valorTotal: 0,
  numeroCavidades: 2,
  tamanosBuenos: 0,
  sobrante: 0,
  detalle: '',
  observacion: '',
  reposicionPlancha: false,
  cantidadReposicion: 0,
  registroManual: false,
})

describe('hasDuplicateColoresPlanchaRegistro', () => {
  it('detecta mismo tipo de plancha y descripción (sin distinguir mayúsculas)', () => {
    const items = [{ ...baseItem(), detalle: 'Tinta pantone' }]
    expect(hasDuplicateColoresPlanchaRegistro(items, 'tp1', 'tinta pantone')).toBe(true)
    expect(hasDuplicateColoresPlanchaRegistro(items, 'tp1', '  Tinta pantone  ')).toBe(true)
  })

  it('no marca duplicado si cambia plancha o descripción', () => {
    const items = [{ ...baseItem(), detalle: 'Tinta pantone' }]
    expect(hasDuplicateColoresPlanchaRegistro(items, 'tp2', 'Tinta pantone')).toBe(false)
    expect(hasDuplicateColoresPlanchaRegistro(items, 'tp1', 'Otro detalle')).toBe(false)
  })

  it('excluye el registro en edición por id', () => {
    const items = [{ ...baseItem(), id: 'edit-me', detalle: 'Tinta pantone' }]
    expect(
      hasDuplicateColoresPlanchaRegistro(items, 'tp1', 'Tinta pantone', 'edit-me')
    ).toBe(false)
  })
})

describe('roundDivision', () => {
  it('rounds to nearest integer', () => {
    expect(roundDivision(3850, 24)).toBe(160)
    expect(roundDivision(5001, 2)).toBe(2501)
    expect(roundDivision(5000, 3)).toBe(1667)
  })
})

describe('computeTamanosBuenos', () => {
  it('returns cantidad divided by cavidades with math rounding', () => {
    expect(computeTamanosBuenos(5000, 2)).toEqual({ ok: true, value: 2500 })
    expect(computeTamanosBuenos(5001, 2)).toEqual({ ok: true, value: 2501 })
    expect(computeTamanosBuenos(5000, 3)).toEqual({ ok: true, value: 1667 })
    expect(resolveTamanosBuenosValue(5000, 2)).toBe(2500)
  })

  it('does not calculate without cavidades', () => {
    expect(computeTamanosBuenos(5000, 0)).toEqual({ ok: false, reason: 'sin-cavidad' })
    expect(resolveTamanosBuenosValue(5000, 0)).toBe(0)
  })
})

describe('sumTamanosBuenosYSobrante', () => {
  it('sums recalculated tamanos buenos and sobrante per registro', () => {
    expect(
      sumTamanosBuenosYSobrante([
        { ...baseItem(), cantidad: 5000, numeroCavidades: 2, tamanosBuenos: 0, sobrante: 100 },
        { ...baseItem(), id: '2', cantidad: 2400, numeroCavidades: 2, tamanosBuenos: 9999, sobrante: 50 },
      ])
    ).toBe(3850)
  })
})

describe('deriveCantidadHojas', () => {
  it('divides total piezas by piezas por pliego (redondeo matemático)', () => {
    const items = [
      { ...baseItem(), cantidad: 5000, numeroCavidades: 2, sobrante: 100 },
      { ...baseItem(), id: '2', cantidad: 2400, numeroCavidades: 2, sobrante: 50 },
    ]
    expect(deriveCantidadHojas(items, 24)).toBe(160)
    expect(deriveCantidadHojas(items, 32)).toBe(120)
  })

  it('returns 0 without piezas por pliego or sin total', () => {
    expect(deriveCantidadHojas([{ ...baseItem(), tamanosBuenos: 100 }], 0)).toBe(0)
    expect(deriveCantidadHojas([], 24)).toBe(0)
  })
})

describe('syncColoresPlanchasCantidadFromOrder', () => {
  it('fills cantidad on historial rows that were left at zero', () => {
    const items = [baseItem(), { ...baseItem(), id: '2', registroManual: true, cantidad: 0 }]
    const synced = syncColoresPlanchasCantidadFromOrder(items, 5000)
    expect(synced).not.toBeNull()
    expect(synced![0].cantidad).toBe(5000)
    expect(synced![0].tamanosBuenos).toBe(2500)
    expect(synced![1].cantidad).toBe(0)
  })

  it('returns null when order quantity is zero or rows already have cantidad', () => {
    expect(syncColoresPlanchasCantidadFromOrder([baseItem()], 0)).toBeNull()
    expect(
      syncColoresPlanchasCantidadFromOrder([{ ...baseItem(), cantidad: 3000 }], 5000)
    ).toBeNull()
  })
})

describe('applyColoresPlanchasForHistorialReuse', () => {
  it('uses order quantity when provided at load time', () => {
    const items = applyColoresPlanchasForHistorialReuse(
      { coloresPlanchas: [baseItem()] },
      8000
    )
    expect(items[0].cantidad).toBe(8000)
  })
})

describe('buildClienteSuministraPlanchaDetalle', () => {
  const tipo = 'Plancha estándar — 70x100 cm'

  it('incluye solo el tipo de plancha sin descripción adicional', () => {
    expect(buildClienteSuministraPlanchaDetalle(tipo)).toBe(
      'Cliente suministra plancha Plancha estándar — 70x100 cm'
    )
  })

  it('concatena la descripción del usuario antes del texto automático', () => {
    expect(buildClienteSuministraPlanchaDetalle(tipo, 'Tinta Pantone')).toBe(
      'Tinta Pantone — Cliente suministra plancha Plancha estándar — 70x100 cm'
    )
  })

  it('no duplica el texto si el usuario pegó el detalle completo', () => {
    const completo =
      'Tinta Pantone — Cliente suministra plancha Plancha estándar — 70x100 cm'
    expect(buildClienteSuministraPlanchaDetalle(tipo, completo)).toBe(completo)
  })

  it('migra el orden anterior al reconstruir el detalle', () => {
    const legacy =
      'Cliente suministra plancha Plancha estándar — 70x100 cm — Tinta Pantone'
    expect(buildClienteSuministraPlanchaDetalle(tipo, legacy)).toBe(
      'Tinta Pantone — Cliente suministra plancha Plancha estándar — 70x100 cm'
    )
  })
})

describe('extractDescripcionUsuarioClienteSuministra', () => {
  const tipo = 'Plancha estándar — 70x100 cm'

  it('extrae la parte del usuario con el orden actual', () => {
    expect(
      extractDescripcionUsuarioClienteSuministra(
        'Tinta Pantone — Cliente suministra plancha Plancha estándar — 70x100 cm',
        tipo
      )
    ).toBe('Tinta Pantone')
  })

  it('extrae la parte del usuario con el orden anterior', () => {
    expect(
      extractDescripcionUsuarioClienteSuministra(
        'Cliente suministra plancha Plancha estándar — 70x100 cm — Tinta Pantone',
        tipo
      )
    ).toBe('Tinta Pantone')
  })
})

describe('reposición en diseño existente', () => {
  const plancha: TamanoPlancha = {
    id: 'tp1',
    name: 'Plancha',
    medida: '70x100',
    valor: 50000,
    active: true,
  }

  it('calcula precio al activar reposición con el ítem ya marcado', () => {
    const item = { ...baseItem(), reposicionPlancha: true, cantidadReposicion: 2 }
    const patch = buildPrecioPatchFromCatalog(item, plancha, 2, { historialMode: true })
    expect(patch.planchaValor).toBe(50000)
    expect(patch.valorTotal).toBe(100000)
  })

  it('suma reposición en valor total planchas del diseño', () => {
    const items = [
      {
        ...baseItem(),
        reposicionPlancha: true,
        cantidadReposicion: 2,
        planchaValor: 50000,
        valorTotal: 100000,
      },
    ]
    const patch = buildColoresPlanchasPatch(items, { historialMode: true })
    expect(patch.valorTotalPlanchas).toBe(100000)
  })

  it('no cobra plancha en historial sin reposición ni registro manual', () => {
    const patch = buildColoresPlanchasPatch([baseItem()], { historialMode: true })
    expect(patch.valorTotalPlanchas).toBe(0)
  })
})
