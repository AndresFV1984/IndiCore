import React, { useId, useMemo } from 'react'
import clsx from 'clsx'
import type { ImpresionTipoBifronte } from '../../../core/domain/entities/Order'
import type { TarifaMillar } from '../../../core/domain/entities/TarifaMillar'
import { IMPRESION_COPY as copy } from './constants/impresionCopy'
import { IMPRESION_GRUPO_VOLTEO_SELECT_OPTIONS, isImpresionConVolteo } from './constants/impresionTipoBifronte'
import ImpresionVolteoSelector from './ImpresionVolteoSelector'
import ImpresionTarifaMetricsStrip from './ImpresionTarifaMetricsStrip'
import ImpresionTintasMillaresCalculadosField from './ImpresionTintasMillaresCalculadosField'
import {
  computeValorImpresionColorBasicoPorReferencia,
  computeValorImpresionColorBasicoConVolteoPorReferencia,
  computeValorImpresionPantonePorReferencia,
  computeValorImpresionPantoneConVolteoPorReferencia,
  shouldUsarPrecioConVolteoColorBasico,
  shouldUsarPrecioConVolteoPantone,
} from './utils/tarifaMillarPricingUtils'
import type { ImpresionGrupoMillaresPreview } from './utils/impresionPrecioTintaUtils'
import { formatPrecioMillar, resolveImpresionPrecioConVolteoMillar } from './utils/impresionVolteoTarifaUtils'

const colorBasicoCopy = copy.tintas.colorBasico
const pantoneCopy = copy.tintas.pantone
const volteoCopy = copy.tintas.tintasVolteo
const millaresCopy = copy.tintas.millaresCalculados
type VolteoVariant = 'colorBasico' | 'pantone'

interface VolteoTarifaBlockProps {
  variant: VolteoVariant
  tipoBifronte: ImpresionTipoBifronte | ''
  tarifa: TarifaMillar | null
  tamanosBuenosReferencia?: number | null
  precioMillar?: number
  millarMinimoVenta?: number
  topeMinimoMillar?: number
  umbralDecimalMillar?: number
  precioVolteoMillar?: number
  millarMinimoVentaVolteo?: number
  topeMinimoMillarVolteo?: number
  umbralDecimalMillarVolteo?: number
  tarifasMillarLoading?: boolean
  millaresPreview?: ImpresionGrupoMillaresPreview | null
  conVolteoPermitido?: boolean
  conVolteoBloqueadoHint?: string | null
  onTipoBifronteChange: (value: ImpresionTipoBifronte | '') => void
  onPrecioMillarChange: (value: number) => void
  onPrecioVolteoMillarChange: (value: number) => void
}

const VARIANT_COPY: Record<
  VolteoVariant,
  {
    title: string
    tarifaCopy: typeof colorBasicoCopy
    tone: 'colorBasico' | 'pantone'
    rootClass: string
  }
> = {
  colorBasico: {
    title: colorBasicoCopy.sectionTitle,
    tarifaCopy: colorBasicoCopy,
    tone: 'colorBasico',
    rootClass: 'production-impresion-grupo-card--color-basico',
  },
  pantone: {
    title: pantoneCopy.sectionTitle,
    tarifaCopy: pantoneCopy,
    tone: 'pantone',
    rootClass: 'production-impresion-grupo-card--pantone',
  },
}

