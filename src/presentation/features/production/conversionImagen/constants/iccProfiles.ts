import type { ConversionInputProfileId, ConversionOutputProfileId } from '../types'

const iccBase = `${import.meta.env.BASE_URL}icc/`

export interface IccProfileOption<T extends string = string> {
  id: T
  label: string
  fileName?: string
  description: string
  region?: string
}

/** Perfiles RGB de entrada. `srgb-builtin` usa cmsCreate_sRGBProfile() de LCMS2. */
export const INPUT_ICC_PROFILES: IccProfileOption<ConversionInputProfileId>[] = [
  {
    id: 'srgb-builtin',
    label: 'sRGB IEC61966-2.1 (integrado LCMS2)',
    description: 'Perfil sRGB estándar integrado en la app. Use esta opción para fotos web, móvil o exportaciones sin perfil específico.',
  },
  {
    id: 'srgb-icc',
    label: 'sRGB IEC61966-2.1 (archivo .icc)',
    fileName: 'sRGB_IEC61966-2.1.icc',
    description: 'Mismo espacio sRGB cargado desde archivo. Solo si su flujo exige el .icc explícito en public/icc/.',
  },
]

/** Perfiles CMYK de salida — colocar los .icc en public/icc/ (ver README). */
export const OUTPUT_ICC_PROFILES: IccProfileOption<ConversionOutputProfileId>[] = [
  {
    id: 'GenericCMYK_LCMS',
    label: 'CMYK genérico (LCMS, incluido)',
    fileName: 'GenericCMYK_LCMS.icc',
    description:
      'Perfil CMYK incluido para probar la conversión sin instalar nada. No reemplace un perfil certificado de imprenta.',
  },
  {
    id: 'SWOP2006_Coated3v2',
    label: 'SWOP2006 Coated3 v2',
    fileName: 'SWOP2006_Coated3v2.icc',
    region: 'USA',
    description:
      'Estándar SWOP 2006 para offset en papel couché (Coated3). Perfil habitual en imprenta norteamericana.',
  },
  {
    id: 'ISOcoated_v2_eci',
    label: 'ISO Coated v2 (ECI)',
    fileName: 'ISOcoated_v2_eci.icc',
    region: 'Europa',
    description: 'Referencia europea (ECI) para couché offset. Es la opción habitual en imprenta comercial en Europa.',
  },
  {
    id: 'GRACoL2006_Coated1v2',
    label: 'GRACoL 2006 Coated 1 v2',
    fileName: 'GRACoL2006_Coated1v2.icc',
    region: 'Alta calidad',
    description: 'Calidad alta en couché brillante. Use cuando su proveedor trabaje con estándar GRACoL 2006.',
  },
]

export const resolveIccProfileUrl = (fileName: string): string => `${iccBase}${fileName}`

export const findOutputProfile = (
  id: ConversionOutputProfileId
): IccProfileOption<ConversionOutputProfileId> | undefined =>
  OUTPUT_ICC_PROFILES.find(profile => profile.id === id)

export const findInputProfile = (
  id: ConversionInputProfileId
): IccProfileOption<ConversionInputProfileId> | undefined =>
  INPUT_ICC_PROFILES.find(profile => profile.id === id)
