import { describe, expect, it } from 'vitest'
import { patchPreprensaClienteSuministraPlanchas } from './preprensaClienteSuministraPlanchasChange'
import type { DisenoColorPlanchaItem } from '../../../../core/domain/entities/PreprensaDiseno'

const registro = (): DisenoColorPlanchaItem => ({
  id: '1',
  colores: '2-colores',
  planchaId: 'tp1',
  planchaNombreMedida: 'Plancha',
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
})

describe('patchPreprensaClienteSuministraPlanchas', () => {
  it('pone precios en cero cuando el cliente suministra planchas', () => {
    const patch = patchPreprensaClienteSuministraPlanchas('si', [registro()])
    expect(patch.clienteSuministraPlanchas).toBe('si')
    expect(patch.coloresPlanchas?.[0]?.planchaValor).toBe(0)
    expect(patch.coloresPlanchas?.[0]?.valorTotal).toBe(0)
    expect(patch.valorTotalPlanchas).toBe(0)
    expect(patch.coloresPlanchas?.[0]?.detalle).toBe('Tinta — Cliente suministra plancha Plancha')
  })

  it('conserva la descripción del usuario al activar suministro del cliente', () => {
    const patch = patchPreprensaClienteSuministraPlanchas('si', [
      { ...registro(), detalle: 'Tinta Pantone' },
    ])
    expect(patch.coloresPlanchas?.[0]?.detalle).toBe(
      'Tinta Pantone — Cliente suministra plancha Plancha'
    )
  })

  it('conserva registros al volver a cobrar planchas de la empresa', () => {
    const patch = patchPreprensaClienteSuministraPlanchas('no', [registro()])
    expect(patch.clienteSuministraPlanchas).toBe('no')
    expect(patch.coloresPlanchas?.[0]?.planchaValor).toBe(50000)
    expect(patch.valorTotalPlanchas).toBe(100000)
  })
})
