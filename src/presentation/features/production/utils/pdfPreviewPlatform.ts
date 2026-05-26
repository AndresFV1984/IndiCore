/** Android/iOS no muestran PDF en iframe con URL blob; en escritorio sí. */
export const prefersPdfCanvasPreview = (): boolean => {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  return /Android/i.test(ua) || /iPhone|iPad|iPod/i.test(ua)
}
