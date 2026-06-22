import * as pdfjs from 'pdfjs-dist'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import {
  ESTIMAR_TINTAS_MAX_SAMPLE_EDGE,
  ESTIMAR_TINTAS_REFERENCE_DPI,
} from './estimarTintasUtils'

pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker

export interface EstimarTintasPdfPageMeta {
  pageCount: number
  widthPx: number
  heightPx: number
  widthCm: number
  heightCm: number
}

export interface EstimarTintasPdfSource {
  meta: EstimarTintasPdfPageMeta
  getAnalysisImage: () => Promise<HTMLImageElement>
}

export const ESTIMAR_TINTAS_ASSET_PREVIEW_PX = 240

export function pdfPointsToCm(points: number): number {
  return (points / 72) * 2.54
}

const canvasToImage = (canvas: HTMLCanvasElement): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => {
      if (img.naturalWidth <= 0 || img.naturalHeight <= 0) {
        reject(new Error('invalid-image-dimensions'))
        return
      }
      resolve(img)
    }
    img.onerror = () => reject(new Error('pdf-render-failed'))
    img.src = canvas.toDataURL('image/png')
  })

const resolvePdfRenderScale = (pageWidthPt: number, pageHeightPt: number): number => {
  const maxEdgePt = Math.max(pageWidthPt, pageHeightPt)
  const dpiScale = ESTIMAR_TINTAS_REFERENCE_DPI / 72
  const minAnalysisScale = ESTIMAR_TINTAS_MAX_SAMPLE_EDGE / maxEdgePt
  const maxCanvasEdge = 4096

  let scale = Math.max(dpiScale, minAnalysisScale)
  if (maxEdgePt * scale > maxCanvasEdge) {
    scale = maxCanvasEdge / maxEdgePt
  }

  return scale
}

export async function prepareEstimarTintasPdfSource(url: string): Promise<EstimarTintasPdfSource> {
  let pdf: pdfjs.PDFDocumentProxy

  try {
    pdf = await pdfjs.getDocument({ url }).promise
  } catch {
    throw new Error('pdf-load-failed')
  }

  let page: pdfjs.PDFPageProxy

  try {
    page = await pdf.getPage(1)
  } catch {
    throw new Error('pdf-load-failed')
  }

  const baseViewport = page.getViewport({ scale: 1 })
  const widthCm = pdfPointsToCm(baseViewport.width)
  const heightCm = pdfPointsToCm(baseViewport.height)
  const renderScale = resolvePdfRenderScale(baseViewport.width, baseViewport.height)
  const renderViewport = page.getViewport({ scale: renderScale })

  let cachedCanvas: HTMLCanvasElement | null = null

  const renderToCanvas = async (): Promise<HTMLCanvasElement> => {
    if (cachedCanvas) return cachedCanvas

    const canvas = document.createElement('canvas')
    canvas.width = Math.floor(renderViewport.width)
    canvas.height = Math.floor(renderViewport.height)

    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) throw new Error('canvas-context-unavailable')

    try {
      await page.render({ canvasContext: context, viewport: renderViewport }).promise
    } catch {
      throw new Error('pdf-render-failed')
    }

    cachedCanvas = canvas
    return canvas
  }

  return {
    meta: {
      pageCount: pdf.numPages,
      widthPx: Math.floor(renderViewport.width),
      heightPx: Math.floor(renderViewport.height),
      widthCm,
      heightCm,
    },
    getAnalysisImage: async () => canvasToImage(await renderToCanvas()),
  }
}

export async function renderEstimarTintasPdfPreviewDataUrl(
  url: string,
  maxEdge = ESTIMAR_TINTAS_ASSET_PREVIEW_PX
): Promise<string> {
  let page: pdfjs.PDFPageProxy

  try {
    const pdf = await pdfjs.getDocument({ url }).promise
    page = await pdf.getPage(1)
  } catch {
    throw new Error('pdf-load-failed')
  }

  const baseViewport = page.getViewport({ scale: 1 })
  const maxEdgePt = Math.max(baseViewport.width, baseViewport.height)
  const scale = maxEdge / maxEdgePt
  const viewport = page.getViewport({ scale })

  const canvas = document.createElement('canvas')
  canvas.width = Math.floor(viewport.width)
  canvas.height = Math.floor(viewport.height)

  const context = canvas.getContext('2d')
  if (!context) throw new Error('canvas-context-unavailable')

  try {
    await page.render({ canvasContext: context, viewport }).promise
  } catch {
    throw new Error('pdf-render-failed')
  }

  return canvas.toDataURL('image/png')
}
