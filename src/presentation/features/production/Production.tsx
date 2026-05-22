import React, { Suspense, lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import ProductionList from './ProductionList'

const ProductionOrderWorkspace = lazy(() => import('./ProductionOrderWorkspace'))

const Production: React.FC = () => {
  return (
    <Routes>
      <Route index element={<ProductionList />} />
      <Route
        path=":orderId"
        element={
          <Suspense
            fallback={
              <div className="orders-loading" style={{ padding: '2rem' }}>
                Cargando orden de producción…
              </div>
            }
          >
            <ProductionOrderWorkspace />
          </Suspense>
        }
      />
    </Routes>
  )
}

export default Production
