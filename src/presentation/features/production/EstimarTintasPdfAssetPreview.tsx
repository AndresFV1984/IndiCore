import React, { useEffect, useState } from 'react'
import { renderEstimarTintasPdfPreviewDataUrl } from './utils/estimarTintasPdfUtils'

interface EstimarTintasPdfAssetPreviewProps {
  url: string
  alt: string
}

const EstimarTintasPdfAssetPreview: React.FC<EstimarTintasPdfAssetPreviewProps> = ({ url, alt }) => {
  const [previewSrc, setPreviewSrc] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const loadPreview = async () => {
      setIsLoading(true)
      setPreviewSrc(null)

      try {
        const dataUrl = await renderEstimarTintasPdfPreviewDataUrl(url)
        if (!cancelled) setPreviewSrc(dataUrl)
      } catch {
        if (!cancelled) setPreviewSrc(null)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void loadPreview()

    return () => {
      cancelled = true
    }
  }, [url])

  if (isLoading) {
    return (
      <div
        className="production-impresion-estimar-tintas__asset-preview-loading"
        role="status"
        aria-label={alt}
      >
        <span className="production-impresion-estimar-tintas__asset-preview-spinner" aria-hidden />
      </div>
    )
  }

  if (!previewSrc) return null

  return <img src={previewSrc} alt={alt} className="production-impresion-estimar-tintas__asset-image" />
}

export default EstimarTintasPdfAssetPreview
