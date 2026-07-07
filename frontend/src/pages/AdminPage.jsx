// src/pages/AdminPage.jsx
import React, { useState, useEffect } from 'react'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function AdminPage() {
  const { user: currentUser } = useAuth()
  const [stats, setStats] = useState({
    users: { total: 0, active: 0 },
    scans: { total: 0, by_label: {}, by_type: {} }
  })
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchAdminData = async () => {
    try {
      const statsResponse = await api.get('/api/admin/stats')
      setStats(statsResponse.data.data)

      const usersResponse = await api.get('/api/admin/users')
      setUsers(usersResponse.data.data.users || [])
    } catch (err) {
      toast.error('Failed to load administrative telemetry.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAdminData()
  }, [])

  const handleUpdateUser = async (targetUserId, updates) => {
    if (targetUserId === currentUser?.id) {
      toast.error('Self-modification forbidden in admin panel.')
      return
    }

    try {
      await api.put(`/api/admin/users/${targetUserId}`, updates)
      toast.success('Analyst profile updated successfully.')
      fetchAdminData()
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to modify profile.')
    }
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Title */}
      <div>
        <h1 className="font-display font-black text-3xl uppercase tracking-wider text-white">Platform Administration</h1>
        <p className="font-mono text-xs text-gray-500 uppercase tracking-widest mt-1">Superuser Security & User Management</p>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <svg className="animate-spin h-8 w-8 text-neon-purple" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="font-mono text-xs text-gray-400 uppercase tracking-widest">Querying Platform Telemetry...</span>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="card p-6 bg-gradient-to-br from-cyber-surface to-cyber-darker">
              <span className="font-mono text-[9px] text-gray-500 uppercase tracking-wider block">Total Registered Users</span>
              <span className="font-display font-bold text-3xl text-neon-purple block mt-1">{stats.users.total}</span>
            </div>

            <div className="card p-6 bg-gradient-to-br from-cyber-surface to-cyber-darker">
              <span className="font-mono text-[9px] text-gray-500 uppercase tracking-wider block">Active Analysts</span>
              <span className="font-display font-bold text-3xl text-threat-safe block mt-1">{stats.users.active}</span>
            </div>

            <div className="card p-6 bg-gradient-to-br from-cyber-surface to-cyber-darker">
              <span className="font-mono text-[9px] text-gray-500 uppercase tracking-wider block">Global Scans Executed</span>
              <span className="font-display font-bold text-3xl text-cyber-glow block mt-1">{stats.scans.total}</span>
            </div>

            <div className="card p-6 bg-gradient-to-br from-cyber-surface to-cyber-darker">
              <span className="font-mono text-[9px] text-gray-500 uppercase tracking-wider block">Phishing Detections</span>
              <span className="font-display font-bold text-3xl text-threat-phishing block mt-1">
                {stats.scans.by_label?.phishing || 0}
              </span>
            </div>
          </div>

          {/* User Management Panel */}
          <div className="card p-6">
            <h3 className="font-display font-bold text-lg uppercase tracking-wider text-white mb-4">Analyst Directory</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-cyber-border/60 text-gray-400 font-mono text-[10px] uppercase tracking-wider">
                    <th className="py-3 px-4">User ID</th>
                    <th className="py-3 px-4">Username</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Active Status</th>
                    <th className="py-3 px-4">Clearance Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyber-border/30 font-mono text-xs text-gray-300">
                  {users.map((u) => {
                    const isSelf = u.id === currentUser?.id
                    return (
                      <tr key={u.id} className={`hover:bg-cyber-darker/40 transition-all ${isSelf ? 'bg-cyber-glow/5' : ''}`}>
                        <td className="py-3.5 px-4 text-gray-500">{u.id.substring(0, 8)}...</td>
                        <td className="py-3.5 px-4 font-semibold text-white">
                          {u.username} {isSelf && <span className="text-cyber-glow text-[10px] uppercase ml-1">// SELF</span>}
                        </td>
                        <td className="py-3.5 px-4 text-gray-400">{u.email}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded font-semibold text-[10px] uppercase border ${
                            u.role === 'admin'
                              ? 'bg-neon-purple/10 border-neon-purple/20 text-neon-purple'
                              : 'bg-cyber-border/30 border-cyber-border text-gray-400'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={u.is_active ? 'text-threat-safe' : 'text-threat-phishing'}>
                            {u.is_active ? 'ACTIVE' : 'SUSPENDED'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-gray-500 text-[10px]">
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-2">
                          <button
                            onClick={() => handleUpdateUser(u.id, { role: u.role === 'admin' ? 'user' : 'admin' })}
                            className="text-cyber-glow hover:underline text-[10px] uppercase tracking-wider disabled:opacity-35"
                            disabled={isSelf}
                          >
                            [Toggle Role]
                          </button>
                          <button
                            onClick={() => handleUpdateUser(u.id, { is_active: !u.is_active })}
                            className="text-threat-suspicious hover:underline text-[10px] uppercase tracking-wider disabled:opacity-35"
                            disabled={isSelf}
                          >
                            [{u.is_active ? 'Suspend' : 'Reinstate'}]
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
