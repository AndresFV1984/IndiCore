import React from 'react'
import ProductionWorkspaceSection from './ProductionWorkspaceSection'
import { IMPRESION_COPY as copy } from './constants/impresionCopy'

const conversionCopy = copy.conversionImagen

const ProductionImpresionConversionImagenPanel: React.FC = () => (
  <>
    <p className="production-workspace-panel-desc">{conversionCopy.panelDesc}</p>

    <ProductionWorkspaceSection
      tag={conversionCopy.section.tag}
      title={conversionCopy.section.title}
      subtitle={conversionCopy.section.subtitle}
      tone={0}
      className="production-impresion-conversion-imagen"
    >
      <div className="production-impresion-conversion-imagen__empty">
        <span className="production-impresion-conversion-imagen__empty-icon" aria-hidden>
          <svg viewBox="0 0 24 24" focusable="false">
            <rect
              x="4.5"
              y="6"
              width="15"
              height="12"
              rx="1.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            />
            <path
              d="M8.5 14.5 11 11.5l2 2 2.5-3 3.5 4.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path
              d="M16.5 5.5h2v2M18.5 5.5 14.5 9.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <p className="production-impresion-conversion-imagen__empty-title">{conversionCopy.empty.title}</p>
        <p className="production-impresion-conversion-imagen__empty-text">{conversionCopy.empty.text}</p>
      </div>
    </ProductionWorkspaceSection>
  </>
)

export default ProductionImpresionConversionImagenPanel
