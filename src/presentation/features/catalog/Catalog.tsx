import React from 'react'
import { Link } from 'react-router-dom'
import { APP_ROUTES } from '../../../config/appRoutes'
import './Catalog.css'

interface CatalogLink {
  to: string
  title: string
  description: string
}

const CATALOG_LINKS: CatalogLink[] = [
  {
    to: APP_ROUTES.catalogTerminados,
    title: 'Terminados',
    description: 'Barniz, laminado, troquelado, plegado y acabados',
  },
  {
    to: APP_ROUTES.catalogOperaciones,
    title: 'Operaciones',
    description: 'Impresión, montaje, corte, revisión y empaque',
  },
  {
    to: APP_ROUTES.catalogTipoPapel,
    title: 'Tipo de papel',
    description: 'Tipos y gramajes de papel',
  },
  {
    to: APP_ROUTES.catalogDespiece,
    title: 'Despiece pliego',
    description: 'Configuración de despiece por pliego',
  },
  {
    to: APP_ROUTES.catalogCorte,
    title: 'Corte de papel',
    description: 'Operaciones y costos de corte',
  },
  {
    to: APP_ROUTES.catalogTamanoPlancha,
    title: 'Tamaño plancha',
    description: 'Dimensiones estándar de plancha offset',
  },
]

const Catalog: React.FC = () => (
  <div className="catalog-page">
    <header className="catalog-page-header">
      <h1>Catálogos</h1>
      <p>Parámetros maestros de producción, materiales y costos</p>
    </header>
    <div className="catalog-hub-grid">
      {CATALOG_LINKS.map((item) => (
        <Link key={item.to} to={item.to} className="catalog-hub-card">
          <h3>{item.title}</h3>
          <p>{item.description}</p>
        </Link>
      ))}
    </div>
  </div>
)

export default Catalog
