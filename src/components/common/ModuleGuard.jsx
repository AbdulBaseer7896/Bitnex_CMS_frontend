import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const TEAL = '#f97316'

/**
 * Route guard that gates a child element on one or more module slugs.
 *
 *   <ModuleGuard module="leaves_manage">  ...  </ModuleGuard>
 *   <ModuleGuard anyOf={['leaves_manage','leaves_own']}>  ...  </ModuleGuard>
 *
 * If the user is not logged in   → /login
 * If they lack the module        → /dashboard
 * Admin always passes (handled inside hasModule).
 */
export default function ModuleGuard({ module, anyOf, children }) {
  const { user, loading, hasModule } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen hero-bg flex items-center justify-center">
        <div className="w-10 h-10 border-2 rounded-full animate-spin"
             style={{ borderColor: 'rgba(75,191,191,0.2)', borderTopColor: TEAL }}/>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  const ok = anyOf
    ? anyOf.some(slug => hasModule(slug))
    : hasModule(module)

  if (!ok) return <Navigate to="/dashboard" replace />

  return children
}
