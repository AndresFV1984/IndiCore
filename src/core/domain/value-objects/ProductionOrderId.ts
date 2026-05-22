import { parsePurchaseOrderSequence } from './PurchaseOrderId.js'

/** Prefijo de órdenes de producción (planta). */
export const PRODUCTION_ORDER_PREFIX = 'OP-'

/** Formato visible: OP-001 (acepta ids OPE-### del pedido y legacy `order-N`). */
export function formatProductionOrderId(id: string): string {
  if (/^OP-\d+$/i.test(id)) {
    const n = id.slice(3)
    return `${PRODUCTION_ORDER_PREFIX}${n.padStart(3, '0')}`
  }
  const fromPedido = parsePurchaseOrderSequence(id)
  if (fromPedido !== null && /^OPE-/i.test(id)) {
    return `${PRODUCTION_ORDER_PREFIX}${String(fromPedido).padStart(3, '0')}`
  }
  const legacy = id.match(/^order-(\d+)$/i)
  if (legacy) {
    return `${PRODUCTION_ORDER_PREFIX}${legacy[1].padStart(3, '0')}`
  }
  return id
}

/** Siguiente código OP-### según órdenes existentes (incluye secuencia de ids OPE-). */
export function createNextProductionOrderId(existingIds: string[]): string {
  let max = 0
  for (const id of existingIds) {
    const seq = parsePurchaseOrderSequence(id)
    if (seq !== null) max = Math.max(max, seq)
    const op = id.match(/^OP-(\d+)$/i)
    if (op) max = Math.max(max, parseInt(op[1], 10))
  }
  return `${PRODUCTION_ORDER_PREFIX}${String(max + 1).padStart(3, '0')}`
}
