import { describe, expect, it } from 'vitest'
import { buildMillaresReferenciaFormulaSteps } from './millaresReferenciaFormulaUtils'
import type { ImpresionGrupoMillaresPreview } from './impresionPrecioTintaUtils'

const preview = (
  partial: Partial<ImpresionGrupoMillaresPreview> & Pick<ImpresionGrupoMillaresPreview, 'millaresBase' | 'millaresCalculados'>
): ImpresionGrupoMillaresPreview => ({
  variant: 'colorBasico',
  cantidadTintas: 4,
  tintasTiro: 2,
  tintasRetiro: 2,
  tamanosBuenos: 2500,
  ajuste: 'ninguno',
  ...partial,
})

describe('buildMillaresReferenciaFormulaSteps', () => {
  it('explica el ajuste por tope y millar mínimo venta', () => {
    const steps = buildMillaresReferenciaFormulaSteps(
      preview({ millaresBase: 0.4, millaresCalculados: 0.5 }),
      500,
      0.2,
      600
    )

    expect(steps).toHaveLength(4)
    expect(steps[0]?.stepRule).toBe('Parte de millares calculados')
    expect(steps[0]?.stepCalc).toBe('= 0,4')
    expect(steps[1]?.stepRule).toBe('Comparación con tope mínimo millar')
    expect(steps[1]?.stepCalc).toContain('0,4 < 0,6')
    expect(steps[2]?.stepRule).toBe('Millar mínimo venta aplicado')
    expect(steps[2]?.stepCalc).toBe('500 ÷ 1.000 = 0,5')
    expect(steps[3]?.stepRule).toBe('Millares referencia')
    expect(steps[3]?.stepCalc).toBe('= 0,5')
  })

  it('explica el umbral decimal cuando supera el tope mínimo', () => {
    const steps = buildMillaresReferenciaFormulaSteps(
      preview({ millaresBase: 1.25, millaresCalculados: 2 }),
      500,
      0.2,
      600
    )

    expect(steps).toHaveLength(5)
    expect(steps[1]?.stepCalc).toContain('≥ 0,6')
    expect(steps[1]?.stepCalc).toContain('aplica umbral decimal')
    expect(steps[2]?.stepCalc).toContain('Parte decimal > 0,2 → entero siguiente')
    expect(steps[3]?.stepCalc).toBe('1,25 → 2')
    expect(steps[4]?.stepCalc).toBe('= 2')
  })

  it('explica la parte entera cuando el decimal no supera el umbral', () => {
    const steps = buildMillaresReferenciaFormulaSteps(
      preview({ millaresBase: 2.15, millaresCalculados: 2 }),
      500,
      0.2,
      600
    )

    expect(steps.some(step => step.stepCalc.includes('Parte decimal ≤ 0,2 → solo parte entera'))).toBe(
      true
    )
    expect(steps.some(step => step.stepCalc === '2,15 → 2')).toBe(true)
    expect(steps.at(-1)?.stepCalc).toBe('= 2')
  })

  it('explica el resultado cuando no hay decimales ni ajuste por tope', () => {
    const steps = buildMillaresReferenciaFormulaSteps(
      preview({ millaresBase: 10, millaresCalculados: 10 }),
      500,
      0.2,
      600
    )

    expect(steps.some(step => step.stepCalc.includes('Sin parte decimal que ajustar'))).toBe(true)
    expect(steps.at(-1)?.stepCalc).toBe('= 10')
  })
})
