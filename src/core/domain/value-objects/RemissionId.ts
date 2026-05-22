/** Prefijo de remisiones (órdenes de remisión). */
export const REMISSION_PREFIX = 'OR-'

/** Formato visible: OR-620 (compatible con REM-###, #NNN y legacy remission-N). */
export function formatRemissionNumber(id: string): string {
  if (/^OR-\d+$/i.test(id)) {
    const n = id.slice(3)
    return `${REMISSION_PREFIX}${n.padStart(3, '0')}`
  }
  const rem = id.match(/^REM-(\d+)$/i)
  if (rem) return `${REMISSION_PREFIX}${rem[1].padStart(3, '0')}`
  const legacy = id.match(/^remission-(\d+)$/i)
  if (legacy) return `${REMISSION_PREFIX}${legacy[1].padStart(3, '0')}`
  const hash = id.match(/^#(\d+)$/i)
  if (hash) return `${REMISSION_PREFIX}${hash[1].padStart(3, '0')}`
  return id
}

export function parseRemissionSequence(id: string): number | null {
  const match =
    id.match(/^OR-(\d+)$/i) ??
    id.match(/^REM-(\d+)$/i) ??
    id.match(/^remission-(\d+)$/i) ??
    id.match(/^#(\d+)$/i)
  return match ? parseInt(match[1], 10) : null
}

export function createNextRemissionId(existingIds: string[]): string {
  let max = 0
  for (const id of existingIds) {
    const seq = parseRemissionSequence(id)
    if (seq !== null) max = Math.max(max, seq)
  }
  return `${REMISSION_PREFIX}${String(max + 1).padStart(3, '0')}`
}
