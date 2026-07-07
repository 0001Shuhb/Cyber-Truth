import React, { useState, useEffect, useContext } from 'react'
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { ThemeContext } from '../../context/ThemeContext'
import { 
  Shield, 
  LayoutDashboard, 
  Link2, 
  Mail, 
  Globe, 
  AlertTriangle, 
  FileText, 
  History, 
  Settings as SettingsIcon, 
  Sun, 
  Moon, 
  Bell, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  Database,
  Radio
} from 'lucide-react'
import Footer from './Footer'

export default function Layout() {
  const { user, isAdmin, logout } = useAuth()
  const { theme, toggleTheme } = useContext(ThemeContext)
  const location = useLocation()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  
  // Notification popover states
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState([
    { id: 1, text: "APT41 spear-phishing signature intercepted", type: "critical", time: "5m ago", read: false },
    { id: 2, text: "Database vulnerability check completed (CVE-2026-1088)", type: "high", time: "1h ago", read: false },
    { id: 3, text: "Analyst shubh@gmail.com authenticated from IP 192.168.1.4", type: "info", time: "2h ago", read: true }
  ])

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (err) {
      console.error('Logout failed:', err)
    }
  }

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const unreadCount = notifications.filter(n => !n.read).length

  const navItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />
    },
    {
      label: 'URL Scanner',
      path: '/scan/url',
      icon: <Link2 className="w-5 h-5" />
    },
    {
      label: 'Email Scanner',
      path: '/scan/email',
      icon: <Mail className="w-5 h-5" />
    },
    {
      label: 'Website Scanner',
      path: '/scan/website',
      icon: <Globe className="w-5 h-5" />
    },
    {
      label: 'Threat Intel',
      path: '/threat-intel',
      icon: <Radio className="w-5 h-5" />
    },
    {
      label: 'Scan History',
      path: '/history',
      icon: <History className="w-5 h-5" />
    },
    {
      label: 'Settings',
      path: '/settings',
      icon: <SettingsIcon className="w-5 h-5" />
    }
  ]

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-cyber-bg-dark text-slate-900 dark:text-slate-100 font-body overflow-hidden relative transition-colors duration-300">
      {/* Background grid overlay in dark mode */}
      <div className="absolute inset-0 bg-cyber-grid bg-grid opacity-[0.03] dark:opacity-[0.06] pointer-events-none z-0"></div>

      {/* Sidebar Container */}
      <aside 
        className={`border-r border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/65 backdrop-blur-xl flex flex-col justify-between z-20 transition-all duration-300 ease-in-out ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div>
          {/* Logo Header */}
          <div className="h-20 flex items-center justify-between px-5 border-b border-slate-200 dark:border-slate-900 relative overflow-hidden">
            {!collapsed ? (
              <div className="flex items-center gap-2.5 animate-fade-in-up">
                <div className="w-8 h-8 rounded bg-blue-500/10 dark:bg-cyber-primary/10 border border-blue-500/30 dark:border-cyber-primary flex items-center justify-center shadow-md dark:shadow-glow-blue">
                  <Shield className="w-4 h-4 text-cyber-primary" />
                </div>
                <div>
                  <span className="font-display font-black tracking-wider text-lg text-cyber-primary dark:text-glow-blue block">CYBER TRUTH</span>
                  <span className="font-mono text-[8px] text-slate-400 dark:text-slate-500 uppercase tracking-widest block">AI Threat Intel</span>
                </div>
              </div>
            ) : (
              <div className="mx-auto w-8 h-8 rounded bg-blue-500/10 dark:bg-cyber-primary/10 border border-blue-500/30 dark:border-cyber-primary flex items-center justify-center shadow-md">
                <Shield className="w-4 h-4 text-cyber-primary" />
              </div>
            )}
            
            <button 
              onClick={() => setCollapsed(!collapsed)}
              className="text-slate-400 hover:text-cyber-primary transition-colors p-1"
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-3.5 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path)
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  title={collapsed ? item.label : undefined}
                  className={`flex items-center gap-3.5 px-4 py-3 rounded-lg font-display tracking-wider text-sm transition-all duration-200 relative overflow-hidden ${
                    isActive
                      ? 'bg-blue-500/5 dark:bg-cyber-primary/5 border border-blue-500/20 dark:border-cyber-primary/30 text-blue-500 dark:text-cyber-primary font-bold shadow-sm'
                      : 'border border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-900/60'
                  }`}
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-1 bg-blue-500 dark:bg-cyber-primary transition-all duration-300 ${isActive ? 'opacity-100' : 'opacity-0'}`} />
                  <span className={`${isActive ? 'text-blue-500 dark:text-cyber-primary' : 'text-slate-400 dark:text-slate-500'}`}>{item.icon}</span>
                  {!collapsed && <span className="animate-fade-in-up">{item.label}</span>}
                </Link>
              )
            })}

            {/* Admin Control */}
            {isAdmin && (
              <Link
                to="/admin"
                title={collapsed ? "Admin Control" : undefined}
                className={`flex items-center gap-3.5 px-4 py-3 rounded-lg font-display tracking-wider text-sm transition-all duration-200 relative overflow-hidden ${
                  location.pathname.startsWith('/admin')
                    ? 'bg-purple-500/5 border border-purple-500/20 text-purple-500 font-bold'
                    : 'border border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-900/60'
                }`}
              >
                <div className={`absolute left-0 top-0 bottom-0 w-1 bg-purple-500 transition-all duration-300 ${location.pathname.startsWith('/admin') ? 'opacity-100' : 'opacity-0'}`} />
                <span className={`${location.pathname.startsWith('/admin') ? 'text-purple-500' : 'text-slate-500'}`}>
                  <Database className="w-5 h-5" />
                </span>
                {!collapsed && <span className="animate-fade-in-up">Admin Control</span>}
              </Link>
            )}
          </nav>
        </div>

        {/* User Card & Logout */}
        <div className="p-3.5 border-t border-slate-200 dark:border-slate-900 bg-white/40 dark:bg-slate-950/60">
          <div className={`flex items-center gap-3 mb-4 ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-10 h-10 rounded-full border border-slate-300 dark:border-slate-800 bg-slate-200 dark:bg-slate-900 flex items-center justify-center shadow-sm">
              <span className="font-display font-bold uppercase text-sm text-blue-500 dark:text-cyber-primary">
                {user?.username?.substring(0, 2) || 'US'}
              </span>
            </div>
            {!collapsed && (
              <div className="overflow-hidden animate-fade-in-up">
                <span className="font-display font-bold block text-slate-800 dark:text-slate-200 truncate text-sm">{user?.username}</span>
                <span className="font-mono text-[9px] text-slate-400 dark:text-slate-500 block uppercase tracking-wider">{user?.role}</span>
              </div>
            )}
          </div>
          
          <button
            onClick={handleLogout}
            title={collapsed ? "System Terminate" : undefined}
            className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-red-200 dark:border-red-950 hover:border-red-500 text-red-500 hover:bg-red-500/5 rounded-md font-display tracking-wide uppercase text-xs transition-all duration-200 ${
              collapsed ? 'px-0' : ''
            }`}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span>System Terminate</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden z-10 relative">
        {/* Main Content Header */}
        <header className="h-20 border-b border-slate-200 dark:border-slate-900 bg-white/70 dark:bg-slate-950/65 backdrop-blur-xl px-8 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse shadow-md dark:shadow-glow-green"></div>
            <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest hidden sm:inline">
              SYS STATUS: OPERATIONAL // SECURE CONNECTION
            </span>
          </div>

          <div className="flex items-center gap-6">
            {/* Clock & Status Indicators */}
            <div className="flex items-center gap-5 text-[11px] font-mono">
              <div className="text-slate-500 dark:text-slate-400 bg-slate-200/50 dark:bg-slate-900/50 border border-slate-300/40 dark:border-slate-800/60 px-3 py-1 rounded">
                <span>{currentTime.toLocaleTimeString()}</span>
              </div>
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 hover:bg-slate-200/60 dark:hover:bg-slate-900/60 rounded-full text-slate-500 dark:text-slate-400 transition-colors relative"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] flex items-center justify-center font-bold animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl py-2 z-30 font-display">
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-900 flex justify-between items-center">
                    <span className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">System Alerts</span>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-[10px] text-blue-500 dark:text-cyber-primary hover:underline">
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-xs text-slate-400 font-mono">No new alerts.</div>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className={`px-4 py-3 border-b border-slate-50 dark:border-slate-900 text-xs flex gap-2.5 ${!n.read ? 'bg-blue-500/5' : ''}`}>
                          {n.type === 'critical' || n.type === 'high' ? (
                            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                          ) : (
                            <Shield className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <p className="text-slate-800 dark:text-slate-300 font-body leading-normal">{n.text}</p>
                            <span className="text-[9px] text-slate-400 dark:text-slate-500 block mt-1 font-mono">{n.time}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Theme Toggle Button */}
            <button 
              onClick={toggleTheme}
              className="p-2 hover:bg-slate-200/60 dark:hover:bg-slate-900/60 rounded-full text-slate-500 dark:text-slate-400 transition-colors"
              title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-8 bg-slate-100/40 dark:bg-slate-950/20 relative z-0 flex flex-col justify-between">
          <div className="flex-grow pb-8">
            <Outlet />
          </div>
          <Footer />
        </main>
      </div>
    </div>
  )
}
