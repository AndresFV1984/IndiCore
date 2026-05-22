/** Formato compacto para KPIs y dashboard (ej. $1.2M, $450K). */
export function formatCompactCurrency(total: number): string {
  if (total >= 1_000_000) {
    const m = total / 1_000_000
    const rounded = Math.round(m * 10) / 10
    return `$${rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)}M`
  }
  if (total >= 1_000) {
    return `$${Math.round(total / 1_000)}K`
  }
  return `$${total.toLocaleString('es-CO')}`
}
