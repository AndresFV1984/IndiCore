import { ROUTES } from '../../../../config/appRoutes'

/** Abre Catálogos › Tipo de papel con el modal de edición del registro indicado. */
export const buildTipoPapelCatalogEditUrl = (tipoPapelId: string): string =>
  `${ROUTES.catalogTipoPapel.path}?edit=${encodeURIComponent(tipoPapelId)}`
