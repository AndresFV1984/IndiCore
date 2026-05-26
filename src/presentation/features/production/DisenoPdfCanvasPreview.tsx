import React, { memo, useEffect, useRef, useState } from 'react'
import * as pdfjs from 'pdfjs-dist'
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { PREPRENSA_DISENO_COPY } from './constants/preprensaDisenoCopy'

pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker

const pdfCopy = PREPRENSA_DISENO_COPY.pdf

interface DisenoPdfCanvasPreviewProps {
  url: string
  fileName: string
}

const DisenoPdfCanvasPreview = memo(function DisenoPdfCanvasPreview({
  url,
  fileName,
}: DisenoPdfCanvasPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pageCount, setPageCount] = useState(0)

  useEffect(() => {
    let cancelled = false
    let renderTask: { cancel?: () => void } | null = null

    const renderPreview = async () => {
      setLoading(true)
      setError(null)
      setPageCount(0)

      try {
        const pdf = await pdfjs.getDocument({ url }).promise
        if (cancelled) return

        setPageCount(pdf.numPages)
        const page = await pdf.getPage(1)
        if (cancelled) return

        const canvas = canvasRef.current
        if (!canvas) {
          throw new Error('canvas-unavailable')
        }

        const containerWidth = viewportRef.current?.clientWidth ?? 320
        const baseViewport = page.getViewport({ scale: 1 })
        const scale = Math.min(2, Math.max(0.75, containerWidth / baseViewport.width))
        const viewport = page.getViewport({ scale })
        const context = canvas.getContext('2d')
        if (!context) throw new Error('canvas-context')

        canvas.width = Math.floor(viewport.width)
        canvas.height = Math.floor(viewport.height)

        renderTask = page.render({ canvasContext: context, viewport })
        await renderTask.promise
      } catch {
        if (!cancelled) {
          setError(pdfCopy.previewError)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void renderPreview()

    return () => {
      cancelled = true
      renderTask?.cancel?.()
    }
  }, [url])

  return (
    <div ref={viewportRef} className="production-diseno-pdf-preview__viewport">
      {loading && (
        <p className="production-diseno-pdf-preview__status" role="status">
          {pdfCopy.previewLoading}
        </p>
      )}
      {error && (
        <div className="production-diseno-pdf-preview__fallback">
          <p className="production-diseno-pdf-preview__status">{error}</p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="production-diseno-pdf-preview__open-link"
          >
            {pdfCopy.previewOpen(fileName)}
          </a>
        </div>
      )}
      <canvas
        ref={canvasRef}
        className={[
          'production-diseno-pdf-preview__canvas',
          loading || error ? 'production-diseno-pdf-preview__canvas--hidden' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        aria-label={PREPRENSA_DISENO_COPY.nuevo.pdfPreview(fileName)}
      />
      {!loading && !error && pageCount > 1 && (
        <p className="production-diseno-pdf-preview__pages-hint">
          {pdfCopy.previewPagesHint(pageCount)}
        </p>
      )}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="production-diseno-pdf-preview__open-link production-diseno-pdf-preview__open-link--secondary"
      >
        {pdfCopy.previewOpen(fileName)}
      </a>
    </div>
  )
})

export default DisenoPdfCanvasPreview
