import { appendCmykColorBar, buildEstimarTintasPdfCmykOperators } from './cmykColorBar'

const encoder = new TextEncoder()

const concatBytes = (chunks: Uint8Array[]): Uint8Array => {
  const total = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0)
  const out = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    out.set(chunk, offset)
    offset += chunk.byteLength
  }
  return out
}

class PdfWriter {
  private readonly chunks: Uint8Array[] = []

  get length(): number {
    return this.chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0)
  }

  writeAscii(text: string): void {
    this.chunks.push(encoder.encode(text))
  }

  writeBytes(bytes: Uint8Array): void {
    this.chunks.push(bytes)
  }

  toUint8Array(): Uint8Array {
    return concatBytes(this.chunks)
  }
}

const escapePdfString = (value: string): string =>
  value.replace(/[^\x20-\x7E]/g, '?').replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')

const buildEstimarTintasContentStream = (pageWidthPt: number, pageHeightPt: number): string => {
  const operatorLines = buildEstimarTintasPdfCmykOperators()
    .map(([c, m, y, k]) => `${c} ${m} ${y} ${k} k`)
    .join('\n')

  return [
    'q',
    operatorLines,
    `${pageWidthPt.toFixed(4)} 0 0 ${pageHeightPt.toFixed(4)} 0 0 cm`,
    '/Im0 Do',
    'Q',
  ].join('\n')
}

/**
 * PDF CMYK compatible con Estimar tintas (DeviceCMYK + operadores k) y preprensa
 * (perfil ICC en OutputIntent).
 */
export function encodeCmykPdf(params: {
  width: number
  height: number
  cmykBytes: Uint8Array
  iccProfile: Uint8Array
  title?: string
  dpi?: number
  includeColorBar?: boolean
  outputProfileLabel?: string
}): Uint8Array {
  const { iccProfile, title, dpi = 300, includeColorBar = false, outputProfileLabel } = params

  const framed = includeColorBar
    ? appendCmykColorBar({
        width: params.width,
        height: params.height,
        cmykBytes: params.cmykBytes,
      })
    : {
        width: params.width,
        height: params.height,
        cmykBytes: params.cmykBytes,
      }

  const { width, height, cmykBytes } = framed

  if (cmykBytes.byteLength !== width * height * 4) {
    throw new Error('pdf-cmyk-invalid-buffer')
  }

  const pageWidthPt = (width * 72) / dpi
  const pageHeightPt = (height * 72) / dpi
  const docTitle = title?.trim() || 'CMYK conversion'
  const profileLabel = outputProfileLabel?.trim() || 'CMYK ICC'

  const writer = new PdfWriter()
  const offsets: number[] = new Array(9).fill(0)

  writer.writeAscii('%PDF-1.4\n%\u00e4\u00e3\u00cf\u00d3\n')

  offsets[1] = writer.length
  writer.writeAscii('1 0 obj\n<< /Type /Catalog /Pages 2 0 R /OutputIntents [ 3 0 R ] >>\nendobj\n')

  offsets[2] = writer.length
  writer.writeAscii('2 0 obj\n<< /Type /Pages /Kids [ 4 0 R ] /Count 1 >>\nendobj\n')

  offsets[3] = writer.length
  writer.writeAscii(
    `3 0 obj\n<< /Type /OutputIntent /S /GTS_PDFX /OutputConditionIdentifier (${escapePdfString(profileLabel)}) /RegistryName (http://www.color.org) /Info (CMYK ICC profile) /DestOutputProfile 5 0 R >>\nendobj\n`
  )

  offsets[4] = writer.length
  writer.writeAscii(
    `4 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [ 0 0 ${pageWidthPt.toFixed(4)} ${pageHeightPt.toFixed(4)} ] /Resources << /XObject << /Im0 6 0 R >> /ColorSpace << /CS0 /DeviceCMYK >> /ProcSet [ /PDF /ImageC ] >> /Contents 7 0 R >>\nendobj\n`
  )

  offsets[5] = writer.length
  writer.writeAscii(`5 0 obj\n<< /N 4 /Alternate /DeviceCMYK /Length ${iccProfile.byteLength} >>\nstream\n`)
  writer.writeBytes(iccProfile)
  writer.writeAscii('\nendstream\nendobj\n')

  offsets[6] = writer.length
  writer.writeAscii(
    `6 0 obj\n<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceCMYK /BitsPerComponent 8 /Length ${cmykBytes.byteLength} >>\nstream\n`
  )
  writer.writeBytes(cmykBytes)
  writer.writeAscii('\nendstream\nendobj\n')

  const contentStream = buildEstimarTintasContentStream(pageWidthPt, pageHeightPt)
  const contentBytes = encoder.encode(contentStream)

  offsets[7] = writer.length
  writer.writeAscii(`7 0 obj\n<< /Length ${contentBytes.byteLength} >>\nstream\n`)
  writer.writeBytes(contentBytes)
  writer.writeAscii('\nendstream\nendobj\n')

  offsets[8] = writer.length
  writer.writeAscii(
    `8 0 obj\n<< /Title (${escapePdfString(docTitle)}) /Creator (IndiCore Conversion img) /Producer (IndiCore CMYK EstimarTintas) >>\nendobj\n`
  )

  const xrefOffset = writer.length
  writer.writeAscii('xref\n0 9\n0000000000 65535 f \n')
  for (let objectId = 1; objectId <= 8; objectId += 1) {
    writer.writeAscii(`${String(offsets[objectId]).padStart(10, '0')} 00000 n \n`)
  }

  writer.writeAscii(`trailer\n<< /Size 9 /Root 1 0 R /Info 8 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`)

  return writer.toUint8Array()
}
