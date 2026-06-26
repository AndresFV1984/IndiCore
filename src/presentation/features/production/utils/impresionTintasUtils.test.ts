import { describe, expect, it } from 'vitest'
import {
  applyImpresionLadoCantidadChange,
  applyImpresionLadoCantidadWithLimit,
  replicateNewRetiroSlotsFromTiro,
  replicateTiroSlotInkToRetiro,
  replicateTiroTintasChangesToRetiro,
  replicateTiroTintasToRetiro,
  buildLadoInkDefaults,
  clampImpresionEntradaDraftSides,
  clampImpresionEntradaToPlanchaColores,
  clampImpresionTintasCantidad,
  createImpresionTiroRetiroEntrada,
  emptyImpresionLadoTintas,
  emptyImpresionTintasRegistro,
  isImpresionEntradaDraftValid,
  isImpresionLadoComplete,
  isImpresionPlanchaCompleta,
  normalizeImpresionInkIndex,
  patchImpresionTintasRegistro,
  resolveCompletedPlanchaIds,
  resolveImpresionLadoMaxCantidad,
  resolvePlanchaColoresMax,
  shouldUsePrimaryInks,
  sumImpresionEntradaTintas,
  sumImpresionRegistroTintas,
  syncImpresionTintasRegistros,
  updateImpresionLadoTinta,
} from './impresionTintasUtils'
import type { DisenoColorPlanchaItem } from '../../../../core/domain/entities/PreprensaDiseno'

const plancha = (id: string): DisenoColorPlanchaItem => ({
  id,
  colores: '4-colores',
  planchaId: 'p1',
  planchaNombreMedida: 'Plancha 50×70',
  planchaValor: 1000,
  cantidad: 1000,
  numeroCavidades: 1,
  tamanosBuenos: 1000,
  sobrante: 0,
  numeroPlanchas: 4,
  valorTotal: 4000,
  detalle: 'Frente',
  observacion: '',
})

describe('normalizeImpresionInkIndex', () => {
  it('conserva Verde (6) y Pantone (7) como índices distintos', () => {
    expect(normalizeImpresionInkIndex(6)).toBe(6)
    expect(normalizeImpresionInkIndex(7)).toBe(7)
    expect(normalizeImpresionInkIndex(5)).toBe(5)
    expect(normalizeImpresionInkIndex(-1)).toBe(-1)
  })
})

describe('buildLadoInkDefaults', () => {
  it('asigna CMYK parcial según cantidad', () => {
    expect(buildLadoInkDefaults(0)).toEqual([])
    expect(buildLadoInkDefaults(1)).toEqual([0])
    expect(buildLadoInkDefaults(3)).toEqual([0, 1, 2])
    expect(buildLadoInkDefaults(4)).toEqual([0, 1, 2, 3])
  })

  it('precarga CMYK, secundarios y Pantone según cantidad', () => {
    expect(buildLadoInkDefaults(5)).toEqual([0, 1, 2, 3, 4])
    expect(buildLadoInkDefaults(6)).toEqual([0, 1, 2, 3, 4, 5])
    expect(buildLadoInkDefaults(7)).toEqual([0, 1, 2, 3, 4, 5, 6])
    expect(buildLadoInkDefaults(8)).toEqual([0, 1, 2, 3, 4, 5, 6, 7])
  })
})

describe('shouldUsePrimaryInks', () => {
  it('aplica primarios solo por debajo de 5', () => {
    expect(shouldUsePrimaryInks(0)).toBe(false)
    expect(shouldUsePrimaryInks(4)).toBe(true)
    expect(shouldUsePrimaryInks(5)).toBe(false)
  })
})

