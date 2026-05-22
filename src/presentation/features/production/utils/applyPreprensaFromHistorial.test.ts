import { describe, expect, it } from 'vitest'
import {
  buildPreprensaFromHistorial,
  normalizePreprensaSnapshot,
} from './applyPreprensaFromHistorial'
import {
  emptyPreprensaDiseno,
  PreprensaDisenoSpecs,
} from '../../../../core/domain/entities/PreprensaDiseno'

describe('buildPreprensaFromHistorial', () => {
  it('zeros planchaValor on coloresPlanchas items', () => {
    const raw: Partial<PreprensaDisenoSpecs> = {
      coloresPlanchas: [
        {
          id: '1',
          colores: '2-colores',
          planchaId: 'tp1',
          planchaNombreMedida: 'Plancha — 70x100',
          planchaValor: 185000,
          cantidad: 0,
          numeroPlanchas: 0,
          valorTotal: 0,
          numeroCavidades: 2,
          detalle: 'Cyan',
          observacion: '',
        },
      ],
    }
    const result = buildPreprensaFromHistorial(raw as PreprensaDisenoSpecs, 'ord-1', 'work')
    expect(result.coloresPlanchas?.[0]?.planchaValor).toBe(0)
    expect(result.coloresPlanchas?.[0]?.reposicionPlancha).toBe(false)
    expect(result.planchaValor).toBe(0)
  })

  it('applyHistorialTrabajo merge keeps zeroed valores', () => {
    const raw: Partial<PreprensaDisenoSpecs> = {
      coloresPlanchas: [
        {
          id: '1',
          colores: '2-colores',
          planchaId: 'tp1',
          planchaNombreMedida: 'Plancha — 70x100',
          planchaValor: 185000,
          cantidad: 0,
          numeroPlanchas: 0,
          valorTotal: 0,
          numeroCavidades: 2,
          detalle: 'Cyan',
          observacion: '',
        },
      ],
    }
    const snapshot = normalizePreprensaSnapshot(raw)
    const preprensaDiseno: PreprensaDisenoSpecs = {
      ...emptyPreprensaDiseno(),
      ...buildPreprensaFromHistorial(snapshot, 'ord-1', 'work'),
    }
    expect(preprensaDiseno.coloresPlanchas[0]?.planchaValor).toBe(0)
  })
})
