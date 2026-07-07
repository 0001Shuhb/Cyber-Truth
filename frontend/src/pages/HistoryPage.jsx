// src/pages/HistoryPage.jsx
import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import toast from 'react-hot-toast'

export default function HistoryPage() {
  const [scans, setScans] = useState([])
  const [pagination, setPagination] = useState({
    page: 1,
    per_page: 10,
    total: 0,
    pages: 1,
    has_next: false,
    has_prev: false
  })
  const [filters, setFilters] = useState({
    scan_type: '',
    risk_label: '',
    sort: 'desc',
    page: 1
  })
  const [loading, setLoading] = useState(true)

  const fetchHistory = async () => {
    setLoading(true)
    try {
      const { scan_type, risk_label, sort, page } = filters
      let query = `/api/scan/history?page=${page}&per_page=10&sort=${sort}`
      if (scan_type) query += `&scan_type=${scan_type}`
      if (risk_label) query += `&risk_label=${risk_label}`

      const response = await api.get(query)
      const data = response.data.data
      setScans(data.scans || [])
      if (data.pagination) {
        setPagination(data.pagination)
      }
    } catch (err) {
      toast.error('Failed to load incident history ledger.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [filters])

  const handleFilterChange = (key, val) => {
    setFilters((prev) => ({
      ...prev,
      [key]: val,
      page: key === 'page' ? val : 1 // Reset page if other filter changes
    }))
  }

  const handleDelete = async (scanId) => {
    if (!window.confirm('Confirm deletion of this scan signature from records?')) return
    try {
      await api.delete(`/api/scan/${scanId}`)
      toast.success('Scan record purged from ledger.')
      fetchHistory()
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Purge request failed.')
    }
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Title */}
      <div>
        <h1 className="font-display font-black text-3xl uppercase tracking-wider text-white">Incident Logs</h1>
        <p className="font-mono text-xs text-gray-500 uppercase tracking-widest mt-1">Audit Trail & Threat Archive</p>
      </div>

      {/* Filter panel */}
      <div className="card p-6 bg-cyber-surface/60 backdrop-blur-sm border border-cyber-border/80 flex flex-wrap gap-6 items-center">
        {/* Type Filter */}
        <div className="flex flex-col gap-1.5 font-mono text-xs">
          <label className="text-gray-400 uppercase tracking-wider">Session Type</label>
          <select
            value={filters.scan_type}
            onChange={(e) => handleFilterChange('scan_type', e.target.value)}
            className="bg-cyber-darker border border-cyber-border rounded px-3 py-2 text-gray-200 outline-none focus:border-cyber-glow"
          >
            <option value="">All Types</option>
            <option value="url">URL</option>
            <option value="email">Email</option>
            <option value="website">Website</option>
          </select>
        </div>

        {/* Verdict Filter */}
        <div className="flex flex-col gap-1.5 font-mono text-xs">
          <label className="text-gray-400 uppercase tracking-wider">Verdict</label>
          <select
            value={filters.risk_label}
            onChange={(e) => handleFilterChange('risk_label', e.target.value)}
            className="bg-cyber-darker border border-cyber-border rounded px-3 py-2 text-gray-200 outline-none focus:border-cyber-glow"
          >
            <option value="">All Verdicts</option>
            <option value="safe">Safe</option>
            <option value="suspicious">Suspicious</option>
            <option value="phishing">Phishing</option>
          </select>
        </div>

        {/* Sort Filter */}
        <div className="flex flex-col gap-1.5 font-mono text-xs">
          <label className="text-gray-400 uppercase tracking-wider">Order</label>
          <select
            value={filters.sort}
            onChange={(e) => handleFilterChange('sort', e.target.value)}
            className="bg-cyber-darker border border-cyber-border rounded px-3 py-2 text-gray-200 outline-none focus:border-cyber-glow"
          >
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Main logs list */}
      <div className="card p-6 min-h-[400px] flex flex-col justify-between">
        {loading ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <svg className="animate-spin h-8 w-8 text-cyber-glow" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="font-mono text-xs text-gray-400 uppercase tracking-widest">Querying Records...</span>
            </div>
          </div>
        ) : scans.length === 0 ? (
          <div className="flex-1 flex items-center justify-center py-20 font-mono text-sm text-gray-500">
            No incident logs match query parameters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-cyber-border/60 text-gray-400 font-mono text-[10px] uppercase tracking-wider">
                  <th className="py-3 px-4">Scan ID</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Payload Summary</th>
                  <th className="py-3 px-4">Risk Index</th>
                  <th className="py-3 px-4">Verdict</th>
                  <th className="py-3 px-4">Logged Time</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyber-border/30 font-mono text-xs text-gray-300">
                {scans.map((scan) => (
                  <tr key={scan.id} className="hover:bg-cyber-darker/40 transition-all">
                    <td className="py-3.5 px-4 text-cyber-glow">{scan.id.substring(0, 8)}</td>
                    <td className="py-3.5 px-4 uppercase text-[10px]">{scan.scan_type}</td>
                    <td className="py-3.5 px-4 max-w-sm truncate text-gray-400">{scan.input_data}</td>
                    <td className="py-3.5 px-4 font-semibold">{scan.risk_score}%</td>
                    <td className="py-3.5 px-4">
                      <span className={
                        scan.risk_label === 'safe'
                          ? 'badge-safe'
                          : scan.risk_label === 'suspicious'
                          ? 'badge-suspicious'
                          : 'badge-phishing'
                      }>
                        {scan.risk_label}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-gray-500 text-[10px]">
                      {new Date(scan.created_at).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-3">
                      <Link
                        to={`/report/${scan.id}`}
                        className="text-cyber-glow hover:underline hover:text-glow-cyan text-[11px] uppercase tracking-wider"
                      >
                        [Report]
                      </Link>
                      <button
                        onClick={() => handleDelete(scan.id)}
                        className="text-threat-phishing hover:underline text-[11px] uppercase tracking-wider"
                      >
                        [Purge]
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {pagination.pages > 1 && (
          <div className="flex justify-between items-center pt-6 mt-6 border-t border-cyber-border/40 font-mono text-xs text-gray-400">
            <span>
              Page {pagination.page} of {pagination.pages} (Total: {pagination.total})
            </span>
            <div className="flex gap-3">
              <button
                onClick={() => handleFilterChange('page', pagination.page - 1)}
                disabled={!pagination.has_prev || loading}
                className="btn-secondary py-1.5 px-4 text-xs disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => handleFilterChange('page', pagination.page + 1)}
                disabled={!pagination.has_next || loading}
                className="btn-secondary py-1.5 px-4 text-xs disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
