import type { ImpresionTintasRegistro } from '../../../../core/domain/entities/Order'
import type { YesNoChoice } from '../../../../core/domain/entities/PreprensaDiseno'

export const resolveClienteSuministraTintaPantone = (
  registro: Pick<ImpresionTintasRegistro, 'clienteSuministraTintaPantone'>
): YesNoChoice => registro.clienteSuministraTintaPantone ?? 'si'

export const resolvePrecioCobroTintaPantone = (
  registro: Pick<ImpresionTintasRegistro, 'clienteSuministraTintaPantone' | 'precioCobroTintaPantone'>
): number => {
  if (resolveClienteSuministraTintaPantone(registro) === 'si') return 0
  const precio = registro.precioCobroTintaPantone
  return typeof precio === 'number' && precio > 0 ? precio : 0
}
