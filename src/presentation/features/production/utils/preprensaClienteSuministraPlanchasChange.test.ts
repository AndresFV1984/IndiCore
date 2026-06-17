import { describe, expect, it } from 'vitest'
import {
  buildColoresPlanchasPatchWithSuministro,
  patchPreprensaClienteSuministraPlanchas,
  patchRegistroClienteSuministraPlanchas,
  resolvePlanchaSuministroSelectorState,
} from './preprensaClienteSuministraPlanchasChange'
import type { DisenoColorPlanchaItem } from '../../../../core/domain/entities/PreprensaDiseno'
import type { TamanoPlancha } from '../../../../core/domain/entities/TamanoPlancha'

const registro = (overrides: Partial<DisenoColorPlanchaItem> = {}): DisenoColorPlanchaItem => ({
  id: '1',
  colores: '2-colores',
  planchaId: 'tp1',
  planchaNombreMedida: 'Plancha — 70x100',
  planchaValor: 50000,
  cantidad: 1000,
  numeroPlanchas: 2,
  valorTotal: 100000,
  numeroCavidades: 2,
  tamanosBuenos: 500,
  sobrante: 0,
  detalle: 'Tinta',
  observacion: '',
  reposicionPlancha: false,
  cantidadReposicion: 0,
  registroManual: false,
  ...overrides,
})

const planchas: TamanoPlancha[] = [
  { id: 'tp1', name: 'Plancha', medida: '70x100', valor: 50000, active: true },
]

describe('resolvePlanchaSuministroSelectorState', () => {
  it('oculta el selector fuera del compositor de registro', () => {
    expect(resolvePlanchaSuministroSelectorState(false, false, 'si')).toEqual({
      visible: false,
      disabledValues: [],
    })
  })

  it('muestra ambas opciones al crear o editar un registro', () => {
    expect(resolvePlanchaSuministroSelectorState(true, false, 'no')).toEqual({
      visible: true,
      disabledValues: [],
    })
    expect(resolvePlanchaSuministroSelectorState(true, true, 'si')).toEqual({
      visible: true,
      disabledValues: [],
    })
  })
})

describe('patchRegistroClienteSuministraPlanchas', () => {
  it('agrega texto de suministro del cliente sin duplicar «Plancha»', () => {
    const patched = patchRegistroClienteSuministraPlanchas(registro(), 'si')
    expect(patched.clienteSuministraPlanchas).toBe('si')
    expect(patched.planchaValor).toBe(0)
    expect(patched.valorTotal).toBe(0)
    expect(patched.detalle).toBe('Tinta — Cliente suministra — Plancha — 70x100')
  })

  it('no cobra reposición si el cliente suministra la plancha', () => {
    const patched = patchRegistroClienteSuministraPlanchas(
      registro({
        reposicionPlancha: true,
        cantidadReposicion: 2,
        planchaValor: 50000,
        valorTotal: 100000,
      }),
      'si'
    )
    expect(patched.reposicionPlancha).toBe(true)
    expect(patched.cantidadReposicion).toBe(2)
    expect(patched.planchaValor).toBe(0)
    expect(patched.valorTotal).toBe(0)
  })

  it('restaura descripción al volver a litografía en un solo registro', () => {
    const conCliente = patchRegistroClienteSuministraPlanchas(registro(), 'si')
    const patched = patchRegistroClienteSuministraPlanchas(conCliente, 'no', planchas)
    expect(patched.clienteSuministraPlanchas).toBe('no')
    expect(patched.detalle).toBe('Tinta')
    expect(patched.valorTotal).toBe(100000)
  })
})

describe('patchPreprensaClienteSuministraPlanchas', () => {
  it('no modifica registros ya guardados', () => {
    const items = [registro({ id: 'a' }), registro({ id: 'b', detalle: 'Otro' })]
    const patch = patchPreprensaClienteSuministraPlanchas('si', items)
    expect(patch.clienteSuministraPlanchas).toBe('si')
    expect(patch.coloresPlanchas).toEqual(items)
    expect(patch.coloresPlanchas?.[0]?.detalle).toBe('Tinta')
    expect(patch.coloresPlanchas?.[1]?.detalle).toBe('Otro')
  })
})

describe('buildColoresPlanchasPatchWithSuministro', () => {
  it('deriva el indicador de orden desde los registros', () => {
    const patch = buildColoresPlanchasPatchWithSuministro([
      registro({ clienteSuministraPlanchas: 'no' }),
      registro({ id: '2', clienteSuministraPlanchas: 'si' }),
    ])
    expect(patch.clienteSuministraPlanchas).toBe('si')
    expect(patch.valorTotalPlanchas).toBe(100000)
  })
})
