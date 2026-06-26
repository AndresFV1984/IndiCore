import React from 'react'
import type { ProductionWorkflowTabId } from './productionTabs'

interface ProductionWorkflowPanelProps {
  tabId: ProductionWorkflowTabId
  activeTab: ProductionWorkflowTabId
  visited: boolean
  children: React.ReactNode
}

/**
 * Mantiene montado el contenido de pestañas ya visitadas para evitar recargar
 * chunks lazy al volver a una etapa del flujo.
 */
const ProductionWorkflowPanel: React.FC<ProductionWorkflowPanelProps> = ({
  tabId,
  activeTab,
  visited,
  children,
}) => {
  const isActive = activeTab === tabId
  const shouldMount = visited || isActive

  if (!shouldMount) {
    return null
  }

  return (
    <div
      className="production-workflow-panel-section"
      hidden={!isActive}
      role="tabpanel"
      id={`production-panel-${tabId}`}
      aria-labelledby={`production-tab-${tabId}`}
      aria-hidden={!isActive}
    >
      {children}
    </div>
  )
}

export default ProductionWorkflowPanel
