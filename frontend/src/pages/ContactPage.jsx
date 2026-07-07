// src/pages/ContactPage.jsx
import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Shield, Send, Terminal, MessageSquare, ArrowLeft } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: 'General Support Desk',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0 })
    const scrollContainers = document.querySelectorAll('.overflow-y-auto')
    scrollContainers.forEach(container => {
      container.scrollTo({ top: 0 })
    })
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    // Validate inputs
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!formData.name.trim()) {
      toast.error('Identification Name is required.')
      return
    }
    if (!formData.email.trim()) {
      toast.error('Contact Email is required.')
      return
    }
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address.')
      return
    }
    if (!formData.message.trim()) {
      toast.error('Message payload cannot be empty.')
      return
    }

    setIsSubmitting(true)

    // Simulate submission
    setTimeout(() => {
      toast.success('Secure transmission complete. Ticket generated!', {
        duration: 4000,
        style: {
          background: '#0a1628',
          color: '#00ff88',
          border: '1px solid #1a2d4a',
          fontFamily: 'JetBrains Mono, monospace'
        }
      })
      setFormData({
        name: '',
        email: '',
        subject: 'General Support Desk',
        message: ''
      })
      setIsSubmitting(false)
    }, 1500)
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 space-y-8 animate-fade-in-up">
      
      {/* Title / Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-6">
        <Link 
          to="/" 
          className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-cyber-glow mb-4 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Return to Terminal
        </Link>
        <h1 className="font-display font-black text-3xl sm:text-4xl uppercase tracking-wider text-slate-800 dark:text-white">
          Contact Ops Center
        </h1>
        <p className="font-mono text-xs text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
          Open Secure Communications Channel
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Side: Contact Channels */}
        <div className="md:col-span-1 space-y-6">
          <div className="glass-card p-5 border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="font-display font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-900 pb-2">
              Inquiries
            </h3>
            
            <div className="space-y-3.5">
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-mono text-[9px] text-slate-400 uppercase block">General support</span>
                  <a href="mailto:shubh13pandit@gmail.com" className="text-xs hover:underline text-slate-700 dark:text-slate-300 font-mono">
                    shubh13pandit@gmail.com
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Shield className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-mono text-[9px] text-slate-400 uppercase block">Abuse & Security Desk</span>
                  <a href="mailto:secops@threatvaultz.com" className="text-xs hover:underline text-slate-700 dark:text-slate-300 font-mono">
                    secops@threatvaultz.com
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-5 border border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="font-display font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-white">
              GPG Encryption
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-[10px] leading-relaxed">
              If communicating sensitive zero-day exploits, please encrypt your payload using our public key:
            </p>
            <div className="bg-slate-100 dark:bg-slate-900/60 p-2.5 rounded border border-slate-200 dark:border-slate-800 font-mono text-[9px] text-slate-400 uppercase break-all leading-normal">
              KEY_ID: 0x93FA77E1<br />
              FINGERPRINT: 5B0A 92EE FF34 C211 411A 022D DE44 93FA 77E1
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="md:col-span-2">
          <div className="glass-card p-6 border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-950/30">
            <h3 className="font-display font-black text-sm uppercase tracking-wider text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-500" /> Dispatch Secure Message
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs" noValidate>
              
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-slate-400 dark:text-slate-500 uppercase tracking-wider block text-[10px]" htmlFor="name">
                  Identification Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Analyst John Doe"
                  className="w-full bg-slate-100/60 dark:bg-slate-900/40 border border-slate-300 dark:border-slate-800 rounded px-3 py-2 focus:outline-none focus:border-blue-500 dark:focus:border-cyber-glow transition-all text-slate-900 dark:text-slate-100"
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-slate-400 dark:text-slate-500 uppercase tracking-wider block text-[10px]" htmlFor="email">
                  Return Contact Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john.doe@company.internal"
                  className="w-full bg-slate-100/60 dark:bg-slate-900/40 border border-slate-300 dark:border-slate-800 rounded px-3 py-2 focus:outline-none focus:border-blue-500 dark:focus:border-cyber-glow transition-all text-slate-900 dark:text-slate-100"
                />
              </div>

              {/* Subject */}
              <div className="space-y-1.5">
                <label className="text-slate-400 dark:text-slate-500 uppercase tracking-wider block text-[10px]" htmlFor="subject">
                  Routing Department
                </label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full bg-slate-100/60 dark:bg-slate-900/40 border border-slate-300 dark:border-slate-800 rounded px-3 py-2 focus:outline-none focus:border-blue-500 dark:focus:border-cyber-glow transition-all text-slate-900 dark:text-slate-100 cursor-pointer"
                >
                  <option value="General Support Desk" className="bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100">General Support Desk</option>
                  <option value="Security Incident Desk" className="bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100">Security Incident Desk (CVEs / Exploits)</option>
                  <option value="Billing & Enterprise" className="bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100">Billing & Enterprise Licenses</option>
                </select>
              </div>

              {/* Message */}
              <div className="space-y-1.5">
                <label className="text-slate-400 dark:text-slate-500 uppercase tracking-wider block text-[10px]" htmlFor="message">
                  Message Payload
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows="5"
                  placeholder="Specify threat intelligence query or platform feedback logs..."
                  className="w-full bg-slate-100/60 dark:bg-slate-900/40 border border-slate-300 dark:border-slate-800 rounded px-3 py-2 focus:outline-none focus:border-blue-500 dark:focus:border-cyber-glow transition-all text-slate-900 dark:text-slate-100 leading-relaxed resize-none"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full py-3 text-xs tracking-widest flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                {isSubmitting ? 'TRANSMITTING PAYLOAD...' : 'TRANSMIT SECURE MESSAGE'}
              </button>

            </form>
          </div>
        </div>

      </div>
    </div>
  )
}
