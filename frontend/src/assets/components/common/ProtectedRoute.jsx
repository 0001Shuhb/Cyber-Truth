// src/components/common/ProtectedRoute.jsx
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

/*
  ProtectedRoute wraps authenticated pages.
  It uses React Router's <Outlet /> pattern — when used as 
  <Route element={<ProtectedRoute />}>, it renders child routes
  via Outlet if the user is authenticated, or redirects to /login.
  
  The 'state' on Navigate preserves where the user tried to go,
  so after login we can redirect them back to their original destination.
  
  Example: User tries to visit /history without being logged in.
  They get redirected to /login?redirect=/history.
  After login, they're sent to /history instead of /dashboard.
  This is called "redirect-after-login" UX pattern.
*/
export default function ProtectedRoute({ requiredRole = null }) {
  const { isAuthenticated, isAdmin, loading, user } = useAuth()
  const location = useLocation()

  // While checking auth state (page refresh), show nothing
  // This prevents a flash of the login page for authenticated users
  if (loading) {
    return (
      <div className="min-h-screen bg-cyber-dark flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          {/* Pulsing shield icon as loader */}
          <div className="w-16 h-16 border-2 border-cyber-glow rounded-full 
                          animate-spin-slow flex items-center justify-center">
            <div className="w-8 h-8 bg-cyber-glow/20 rounded-full animate-pulse" />
          </div>
          <p className="text-gray-400 font-mono text-sm tracking-widest">
            AUTHENTICATING...
          </p>
        </div>
      </div>
    )
  }

  // Not logged in → redirect to login, preserving intended destination
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Role-based access control: admin routes require admin role
  if (requiredRole === 'admin' && !isAdmin) {
    // Redirect to dashboard with an error state
    return <Navigate to="/dashboard" state={{ error: 'ACCESS_DENIED' }} replace />
  }

  // All checks pass — render the protected content
  return <Outlet />
}