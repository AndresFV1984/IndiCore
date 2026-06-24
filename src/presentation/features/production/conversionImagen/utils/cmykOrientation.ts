/** Invierte filas CMYK interleaved (origen superior → orden TIFF/PDF estándar). */
export function flipCmykRowsVertically(
  cmykBytes: Uint8Array,
  width: number,
  height: number,
  bytesPerPixel = 4
): Uint8Array {
  const rowBytes = width * bytesPerPixel
  if (cmykBytes.byteLength !== rowBytes * height) {
    throw new Error('cmyk-flip-invalid-buffer')
  }

  const out = new Uint8Array(cmykBytes.byteLength)
  for (let row = 0; row < height; row += 1) {
    const srcStart = row * rowBytes
    const dstStart = (height - 1 - row) * rowBytes
    out.set(cmykBytes.subarray(srcStart, srcStart + rowBytes), dstStart)
  }

  return out
}
