const assetByEntradaId = new Map<string, File>()

export const setEstimarTintasCachedAsset = (entradaId: string, file: File): void => {
  if (!entradaId.trim()) return
  assetByEntradaId.set(entradaId, file)
}

export const getEstimarTintasCachedAsset = (entradaId: string): File | undefined => {
  if (!entradaId.trim()) return undefined
  return assetByEntradaId.get(entradaId)
}

export const deleteEstimarTintasCachedAsset = (entradaId: string): void => {
  if (!entradaId.trim()) return
  assetByEntradaId.delete(entradaId)
}