const ImpresionTintasVolteoTarifaBlock: React.FC<VolteoTarifaBlockProps> = ({
  variant,
  tipoBifronte,
  tarifa,
  tamanosBuenosReferencia = null,
  precioMillar = 0,
  millarMinimoVenta,
  topeMinimoMillar,
  umbralDecimalMillar,
  precioVolteoMillar = 0,
  millarMinimoVentaVolteo,
  topeMinimoMillarVolteo,
  umbralDecimalMillarVolteo,
  tarifasMillarLoading = false,
  millaresPreview = null,
  conVolteoPermitido = true,
  conVolteoBloqueadoHint = null,
  onTipoBifronteChange,
  onPrecioMillarChange,
  onPrecioVolteoMillarChange,
}) => {
  const volteoGroupId = useId()
  const variantCopy = VARIANT_COPY[variant]
  const tarifaCopy = variantCopy.tarifaCopy
  const conVolteo = isImpresionConVolteo(tipoBifronte)
  const volteoSeleccionLabel =
    IMPRESION_GRUPO_VOLTEO_SELECT_OPTIONS.find(
      option => option.value === (tipoBifronte || 'diferente-plancha')
    )?.label ?? volteoCopy.volteoStatusSin
  const precioInicial = precioMillar > 0 ? precioMillar : (tarifa?.precio ?? 0)
  const precioPorMillarVolteo = resolveImpresionPrecioConVolteoMillar(
    tarifa,
    precioVolteoMillar,
    tipoBifronte
  )
  const precioPorMillarBase = precioInicial
  const topeActivo = conVolteo ? (topeMinimoMillarVolteo ?? 0) : (topeMinimoMillar ?? 0)
  const referenciaParaPrecio =
    tamanosBuenosReferencia ??
    (millaresPreview?.tamanosBuenosFuente === 'referencia' ? millaresPreview.tamanosBuenos : null)
  const usaPrecioConVolteoColorBasico =
    variant === 'colorBasico' && shouldUsarPrecioConVolteoColorBasico(referenciaParaPrecio)
  const usaPrecioConVolteoPantone =
    variant === 'pantone' && shouldUsarPrecioConVolteoPantone(referenciaParaPrecio)
  const valorImpresion = useMemo(() => {
    const millaresReferencia = millaresPreview?.millaresCalculados ?? 0
    if (millaresReferencia <= 0) return 0

    if (variant === 'colorBasico') {
      if (conVolteo) {
        return computeValorImpresionColorBasicoConVolteoPorReferencia({
          millaresReferencia,
          tamanosBuenosReferencia: referenciaParaPrecio,
          precioConVolteo: precioPorMillarVolteo,
          precioSinVolteo: precioInicial,
          topeMinimoMillar: topeActivo,
        })
      }
      return computeValorImpresionColorBasicoPorReferencia({
        millaresReferencia,
        tamanosBuenosReferencia: referenciaParaPrecio,
        precioConVolteo: precioPorMillarVolteo,
        precioSinVolteo: precioInicial,
      })
    }

    if (conVolteo) {
      return computeValorImpresionPantoneConVolteoPorReferencia({
        millaresReferencia,
        tamanosBuenosReferencia: referenciaParaPrecio,
        precioConVolteo: precioPorMillarVolteo,
        precioSinVolteo: precioInicial,
        topeMinimoMillar: topeActivo,
      })
    }

    return computeValorImpresionPantonePorReferencia({
      millaresReferencia,
      tamanosBuenosReferencia: referenciaParaPrecio,
      precioConVolteo: precioPorMillarVolteo,
      precioSinVolteo: precioInicial,
    })
  }, [
    conVolteo,
    millaresPreview?.millaresCalculados,
    precioInicial,
    precioPorMillarBase,
    precioPorMillarVolteo,
    referenciaParaPrecio,
    topeActivo,
    variant,
  ])

  const valorImpresionDisplay =
    valorImpresion > 0 ? formatPrecioMillar(valorImpresion) : millaresCopy.empty

  const tarifaStripProps = conVolteo
    ? {
        tone: 'volteo' as const,
        labels: {
          precioInicial: tarifaCopy.precioInicialLabel,
          precio: tarifaCopy.precioConVolteoLabel,
          topeMinimoMillar: volteoCopy.topeMinimoMillarLabel,
          millarMinimoVenta: volteoCopy.millarMinimoVentaLabel,
          umbralDecimalMillar: volteoCopy.umbralDecimalMillarLabel,
          precioEmpty: volteoCopy.precioEmpty,
          precioInicialEmpty: tarifaCopy.precioInicialEmpty,
          topeMinimoMillarEmpty: volteoCopy.topeMinimoMillarEmpty,
          millarMinimoVentaEmpty: volteoCopy.millarMinimoVentaEmpty,
          umbralDecimalMillarEmpty: volteoCopy.umbralDecimalMillarEmpty,
          precioMillarHint: volteoCopy.precioMillarHint,
          precioMillarNoTarifa: volteoCopy.precioMillarNoTarifa,
        },
        tarifa,
        precioInicialMillar: precioMillar,
        showPrecioInicial: true,
        precioMillar: precioVolteoMillar,
        millarMinimoVenta: millarMinimoVentaVolteo,
        topeMinimoMillar: topeMinimoMillarVolteo,
        umbralDecimalMillar: umbralDecimalMillarVolteo,
        tarifasMillarLoading,
        precioInicialEditable: true,
        onPrecioInicialChange: onPrecioMillarChange,
        precioEditable: true,
        onPrecioMillarChange: onPrecioVolteoMillarChange,
      }
    : {
        tone: variantCopy.tone,
        labels: {
          precio: tarifaCopy.precioInicialLabel,
          topeMinimoMillar: tarifaCopy.topeMinimoMillarLabel,
          millarMinimoVenta: tarifaCopy.millarMinimoVentaLabel,
          umbralDecimalMillar: tarifaCopy.umbralDecimalMillarLabel,
          precioEmpty: tarifaCopy.precioInicialEmpty,
          topeMinimoMillarEmpty: tarifaCopy.topeMinimoMillarEmpty,
          millarMinimoVentaEmpty: tarifaCopy.millarMinimoVentaEmpty,
          umbralDecimalMillarEmpty: tarifaCopy.umbralDecimalMillarEmpty,
          precioMillarHint: tarifaCopy.precioMillarHint,
          precioMillarNoTarifa: tarifaCopy.precioMillarNoTarifa,
        },
        tarifa,
        precioMillar,
        millarMinimoVenta,
        topeMinimoMillar,
        umbralDecimalMillar,
        tarifasMillarLoading,
        precioEditable: true,
        onPrecioMillarChange,
      }

  return (
    <section
      className={clsx(
        'production-impresion-grupo-card',
        variantCopy.rootClass,
        conVolteo && 'production-impresion-grupo-card--con-volteo'
      )}
      aria-labelledby={`${volteoGroupId}-title`}
    >
      <header className="production-impresion-grupo-card__header">
        <div className="production-impresion-grupo-card__header-main">
          <h5 className="production-impresion-grupo-card__title" id={`${volteoGroupId}-title`}>
            {variantCopy.title}
          </h5>
          <span
            className={clsx(
              'production-impresion-grupo-card__status',
              conVolteo && 'production-impresion-grupo-card__status--activo'
            )}
          >
            {volteoSeleccionLabel}
          </span>
        </div>
        <div className="production-impresion-grupo-card__total" role="status">
          <span className="production-impresion-grupo-card__total-label">
            {millaresCopy.valorImpresionLabel}
          </span>
          <span className="production-impresion-grupo-card__total-value">
            {valorImpresionDisplay}
          </span>
        </div>
      </header>

      <div className="production-impresion-grupo-card__body">
        <ImpresionVolteoSelector
          value={tipoBifronte}
          onChange={onTipoBifronteChange}
          disabled={tarifasMillarLoading}
          conVolteoPermitido={conVolteoPermitido}
          conVolteoBloqueadoHint={conVolteoBloqueadoHint}
        />

        <ImpresionTarifaMetricsStrip {...tarifaStripProps} />

        <ImpresionTintasMillaresCalculadosField
          preview={millaresPreview}
          variant={variant}
          valorImpresion={valorImpresion}
          conVolteo={conVolteo}
          precioInicial={precioInicial}
          precioPorMillar={conVolteo ? precioPorMillarVolteo : precioPorMillarBase}
          precioConVolteoMillar={precioPorMillarVolteo}
          usaPrecioConVolteoColorBasico={usaPrecioConVolteoColorBasico}
          usaPrecioConVolteoPantone={usaPrecioConVolteoPantone}
          topeMinimoMillarActivo={topeActivo}
        />
      </div>
    </section>
  )
}

