import type { ImpresionTintasRegistro } from '../../../../core/domain/entities/Order'
import type { YesNoChoice } from '../../../../core/domain/entities/PreprensaDiseno'

export const resolveClienteSuministraPruebaSherpa = (
  registro: Pick<ImpresionTintasRegistro, 'clienteSuministraPruebaSherpa'>
): YesNoChoice => registro.clienteSuministraPruebaSherpa ?? 'si'

export const resolvePrecioPruebaSherpaCobro = (
  registro: Pick<ImpresionTintasRegistro, 'clienteSuministraPruebaSherpa' | 'precioPruebaSherpa'>
): number => {
  if (resolveClienteSuministraPruebaSherpa(registro) === 'si') return 0
  const precio = registro.precioPruebaSherpa
  return typeof precio === 'number' && precio > 0 ? precio : 0
}
