import api, { setAccessToken as setApiAccessToken } from './api'

let accessToken = null

export const authService = {
  // Login with email and password
  login: async (email, password) => {
    const response = await api.post('/api/auth/login', { email, password })
    return response.data.data
  },

  // Register a new user
  register: async (email, username, password) => {
    const response = await api.post('/api/auth/register', { email, username, password })
    return response.data.data
  },

  // Refresh the access token using the refresh token cookie, then fetch user profile
  refreshSession: async () => {
    try {
      const response = await api.post('/api/auth/refresh')
      const { access_token } = response.data.data
      authService.setAccessToken(access_token)
      
      const meResponse = await api.get('/api/auth/me')
      return meResponse.data.data.user
    } catch (err) {
      authService.setAccessToken(null)
      return null
    }
  },

  // Logout and clear tokens
  logout: async () => {
    const response = await api.post('/api/auth/logout')
    return response.data
  },

  // Store access token in memory
  setAccessToken: (token) => {
    accessToken = token
    setApiAccessToken(token)
  },

  // Get current access token
  getAccessToken: () => accessToken,
}