describe('applyImpresionLadoCantidadChange', () => {
  it('preasigna primarios cuando cantidad < 5', () => {
    const next = applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 3)
    expect(next).toEqual({ cantidad: 3, tintas: [0, 1, 2] })
  })

  it('precarga CMYK, Rojo y Pantone cuando cantidad >= 5', () => {
    const next = applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 6)
    expect(next.cantidad).toBe(6)
    expect(next.tintas).toEqual([0, 1, 2, 3, 4, 5])
  })

  it('conserva tintas personalizadas al ampliar cantidad', () => {
    const base = applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 5)
    const customized = updateImpresionLadoTinta(base, 4, 7)
    const expanded = applyImpresionLadoCantidadChange(customized, 6)
    expect(expanded.tintas).toEqual([0, 1, 2, 3, 7, 5])
  })
})

describe('isImpresionEntradaDraftValid', () => {
  it('exige que tiro + retiro sumen exactamente los colores de la plancha', () => {
    expect(isImpresionEntradaDraftValid(emptyImpresionLadoTintas(), emptyImpresionLadoTintas(), 4)).toBe(
      false
    )
    expect(
      isImpresionEntradaDraftValid(
        applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 2),
        emptyImpresionLadoTintas(),
        4
      )
    ).toBe(false)
    expect(
      isImpresionEntradaDraftValid(
        emptyImpresionLadoTintas(),
        applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 4),
        4
      )
    ).toBe(true)
    expect(
      isImpresionEntradaDraftValid(
        applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 4),
        emptyImpresionLadoTintas(),
        4
      )
    ).toBe(true)
    expect(
      isImpresionEntradaDraftValid(
        applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 2),
        applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 2),
        4
      )
    ).toBe(true)
    expect(
      isImpresionEntradaDraftValid(
        applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 3),
        applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 2),
        4
      )
    ).toBe(false)
  })
})

describe('updateImpresionLadoTinta', () => {
  it('permite cambiar cualquier tinta en cualquier momento', () => {
    const lado = applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 2)
    expect(updateImpresionLadoTinta(lado, 1, 5).tintas).toEqual([0, 5])
    expect(updateImpresionLadoTinta(lado, 0, 4).tintas).toEqual([4, 1])
  })

  it('conserva Verde al asignar el índice 6', () => {
    const lado = applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 5)
    expect(updateImpresionLadoTinta(lado, 4, 6).tintas).toEqual([0, 1, 2, 3, 6])
  })
})

describe('replicateTiroTintasToRetiro', () => {
  it('copia tintas de tiro en los slots homólogos de retiro', () => {
    const tiro = updateImpresionLadoTinta(
      applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 3),
      2,
      5
    )
    const retiro = applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 2)

    expect(replicateTiroTintasToRetiro(tiro, retiro)).toEqual({
      cantidad: 2,
      tintas: [0, 1],
    })
  })

  it('no altera retiro cuando tiro o retiro no tienen cantidad', () => {
    const retiro = applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 2)
    expect(replicateTiroTintasToRetiro(emptyImpresionLadoTintas(), retiro)).toBe(retiro)
    expect(
      replicateTiroTintasToRetiro(
        applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 2),
        emptyImpresionLadoTintas()
      )
    ).toEqual(emptyImpresionLadoTintas())
  })

  it('conserva slots extra de retiro cuando tiro tiene menos tintas', () => {
    const tiro = applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 1)
    const retiro = updateImpresionLadoTinta(
      applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 3),
      2,
      6
    )

    expect(replicateTiroTintasToRetiro(tiro, retiro)).toEqual({
      cantidad: 3,
      tintas: [0, 1, 6],
    })
  })
})

