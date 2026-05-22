import React from 'react'
import type { ProductionWorkspaceTone } from './constants/productionWorkspaceColors'

interface ProductionWorkspaceSectionProps {
  title?: string
  subtitle?: string
  tag?: string
  tone?: ProductionWorkspaceTone
  children: React.ReactNode
  className?: string
}

const ProductionWorkspaceSection: React.FC<ProductionWorkspaceSectionProps> = ({
  title,
  subtitle,
  tag,
  tone = 0,
  children,
  className,
}) => {
  const showHead = Boolean(tag || title || subtitle)

  return (
    <section
      className={[
        'production-ws-section',
        `production-ws-section--tone-${tone}`,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {showHead && (
        <header className="production-ws-section__head">
          <div className="production-ws-section__head-row">
            {tag && <span className="production-ws-section__tag">{tag}</span>}
            {(title || subtitle) && (
              <div className="production-ws-section__titles">
                {title && <h3 className="production-ws-section__title">{title}</h3>}
                {subtitle && <p className="production-ws-section__sub">{subtitle}</p>}
              </div>
            )}
          </div>
        </header>
      )}
      <div className="production-ws-section__body">{children}</div>
    </section>
  )
}

export default ProductionWorkspaceSection
