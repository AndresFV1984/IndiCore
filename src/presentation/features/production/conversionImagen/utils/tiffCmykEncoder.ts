const TIFF_MAGIC = 0x4949 // little-endian II
const COMPRESSION_NONE = 1
const PHOTOMETRIC_SEPARATED = 5
const PLANAR_CONFIGURATION_CHUNKY = 1
const INK_SET_CMYK = 1
const SAMPLE_FORMAT_UNSIGNED_INT = 1
const RESOLUTION_UNIT_INCH = 2
const TAG_IMAGE_WIDTH = 256
const TAG_IMAGE_LENGTH = 257
const TAG_BITS_PER_SAMPLE = 258
const TAG_COMPRESSION = 259
const TAG_PHOTOMETRIC = 262
const TAG_STRIP_OFFSETS = 273
const TAG_SAMPLES_PER_PIXEL = 277
const TAG_ROWS_PER_STRIP = 278
const TAG_STRIP_BYTE_COUNTS = 279
const TAG_PLANAR_CONFIGURATION = 284
const TAG_X_RESOLUTION = 282
const TAG_Y_RESOLUTION = 283
const TAG_RESOLUTION_UNIT = 296
const TAG_INK_SET = 332
const TAG_NUMBER_OF_INKS = 334
const TAG_SAMPLE_FORMAT = 339
const TAG_ICC_PROFILE = 34675
const TAG_IMAGE_DESCRIPTION = 270
const TYPE_BYTE = 1
const TYPE_ASCII = 2
const TYPE_SHORT = 3
const TYPE_LONG = 4
const TYPE_RATIONAL = 5

const align4 = (value: number): number => (value + 3) & ~3

const sanitizeTiffAscii = (text: string): string =>
  text.replace(/[^\x20-\x7E]/g, ' ').trim().slice(0, 512)

function writeAscii(buffer: DataView, offset: number, text: string): number {
  for (let i = 0; i < text.length; i += 1) {
    buffer.setUint8(offset + i, text.charCodeAt(i))
  }
  buffer.setUint8(offset + text.length, 0)
  return offset + text.length + 1
}

function writeRational(buffer: DataView, offset: number, numerator: number, denominator: number): void {
  buffer.setUint32(offset, numerator, true)
  buffer.setUint32(offset + 4, denominator, true)
}

interface IfdEntry {
  tag: number
  type: number
  count: number
  valueOrOffset: number
}

function writeIfdEntry(view: DataView, ifdOffset: number, entry: IfdEntry): void {
  view.setUint16(ifdOffset, entry.tag, true)
  view.setUint16(ifdOffset + 2, entry.type, true)
  view.setUint32(ifdOffset + 4, entry.count, true)

  const inlineByteLength =
    entry.type === TYPE_BYTE || entry.type === TYPE_ASCII
      ? entry.count
      : entry.type === TYPE_SHORT
        ? entry.count * 2
        : entry.type === TYPE_LONG || entry.type === TYPE_RATIONAL
          ? entry.count * 4
          : 0

  if (inlineByteLength > 0 && inlineByteLength <= 4) {
    const packed = new Uint8Array(4)
    if (entry.type === TYPE_SHORT) {
      const shorts = new Uint16Array([entry.valueOrOffset])
      packed.set(new Uint8Array(shorts.buffer))
    } else if (entry.type === TYPE_LONG) {
      const longs = new Uint32Array([entry.valueOrOffset])
      packed.set(new Uint8Array(longs.buffer))
    } else {
      packed[0] = entry.valueOrOffset
    }
    for (let i = 0; i < 4; i += 1) {
      view.setUint8(ifdOffset + 8 + i, packed[i] ?? 0)
    }
    return
  }

  view.setUint32(ifdOffset + 8, entry.valueOrOffset, true)
}

/**
 * Codifica TIFF CMYK con perfil ICC embebido (tag 34675).
 * Soporta 8 o 16 bits por canal, sin compresión (máxima compatibilidad RIP).
 */
