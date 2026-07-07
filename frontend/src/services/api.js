// src/services/api.js
import axios from 'axios'

/*
  This module creates a SINGLETON Axios instance.
  A singleton means there's only one instance of this object
  across your entire application — all components import the same 
  'api' object and share the same interceptors and configuration.
  
  This is the correct pattern for auth headers because we need one
  central place to attach JWT tokens and handle 401 responses.
*/

// In-memory token storage (not localStorage — see security note in AuthContext)
let accessToken = null

// Create the Axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  timeout: 30000,  // 30 second timeout for website scanning (it can be slow)
  withCredentials: true,  // Send httpOnly cookies (for refresh token)
  headers: {
    'Content-Type': 'application/json',
  },
})

/*
  REQUEST INTERCEPTOR
  Runs before every request is sent.
  We use it to attach the JWT access token to the Authorization header.
  
  The access token is stored in memory (the 'accessToken' variable above).
  This means if the page refreshes, the token is gone — but the refresh 
  token in the httpOnly cookie will get a new one via /api/auth/refresh.
*/
api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

/*
  RESPONSE INTERCEPTOR  
  Runs after every response is received.
  
  We use it to handle 401 (Unauthorized) responses automatically.
  
  Flow:
  1. A request fails with 401 (access token expired)
  2. We send a refresh request to /api/auth/refresh
  3. The server validates the refresh token from the httpOnly cookie
  4. We receive a new access token
  5. We retry the original failed request with the new token
  
  This is called "silent refresh" — the user never sees the expiry.
  The _retry flag prevents infinite loops if the refresh also fails.
*/
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    
    // If 401 and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      try {
        // Attempt to get a new access token using the refresh cookie
        // We use raw axios here to avoid triggering this same interceptor again on a 401
        const response = await axios.post(`${api.defaults.baseURL}/api/auth/refresh`, {}, {
          withCredentials: true
        })
        const newAccessToken = response.data.data.access_token
        
        // Store the new token and update headers
        setAccessToken(newAccessToken)
        
        // Update the failed request's header and retry it
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        return api(originalRequest)
      } catch (refreshError) {
        // Refresh failed — user must log in again
        // Dispatch a custom event so AuthContext can clear the user state
        window.dispatchEvent(new Event('auth:logout'))
        return Promise.reject(refreshError)
      }
    }
    
    return Promise.reject(error)
  }
)

// Allow AuthContext to set/clear the token
export const setAccessToken = (token) => {
  accessToken = token
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
  } else {
    delete api.defaults.headers.common['Authorization']
  }
}

export default api