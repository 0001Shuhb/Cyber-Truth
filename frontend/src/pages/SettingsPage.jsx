// src/pages/SettingsPage.jsx
import React from 'react'
import { useAuth } from '../context/AuthContext'

export default function SettingsPage() {
  const { user } = useAuth()

  return (
    <div className="space-y-8 animate-fade-in-up max-w-3xl">
      {/* Title */}
      <div>
        <h1 className="font-display font-black text-3xl uppercase tracking-wider text-white">System Settings</h1>
        <p className="font-mono text-xs text-gray-500 uppercase tracking-widest mt-1">Analyst Profile & Security Preferences</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Profile Card */}
        <div className="card p-6">
          <h3 className="font-display font-bold text-lg uppercase tracking-wider text-white mb-4">Analyst Profile</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-cyber-darker border border-cyber-border rounded-lg">
                <span className="font-mono text-[9px] text-gray-500 uppercase tracking-wider block">Username Identifier</span>
                <span className="font-mono text-sm text-gray-200 block mt-1">{user?.username}</span>
              </div>
              <div className="p-3 bg-cyber-darker border border-cyber-border rounded-lg">
                <span className="font-mono text-[9px] text-gray-500 uppercase tracking-wider block">Email Node</span>
                <span className="font-mono text-sm text-gray-200 block mt-1">{user?.email || 'analyst@cybertruth.internal'}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-cyber-darker border border-cyber-border rounded-lg">
                <span className="font-mono text-[9px] text-gray-500 uppercase tracking-wider block">Security Clearance Role</span>
                <span className="font-mono text-sm text-cyber-glow font-bold uppercase block mt-1">{user?.role}</span>
              </div>
              <div className="p-3 bg-cyber-darker border border-cyber-border rounded-lg">
                <span className="font-mono text-[9px] text-gray-500 uppercase tracking-wider block">Account Created</span>
                <span className="font-mono text-xs text-gray-300 block mt-1">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Security Parameters (Mock Settings) */}
        <div className="card p-6">
          <h3 className="font-display font-bold text-lg uppercase tracking-wider text-white mb-4">Security Parameters</h3>
          <div className="space-y-4">
            {/* MFA toggle */}
            <div className="flex items-center justify-between p-4 bg-cyber-darker border border-cyber-border rounded-lg">
              <div>
                <span className="font-display font-semibold text-sm text-white block">Multi-Factor Authentication (MFA)</span>
                <span className="font-mono text-[10px] text-gray-500 block mt-0.5">Enforce hardware-based authentication tokens.</span>
              </div>
              <div className="w-10 h-6 bg-cyber-border rounded-full p-1 cursor-pointer flex items-center transition-all duration-200">
                <div className="w-4 h-4 bg-cyber-glow/50 border border-cyber-glow rounded-full shadow-glow-cyan"></div>
              </div>
            </div>

            {/* Session Expiry */}
            <div className="flex items-center justify-between p-4 bg-cyber-darker border border-cyber-border rounded-lg">
              <div>
                <span className="font-display font-semibold text-sm text-white block">Automatic Session Termination</span>
                <span className="font-mono text-[10px] text-gray-500 block mt-0.5">Revoke access tokens after 15 minutes of idle state.</span>
              </div>
              <div className="w-10 h-6 bg-cyber-glow rounded-full p-1 cursor-pointer flex items-center justify-end transition-all duration-200">
                <div className="w-4 h-4 bg-cyber-dark rounded-full"></div>
              </div>
            </div>

            {/* Diagnostic Mode */}
            <div className="flex items-center justify-between p-4 bg-cyber-darker border border-cyber-border rounded-lg">
              <div>
                <span className="font-display font-semibold text-sm text-white block">Diagnostic Log Output</span>
                <span className="font-mono text-[10px] text-gray-500 block mt-0.5">Include millisecond timing details inside API scan responses.</span>
              </div>
              <div className="w-10 h-6 bg-cyber-glow rounded-full p-1 cursor-pointer flex items-center justify-end transition-all duration-200">
                <div className="w-4 h-4 bg-cyber-dark rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
