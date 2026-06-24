import React from 'react'

export interface ConversionImagenHelpItem {
  label: string
  description: string
}

interface ConversionImagenHelpDetailsProps {
  summary: string
  intro?: string
  items: ConversionImagenHelpItem[]
}

const ConversionImagenHelpDetails: React.FC<ConversionImagenHelpDetailsProps> = ({
  summary,
  intro,
  items,
}) => (
  <details className="production-impresion-datos__formula production-impresion-conversion-imagen__help">
    <summary>
      <span className="production-impresion-datos__formula-summary">{summary}</span>
    </summary>
    <div className="production-impresion-datos__formula-body">
      {intro ? (
        <p className="production-impresion-conversion-imagen__help-intro">{intro}</p>
      ) : null}
      {items.map(item => (
        <p key={item.label} className="production-impresion-datos__formula-line">
          <span className="production-impresion-datos__formula-line-label">{item.label}</span>
          <span className="production-impresion-conversion-imagen__help-desc">{item.description}</span>
        </p>
      ))}
    </div>
  </details>
)

export default ConversionImagenHelpDetails
