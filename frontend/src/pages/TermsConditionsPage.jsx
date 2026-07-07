// src/pages/TermsConditionsPage.jsx
import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { AlertOctagon, Scale, ShieldAlert, Cpu, Terminal, ArrowLeft } from 'lucide-react'

export default function TermsConditionsPage() {
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
          Terms & Conditions
        </h1>
        <p className="font-mono text-xs text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
          SaaS Licensing & Rules of Engagement // Updated: June 28, 2026
        </p>
      </div>

      {/* Warning Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-5 border border-slate-200 dark:border-slate-800 flex items-start gap-4">
          <div className="p-2.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-500 shrink-0">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-display font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-white mb-1">Authorized Scan Only</h3>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
              Scanners must only be targeted at systems you own or have explicit authorization to audit.
            </p>
          </div>
        </div>

        <div className="glass-card p-5 border border-slate-200 dark:border-slate-800 flex items-start gap-4">
          <div className="p-2.5 rounded bg-blue-500/10 dark:bg-cyber-primary/10 border border-blue-500/20 dark:border-cyber-primary text-blue-500 dark:text-cyber-glow shrink-0">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-display font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-white mb-1">Model Protection</h3>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
              Decompilation or reverse-engineering of ML threat weights and NLP classifiers is strictly prohibited.
            </p>
          </div>
        </div>

        <div className="glass-card p-5 border border-slate-200 dark:border-slate-800 flex items-start gap-4">
          <div className="p-2.5 rounded bg-red-500/10 border border-red-500/20 text-red-500 shrink-0">
            <AlertOctagon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-display font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-white mb-1">Zero Abuse Policy</h3>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
              Platform features may not be integrated into automated malware generators or scanners.
            </p>
          </div>
        </div>
      </div>

      {/* Legal Text Panel */}
      <div className="glass-card p-6 sm:p-8 border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-950/30 text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-body leading-relaxed space-y-6">
        
        <section className="space-y-2">
          <h2 className="font-display font-bold uppercase tracking-wider text-slate-800 dark:text-white text-sm sm:text-base flex items-center gap-2">
            <span className="font-mono text-blue-500 dark:text-cyber-glow">01 //</span> Agreement to Terms
          </h2>
          <p>
            By establishing an active session, provisioning an analyst profile, or deploying ThreatVaultZ threat scanners, you agree to be bound by these Terms & Conditions. If you object to any portion of these protocols, you must immediately terminate your operational session and de-authorize your analyst node.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display font-bold uppercase tracking-wider text-slate-800 dark:text-white text-sm sm:text-base flex items-center gap-2">
            <span className="font-mono text-blue-500 dark:text-cyber-glow">02 //</span> Scope of License & Use Controls
          </h2>
          <p>
            ThreatVaultZ grants you a revocable, non-exclusive, non-transferable, limited license to run diagnostic phishing and vulnerability audits on targeting elements (URLs, emails, and sites) in compliance with these terms:
          </p>
          <ul className="list-disc list-inside pl-4 space-y-1.5 pt-1">
            <li>
              <strong>No Exploit Packaging:</strong> You may not use model telemetry feedback or scoring nodes to refine phishing campaigns, bypass firewall filters, or test zero-day security templates.
            </li>
            <li>
              <strong>Unauthorized Probing:</strong> Triggering scanning requests against systems, domains, or intellectual network blocks without operational authorization is a violation of international computer protection laws (e.g., Computer Fraud and Abuse Act in the US).
            </li>
            <li>
              <strong>Rate Limiting:</strong> Any attempt to launch Denial-of-Service attacks or bypass local API limits via automated scripts will result in immediate session revocation.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-display font-bold uppercase tracking-wider text-slate-800 dark:text-white text-sm sm:text-base flex items-center gap-2">
            <span className="font-mono text-blue-500 dark:text-cyber-glow">03 //</span> Reverse-Engineering & Intellectual Property
          </h2>
          <p>
            The software, layout, random forest ML models, text tokenizers, and dataset weights are the intellectual property of ThreatVaultZ. You agree not to copy, decompile, mirror, scrape, or extract components of our machine learning codebases.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display font-bold uppercase tracking-wider text-slate-800 dark:text-white text-sm sm:text-base flex items-center gap-2">
            <span className="font-mono text-blue-500 dark:text-cyber-glow">04 //</span> Limitation of Liability
          </h2>
          <div className="p-3.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded font-mono text-[11px] text-slate-500 dark:text-slate-400">
            ⚠️ WARNING: ThreatVaultZ uses AI statistical models for phishing scoring. We DO NOT guarantee 100% accuracy. ThreatVaultZ is not liable for data loss, corporate network breaches, or ransomware infections resulting from false negatives or reliance on model scoring.
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="font-display font-bold uppercase tracking-wider text-slate-800 dark:text-white text-sm sm:text-base flex items-center gap-2">
            <span className="font-mono text-blue-500 dark:text-cyber-glow">05 //</span> Operational Disruption & Force Majeure
          </h2>
          <p>
            We endeavor to keep threat feeds operational (v1.0.0 is marked green). However, network sync cycles, API latency variations, or cyber attacks against our nodes can cause service interruptions. We reserve the right to suspend gateways for diagnostics at any time.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display font-bold uppercase tracking-wider text-slate-800 dark:text-white text-sm sm:text-base flex items-center gap-2">
            <span className="font-mono text-blue-500 dark:text-cyber-glow">06 //</span> Governing Law & Disputes
          </h2>
          <p>
            These terms are governed and construed in accordance with the laws of the jurisdiction of operations, without reference to conflict-of-law principles. Any legal challenges must be escalated to the arbitration nodes indicated in our compliance bulletins.
          </p>
        </section>
      </div>
    </div>
  )
}
