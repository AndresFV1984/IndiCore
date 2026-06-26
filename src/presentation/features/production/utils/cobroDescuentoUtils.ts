import type { CobroDescuentoModo } from '../../../../core/domain/entities/Order'

export interface CobroDescuentoInput {
  modo: CobroDescuentoModo
  valor: number
  subtotal: number
}

export interface CobroDescuentoResult {
  descuentoAplicado: number
  totalConDescuento: number
  hasDescuento: boolean
}

export const DEFAULT_COBRO_DESCUENTO_MODO: CobroDescuentoModo = 'porcentaje'

export const normalizeCobroDescuentoModo = (
  modo: CobroDescuentoModo | undefined
): CobroDescuentoModo => (modo === 'valor' ? 'valor' : DEFAULT_COBRO_DESCUENTO_MODO)

export const normalizeCobroDescuentoValor = (valor: number | undefined): number =>
  Math.max(0, Math.round(valor ?? 0))

export const computeCobroDescuento = (input: CobroDescuentoInput): CobroDescuentoResult => {
  const subtotal = Math.max(0, Math.round(input.subtotal))
  const valor = normalizeCobroDescuentoValor(input.valor)

  if (valor <= 0 || subtotal <= 0) {
    return {
      descuentoAplicado: 0,
      totalConDescuento: subtotal,
      hasDescuento: false,
    }
  }

  const descuentoAplicado =
    input.modo === 'porcentaje'
      ? Math.round((subtotal * Math.min(100, valor)) / 100)
      : Math.min(subtotal, valor)

  return {
    descuentoAplicado,
    totalConDescuento: Math.max(0, subtotal - descuentoAplicado),
    hasDescuento: descuentoAplicado > 0,
  }
}
