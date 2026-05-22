import React from 'react'
import { Link } from 'react-router-dom'
import type { AppRouteDefinition } from '../../../config/appRoutes'
import { ROUTES } from '../../../config/appRoutes'
const ComingSoonPage: React.FC<{ route: AppRouteDefinition }> = ({ route }) => (
  <div className="remissions-container">
    <h1 className="remissions-title">{route.label}</h1>
    <p>{route.purpose}</p>
    <p>Este módulo estará disponible próximamente.</p>
    <Link to={ROUTES.dashboard.path} className="remissions-btn-new">Volver al dashboard</Link>
  </div>
)
export default ComingSoonPage