interface ImpresionTintasVolteoSectionProps {
  hasPantone: boolean
  hasColorBasico: boolean
  tipoBifronteColorBasico: ImpresionTipoBifronte | ''
  tipoBifrontePantone: ImpresionTipoBifronte | ''
  tarifaColorBasico: TarifaMillar | null
  tarifaPantone: TarifaMillar | null
  precioColorBasicoMillar?: number
  millarMinimoVentaColorBasico?: number
  topeMinimoMillarColorBasico?: number
  umbralDecimalMillarColorBasico?: number
  precioPantoneMillar?: number
  millarMinimoVentaPantone?: number
  topeMinimoMillarPantone?: number
  umbralDecimalMillarPantone?: number
  precioVolteoColorBasicoMillar?: number
  millarMinimoVentaVolteoColorBasico?: number
  topeMinimoMillarVolteoColorBasico?: number
  umbralDecimalMillarVolteoColorBasico?: number
  precioVolteoPantoneMillar?: number
  millarMinimoVentaVolteoPantone?: number
  topeMinimoMillarVolteoPantone?: number
  umbralDecimalMillarVolteoPantone?: number
  tarifasMillarLoading?: boolean
  millaresPreviewColorBasico?: ImpresionGrupoMillaresPreview | null
  millaresPreviewPantone?: ImpresionGrupoMillaresPreview | null
  tamanosBuenosReferenciaColorBasico?: number | null
  tamanosBuenosReferenciaPantone?: number | null
  conVolteoPermitidoColorBasico?: boolean
  conVolteoPermitidoPantone?: boolean
  conVolteoBloqueadoHintColorBasico?: string | null
  conVolteoBloqueadoHintPantone?: string | null
  onTipoBifronteColorBasicoChange: (value: ImpresionTipoBifronte | '') => void
  onTipoBifrontePantoneChange: (value: ImpresionTipoBifronte | '') => void
  onPrecioColorBasicoMillarChange: (value: number) => void
  onPrecioPantoneMillarChange: (value: number) => void
  onPrecioVolteoColorBasicoMillarChange: (value: number) => void
  onPrecioVolteoPantoneMillarChange: (value: number) => void
}

