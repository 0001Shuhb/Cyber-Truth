// src/pages/CookiePolicyPage.jsx
import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Check, Settings, ShieldCheck, HelpCircle, ArrowLeft } from 'lucide-react'

export default function CookiePolicyPage() {
  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0 })
    const scrollContainers = document.querySelectorAll('.overflow-y-auto')
    scrollContainers.forEach(container => {
      container.scrollTo({ top: 0 })
    })
  }, [])

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
          Cookie Policy
        </h1>
        <p className="font-mono text-xs text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
          Cookie Audit Telemetry // Updated: June 28, 2026
        </p>
      </div>

      {/* Grid section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-5 border border-slate-200 dark:border-slate-800 flex items-start gap-4">
          <div className="p-2.5 rounded bg-blue-500/10 dark:bg-cyber-primary/10 border border-blue-500/20 dark:border-cyber-primary text-blue-500 dark:text-cyber-glow shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-display font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-white mb-1">Necessary Cookies Only</h3>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
              We deploy only essential cookies required for session establishment and layout preferences.
            </p>
          </div>
        </div>

        <div className="glass-card p-5 border border-slate-200 dark:border-slate-800 flex items-start gap-4">
          <div className="p-2.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-500 shrink-0">
            <Settings className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-display font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-white mb-1">Full Browser Management</h3>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
              You can block, clear, or customize cookie responses directly within your browser settings.
            </p>
          </div>
        </div>
      </div>

      {/* Policy Details */}
      <div className="glass-card p-6 sm:p-8 border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-950/30 text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-body leading-relaxed space-y-6">
        
        <section className="space-y-2">
          <h2 className="font-display font-bold uppercase tracking-wider text-slate-800 dark:text-white text-sm sm:text-base flex items-center gap-2">
            <span className="font-mono text-blue-500 dark:text-cyber-glow">01 //</span> What are Cookies?
          </h2>
          <p>
            Cookies are micro-sized text files saved onto your workstation or local computer when visiting websites. They hold basic configurations and credentials, letting Web Apps maintain state (for example, keeping you logged into the Dashboard as you move between scanning tools).
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display font-bold uppercase tracking-wider text-slate-800 dark:text-white text-sm sm:text-base flex items-center gap-2">
            <span className="font-mono text-blue-500 dark:text-cyber-glow">02 //</span> How ThreatVaultZ Uses Cookies
          </h2>
          <p>
            ThreatVaultZ enforces a strict "data minimization" protocol. We do not use advertising tracking cookies. We employ cookies and browser LocalStorage nodes exclusively for two purposes:
          </p>
          <ul className="list-disc list-inside pl-4 space-y-1.5 pt-1">
            <li>
              <strong>Session Security Management:</strong> Used to maintain authentication states. When you sign in, a token is set so the APIs recognize your clearance role as you scan payloads.
            </li>
            <li>
              <strong>System Preferences:</strong> Remembers your selection for theme mode (Dark vs. Light) and sidebar alignment.
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="font-display font-bold uppercase tracking-wider text-slate-800 dark:text-white text-sm sm:text-base flex items-center gap-2">
            <span className="font-mono text-blue-500 dark:text-cyber-glow">03 //</span> Cookie Inventory
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-[11px] border border-slate-200 dark:border-slate-800 rounded">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                  <th className="p-3">Identifier</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Lifespan</th>
                  <th className="p-3">Functional Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-500 dark:text-slate-400">
                <tr>
                  <td className="p-3 font-bold text-slate-700 dark:text-slate-300">token / auth</td>
                  <td className="p-3">Necessary</td>
                  <td className="p-3">Session / 15m</td>
                  <td className="p-3">Holds cryptographically signed authorization token for secure API access.</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-slate-700 dark:text-slate-300">theme</td>
                  <td className="p-3">Preference</td>
                  <td className="p-3">Persistent</td>
                  <td className="p-3">Remembers user preference for Dark or Light aesthetic colors.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="font-display font-bold uppercase tracking-wider text-slate-800 dark:text-white text-sm sm:text-base flex items-center gap-2">
            <span className="font-mono text-blue-500 dark:text-cyber-glow">04 //</span> How to Manage Cookies
          </h2>
          <p>
            You can direct your browser to block cookies or alert you when cookies are sent. Please check your browser's instructions (Firefox, Chrome, Edge, Safari) to alter configurations.
          </p>
          <div className="p-3.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded font-mono text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-2.5">
            <HelpCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <span>
              SYSTEM ALERT: Erasing or disabling Necessary cookies will sign you out of the SOC platform and disable core scanner features.
            </span>
          </div>
        </section>
      </div>
    </div>
  )
}
