// src/components/common/DashboardLayout.jsx
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../context/AuthContext'
import {
  Shield, Globe, Mail, BarChart2, Clock, Settings,
  Users, ChevronLeft, ChevronRight, LogOut, Bell,
  Zap, Search, Menu, X
} from 'lucide-react'

const navItems = [
  { icon: BarChart2, label: 'Dashboard',      path: '/dashboard',       color: 'text-cyber-glow' },
  { icon: Globe,     label: 'URL Scanner',    path: '/scan/url',        color: 'text-neon-blue' },
  { icon: Mail,      label: 'Email Scanner',  path: '/scan/email',      color: 'text-neon-purple' },
  { icon: Search,    label: 'Web Scanner',    path: '/scan/website',    color: 'text-neon-green' },
  { icon: Clock,     label: 'History',        path: '/history',         color: 'text-neon-amber' },
  { icon: Settings,  label: 'Settings',       path: '/settings',        color: 'text-gray-400' },
]

const adminItems = [
  { icon: Users, label: 'Admin Panel', path: '/admin', color: 'text-threat-phishing' },
]

export default function DashboardLayout({ children }) {
  const [collapsed, setCollapsed]       = useState(false)
  const [mobileOpen, setMobileOpen]     = useState(false)
  const { user, logout, isAdmin }       = useAuth()
  const location  = useLocation()
  const navigate  = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const isActive = (path) => location.pathname === path

  return (
    <div className="min-h-screen bg-cyber-dark bg-grid-overlay flex">
      
      {/* =====================
          SIDEBAR — Desktop
          ===================== */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="hidden lg:flex flex-col bg-cyber-darker border-r border-cyber-border 
                   relative z-20 flex-shrink-0"
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-cyber-border flex-shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="flex-shrink-0 w-8 h-8 bg-cyber-glow/10 border border-cyber-glow/30 
                            rounded-lg flex items-center justify-center">
              <Shield className="w-4 h-4 text-cyber-glow" />
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="font-display font-bold text-lg text-white tracking-wider">
                    PHISH<span className="text-cyber-glow">GUARD</span>
                  </div>
                  <div className="text-[10px] text-gray-500 font-mono tracking-widest -mt-0.5">
                    THREAT INTELLIGENCE
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
          {navItems.map((item) => (
            <NavItem
              key={item.path}
              item={item}
              collapsed={collapsed}
              active={isActive(item.path)}
            />
          ))}

          {/* Admin section */}
          {isAdmin && (
            <>
              <div className="my-3 border-t border-cyber-border" />
              {adminItems.map((item) => (
                <NavItem
                  key={item.path}
                  item={item}
                  collapsed={collapsed}
                  active={isActive(item.path)}
                />
              ))}
            </>
          )}
        </nav>

        {/* User profile + logout */}
        <div className="p-3 border-t border-cyber-border flex-shrink-0">
          {!collapsed && (
            <div className="flex items-center gap-3 p-2 rounded-lg mb-2">
              <div className="w-8 h-8 rounded-full bg-cyber-glow/20 border border-cyber-glow/30
                              flex items-center justify-center flex-shrink-0">
                <span className="text-cyber-glow font-mono font-bold text-sm">
                  {user?.username?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold text-white truncate">
                  {user?.username}
                </p>
                <p className="text-[11px] text-gray-500 font-mono truncate">
                  {user?.role?.toUpperCase()}
                </p>
              </div>
            </div>
          )}
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg
                       text-gray-400 hover:text-threat-phishing hover:bg-threat-phishing/5
                       transition-colors duration-200 font-mono text-sm"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>

        {/* Collapse toggle button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-cyber-darker border border-cyber-border
                     rounded-full flex items-center justify-center text-gray-400
                     hover:text-cyber-glow hover:border-cyber-glow transition-colors z-30"
        >
          {collapsed 
            ? <ChevronRight className="w-3 h-3" /> 
            : <ChevronLeft  className="w-3 h-3" />
          }
        </button>
      </motion.aside>

      {/* =====================
          MAIN CONTENT AREA
          ===================== */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Navigation Bar */}
        <header className="h-16 bg-cyber-darker border-b border-cyber-border 
                           flex items-center justify-between px-4 lg:px-6 flex-shrink-0 z-10">
          
          {/* Mobile menu button */}
          <button
            className="lg:hidden text-gray-400 hover:text-white"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Page title — derived from current route */}
          <div className="hidden lg:flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyber-glow" />
            <span className="font-mono text-sm text-gray-400 tracking-widest">
              {getPageTitle(location.pathname)}
            </span>
          </div>

          {/* Right side: notifications + user */}
          <div className="flex items-center gap-3">
            <button className="relative w-9 h-9 rounded-lg border border-cyber-border
                               flex items-center justify-center text-gray-400
                               hover:text-cyber-glow hover:border-cyber-glow/50
                               transition-colors">
              <Bell className="w-4 h-4" />
              {/* Notification dot */}
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-threat-phishing 
                               rounded-full animate-pulse" />
            </button>
            
            <div className="w-9 h-9 rounded-lg bg-cyber-glow/10 border border-cyber-glow/30
                            flex items-center justify-center">
              <span className="text-cyber-glow font-mono font-bold text-sm">
                {user?.username?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-30 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-64 bg-cyber-darker 
                         border-r border-cyber-border z-40 lg:hidden flex flex-col"
            >
              {/* Mobile sidebar content — same as desktop */}
              <div className="h-16 flex items-center justify-between px-4 
                              border-b border-cyber-border">
                <div className="font-display font-bold text-lg text-white tracking-wider">
                  PHISH<span className="text-cyber-glow">GUARD</span>
                </div>
                <button onClick={() => setMobileOpen(false)} className="text-gray-400">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 py-4 space-y-1 px-2">
                {navItems.map((item) => (
                  <NavItem
                    key={item.path}
                    item={item}
                    collapsed={false}
                    active={isActive(item.path)}
                    onClick={() => setMobileOpen(false)}
                  />
                ))}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// Individual navigation item component
function NavItem({ item, collapsed, active, onClick }) {
  const Icon = item.icon
  
  return (
    <Link
      to={item.path}
      onClick={onClick}
      className={`
        flex items-center gap-3 px-3 py-2.5 rounded-lg
        font-mono text-sm transition-all duration-200 group relative
        ${active 
          ? 'bg-cyber-glow/10 text-cyber-glow border border-cyber-glow/20' 
          : 'text-gray-400 hover:text-white hover:bg-cyber-surface'
        }
      `}
    >
      <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-cyber-glow' : item.color}`} />
      
      {!collapsed && (
        <span className="truncate">{item.label}</span>
      )}
      
      {/* Active indicator dot */}
      {active && (
        <motion.div
          layoutId="activeNav"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 
                     bg-cyber-glow rounded-r-full"
        />
      )}
      
      {/* Tooltip when collapsed */}
      {collapsed && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-cyber-surface 
                        border border-cyber-border rounded text-white text-xs
                        opacity-0 group-hover:opacity-100 pointer-events-none
                        whitespace-nowrap transition-opacity z-50">
          {item.label}
        </div>
      )}
    </Link>
  )
}

function getPageTitle(pathname) {
  const titles = {
    '/dashboard':    'OVERVIEW',
    '/scan/url':     'URL SCANNER',
    '/scan/email':   'EMAIL SCANNER',
    '/scan/website': 'WEBSITE SCANNER',
    '/history':      'SCAN HISTORY',
    '/settings':     'SETTINGS',
    '/admin':        'ADMIN PANEL',
  }
  return titles[pathname] || 'PHISHGUARD'
}