const ImpresionTintasVolteoSection: React.FC<ImpresionTintasVolteoSectionProps> = ({
  hasPantone,
  hasColorBasico,
  tipoBifronteColorBasico,
  tipoBifrontePantone,
  tarifaColorBasico,
  tarifaPantone,
  precioColorBasicoMillar = 0,
  millarMinimoVentaColorBasico,
  topeMinimoMillarColorBasico,
  umbralDecimalMillarColorBasico,
  precioPantoneMillar = 0,
  millarMinimoVentaPantone,
  topeMinimoMillarPantone,
  umbralDecimalMillarPantone,
  precioVolteoColorBasicoMillar = 0,
  millarMinimoVentaVolteoColorBasico,
  topeMinimoMillarVolteoColorBasico,
  umbralDecimalMillarVolteoColorBasico,
  precioVolteoPantoneMillar = 0,
  millarMinimoVentaVolteoPantone,
  topeMinimoMillarVolteoPantone,
  umbralDecimalMillarVolteoPantone,
  tarifasMillarLoading = false,
  millaresPreviewColorBasico = null,
  millaresPreviewPantone = null,
  tamanosBuenosReferenciaColorBasico = null,
  tamanosBuenosReferenciaPantone = null,
  conVolteoPermitidoColorBasico = true,
  conVolteoPermitidoPantone = true,
  conVolteoBloqueadoHintColorBasico = null,
  conVolteoBloqueadoHintPantone = null,
  onTipoBifronteColorBasicoChange,
  onTipoBifrontePantoneChange,
  onPrecioColorBasicoMillarChange,
  onPrecioPantoneMillarChange,
  onPrecioVolteoColorBasicoMillarChange,
  onPrecioVolteoPantoneMillarChange,
}) => (
  <div
    className={clsx(
      'production-impresion-tintas-volteo-stack',
      hasColorBasico && hasPantone && 'production-impresion-tintas-volteo-stack--dual'
    )}
  >
    {hasColorBasico ? (
      <ImpresionTintasVolteoTarifaBlock
        variant="colorBasico"
        tipoBifronte={tipoBifronteColorBasico}
        tarifa={tarifaColorBasico}
        precioMillar={precioColorBasicoMillar}
        millarMinimoVenta={millarMinimoVentaColorBasico}
        topeMinimoMillar={topeMinimoMillarColorBasico}
        umbralDecimalMillar={umbralDecimalMillarColorBasico}
        precioVolteoMillar={precioVolteoColorBasicoMillar}
        millarMinimoVentaVolteo={millarMinimoVentaVolteoColorBasico}
        topeMinimoMillarVolteo={topeMinimoMillarVolteoColorBasico}
        umbralDecimalMillarVolteo={umbralDecimalMillarVolteoColorBasico}
        tarifasMillarLoading={tarifasMillarLoading}
        millaresPreview={millaresPreviewColorBasico}
        tamanosBuenosReferencia={tamanosBuenosReferenciaColorBasico}
        conVolteoPermitido={conVolteoPermitidoColorBasico}
        conVolteoBloqueadoHint={conVolteoBloqueadoHintColorBasico}
        onTipoBifronteChange={onTipoBifronteColorBasicoChange}
        onPrecioMillarChange={onPrecioColorBasicoMillarChange}
        onPrecioVolteoMillarChange={onPrecioVolteoColorBasicoMillarChange}
      />
    ) : null}
    {hasPantone ? (
      <ImpresionTintasVolteoTarifaBlock
        variant="pantone"
        tipoBifronte={tipoBifrontePantone}
        tarifa={tarifaPantone}
        precioMillar={precioPantoneMillar}
        millarMinimoVenta={millarMinimoVentaPantone}
        topeMinimoMillar={topeMinimoMillarPantone}
        umbralDecimalMillar={umbralDecimalMillarPantone}
        precioVolteoMillar={precioVolteoPantoneMillar}
        millarMinimoVentaVolteo={millarMinimoVentaVolteoPantone}
        topeMinimoMillarVolteo={topeMinimoMillarVolteoPantone}
        umbralDecimalMillarVolteo={umbralDecimalMillarVolteoPantone}
        tarifasMillarLoading={tarifasMillarLoading}
        millaresPreview={millaresPreviewPantone}
        tamanosBuenosReferencia={tamanosBuenosReferenciaPantone}
        conVolteoPermitido={conVolteoPermitidoPantone}
        conVolteoBloqueadoHint={conVolteoBloqueadoHintPantone}
        onTipoBifronteChange={onTipoBifrontePantoneChange}
        onPrecioMillarChange={onPrecioPantoneMillarChange}
        onPrecioVolteoMillarChange={onPrecioVolteoPantoneMillarChange}
      />
    ) : null}
  </div>
)

export default ImpresionTintasVolteoSection
