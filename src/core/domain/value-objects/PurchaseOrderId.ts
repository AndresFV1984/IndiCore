/** Prefijo de órdenes de pedido (comercial). */
export const PURCHASE_ORDER_PREFIX = 'OPE-'

/** Formato visible: OPE-001 (compatible con ids legacy OP-### y `order-N`). */
export function formatPurchaseOrderNumber(id: string): string {
  if (/^OPE-\d+$/i.test(id)) {
    const n = id.slice(4)
    return `${PURCHASE_ORDER_PREFIX}${n.padStart(3, '0')}`
  }
  const op = id.match(/^OP-(\d+)$/i)
  if (op) {
    return `${PURCHASE_ORDER_PREFIX}${op[1].padStart(3, '0')}`
  }
  const legacy = id.match(/^order-(\d+)$/i)
  if (legacy) {
    return `${PURCHASE_ORDER_PREFIX}${legacy[1].padStart(3, '0')}`
  }
  return id
}

/** Extrae el número secuencial de un id de pedido u órdenes legacy. */
export function parsePurchaseOrderSequence(id: string): number | null {
  const match =
    id.match(/^OPE-(\d+)$/i) ??
    id.match(/^OP-(\d+)$/i) ??
    id.match(/^order-(\d+)$/i)
  return match ? parseInt(match[1], 10) : null
}

/** Siguiente código OPE-### según pedidos existentes. */
export function createNextPurchaseOrderId(existingIds: string[]): string {
  let max = 0
  for (const id of existingIds) {
    const seq = parsePurchaseOrderSequence(id)
    if (seq !== null) max = Math.max(max, seq)
  }
  return `${PURCHASE_ORDER_PREFIX}${String(max + 1).padStart(3, '0')}`
}
