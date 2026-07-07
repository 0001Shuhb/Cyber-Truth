// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authService } from '../services/authService'

// Create the context object
// This is what components subscribe to with useContext(AuthContext)
const AuthContext = createContext(null)

export { AuthContext }

export function AuthProvider({ children }) {
  const [user, setUser]         = useState(null)
  const [loading, setLoading]   = useState(true)  // true during initial auth check
  const [error, setError]       = useState(null)

  /*
    On mount, check if there's a stored JWT and validate it.
    This handles the case where a user refreshes the page —
    we don't want them to be logged out just because React remounted.
    
    Security note: We store the JWT in httpOnly cookies when possible.
    For this project (React SPA + Flask), we'll store it in memory
    and use a refresh token in an httpOnly cookie.
    
    NEVER store JWTs in localStorage — it's vulnerable to XSS attacks.
    If any script on your page is compromised, it can read localStorage.
    Memory storage means an XSS attack only gets the current session,
    and cookies with httpOnly + SameSite=Strict prevent CSRF.
  */
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Attempt to refresh the session using the refresh token cookie
        const userData = await authService.refreshSession()
        setUser(userData)
      } catch (err) {
        // No valid session — user needs to log in
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    initAuth()
  }, [])

  const login = useCallback(async (email, password) => {
    setError(null)
    try {
      const { user: userData, access_token: accessToken } = await authService.login(email, password)
      // Store access token in memory (closure variable in the axios instance)
      authService.setAccessToken(accessToken)
      setUser(userData)
      return userData
    } catch (err) {
      const message = err.response?.data?.error?.message || 'Login failed'
      setError(message)
      throw err
    }
  }, [])

  const register = useCallback(async (email, username, password) => {
    setError(null)
    try {
      const { user: userData, access_token: accessToken } = await authService.register(email, username, password)
      authService.setAccessToken(accessToken)
      setUser(userData)
      return userData
    } catch (err) {
      const message = err.response?.data?.error?.message || 'Registration failed'
      setError(message)
      throw err
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await authService.logout()
    } finally {
      // Clear everything regardless of API response
      authService.setAccessToken(null)
      setUser(null)
    }
  }, [])

  // The value object is what all consuming components receive
  // Keep it stable to prevent unnecessary re-renders
  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook — components use useAuth() instead of useContext(AuthContext)
// This gives a better error message if used outside the provider
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}