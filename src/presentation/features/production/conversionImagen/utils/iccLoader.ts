import {
  findInputProfile,
  findOutputProfile,
  resolveIccProfileUrl,
} from '../constants/iccProfiles'
import type { ConversionInputProfileId, ConversionOutputProfileId } from '../types'
import genericCmykBundledUrl from '../assets/GenericCMYK_LCMS.icc?url'

const iccCache = new Map<string, Uint8Array>()

const ICC_SIGNATURE_OFFSET = 36
const ICC_MIN_SIZE = 128

/** Perfiles empaquetados con Vite (siempre disponibles en build y dev). */
const BUNDLED_ICC_URLS: Record<string, string> = {
  'GenericCMYK_LCMS.icc': genericCmykBundledUrl,
}

export function isValidIccProfileBytes(bytes: Uint8Array): boolean {
  if (bytes.byteLength < ICC_MIN_SIZE) return false
  return (
    bytes[ICC_SIGNATURE_OFFSET] === 0x61 &&
    bytes[ICC_SIGNATURE_OFFSET + 1] === 0x63 &&
    bytes[ICC_SIGNATURE_OFFSET + 2] === 0x73 &&
    bytes[ICC_SIGNATURE_OFFSET + 3] === 0x70
  )
}

export async function fetchIccProfileBytes(fileName: string): Promise<Uint8Array> {
  const cached = iccCache.get(fileName)
  if (cached) return cached

  const sources = [resolveIccProfileUrl(fileName)]
  const bundledUrl = BUNDLED_ICC_URLS[fileName]
  if (bundledUrl) sources.push(bundledUrl)

  let sawInvalid = false
  for (const url of sources) {
    try {
      const response = await fetch(url)
      if (!response.ok) continue

      const buffer = await response.arrayBuffer()
      const bytes = new Uint8Array(buffer)
      if (!isValidIccProfileBytes(bytes)) {
        sawInvalid = true
        continue
      }

      iccCache.set(fileName, bytes)
      return bytes
    } catch {
      // probar siguiente origen
    }
  }

  throw new Error(sawInvalid ? 'icc-invalid' : 'icc-missing')
}

export async function loadOutputIccBytes(
  profileId: ConversionOutputProfileId
): Promise<Uint8Array> {
  const profile = findOutputProfile(profileId)
  if (!profile?.fileName) throw new Error('icc-missing')
  return fetchIccProfileBytes(profile.fileName)
}

export async function loadInputIccBytes(
  profileId: ConversionInputProfileId
): Promise<Uint8Array | undefined> {
  if (profileId === 'srgb-builtin') return undefined
  const profile = findInputProfile(profileId)
  if (!profile?.fileName) return undefined
  return fetchIccProfileBytes(profile.fileName)
}

export async function probeAvailableOutputProfiles(): Promise<ConversionOutputProfileId[]> {
  const available: ConversionOutputProfileId[] = []
  await Promise.all(
    (
      [
        'GenericCMYK_LCMS',
        'SWOP2006_Coated3v2',
        'ISOcoated_v2_eci',
        'GRACoL2006_Coated1v2',
      ] as const
    ).map(async id => {
      try {
        await loadOutputIccBytes(id)
        available.push(id)
      } catch {
        // perfil opcional no instalado
      }
    })
  )
  return available
}
