import { Navigate, useLocation } from 'react-router-dom'
import { ROUTES } from '../../../config/appRoutes'
import {
  isOperatorAllowedPath,
  isOperatorOnlySession,
} from '../../../core/domain/auth/authRouting'
import { useAuth } from '../../hooks/useAuth'

const OperatorRouteGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session } = useAuth()
  const location = useLocation()

  if (!session || !isOperatorOnlySession(session)) {
    return <>{children}</>
  }

  if (isOperatorAllowedPath(location.pathname)) {
    return <>{children}</>
  }

  return <Navigate to={ROUTES.operatorWork.path} replace />
}

export default OperatorRouteGuard