describe('replicateTiroTintasChangesToRetiro', () => {
  it('replica solo el slot de tiro que cambió', () => {
    const prevTiro = applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 2)
    const nextTiro = updateImpresionLadoTinta(prevTiro, 0, 4)
    const retiro = updateImpresionLadoTinta(
      applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 2),
      1,
      6
    )

    expect(replicateTiroTintasChangesToRetiro(prevTiro, nextTiro, retiro, 4)).toEqual({
      cantidad: 2,
      tintas: [4, 6],
    })
  })

  it('no sobrescribe retiro si tiro no cambió en ese slot', () => {
    const tiro = applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 2)
    const retiro = updateImpresionLadoTinta(
      applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 2),
      0,
      5
    )

    expect(replicateTiroTintasChangesToRetiro(tiro, tiro, retiro, 4)).toBe(retiro)
  })

  it('replica slots nuevos cuando aumenta la cantidad en tiro', () => {
    const prevTiro = applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 2)
    const nextTiro = applyImpresionLadoCantidadChange(prevTiro, 3)
    const retiro = applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 3)

    expect(replicateTiroTintasChangesToRetiro(prevTiro, nextTiro, retiro, 4)).toEqual({
      cantidad: 3,
      tintas: [0, 1, 2],
    })
  })

  it('limpia retiro cuando tiro queda sin tintas', () => {
    const prevTiro = applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 2)
    const retiro = applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 2)

    expect(
      replicateTiroTintasChangesToRetiro(
        prevTiro,
        emptyImpresionLadoTintas(),
        retiro,
        4
      )
    ).toEqual(emptyImpresionLadoTintas())
  })

  it('reduce retiro al mismo tiempo que se quitan tintas en tiro', () => {
    const prevTiro = updateImpresionLadoTinta(
      applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 2),
      1,
      6
    )
    const nextTiro = applyImpresionLadoCantidadChange(prevTiro, 1)
    const retiro = updateImpresionLadoTinta(
      applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 2),
      1,
      6
    )

    expect(replicateTiroTintasChangesToRetiro(prevTiro, nextTiro, retiro, 4)).toEqual({
      cantidad: 1,
      tintas: [0],
    })
  })
})

describe('replicateTiroSlotInkToRetiro', () => {
  it('amplía retiro y copia tintas cuando aún no hay slots en retiro', () => {
    const tiro = updateImpresionLadoTinta(
      applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 2),
      0,
      4
    )

    expect(
      replicateTiroSlotInkToRetiro(tiro, emptyImpresionLadoTintas(), 0, 4)
    ).toEqual({
      cantidad: 1,
      tintas: [4],
    })
  })

  it('copia un slot existente sin tocar los demás', () => {
    const tiro = updateImpresionLadoTinta(
      applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 2),
      0,
      4
    )
    const retiro = updateImpresionLadoTinta(
      applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 2),
      1,
      6
    )

    expect(replicateTiroSlotInkToRetiro(tiro, retiro, 0, 4)).toEqual({
      cantidad: 2,
      tintas: [4, 6],
    })
  })
})

describe('replicateNewRetiroSlotsFromTiro', () => {
  it('precarga solo los slots nuevos de retiro desde tiro', () => {
    const prevRetiro = updateImpresionLadoTinta(
      applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 1),
      0,
      5
    )
    const nextRetiro = applyImpresionLadoCantidadChange(prevRetiro, 2)
    const tiro = updateImpresionLadoTinta(
      applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 2),
      1,
      6
    )

    expect(replicateNewRetiroSlotsFromTiro(prevRetiro, nextRetiro, tiro)).toEqual({
      cantidad: 2,
      tintas: [5, 6],
    })
  })
})

describe('isImpresionLadoComplete', () => {
  it('requiere todas las tintas asignadas cuando hay cantidad', () => {
    expect(isImpresionLadoComplete({ cantidad: 0, tintas: [] })).toBe(true)
    expect(isImpresionLadoComplete({ cantidad: 2, tintas: [0, -1] })).toBe(false)
    expect(isImpresionLadoComplete({ cantidad: 2, tintas: [0, 1] })).toBe(true)
  })
})

