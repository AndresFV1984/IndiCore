import { describe, expect, it } from 'vitest'
import { emptyPreprensaDiseno } from '../../../../core/domain/entities/PreprensaDiseno'
import { computeDisenoResumenTotales } from './preprensaDisenoTotales'

describe('computeDisenoResumenTotales', () => {
  it('solo suma montaje cuando hay tarifa seleccionada', () => {
    const diseno = {
      ...emptyPreprensaDiseno(),
      precioMontajeId: '',
      precioMontajeNombre: 'Montaje huérfano',
      precioMontajeCosto: 120000,
    }
    const resumen = computeDisenoResumenTotales(diseno)
    expect(resumen.precioMontaje).toBe(0)
    expect(resumen.totalDiseno).toBe(0)
  })

  it('incluye montaje cuando el id de tarifa está definido', () => {
    const diseno = {
      ...emptyPreprensaDiseno(),
      precioMontajeId: 'm1',
      precioMontajeNombre: 'Montaje estándar',
      precioMontajeCosto: 120000,
      valorTotalPlanchas: 50000,
    }
    const resumen = computeDisenoResumenTotales(diseno)
    expect(resumen.precioMontaje).toBe(120000)
    expect(resumen.totalDiseno).toBe(170000)
  })
})
