import React from 'react'

export interface ConversionImagenRevealProps {
  show: boolean
  children: React.ReactNode
}

const ConversionImagenReveal: React.FC<ConversionImagenRevealProps> = ({ show, children }) => {
  if (!show) return null
  return <div className="production-impresion-estimar-tintas-reveal">{children}</div>
}

export default ConversionImagenReveal
