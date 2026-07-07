// src/components/common/Footer.jsx
import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, ArrowUp, Send, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react'
import { FaLinkedinIn, FaInstagram, FaXTwitter } from 'react-icons/fa6'
import { useAuth } from '../../context/AuthContext'
import { toast } from 'react-hot-toast'

// Helper component for animated social links
const SocialLink = ({ href, icon: Icon, platform }) => {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div className="relative flex flex-col items-center">
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: -34, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="absolute z-30 px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-white bg-blue-600 dark:bg-cyber-secondary rounded shadow-md whitespace-nowrap pointer-events-none"
          >
            {platform}
          </motion.div>
        )}
      </AnimatePresence>
      <motion.a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ scale: 1.15, y: -2 }}
        className="w-10 h-10 rounded-lg flex items-center justify-center bg-slate-200/50 hover:bg-blue-500/10 text-slate-600 hover:text-blue-500 dark:bg-slate-900/60 dark:hover:bg-cyber-primary/10 dark:text-slate-400 dark:hover:text-cyber-glow border border-slate-300/40 dark:border-slate-800/80 transition-all duration-300"
        aria-label={`Follow Shubham Pandey on ${platform}`}
      >
        <Icon className="w-4 h-4" />
      </motion.a>
    </div>
  )
}

export default function Footer() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  
  // Newsletter state
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Scroll to top state
  const [showScrollTop, setShowScrollTop] = useState(false)

  useEffect(() => {
    const handleScroll = (e) => {
      const scrollTop = e.target === document ? window.scrollY : e.target.scrollTop
      if (scrollTop > 300) {
        setShowScrollTop(true)
      } else {
        setShowScrollTop(false)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    
    // Also bind to any dashboard scroll container
    const scrollContainers = document.querySelectorAll('.overflow-y-auto')
    scrollContainers.forEach(container => {
      container.addEventListener('scroll', handleScroll, { passive: true })
    })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      scrollContainers.forEach(container => {
        container.removeEventListener('scroll', handleScroll)
      })
    }
  }, [])

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    const scrollContainers = document.querySelectorAll('.overflow-y-auto')
    scrollContainers.forEach(container => {
      container.scrollTo({ top: 0, behavior: 'smooth' })
    })
  }

  const handleSubscribe = (e) => {
    e.preventDefault()
    
    // Simple email regex validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email.trim()) {
      toast.error('Email address is required.')
      return
    }
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address.')
      return
    }

    setIsSubmitting(true)
    
    // Simulate API registration
    setTimeout(() => {
      toast.success('Subscription active! Enrolled in Threat Intel bulletins.')
      setEmail('')
      setIsSubmitting(false)
    }, 1200)
  }

  // Quick link logic: redirect to login if unauthenticated and linking to app console
  const getQuickLink = (path) => {
    if (!isAuthenticated && ['/dashboard', '/scan/url', '/scan/email', '/scan/website', '/threat-intel', '/settings', '/history'].includes(path)) {
      return '/login'
    }
    return path
  }

  return (
    <footer className="w-full border-t border-slate-200 dark:border-slate-900 bg-white/70 dark:bg-slate-950/70 backdrop-blur-md relative z-10 transition-colors duration-300">
      
      {/* Upper Grid section */}
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Brand Section */}
        <div className="space-y-4 md:col-span-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-blue-500/10 dark:bg-cyber-primary/10 border border-blue-500/30 dark:border-cyber-primary flex items-center justify-center shadow-sm">
              <Shield className="w-4 h-4 text-blue-500 dark:text-cyber-glow" />
            </div>
            <div>
              <span className="font-display font-black tracking-wider text-base text-slate-800 dark:text-white block">ThreatVaultZ</span>
              <span className="font-mono text-[8px] text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Threat Intelligence</span>
            </div>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-body leading-relaxed">
            Empowering users with AI-driven phishing detection, threat intelligence, and cybersecurity awareness.
          </p>
          
          {/* Social Links */}
          <div className="pt-2">
            <span className="font-mono text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-3">SECURE FEEDS // CONNECT</span>
            <div className="flex items-center gap-3">
              <SocialLink href="https://www.linkedin.com/in/shubhampand3y/" icon={FaLinkedinIn} platform="LinkedIn" />
              <SocialLink href="https://x.com/Shubham_pray" icon={FaXTwitter} platform="X (Twitter)" />
              <SocialLink href="https://www.instagram.com/shubham_xashyap/" icon={FaInstagram} platform="Instagram" />
            </div>
          </div>
        </div>

        {/* Quick Links Section */}
        <div className="space-y-3">
          <h4 className="font-display font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-white border-l-2 border-blue-500 dark:border-cyber-secondary pl-2">
            Quick Links
          </h4>
          <ul className="space-y-2 text-xs font-body text-slate-500 dark:text-slate-400">
            <li><Link to={getQuickLink('/dashboard')} className="hover:text-blue-500 dark:hover:text-cyber-glow transition-colors">Dashboard</Link></li>
            <li><Link to={getQuickLink('/scan/url')} className="hover:text-blue-500 dark:hover:text-cyber-glow transition-colors">URL Scanner</Link></li>
            <li><Link to={getQuickLink('/scan/email')} className="hover:text-blue-500 dark:hover:text-cyber-glow transition-colors">Email Scanner</Link></li>
            <li><Link to={getQuickLink('/scan/website')} className="hover:text-blue-500 dark:hover:text-cyber-glow transition-colors">Website Scanner</Link></li>
            <li><Link to={getQuickLink('/threat-intel')} className="hover:text-blue-500 dark:hover:text-cyber-glow transition-colors">Global Threat Intelligence</Link></li>
            <li><Link to={getQuickLink('/history')} className="hover:text-blue-500 dark:hover:text-cyber-glow transition-colors">Reports</Link></li>
            <li><Link to={getQuickLink('/history')} className="hover:text-blue-500 dark:hover:text-cyber-glow transition-colors">History</Link></li>
            <li><Link to={getQuickLink('/settings')} className="hover:text-blue-500 dark:hover:text-cyber-glow transition-colors">Settings</Link></li>
          </ul>
        </div>

        {/* Resources Section */}
        <div className="space-y-3">
          <h4 className="font-display font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-white border-l-2 border-blue-500 dark:border-cyber-secondary pl-2">
            Resources
          </h4>
          <ul className="space-y-2 text-xs font-body text-slate-500 dark:text-slate-400">
            <li>
              <a 
                href="#docs" 
                onClick={(e) => {
                  e.preventDefault()
                  toast('Documentation portal is currently internal-only.', { icon: '🔒' })
                }}
                className="hover:text-blue-500 dark:hover:text-cyber-glow transition-colors flex items-center gap-1"
              >
                Documentation <ExternalLink className="w-3 h-3 opacity-55" />
              </a>
            </li>
            <li><Link to="/privacy" className="hover:text-blue-500 dark:hover:text-cyber-glow transition-colors">Privacy Policy</Link></li>
            <li><Link to="/terms" className="hover:text-blue-500 dark:hover:text-cyber-glow transition-colors">Terms & Conditions</Link></li>
            <li><Link to="/cookies" className="hover:text-blue-500 dark:hover:text-cyber-glow transition-colors">Cookie Policy</Link></li>
            <li><Link to="/contact" className="hover:text-blue-500 dark:hover:text-cyber-glow transition-colors">Contact</Link></li>
            <li><Link to="/about" className="hover:text-blue-500 dark:hover:text-cyber-glow transition-colors">About</Link></li>
          </ul>
        </div>

        {/* Newsletter Section */}
        <div className="space-y-3">
          <h4 className="font-display font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-white border-l-2 border-blue-500 dark:border-cyber-secondary pl-2">
            Newsletter
          </h4>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-body leading-relaxed">
            Subscribe to receive real-time threat intelligence bulletins and security alerts.
          </p>
          <form onSubmit={handleSubscribe} className="space-y-2 pt-1.5" noValidate>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="analyst@threatvaultz.com"
                className="w-full bg-slate-100/80 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-800 rounded px-3.5 py-2 text-xs font-mono focus:outline-none focus:border-blue-500 dark:focus:border-cyber-glow transition-all pr-10 text-slate-900 dark:text-slate-100"
                aria-label="Email address for newsletter"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="absolute right-1 top-1 bottom-1 px-2.5 rounded bg-blue-500 dark:bg-cyber-primary hover:bg-blue-600 dark:hover:bg-blue-500 text-white flex items-center justify-center transition-colors disabled:opacity-50"
                aria-label="Subscribe"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
            <span className="font-mono text-[8px] text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              🔒 TLS ENCRYPTED INGESTION
            </span>
          </form>
        </div>

      </div>

      {/* Bottom bar */}
      <div className="border-t border-slate-200 dark:border-slate-900/60 bg-slate-50/50 dark:bg-slate-950/30 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left text-[11px] font-mono text-slate-400 dark:text-slate-500">
          
          {/* Copyright Info */}
          <div className="space-y-1">
            <p>
              © 2026 ThreatVaultZ. All Rights Reserved. Designed & Developed by{' '}
              <a 
                href="https://www.linkedin.com/in/shubhampand3y/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 dark:text-cyber-glow hover:underline font-bold"
              >
                Shubham Pandey
              </a>.
            </p>
            <p className="text-[10px] opacity-75">
              Secure Profile:{' '}
              <a 
                href="https://www.linkedin.com/in/shubhampand3y/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-cyber-glow hover:underline inline-flex items-center gap-0.5"
              >
                Connect with Me <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </p>
          </div>

          {/* System metadata indicators */}
          <div className="flex flex-wrap justify-center md:justify-end items-center gap-4 text-[10px]">
            {/* Version */}
            <span className="bg-slate-200/50 dark:bg-slate-900/50 px-2 py-0.5 rounded border border-slate-300/40 dark:border-slate-800/60 text-slate-500 dark:text-slate-400">
              v1.0.0
            </span>

            {/* Last Updated */}
            <span className="text-slate-400 dark:text-slate-500">
              UPDATED: JUNE 28, 2026
            </span>

            {/* Build Status Indicator */}
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-green-500/5 border border-green-500/20 text-green-500">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              <span>SYS STATUS: OPERATIONAL</span>
            </div>
          </div>

        </div>
      </div>

      {/* Floating Scroll-To-Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            onClick={handleScrollToTop}
            className="fixed bottom-6 right-6 z-50 p-3 rounded-full bg-blue-500 dark:bg-cyber-primary text-white shadow-lg hover:bg-blue-600 dark:hover:bg-blue-500 flex items-center justify-center transition-colors border border-blue-400 dark:border-cyber-glow cursor-pointer"
            aria-label="Scroll to top"
            title="Scroll to top"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowUp className="w-4 h-4" />
          </motion.button>
        )}
      </AnimatePresence>

    </footer>
  )
}
