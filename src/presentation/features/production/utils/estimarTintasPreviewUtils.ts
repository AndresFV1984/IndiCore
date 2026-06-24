import {
  ESTIMAR_TINTAS_ASSET_PREVIEW_PX,
  renderEstimarTintasPdfPreviewDataUrl,
} from './estimarTintasPdfUtils'
import { loadEstimarTintasImage, type EstimarTintasSourceKind } from './estimarTintasUtils'

export async function captureEstimarTintasAssetPreviewDataUrl(
  previewUrl: string,
  sourceKind: EstimarTintasSourceKind
): Promise<string> {
  if (sourceKind === 'pdf') {
    return renderEstimarTintasPdfPreviewDataUrl(previewUrl)
  }

  const img = await loadEstimarTintasImage(previewUrl)
  const maxEdge = Math.max(img.naturalWidth, img.naturalHeight, 1)
  const scale = ESTIMAR_TINTAS_ASSET_PREVIEW_PX / maxEdge
  const width = Math.max(1, Math.floor(img.naturalWidth * scale))
  const height = Math.max(1, Math.floor(img.naturalHeight * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')
  if (!context) throw new Error('canvas-context-unavailable')

  context.drawImage(img, 0, 0, width, height)
  return canvas.toDataURL('image/jpeg', 0.82)
}
