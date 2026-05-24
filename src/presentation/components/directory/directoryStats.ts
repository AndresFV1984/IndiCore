/** Contadores para KPIs de directorio (activo vía `active` o `state`). */
export function countDirectoryStats<T extends { active?: boolean; state?: boolean }>(
  items: T[]
): { total: number; active: number; inactive: number } {
  let active = 0
  let inactive = 0
  for (const item of items) {
    const isActive = item.active ?? item.state ?? true
    if (isActive) active += 1
    else inactive += 1
  }
  return { total: items.length, active, inactive }
}
