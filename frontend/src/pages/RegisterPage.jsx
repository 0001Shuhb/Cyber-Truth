import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { User, Mail, ShieldAlert, Key, LockOpen } from 'lucide-react'

export default function RegisterPage() {
  const [email, setEmail]             = useState('')
  const [username, setUsername]       = useState('')
  const [password, setPassword]       = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting]   = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const validatePassword = (pwd) => {
    const errors = []
    if (pwd.length < 8)            errors.push('at least 8 characters')
    if (!/[A-Z]/.test(pwd))        errors.push('one uppercase letter')
    if (!/[a-z]/.test(pwd))        errors.push('one lowercase letter')
    if (!/\d/.test(pwd))           errors.push('one number')
    if (!/[!@#$%^&*(),.?":{}|<>_\-]/.test(pwd)) errors.push('one special character (!@#$...)')
    return errors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!email || !username || !password || !confirmPassword) {
      toast.error('All profile fields are required.')
      return
    }

    if (password !== confirmPassword) {
      toast.error('Access keys do not match.')
      return
    }

    const pwdErrors = validatePassword(password)
    if (pwdErrors.length > 0) {
      toast.error(`Password needs: ${pwdErrors.join(', ')}`)
      return
    }

    setSubmitting(true)
    try {
      await register(email, username, password)
      toast.success('Analyst profile registered successfully.')
      navigate('/dashboard')
    } catch (err) {
      const serverMsg =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        err?.message ||
        'Profile registration failed. Please try again.'
      const details = err?.response?.data?.error?.details
      if (details) {
        const firstField = Object.keys(details)[0]
        const firstError = Array.isArray(details[firstField]) ? details[firstField][0] : details[firstField]
        toast.error(`${firstField}: ${firstError}`)
      } else {
        toast.error(serverMsg)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-cyber-bg-dark text-slate-800 dark:text-slate-100 font-body relative overflow-hidden flex items-center justify-center p-4 transition-colors duration-300">
      {/* Background Grid Overlay */}
      <div className="absolute inset-0 bg-cyber-grid bg-grid opacity-[0.03] dark:opacity-[0.08] pointer-events-none z-0"></div>

      {/* Cyberpunk Glow Accents */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/5 dark:bg-cyber-primary/5 blur-[130px] rounded-full pointer-events-none z-0"></div>
      <div className="absolute bottom-1/4 right-1/3 translate-x-1/2 translate-y-1/2 w-80 h-80 bg-purple-500/5 blur-[120px] rounded-full pointer-events-none z-0"></div>

      {/* Register Card */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md glass-card border border-slate-200/80 dark:border-slate-800/80 p-9 z-10 relative overflow-hidden shadow-xl"
      >
        {/* Futuristic Technical Corner Crosshairs */}
        <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-blue-500/40 dark:border-cyber-primary/50"></div>
        <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-blue-500/40 dark:border-cyber-primary/50"></div>
        <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-blue-500/40 dark:border-cyber-primary/50"></div>
        <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-blue-500/40 dark:border-cyber-primary/50"></div>

        {/* Scan Bar Animation Overlay */}
        <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500/10 dark:via-cyber-primary/15 to-transparent top-0 animate-scan-line pointer-events-none"></div>

        {/* Logo and Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-lg bg-blue-500/5 dark:bg-cyber-primary/5 border border-blue-500/30 dark:border-cyber-primary/40 flex items-center justify-center shadow-md dark:shadow-glow-blue mx-auto mb-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-blue-500/10 dark:from-cyber-primary/10 to-transparent"></div>
            <LockOpen className="w-5 h-5 text-blue-500 dark:text-cyber-primary" />
          </div>
          <h2 className="font-display font-black text-2xl uppercase tracking-wider text-slate-800 dark:text-white">PROFILE REGISTER</h2>
          <p className="font-mono text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">ESTABLISH NEW ANALYST NODE</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-mono text-[9px] uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-blue-500 dark:text-cyber-primary" /> ANALYST USERNAME
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-cyber"
              placeholder="anonsoldier"
              disabled={submitting}
              required
            />
          </div>

          <div>
            <label className="block font-mono text-[9px] uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-blue-500 dark:text-cyber-primary" /> EMAIL ADDRESS
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-cyber"
              placeholder="analyst@cybertruth.internal"
              disabled={submitting}
              required
            />
          </div>

          <div>
            <label className="block font-mono text-[9px] uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-blue-500 dark:text-cyber-primary" /> ACCESS KEY (PASSWORD)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-cyber"
              placeholder="Min 8 characters"
              disabled={submitting}
              required
            />
            <p className="mt-1 font-mono text-[8px] text-slate-400 dark:text-slate-500 leading-relaxed">
              Requires: uppercase, lowercase, number &amp; special char (!@#$%...)
            </p>
          </div>

          <div>
            <label className="block font-mono text-[9px] uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-blue-500 dark:text-cyber-primary" /> CONFIRM ACCESS KEY
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="input-cyber"
              placeholder="Re-enter access key"
              disabled={submitting}
              required
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            className="w-full btn-primary justify-center mt-2 py-3.5 flex items-center gap-2"
            disabled={submitting}
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                PROVISIONING NODE...
              </span>
            ) : (
              'ESTABLISH ANALYST PROFILE'
            )}
          </motion.button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-900 text-center font-mono text-xs">
          <p className="text-slate-500">
            Already established?{' '}
            <Link to="/login" className="text-blue-500 dark:text-cyber-primary hover:underline font-bold transition-all">
              ACCESS NODE
            </Link>
          </p>
          <p className="mt-4">
            <Link to="/" className="text-slate-400 hover:text-slate-600 dark:hover:text-white hover:underline transition-colors">
              ← Return to Outer Gateway
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
