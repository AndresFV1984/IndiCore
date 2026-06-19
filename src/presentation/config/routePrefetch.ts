import { ROUTES } from '../../config/appRoutes'

/** Precarga el chunk de la ruta al pasar el mouse por el menú (navegación más rápida). */
export const routePrefetchers: Record<string, () => Promise<unknown>> = {
  [ROUTES.production.path]: () => import('../features/production/Production'),
  [ROUTES.orders.path]: () => import('../features/orders/Orders'),
  [ROUTES.clients.path]: () => import('../features/clients/Clients'),
  [ROUTES.users.path]: () => import('../features/users/Users'),
  [ROUTES.vendedor.path]: () => import('../features/vendedores/Vendedores'),
  [ROUTES.remissions.path]: () => import('../features/remissions/Remissions'),
  [ROUTES.catalogHub.path]: () => import('../features/catalog/Catalog'),
  [ROUTES.catalogTerminados.path]: () => import('../features/catalog/CatalogTerminados'),
  [ROUTES.catalogOperaciones.path]: () => import('../features/catalog/OperationsCatalog'),
  [ROUTES.catalogTipoPapel.path]: () => import('../features/catalog/CatalogTipoPapel'),
  [ROUTES.catalogDespiecePliego.path]: () => import('../features/catalog/CatalogDespiecePliego'),
  [ROUTES.catalogTamanoPlancha.path]: () => import('../features/catalog/CatalogTamanoPlancha'),
  [ROUTES.precioMontaje.path]: () => import('../features/precio-montaje/PrecioMontaje'),
  [ROUTES.tarifasMillar.path]: () => import('../features/tarifas-millar/TarifasMillar'),
  [ROUTES.trazabilidad.path]: () => import('../features/trazabilidad/TrazabilidadOperarios'),
}

export function prefetchRoute(path: string): void {
  const key = path.split('?')[0]
  const loader = routePrefetchers[key]
  if (loader) void loader()
}

const PREFETCH_PRIORITY: string[] = [
  ROUTES.production.path,
  ROUTES.orders.path,
  ROUTES.clients.path,
  ROUTES.users.path,
  ROUTES.vendedor.path,
  ROUTES.remissions.path,
  ROUTES.trazabilidad.path,
]

let routesPrefetchStarted = false

/** Precarga chunks del menú en segundo plano (prioridad a rutas más usadas). */
export function prefetchAllRoutes(): void {
  if (routesPrefetchStarted) return
  routesPrefetchStarted = true

  const seen = new Set<() => Promise<unknown>>()
  const ordered: Array<() => Promise<unknown>> = []

  for (const path of PREFETCH_PRIORITY) {
    const loader = routePrefetchers[path]
    if (loader && !seen.has(loader)) {
      seen.add(loader)
      ordered.push(loader)
    }
  }

  for (const loader of Object.values(routePrefetchers)) {
    if (!seen.has(loader)) {
      seen.add(loader)
      ordered.push(loader)
    }
  }

  ordered.forEach((loader, index) => {
    window.setTimeout(() => void loader(), 80 + index * 60)
  })
}
