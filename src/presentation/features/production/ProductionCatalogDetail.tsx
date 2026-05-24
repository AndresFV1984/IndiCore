import React from 'react'
import type { DespieceAsociado } from '../../../core/domain/entities/CortePapel'
import type { ProductionWorkspaceTone } from './constants/productionWorkspaceColors'
import { formatPiezasPorPliegoDisplay } from './utils/cortePapelDisplay'

export const CatalogReadonlyField: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => (
  <div className="production-catalog-field">
    <span className="production-catalog-field__label">{label}</span>
    <div className="production-catalog-field__value" aria-readonly="true">
      {value || '—'}
    </div>
  </div>
)

interface ProductionCatalogDetailProps {
  title: string
  children: React.ReactNode
  className?: string
  /** Mismo sistema de tonos que las secciones del workspace (0 / 1 / 2). */
  tone?: ProductionWorkspaceTone
}

export const ProductionCatalogDetail: React.FC<ProductionCatalogDetailProps> = ({
  title,
  children,
  className,
  tone = 0,
}) => (
  <div
    className={[
      'production-catalog-detail',
      `production-catalog-detail--tone-${tone}`,
      className,
    ]
      .filter(Boolean)
      .join(' ')}
    aria-live="polite"
  >
    <p className="production-catalog-detail__heading">{title}</p>
    {children}
  </div>
)

export const ProductionCatalogDetailGrid: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <div className="production-catalog-detail__grid">{children}</div>

interface DespiecePliegoReadonlySectionProps {
  despiece: Pick<DespieceAsociado, 'ancho' | 'alto' | 'unidadMedida' | 'piezasPorPliego'>
}

/** Medida de un despiece en campos separados (ancho, alto, unidad). */
export const DespiecePliegoReadonlySection: React.FC<DespiecePliegoReadonlySectionProps> = ({
  despiece,
}) => (
  <>
    <p className="production-catalog-detail__subheading">Despiece por pliego asociado</p>
    <ProductionCatalogDetailGrid>
      <CatalogReadonlyField label="Ancho" value={despiece.ancho} />
      <CatalogReadonlyField label="Alto" value={despiece.alto} />
      <CatalogReadonlyField label="Unidad de medida" value={despiece.unidadMedida} />
      <CatalogReadonlyField
        label="Piezas por pliego"
        value={formatPiezasPorPliegoDisplay(despiece.piezasPorPliego)}
      />
    </ProductionCatalogDetailGrid>
  </>
)

/** Lista de despieces con medida en campos separados. */
export const DespiecesPliegoReadonlyList: React.FC<{
  despieces: Pick<DespieceAsociado, 'ancho' | 'alto' | 'unidadMedida' | 'piezasPorPliego' | 'despieceId'>[]
}> = ({ despieces }) => (
  <>
    <p className="production-catalog-detail__subheading">Despieces por pliego asociados</p>
    {despieces.map(despiece => (
      <div key={despiece.despieceId} className="production-catalog-detail__despiece-block">
        <ProductionCatalogDetailGrid>
          <CatalogReadonlyField label="Ancho" value={despiece.ancho} />
          <CatalogReadonlyField label="Alto" value={despiece.alto} />
          <CatalogReadonlyField label="Unidad de medida" value={despiece.unidadMedida} />
          <CatalogReadonlyField
            label="Piezas por pliego"
            value={formatPiezasPorPliegoDisplay(despiece.piezasPorPliego)}
          />
        </ProductionCatalogDetailGrid>
      </div>
    ))}
  </>
)
