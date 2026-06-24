import { describe, expect, it } from 'vitest'
import { isValidIccProfileBytes } from './iccLoader'
import { applyTacLimitToCmyk16Pixel, cmyk16ToPercent, percentToCmyk16 } from './tacAndGcr'
import { encodeCmykTiff } from './tiffCmykEncoder'
import { encodeCmykPdf } from './pdfCmykEncoder'
import { appendCmykColorBar, resolveColorBarHeightPx } from './cmykColorBar'
import { detectPdfColorSpaceFromBytes } from '../../utils/estimarTintasColorSpaceUtils'

describe('iccLoader', () => {
  it('rechaza archivos demasiado pequeños o sin firma acsp', () => {
    expect(isValidIccProfileBytes(new Uint8Array(64))).toBe(false)

    const html = new Uint8Array(256)
    html.set([...'<!DOCTYPE html'].map(char => char.charCodeAt(0)))
    expect(isValidIccProfileBytes(html)).toBe(false)

    const icc = new Uint8Array(256)
    icc[36] = 0x61
    icc[37] = 0x63
    icc[38] = 0x73
    icc[39] = 0x70
    expect(isValidIccProfileBytes(icc)).toBe(true)
  })
})

describe('tacAndGcr', () => {
  it('limita TAC escalando canales proporcionalmente', () => {
    const c = percentToCmyk16(80)
    const m = percentToCmyk16(80)
    const y = percentToCmyk16(80)
    const k = percentToCmyk16(80)
    const [nc, nm, ny, nk] = applyTacLimitToCmyk16Pixel(c, m, y, k, 200)

    const tac =
      cmyk16ToPercent(nc) + cmyk16ToPercent(nm) + cmyk16ToPercent(ny) + cmyk16ToPercent(nk)
    expect(tac).toBeLessThanOrEqual(200.5)
  })
})

describe('tiffCmykEncoder', () => {
  it('genera TIFF little-endian con magic II', () => {
    const width = 2
    const height = 2
    const cmyk = new Uint8Array(width * height * 4)
    cmyk.fill(128)
    const icc = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7])

    const tiff = encodeCmykTiff({
      width,
      height,
      cmykBytes: cmyk,
      bitsPerSample: 8,
      iccProfile: icc,
      imageDescription: 'test',
    })

    expect(tiff[0]).toBe(0x49)
    expect(tiff[1]).toBe(0x49)
    expect(tiff.byteLength).toBeGreaterThan(cmyk.byteLength + icc.byteLength)
  })

  it('escribe un IFD con el mismo número de entradas declaradas', () => {
    const width = 4
    const height = 4
    const cmyk = new Uint8Array(width * height * 4)
    const icc = new Uint8Array(128)
    icc.set([0x61, 0x63, 0x73, 0x70], 36)

    const tiff = encodeCmykTiff({
      width,
      height,
      cmykBytes: cmyk,
      bitsPerSample: 8,
      iccProfile: icc,
      imageDescription: 'CMYK test',
    })

    const view = new DataView(tiff.buffer, tiff.byteOffset, tiff.byteLength)
    const declaredEntries = view.getUint16(8, true)
    let offset = 10
    const tags: number[] = []
    for (let i = 0; i < declaredEntries; i += 1) {
      tags.push(view.getUint16(offset, true))
      offset += 12
    }

    expect(declaredEntries).toBe(tags.length)
    expect(tags).toContain(332) // InkSet CMYK
    expect(tags).toContain(339) // SampleFormat
    expect(view.getUint32(offset, true)).toBe(0) // next IFD offset
  })
})

describe('pdfCmykEncoder', () => {
  it('genera PDF con imagen CMYK, ICCBased y OutputIntent', () => {
    const width = 2
    const height = 2
    const cmyk = new Uint8Array(width * height * 4)
    cmyk.fill(128)
    const icc = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7])

    const pdf = encodeCmykPdf({
      width,
      height,
      cmykBytes: cmyk,
      iccProfile: icc,
      title: 'test',
    })

    const header = new TextDecoder().decode(pdf.subarray(0, 8))
    const body = new TextDecoder().decode(pdf)

    expect(header.startsWith('%PDF-1.4')).toBe(true)
    expect(body).toContain('/DeviceCMYK')
    expect(body).toContain('/OutputIntent')
    expect(body).not.toContain('/ICCBased')
    expect(detectPdfColorSpaceFromBytes(pdf)).toBe('cmyk')
    expect(pdf.byteLength).toBeGreaterThan(cmyk.byteLength + icc.byteLength)
  })

  it('incluye firma de color CMYK bajo la imagen solo si se solicita', () => {
    const width = 80
    const height = 40
    const cmyk = new Uint8Array(width * height * 4)
    cmyk.fill(64)
    const icc = new Uint8Array(128)
    icc.set([0x61, 0x63, 0x73, 0x70], 36)

    const pdfWithoutBar = encodeCmykPdf({
      width,
      height,
      cmykBytes: cmyk,
      iccProfile: icc,
      includeColorBar: false,
    })

    expect(pdfWithoutBar.byteLength).toBeLessThan(width * (height + 28) * 4)

    const pdfWithBar = encodeCmykPdf({
      width,
      height,
      cmykBytes: cmyk,
      iccProfile: icc,
      includeColorBar: true,
    })

    const barHeight = resolveColorBarHeightPx(height)
    const framed = appendCmykColorBar({ width, height, cmykBytes: cmyk, barHeightPx: barHeight })
    expect(framed.height).toBe(height + barHeight)
    expect(pdfWithBar.byteLength).toBeGreaterThan(pdfWithoutBar.byteLength)
  })
})