describe('resolvePlanchaColoresMax', () => {
  it('usa la cantidad de colores del registro preprensa', () => {
    expect(resolvePlanchaColoresMax({ ...plancha('a'), colores: '4-colores' })).toBe(4)
    expect(resolvePlanchaColoresMax({ ...plancha('a'), colores: '7-colores-o-mas' })).toBe(7)
    expect(
      resolvePlanchaColoresMax({
        ...plancha('a'),
        colores: '7-colores-o-mas',
        numeroPlanchas: 10,
      })
    ).toBe(10)
  })
})

describe('clampImpresionEntradaDraftSides', () => {
  it('ajusta tiro y retiro del borrador al límite de la plancha', () => {
    const next = clampImpresionEntradaDraftSides(
      applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 3),
      applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 3),
      4
    )
    expect(next.tiro.cantidad + next.retiro.cantidad).toBeLessThanOrEqual(4)
  })
})

describe('applyImpresionLadoCantidadWithLimit', () => {
  it('limita tiro cuando retiro ya ocupa colores', () => {
    const tiro = applyImpresionLadoCantidadWithLimit(emptyImpresionLadoTintas(), 3, 4, 2)
    expect(tiro.cantidad).toBe(2)
  })
})

describe('clampImpresionEntradaToPlanchaColores', () => {
  it('ajusta tiro y retiro de una entrada al límite de la plancha', () => {
    const entrada = clampImpresionEntradaToPlanchaColores(
      createImpresionTiroRetiroEntrada(
        { cantidad: 5, tintas: [0, 1, 2, 3, 4] },
        { cantidad: 3, tintas: [0, 1, 2] }
      ),
      4
    )
    expect(entrada.tiro.cantidad).toBe(4)
    expect(entrada.retiro.cantidad).toBe(0)
  })
})

describe('resolveCompletedPlanchaIds', () => {
  it('devuelve ids de planchas con registro de tintas', () => {
    const registros = syncImpresionTintasRegistros([plancha('a'), plancha('b')])
    const next = patchImpresionTintasRegistro(registros, {
      colorPlanchaId: 'a',
      entradas: [
        createImpresionTiroRetiroEntrada(
          applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 2),
          emptyImpresionLadoTintas()
        ),
      ],
    })
    expect(resolveCompletedPlanchaIds(next)).toEqual(['a'])
    expect(isImpresionPlanchaCompleta(next[0]!)).toBe(true)
    expect(isImpresionPlanchaCompleta(next[1]!)).toBe(false)
  })
})

describe('syncImpresionTintasRegistros one per plancha', () => {
  it('conserva solo la primera entrada si hay varias', () => {
    const synced = syncImpresionTintasRegistros(
      [plancha('a')],
      [
        {
          colorPlanchaId: 'a',
          entradas: [
            createImpresionTiroRetiroEntrada(
              { cantidad: 1, tintas: [0] },
              emptyImpresionLadoTintas()
            ),
            createImpresionTiroRetiroEntrada(
              { cantidad: 2, tintas: [0, 1] },
              emptyImpresionLadoTintas()
            ),
          ],
        },
      ]
    )
    expect(synced[0]?.entradas).toHaveLength(1)
    expect(synced[0]?.entradas[0]?.tiro.cantidad).toBe(1)
  })
})

describe('sumImpresionRegistroTintas', () => {
  it('suma tintas de todas las entradas del registro', () => {
    const registro = {
      colorPlanchaId: 'a',
      entradas: [
        createImpresionTiroRetiroEntrada(
          applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 2),
          emptyImpresionLadoTintas()
        ),
        createImpresionTiroRetiroEntrada(
          applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 1),
          applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 1)
        ),
      ],
    }
    expect(sumImpresionRegistroTintas(registro)).toBe(4)
    expect(sumImpresionEntradaTintas(registro.entradas[0]!)).toBe(2)
  })
})

describe('resolveImpresionLadoMaxCantidad', () => {
  it('calcula el máximo restante para un lado', () => {
    expect(resolveImpresionLadoMaxCantidad(4, 2)).toBe(2)
    expect(resolveImpresionLadoMaxCantidad(4, 4)).toBe(0)
  })
})

