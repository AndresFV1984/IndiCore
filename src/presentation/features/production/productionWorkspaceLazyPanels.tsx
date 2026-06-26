import React, { lazy, Suspense, type ReactNode } from 'react'

export const ProductionWorkspacePanelFallback = () => (
  <div className="orders-loading" style={{ padding: '1.5rem', minHeight: '8rem' }}>
    Cargando sección…
  </div>
)

export function withProductionPanelSuspense(node: ReactNode): ReactNode {
  return <Suspense fallback={<ProductionWorkspacePanelFallback />}>{node}</Suspense>
}

export const LazyProductionDetalleOpPanel = lazy(() => import('./ProductionDetalleOpPanel'))
export const LazyProductionPreprensaDiseno = lazy(() => import('./ProductionPreprensaDiseno'))
export const LazyPreprensaDisenoModoShell = lazy(() => import('./PreprensaDisenoModoShell'))
export const LazyProductionCortePapelForm = lazy(() => import('./ProductionCortePapelForm'))
export const LazyProductionImpresionTintasPanel = lazy(() => import('./ProductionImpresionTintasPanel'))
export const LazyProductionImpresionMuestraPanel = lazy(() => import('./ProductionImpresionMuestraPanel'))
export const LazyProductionImpresionConversionImagenPanel = lazy(
  () => import('./ProductionImpresionConversionImagenPanel')
)
export const LazyProductionTerminadosPanel = lazy(() => import('./ProductionTerminadosPanel'))
export const LazyProductionAcabadosPanel = lazy(() => import('./ProductionAcabadosPanel'))
export const LazyProductionOrderCobroPanel = lazy(() => import('./ProductionOrderCobroPanel'))

/** Precarga paneles de preprensa para órdenes nuevas (evita espera al abrir la pestaña). */
export const prefetchPreprensaWorkspacePanels = (): void => {
  void import('./ProductionPreprensaDiseno')
  void import('./ProductionDetalleOpPanel')
}
