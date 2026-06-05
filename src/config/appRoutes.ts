/**
 * Contrato de rutas de la SPA: cada entrada tiene un código estable (`id`),
 * la URL (`path`), la etiqueta en menú y la función que cumple la pantalla en el ERP.
 */

export interface AppRouteDefinition {
  /** Nombre estable para código, analytics o permisos */
  readonly id: string
  /** Path único para React Router */
  readonly path: string
  /** Texto corto visible en navegación */
  readonly label: string
  /** Qué resuelve esta pantalla en el negocio */
  readonly purpose: string
}

export const ROUTES = {
  home: {
    id: 'HOME',
    path: '/',
    label: 'Inicio',
    purpose: 'Entrada a la aplicación; muestra el mismo resumen que el dashboard.',
  },
  dashboard: {
    id: 'DASHBOARD',
    path: '/dashboard',
    label: 'Dashboard',
    purpose: 'Resumen operativo con indicadores KPI del negocio.',
  },
  production: {
    id: 'PRODUCTION_ORDERS',
    path: '/production',
    label: 'Producción',
    purpose: 'Listado de órdenes en producción, avance de entrega y estado de planta.',
  },
  orders: {
    id: 'ORDER_LIST',
    path: '/orders',
    label: 'Pedidos',
    purpose: 'Consulta y administración del listado de pedidos de trabajo.',
  },
  remissions: {
    id: 'REMISSION_LIST',
    path: '/remissions',
    label: 'Remisiones',
    purpose: 'Control de despachos, remisiones y valor asociado a entregas.',
  },
  clients: {
    id: 'CLIENT_DIRECTORY',
    path: '/clients',
    label: 'Clientes',
    purpose: 'Directorio de clientes: datos de contacto, correo y estado activo/inactivo.',
  },
  users: {
    id: 'USER_DIRECTORY',
    path: '/users',
    label: 'Usuarios',
    purpose: 'Administración de usuarios del sistema: acceso, roles y estado.',
  },
  vendedor: {
    id: 'SALES_REP_DIRECTORY',
    path: '/vendedores',
    label: 'Vendedores',
    purpose: 'Directorio de vendedores: asignación a clientes y seguimiento comercial.',
  },
  catalogHub: {
    id: 'CATALOG_ROOT',
    path: '/catalog',
    label: 'Catálogos',
    purpose: 'Punto central de datos maestros de catálogos pendientes de módulos específicos.',
  },
  catalogTerminados: {
    id: 'CATALOG_FINISHINGS',
    path: '/catalog/terminados',
    label: 'Terminados',
    purpose: 'Catálogo de acabados/terminaciones asignables a órdenes de producción.',
  },
  catalogOperaciones: {
    id: 'CATALOG_OPERATIONS',
    path: '/catalog/operaciones',
    label: 'Operaciones',
    purpose: 'Catálogo de operaciones productivas y costos asociados.',
  },
  catalogTipoPapel: {
    id: 'CATALOG_PAPER_TYPE',
    path: '/catalog/tipo-papel',
    label: 'Tipo de papel',
    purpose: 'Mantenimiento del maestro de tipos de papel para especificaciones de pedido.',
  },
  catalogTamanoPapel: {
    id: 'CATALOG_PAPER_SIZE',
    path: '/catalog/tamano-papel',
    label: 'Tamaño papel',
    purpose: 'Mantenimiento de formatos/tamaños de papel estándar.',
  },
  catalogDespiecePliego: {
    id: 'CATALOG_SHEET_LAYOUT',
    path: '/catalog/despiece-pliego',
    label: 'Despiece pliego',
    purpose: 'Definición de despieces por pliego para cálculos de producción.',
  },
  catalogTamanoPlancha: {
    id: 'CATALOG_PLATE_SIZE',
    path: '/catalog/tamano-plancha',
    label: 'Tipo Plancha',
    purpose: 'Catálogo de tipos de plancha: nombre, medida, valor y estado activo/inactivo.',
  },
  precioMontaje: {
    id: 'ASSEMBLY_PRICE',
    path: '/precio-montaje',
    label: 'Precio Montaje',
    purpose: 'Catálogo de precios de montaje: nombre, costo y estado activo/inactivo.',
  },
  tarifasMillar: {
    id: 'THOUSAND_RATE',
    path: '/tarifas-millar',
    label: 'Tarifas por millar',
    purpose:
      'Catálogo de tarifas por millar: nombre, unidad, precio, categoría, descripción y estado.',
  },
  reports: {
    id: 'REPORTS',
    path: '/reports',
    label: 'Reportes',
    purpose: 'Generación y consulta de reportes gerenciales y operativos.',
  },
  settings: {
    id: 'SETTINGS',
    path: '/settings',
    label: 'Configuración',
    purpose: 'Ajustes globales del sistema, usuarios e integraciones.',
  },
} as const satisfies Record<string, AppRouteDefinition>

export type RouteKey = keyof typeof ROUTES

/** Lista ordenada útil para documentación o pruebas */
export const ROUTE_REGISTRY: readonly AppRouteDefinition[] = Object.values(ROUTES)

export const APP_ROUTES = {
  production: ROUTES.production.path,
  catalogTerminados: ROUTES.catalogTerminados.path,
  catalogOperaciones: ROUTES.catalogOperaciones.path,
  catalogTipoPapel: ROUTES.catalogTipoPapel.path,
  catalogTamanoPapel: ROUTES.catalogTamanoPapel.path,
  catalogDespiece: ROUTES.catalogDespiecePliego.path,
  catalogTamanoPlancha: ROUTES.catalogTamanoPlancha.path,
} as const
