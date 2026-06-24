import React from 'react'
import clsx from 'clsx'
import { IMPRESION_COPY as copy } from './constants/impresionCopy'
import {
  ESTIMAR_TINTAS_PROCESS_CMYK_SWATCHES,
  isDisenoInkPantoneMix,
} from './constants/preprensaDisenoColors'
import type { EstimarTintasDetectedColor } from './utils/estimarTintasImageColorsUtils'
import {
  resolveEstimarTintasPantoneDisplaySwatch,
  sortPantoneDetectedColorsForDisplay,
} from './utils/estimarTintasImageColorsUtils'
import {
  CMYK_CHANNELS,
  formatEstimarTintasCoverage,
  formatEstimarTintasWeightG,
  type CmykChannel,
  type EstimarTintasResult,
} from './utils/estimarTintasUtils'
import {
  resolveInkCoverageFillStyle,
  resolveInkHeroSurfaceStyle,
  resolveInkTileBadgeStyle,
} from './utils/estimarTintasColorDisplayUtils'

const estimarCopy = copy.muestra

const resolveProcessCmykDisplaySwatch = (channel: CmykChannel): string =>
  ESTIMAR_TINTAS_PROCESS_CMYK_SWATCHES[channel]

interface EstimarTintasInkTileProps {
  name: string
  badge: string
  swatch: string
  coverage: number
  weightG: number
  variant?: 'process' | 'pantone'
}

const EstimarTintasInkTile: React.FC<EstimarTintasInkTileProps> = ({
  name,
  badge,
  swatch,
  coverage,
  weightG,
  variant = 'process',
}) => {
  const coveragePercent = Math.min(100, Math.max(0, coverage * 100))
  const barWidth = coveragePercent > 0 ? Math.max(coveragePercent, 4) : 0

  return (
    <article
      className={clsx(
        'production-impresion-estimar-tintas-hud__ink-tile',
        variant === 'pantone' && 'production-impresion-estimar-tintas-hud__ink-tile--pantone',
        isDisenoInkPantoneMix(swatch) && 'production-impresion-estimar-tintas-hud__ink-tile--mix'
      )}
      role="listitem"
      aria-label={`${name}: ${formatEstimarTintasCoverage(coverage)}, ${formatEstimarTintasWeightG(weightG)}`}
    >
      <div
        className="production-impresion-estimar-tintas-hud__ink-tile-hero"
        style={resolveInkHeroSurfaceStyle(swatch)}
      >
        <span
          className="production-impresion-estimar-tintas-hud__ink-tile-badge"
          style={resolveInkTileBadgeStyle(swatch)}
        >
          {badge}
        </span>
      </div>

      <div className="production-impresion-estimar-tintas-hud__ink-tile-body">
        <p className="production-impresion-estimar-tintas-hud__ink-tile-name" title={name}>
          {name}
        </p>

        <div
          className="production-impresion-estimar-tintas-hud__ink-tile-bar"
          role="presentation"
          aria-hidden
        >
          <div
            className="production-impresion-estimar-tintas-hud__ink-tile-bar-fill"
            style={{
              width: `${barWidth}%`,
              ...resolveInkCoverageFillStyle(swatch),
            }}
          />
        </div>

        <div className="production-impresion-estimar-tintas-hud__ink-tile-metrics">
          <span className="production-impresion-estimar-tintas-hud__ink-tile-coverage">
            {formatEstimarTintasCoverage(coverage)}
          </span>
          <span className="production-impresion-estimar-tintas-hud__ink-tile-grams">
            {formatEstimarTintasWeightG(weightG)}
          </span>
        </div>
      </div>
    </article>
  )
}

const resolvePantoneBadge = (color: EstimarTintasDetectedColor): string => {
  if (color.category === 'pantone') return 'P'
  return color.name.trim().charAt(0).toUpperCase() || '?'
}

const resolvePantoneSwatch = (color: EstimarTintasDetectedColor): string =>
  resolveEstimarTintasPantoneDisplaySwatch(color)

interface EstimarTintasConsumoPaletteProps {
  result: EstimarTintasResult
}

const EstimarTintasConsumoPalette: React.FC<EstimarTintasConsumoPaletteProps> = ({ result }) => {
  const spotColors = sortPantoneDetectedColorsForDisplay(result.detectedColors ?? [])

  return (
    <div className="production-impresion-estimar-tintas-hud__palette">
      <section className="production-impresion-estimar-tintas-hud__palette-section" aria-label={estimarCopy.results.processColorsTitle}>
        <h4 className="production-impresion-estimar-tintas-hud__palette-heading">
          {estimarCopy.results.processColorsTitle}
        </h4>
        <p className="production-impresion-estimar-tintas-hud__palette-hint">
          {estimarCopy.results.processColorsHint}
        </p>
        <div className="production-impresion-estimar-tintas-hud__ink-grid" role="list">
          {CMYK_CHANNELS.map(channel => (
            <EstimarTintasInkTile
              key={channel}
              name={estimarCopy.channelNames[channel]}
              badge={channel.toUpperCase()}
              swatch={resolveProcessCmykDisplaySwatch(channel)}
              coverage={result.coverage[channel]}
              weightG={result.inkG[channel]}
              variant="process"
            />
          ))}
        </div>
      </section>

      {spotColors.length > 0 ? (
        <section
          className="production-impresion-estimar-tintas-hud__palette-section"
          aria-label={estimarCopy.results.detectedColorsTitle}
        >
          <h4 className="production-impresion-estimar-tintas-hud__palette-heading">
            {estimarCopy.results.detectedColorsTitle}
          </h4>
          <div className="production-impresion-estimar-tintas-hud__ink-grid" role="list">
            {spotColors.map(color => (
              <EstimarTintasInkTile
                key={`${color.index}-${color.representativeSwatch ?? color.name}`}
                name={color.name}
                badge={resolvePantoneBadge(color)}
                swatch={resolvePantoneSwatch(color)}
                coverage={color.coverage}
                weightG={color.inkG}
                variant="pantone"
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}

export default EstimarTintasConsumoPalette
