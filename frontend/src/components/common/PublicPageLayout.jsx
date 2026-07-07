// src/components/common/PublicPageLayout.jsx
import React, { useContext } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { Shield, Moon, Sun, ArrowLeft } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { ThemeContext } from '../../context/ThemeContext'
import Footer from './Footer'

export default function PublicPageLayout() {
  const { isAuthenticated } = useAuth()
  const { theme, toggleTheme } = useContext(ThemeContext)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-cyber-dark text-slate-800 dark:text-slate-100 font-body relative overflow-x-hidden flex flex-col justify-between transition-colors duration-300">
      
      {/* Background Grid Overlay */}
      <div className="absolute inset-0 bg-cyber-grid bg-grid opacity-[0.03] dark:opacity-[0.06] pointer-events-none z-0"></div>

      {/* Header */}
      <header className="w-full h-20 border-b border-slate-200 dark:border-slate-900 bg-white/70 dark:bg-slate-950/40 backdrop-blur-md px-6 sm:px-8 flex items-center justify-between z-20 transition-colors relative">
        <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
          <div className="w-8 h-8 rounded bg-blue-500/10 dark:bg-cyber-primary/10 border border-blue-500/30 dark:border-cyber-primary flex items-center justify-center shadow-sm">
            <Shield className="w-4 h-4 text-blue-500 dark:text-cyber-glow" />
          </div>
          <div>
            <span className="font-display font-black tracking-wider text-lg text-slate-800 dark:text-white block">ThreatVaultZ</span>
            <span className="font-mono text-[8px] text-slate-400 dark:text-slate-500 uppercase tracking-widest block">AI Threat Intel</span>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          {/* Light/Dark Toggle */}
          <button 
            onClick={toggleTheme}
            className="p-2 hover:bg-slate-200/60 dark:hover:bg-slate-900/60 rounded-full text-slate-500 dark:text-slate-400 transition-colors"
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>

          {isAuthenticated ? (
            <Link to="/dashboard" className="btn-secondary py-2 text-xs flex items-center gap-1.5">
              Operations Center
            </Link>
          ) : (
            <>
              <Link to="/login" className="px-3 py-2 text-xs font-display tracking-widest uppercase text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-cyber-primary transition-all duration-200">
                Sign In
              </Link>
              <Link to="/register" className="btn-primary py-2 text-xs">
                Establish Session
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow z-10 w-full relative">
        <Outlet />
      </main>

      {/* Reusable Footer */}
      <Footer />
    </div>
  )
}
