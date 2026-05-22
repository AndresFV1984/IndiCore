import React, { memo, useCallback, useEffect, useId, useRef, useState } from 'react'
import { PREPRENSA_DISENO_COPY } from './constants/preprensaDisenoCopy'

const n = PREPRENSA_DISENO_COPY.nuevo
const pdfCopy = PREPRENSA_DISENO_COPY.pdf

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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)

  const revokePreview = useCallback(() => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current)
      blobUrlRef.current = null
    }
    setPreviewUrl(null)
  }, [])

  useEffect(() => () => revokePreview(), [revokePreview])

  useEffect(() => {
    if (!fileName) revokePreview()
  }, [fileName, revokePreview])

  const openFilePicker = useCallback(() => {
    inputRef.current?.click()
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        openFilePicker()
      }
    },
    [openFilePicker]
  )

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      const err = validatePdfFile(file, maxMb)
      if (err) {
        setFileError(err)
        e.target.value = ''
        return
      }

      setFileError(null)
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

  const handleRemove = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      if (inputRef.current) inputRef.current.value = ''
      revokePreview()
      setFileError(null)
      onFileNameChange('')
    },
    [onFileNameChange, revokePreview]
  )

  const hasFile = Boolean(fileName)
  const showPreview = Boolean(previewUrl && fileName)
  const showHistorialHint = historialSinPreview && hasFile && !showPreview

  return (
    <>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="application/pdf,.pdf"
        className="production-diseno-dropzone__file-input"
        tabIndex={-1}
        aria-hidden
        onChange={handleChange}
      />
      <div
        role="button"
        tabIndex={0}
        className={`production-diseno-dropzone${hasFile ? ' production-diseno-dropzone--has-file' : ''}`}
        aria-controls={inputId}
        onClick={openFilePicker}
        onKeyDown={handleKeyDown}
      >
        <span className="production-diseno-dropzone__surface">
          <span className="production-diseno-dropzone__icon" aria-hidden>
            PDF
          </span>
          <span className="production-diseno-dropzone__label">
            {fileName || n.pdfPlaceholder}
          </span>
          <span className="production-diseno-dropzone__action">{n.pdfExaminar}</span>
        </span>
      </div>

      {fileError && <p className="production-form-error">{fileError}</p>}

      {showHistorialHint && (
        <p className="production-diseno-cliente-hint">
          Archivo registrado: <strong>{fileName}</strong>. Vuelva a cargar el PDF si lo necesita
          en esta orden.
        </p>
      )}

      {showPreview && (
        <div className="production-diseno-pdf-preview">
          <div className="production-diseno-pdf-preview__head">
            <p className="production-diseno-pdf-preview__name">{fileName}</p>
            <button
              type="button"
              className="production-diseno-pdf-preview__remove"
              onClick={handleRemove}
            >
              {n.pdfQuitar}
            </button>
          </div>
          <iframe
            src={previewUrl!}
            title={n.pdfPreview(fileName)}
            className="production-diseno-pdf-preview__frame"
            loading="lazy"
          />
        </div>
      )}
    </>
  )
})

export default DisenoPdfUpload
