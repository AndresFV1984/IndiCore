import { describe, expect, it } from 'vitest'
import type { OrderSpecs } from '../entities/Order'
import {
  canSetProductionStatus,
  getAllowedProductionStatuses,
  getProductionStatusForPhase,
} from './productionOrderStatusPolicy'
import { getPermissionsForRole } from '../auth/userPermissions'

const baseSpecs = (overrides: Partial<OrderSpecs> = {}): OrderSpecs =>
  ({
    paperRows: [],
    quantity: 0,
    cantidadHojas: 0,
    margenRedondeo: 2,
    valorCorte: 0,
    clienteSuministraPapel: 'no',
    mounting: false,
    design: false,
    preprensaDiseno: {} as never,
    plates: 0,
    platesValue: {} as never,
    thousands: 0,
    inks: '',
    impresionTintasRegistros: [],
    impresionEstimarTintasRegistros: [],
    terminadosRegistros: [],
    acabadosRegistros: [],
    machineOutputValue: {} as never,
    chapoliado: false,
    finishes: [],
    operations: [],
    ...overrides,
  }) as OrderSpecs

describe('productionOrderStatusPolicy', () => {
  const supervisorPermissions = getPermissionsForRole('Supervisor')
  const operatorPermissions = getPermissionsForRole('Operador')

  it('permite al supervisor cambiar a cualquier estado', () => {
    expect(
      canSetProductionStatus(supervisorPermissions, 'Pausada', {
        userId: 'user-3',
        specs: baseSpecs(),
      })
    ).toBe(true)

    expect(getAllowedProductionStatuses(supervisorPermissions, {
      userId: 'user-3',
      specs: baseSpecs(),
    })).toHaveLength(11)
  })

  it('restringe Cancelada al supervisor', () => {
    expect(
      canSetProductionStatus(operatorPermissions, 'Cancelada', {
        userId: 'user-2',
        specs: baseSpecs({ operadorImpresionId: 'user-2' }),
      })
    ).toBe(false)

    expect(
      canSetProductionStatus(supervisorPermissions, 'Cancelada', {
        userId: 'user-3',
        specs: baseSpecs(),
      })
    ).toBe(true)
  })

  it('restringe En Revisión al supervisor', () => {
    expect(
      canSetProductionStatus(operatorPermissions, 'En Revisión', {
        userId: 'user-2',
        specs: baseSpecs({ operadorImpresionId: 'user-2' }),
      })
    ).toBe(false)

    expect(
      canSetProductionStatus(supervisorPermissions, 'En Revisión', {
        userId: 'user-3',
        specs: baseSpecs(),
      })
    ).toBe(true)
  })

  it('restringe al operador a estados de etapa asignada', () => {
    const specs = baseSpecs({ operadorImpresionId: 'user-2' })

    expect(
      canSetProductionStatus(operatorPermissions, 'En Proceso Impresion', {
        userId: 'user-2',
        specs,
      })
    ).toBe(true)

    expect(
      canSetProductionStatus(operatorPermissions, 'Pausada', {
        userId: 'user-2',
        specs,
      })
    ).toBe(false)

    expect(
      canSetProductionStatus(operatorPermissions, 'En Proceso Preprensa', {
        userId: 'user-2',
        specs,
      })
    ).toBe(false)
  })

  it('mapea fases a estados de producción', () => {
    expect(getProductionStatusForPhase('preprensa')).toBe('En Proceso Preprensa')
    expect(getProductionStatusForPhase('acabados')).toBe('En Proceso Acabados')
  })
})
