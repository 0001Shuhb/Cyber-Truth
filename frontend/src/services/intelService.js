// src/services/intelService.js
import api from './api'

/**
 * Fetch threat intelligence news articles from the backend.
 * The backend aggregates 12+ RSS/API sources and caches them for 12 minutes.
 *
 * @param {Object} opts
 * @param {boolean} opts.forceRefresh  - Bypass backend cache
 * @returns {Promise<Array>} Array of enriched article objects
 */
export const getNews = async ({ forceRefresh = false, limit } = {}) => {
  const queryParams = new URLSearchParams()
  if (forceRefresh) queryParams.append('force_refresh', 'true')
  if (limit) queryParams.append('limit', limit.toString())
  
  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : ''
  const response = await api.get(`/api/intel/news${queryString}`)
  const data = response.data?.data

  if (!data || !Array.isArray(data.articles)) {
    throw new Error('Invalid threat intelligence response structure.')
  }

  return data.articles
}

/**
 * Force server-side cache invalidation and re-fetch of all threat sources.
 * @returns {Promise<{total: number, refreshed_at: string}>}
 */
export const refreshNews = async () => {
  const response = await api.post('/api/intel/news/refresh')
  return response.data?.data
}

/**
 * Fetch Operations Matrix telemetry data (trends, heatmap, APT, etc.)
 * @returns {Promise<Object>} Telemetry data object
 */
export const getDashboardTelemetry = async () => {
  const response = await api.get('/api/intel/dashboard')
  const data = response.data?.data
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid dashboard telemetry response.')
  }
  return data
}
