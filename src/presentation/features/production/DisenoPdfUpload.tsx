import React, { lazy, memo, Suspense, useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import clsx from 'clsx'
import { PREPRENSA_DISENO_COPY } from './constants/preprensaDisenoCopy'
import { prefersPdfCanvasPreview } from './utils/pdfPreviewPlatform'

const DisenoPdfCanvasPreview = lazy(() => import('./DisenoPdfCanvasPreview'))

const n = PREPRENSA_DISENO_COPY.nuevo
const pdfCopy = PREPRENSA_DISENO_COPY.pdf

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const validatePdfFile = (file: File, maxMb: number): string | null => {
  const isPdf =
    file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
  if (!isPdf) return pdfCopy.soloPdf
  if (file.size > maxMb * 1024 * 1024) {
    return pdfCopy.maxSize(maxMb)
  }
  return null
}

interface DisenoPdfUploadProps {
  fileName: string
  maxMb: number
  historialSinPreview?: boolean
  onFileNameChange: (fileName: string) => void
}

const DisenoPdfUpload = memo(function DisenoPdfUpload({
  fileName,
  maxMb,
  historialSinPreview = false,
  onFileNameChange,
}: DisenoPdfUploadProps) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const blobUrlRef = useRef<string | null>(null)
  const dragDepthRef = useRef(0)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [fileSize, setFileSize] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const revokePreview = useCallback(() => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current)
      blobUrlRef.current = null
    }
    setPreviewUrl(null)
  }, [])

  useEffect(() => () => revokePreview(), [revokePreview])

  useEffect(() => {
    if (!fileName) {
      revokePreview()
      setFileSize(null)
    }
  }, [fileName, revokePreview])

  const applyFile = useCallback(
    (file: File) => {
      const err = validatePdfFile(file, maxMb)
      if (err) {
        setFileError(err)
        return
      }

      setFileError(null)
      setFileSize(file.size)
      onFileNameChange(file.name)

      revokePreview()
      queueMicrotask(() => {
        const url = URL.createObjectURL(file)
        blobUrlRef.current = url
        setPreviewUrl(url)
      })
    },
    [maxMb, onFileNameChange, revokePreview]
  )

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      applyFile(file)
      e.target.value = ''
    },
    [applyFile]
  )

  const handleRemove = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      if (inputRef.current) inputRef.current.value = ''
      revokePreview()
      setFileError(null)
      setFileSize(null)
      onFileNameChange('')
    },
    [onFileNameChange, revokePreview]
  )

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragDepthRef.current += 1
    if (dragDepthRef.current === 1) setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1)
    if (dragDepthRef.current === 0) setIsDragging(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      dragDepthRef.current = 0
      setIsDragging(false)
      const file = e.dataTransfer.files?.[0]
      if (file) applyFile(file)
    },
    [applyFile]
  )

  const openFilePicker = useCallback((e?: React.SyntheticEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    const input = inputRef.current
    if (!input) return
    if (typeof input.showPicker === 'function') {
      try {
        void input.showPicker()
        return
      } catch {
        // Algunos navegadores solo permiten click() tras activación del usuario.
      }
    }
    input.click()
  }, [])

  const useCanvasPreview = useMemo(() => prefersPdfCanvasPreview(), [])

  const hasFile = Boolean(fileName)
  const showPreview = Boolean(previewUrl && fileName)
  const showHistorialHint = historialSinPreview && hasFile && !showPreview

  return (
    <div className="production-diseno-pdf-upload">
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="application/pdf,.pdf"
        className="production-diseno-pdf-upload__input"
        tabIndex={-1}
        aria-hidden
        onChange={handleChange}
      />

      {!hasFile ? (
        <div
          className={clsx(
            'production-diseno-pdf-upload__drop',
            isDragging && 'production-diseno-pdf-upload__drop--active'
          )}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <span className="production-diseno-pdf-upload__drop-icon" aria-hidden>
            <svg viewBox="0 0 24 24" focusable="false">
              <path
                d="M8 3.5h5.2L18 8.3V19.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19.5v-15A1.5 1.5 0 0 1 7.5 3.5Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <path
                d="M13 3.5V8h4.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <path
                d="M9 12.5h6M9 15.5h4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <p className="production-diseno-pdf-upload__drop-title">
            {isDragging ? n.pdfDropActive : n.pdfEmptyTitle}
          </p>
          {!isDragging ? (
            <p className="production-diseno-pdf-upload__drop-hint">{n.pdfEmptyHint(maxMb)}</p>
          ) : null}
          <button
            type="button"
            className="production-diseno-pdf-upload__select-btn"
            onPointerDown={e => {
              if (e.button !== 0) return
              openFilePicker(e)
            }}
          >
            {n.pdfSelectBtn}
          </button>
        </div>
      ) : (
        <div className="production-diseno-pdf-upload__file">
          <div className="production-diseno-pdf-upload__file-row">
            <span className="production-diseno-pdf-upload__file-badge" aria-hidden>
              PDF
            </span>
            <div className="production-diseno-pdf-upload__file-meta">
              <span className="production-diseno-pdf-upload__file-name" title={fileName}>
                {fileName}
              </span>
              {fileSize ? (
                <span className="production-diseno-pdf-upload__file-size">
                  {formatFileSize(fileSize)}
                </span>
              ) : null}
            </div>
            <div className="production-diseno-pdf-upload__file-actions">
              <button
                type="button"
                className="production-diseno-pdf-upload__action-btn"
                onPointerDown={e => {
                  if (e.button !== 0) return
                  openFilePicker(e)
                }}
              >
                {n.pdfChangeBtn}
              </button>
              <button
                type="button"
                className="production-diseno-pdf-upload__action-btn production-diseno-pdf-upload__action-btn--danger"
                onClick={handleRemove}
              >
                {n.pdfQuitar}
              </button>
            </div>
          </div>

          {showHistorialHint ? (
            <p className="production-diseno-pdf-upload__historial-hint">{n.pdfHistorialHint}</p>
          ) : null}

          {showPreview ? (
            <div className="production-diseno-pdf-preview">
              {useCanvasPreview ? (
                <Suspense
                  fallback={
                    <p className="production-diseno-pdf-preview__status" role="status">
                      {pdfCopy.previewLoading}
                    </p>
                  }
                >
                  <DisenoPdfCanvasPreview url={previewUrl!} fileName={fileName} />
                </Suspense>
              ) : (
                <iframe
                  src={previewUrl!}
                  title={n.pdfPreview(fileName)}
                  className="production-diseno-pdf-preview__frame"
                  loading="lazy"
                />
              )}
            </div>
          ) : null}
        </div>
      )}

      {fileError ? <p className="production-form-error">{fileError}</p> : null}
    </div>
  )
})

export default DisenoPdfUpload