describe('syncImpresionTintasRegistros', () => {
  it('conserva tipoBifronte al sincronizar registros existentes', () => {
    const synced = syncImpresionTintasRegistros(
      [plancha('a')],
      [
        {
          colorPlanchaId: 'a',
          tipoBifronte: 'volteo-pinza',
          entradas: [],
        },
      ]
    )
    expect(synced[0]?.tipoBifronte).toBe('volteo-pinza')
  })

  it('crea registros por plancha y conserva entradas existentes', () => {
    const existing = [
      {
        colorPlanchaId: 'a',
        entradas: [
          createImpresionTiroRetiroEntrada(
            { cantidad: 2, tintas: [0, 3] },
            emptyImpresionLadoTintas()
          ),
        ],
      },
    ]
    const synced = syncImpresionTintasRegistros([plancha('a'), plancha('b')], existing)
    expect(synced).toHaveLength(2)
    expect(synced[0]?.entradas[0]?.tiro).toEqual({ cantidad: 2, tintas: [0, 3] })
    expect(synced[1]?.colorPlanchaId).toBe('b')
  })

  it('migra registros legacy con tiro y retiro al nivel superior', () => {
    const synced = syncImpresionTintasRegistros(
      [plancha('a')],
      [
        {
          colorPlanchaId: 'a',
          tiro: { cantidad: 2, tintas: [0, 1] },
          retiro: { cantidad: 1, tintas: [2] },
        },
      ]
    )
    expect(synced[0]?.entradas).toHaveLength(1)
    expect(synced[0]?.entradas[0]?.tiro).toEqual({ cantidad: 2, tintas: [0, 1] })
    expect(synced[0]?.entradas[0]?.retiro).toEqual({ cantidad: 1, tintas: [2] })
  })

  it('conserva Verde (índice 6) al sincronizar registros existentes', () => {
    const synced = syncImpresionTintasRegistros(
      [plancha('a')],
      [
        {
          colorPlanchaId: 'a',
          entradas: [
            createImpresionTiroRetiroEntrada(
              { cantidad: 1, tintas: [6] },
              emptyImpresionLadoTintas()
            ),
          ],
        },
      ]
    )
    expect(synced[0]?.entradas[0]?.tiro.tintas).toEqual([6])
  })

  it('recorta entradas al sincronizar si superan los colores de la plancha', () => {
    const existing = [
      {
        colorPlanchaId: 'a',
        entradas: [
          createImpresionTiroRetiroEntrada(
            { cantidad: 3, tintas: [0, 1, 2] },
            { cantidad: 2, tintas: [3, 4] }
          ),
        ],
      },
    ]
    const synced = syncImpresionTintasRegistros([plancha('a')], existing)
    expect(sumImpresionEntradaTintas(synced[0]!.entradas[0]!)).toBeLessThanOrEqual(4)
  })
})

describe('clampImpresionTintasCantidad', () => {
  it('limita la cantidad al rango permitido', () => {
    expect(clampImpresionTintasCantidad(-2)).toBe(0)
    expect(clampImpresionTintasCantidad(3.8)).toBe(3)
    expect(clampImpresionTintasCantidad(99)).toBe(12)
  })
})

describe('patchImpresionTintasRegistro', () => {
  it('actualiza solo el registro indicado', () => {
    const registros = syncImpresionTintasRegistros([plancha('a'), plancha('b')])
    const next = patchImpresionTintasRegistro(registros, {
      colorPlanchaId: 'b',
      entradas: [
        createImpresionTiroRetiroEntrada(
          emptyImpresionLadoTintas(),
          applyImpresionLadoCantidadChange(emptyImpresionLadoTintas(), 1)
        ),
      ],
    })
    expect(next[1]?.entradas[0]?.retiro).toEqual({ cantidad: 1, tintas: [0] })
    expect(next[0]?.entradas).toEqual([])
  })
})