export function encodeCmykTiff(params: {
  width: number
  height: number
  cmykBytes: Uint8Array
  bitsPerSample: 8 | 16
  iccProfile: Uint8Array
  imageDescription?: string
  dpi?: number
}): Uint8Array {
  const { width, height, cmykBytes, bitsPerSample, iccProfile, imageDescription, dpi = 300 } = params
  const samplesPerPixel = 4
  const bytesPerSample = bitsPerSample / 8
  const rowBytes = width * samplesPerPixel * bytesPerSample
  const imageDataSize = rowBytes * height

  const bitsArray = new Uint16Array(4)
  bitsArray.fill(bitsPerSample)

  const sampleFormatArray = new Uint16Array(4)
  sampleFormatArray.fill(SAMPLE_FORMAT_UNSIGNED_INT)

  const description = sanitizeTiffAscii(imageDescription ?? '')
  const descriptionBytes = description.length > 0 ? align4(description.length + 1) : 0
  const iccSize = align4(iccProfile.byteLength)
  const bitsSize = align4(bitsArray.byteLength)
  const sampleFormatSize = align4(sampleFormatArray.byteLength)
  const rationalSize = 16

  const entries: IfdEntry[] = [
    { tag: TAG_IMAGE_WIDTH, type: TYPE_LONG, count: 1, valueOrOffset: width },
    { tag: TAG_IMAGE_LENGTH, type: TYPE_LONG, count: 1, valueOrOffset: height },
    { tag: TAG_BITS_PER_SAMPLE, type: TYPE_SHORT, count: 4, valueOrOffset: 0 },
    { tag: TAG_COMPRESSION, type: TYPE_SHORT, count: 1, valueOrOffset: COMPRESSION_NONE },
    { tag: TAG_PHOTOMETRIC, type: TYPE_SHORT, count: 1, valueOrOffset: PHOTOMETRIC_SEPARATED },
    { tag: TAG_INK_SET, type: TYPE_SHORT, count: 1, valueOrOffset: INK_SET_CMYK },
    { tag: TAG_NUMBER_OF_INKS, type: TYPE_SHORT, count: 1, valueOrOffset: samplesPerPixel },
    { tag: TAG_STRIP_OFFSETS, type: TYPE_LONG, count: 1, valueOrOffset: 0 },
    { tag: TAG_SAMPLES_PER_PIXEL, type: TYPE_SHORT, count: 1, valueOrOffset: samplesPerPixel },
    { tag: TAG_ROWS_PER_STRIP, type: TYPE_LONG, count: 1, valueOrOffset: height },
    { tag: TAG_STRIP_BYTE_COUNTS, type: TYPE_LONG, count: 1, valueOrOffset: imageDataSize },
    { tag: TAG_PLANAR_CONFIGURATION, type: TYPE_SHORT, count: 1, valueOrOffset: PLANAR_CONFIGURATION_CHUNKY },
    { tag: TAG_SAMPLE_FORMAT, type: TYPE_SHORT, count: 4, valueOrOffset: 0 },
    { tag: TAG_X_RESOLUTION, type: TYPE_RATIONAL, count: 1, valueOrOffset: 0 },
    { tag: TAG_Y_RESOLUTION, type: TYPE_RATIONAL, count: 1, valueOrOffset: 0 },
    { tag: TAG_RESOLUTION_UNIT, type: TYPE_SHORT, count: 1, valueOrOffset: RESOLUTION_UNIT_INCH },
    { tag: TAG_ICC_PROFILE, type: TYPE_BYTE, count: iccProfile.byteLength, valueOrOffset: 0 },
  ]

  if (description) {
    entries.push({
      tag: TAG_IMAGE_DESCRIPTION,
      type: TYPE_ASCII,
      count: description.length + 1,
      valueOrOffset: 0,
    })
  }

  const ifdEntryCount = entries.length
  const ifdSize = 2 + ifdEntryCount * 12 + 4
  let dataOffset = 8 + ifdSize

  const stripOffset = dataOffset
  dataOffset += imageDataSize

  const bitsOffset = dataOffset
  dataOffset += bitsSize
  entries.find(entry => entry.tag === TAG_BITS_PER_SAMPLE)!.valueOrOffset = bitsOffset

  const sampleFormatOffset = dataOffset
  dataOffset += sampleFormatSize
  entries.find(entry => entry.tag === TAG_SAMPLE_FORMAT)!.valueOrOffset = sampleFormatOffset

  const xResOffset = dataOffset
  dataOffset += rationalSize
  entries.find(entry => entry.tag === TAG_X_RESOLUTION)!.valueOrOffset = xResOffset

  const yResOffset = dataOffset
  dataOffset += rationalSize
  entries.find(entry => entry.tag === TAG_Y_RESOLUTION)!.valueOrOffset = yResOffset

  let descriptionOffset = 0
  if (description) {
    descriptionOffset = dataOffset
    dataOffset += descriptionBytes
    entries.find(entry => entry.tag === TAG_IMAGE_DESCRIPTION)!.valueOrOffset = descriptionOffset
  }

  const iccOffset = dataOffset
  dataOffset += iccSize
  entries.find(entry => entry.tag === TAG_ICC_PROFILE)!.valueOrOffset = iccOffset
  entries.find(entry => entry.tag === TAG_STRIP_OFFSETS)!.valueOrOffset = stripOffset

  const totalSize = dataOffset
  const buffer = new ArrayBuffer(totalSize)
  const view = new DataView(buffer)
  const bytes = new Uint8Array(buffer)

  view.setUint16(0, TIFF_MAGIC, true)
  view.setUint32(4, 8, true)

  let ifdOffset = 8
  view.setUint16(ifdOffset, ifdEntryCount, true)
  ifdOffset += 2

  for (const entry of entries) {
    writeIfdEntry(view, ifdOffset, entry)
    ifdOffset += 12
  }

  view.setUint32(ifdOffset, 0, true)

  bytes.set(cmykBytes, stripOffset)
  bytes.set(new Uint8Array(bitsArray.buffer), bitsOffset)
  bytes.set(new Uint8Array(sampleFormatArray.buffer), sampleFormatOffset)
  writeRational(view, xResOffset, dpi, 1)
  writeRational(view, yResOffset, dpi, 1)
  if (description) writeAscii(view, descriptionOffset, description)
  bytes.set(iccProfile, iccOffset)

  return bytes
}

/** Reduce CMYK 16-bit interleaved a 8-bit (byte alto de cada canal). */
export function downsampleCmyk16To8(cmyk16: Uint16Array): Uint8Array {
  const out = new Uint8Array(cmyk16.length)
  for (let i = 0; i < cmyk16.length; i += 1) {
    out[i] = cmyk16[i] >> 8
  }
  return out
}
