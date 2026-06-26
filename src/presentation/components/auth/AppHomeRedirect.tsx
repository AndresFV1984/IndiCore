import { Navigate, useLocation } from 'react-router-dom'
import { ROUTES } from '../../../config/appRoutes'
import { shouldRedirectOperatorHome } from '../../../core/domain/auth/authRouting'
import { useAuth } from '../../hooks/useAuth'

const AppHomeRedirect: React.FC = () => {
  const { session } = useAuth()
  const location = useLocation()

  if (!session) return null
  if (!shouldRedirectOperatorHome(session, location.pathname)) return null

  return <Navigate to={ROUTES.operatorWork.path} replace />
}

export default AppHomeRedirect
