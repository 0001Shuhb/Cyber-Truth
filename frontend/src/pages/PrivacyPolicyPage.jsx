// src/pages/PrivacyPolicyPage.jsx
import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Shield, Lock, Eye, RefreshCw, FileText, ArrowLeft } from 'lucide-react'

export default function PrivacyPolicyPage() {
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
          Privacy Policy
        </h1>
        <p className="font-mono text-xs text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
          ThreatVaultZ Platform Compliance // Version 2.1 (Last Updated: June 28, 2026)
        </p>
      </div>

      {/* Info Boxes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-5 border border-slate-200 dark:border-slate-800 flex items-start gap-4">
          <div className="p-2.5 rounded bg-blue-500/10 dark:bg-cyber-primary/10 border border-blue-500/20 dark:border-cyber-primary text-blue-500 dark:text-cyber-glow shrink-0">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-display font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-white mb-1">Secure Ingestion</h3>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
              All scanning requests are encrypted in transit via secure TLS tunnels.
            </p>
          </div>
        </div>

        <div className="glass-card p-5 border border-slate-200 dark:border-slate-800 flex items-start gap-4">
          <div className="p-2.5 rounded bg-emerald-500/10 dark:bg-cyber-accent/10 border border-emerald-500/20 dark:border-cyber-accent text-emerald-500 dark:text-cyber-accent shrink-0">
            <Eye className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-display font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-white mb-1">Zero Tracker Policy</h3>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
              We never deploy behavioral ad-trackers or sell scanning history to third parties.
            </p>
          </div>
        </div>

        <div className="glass-card p-5 border border-slate-200 dark:border-slate-800 flex items-start gap-4">
          <div className="p-2.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-500 shrink-0">
            <RefreshCw className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-display font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-white mb-1">Telemetry Control</h3>
            <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
              Analysts retain the right to clear historical scanning nodes at any time.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="glass-card p-6 sm:p-8 border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-950/30 text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-body leading-relaxed space-y-6">
        
        <section className="space-y-2">
          <h2 className="font-display font-bold uppercase tracking-wider text-slate-800 dark:text-white text-sm sm:text-base flex items-center gap-2">
            <span className="font-mono text-blue-500 dark:text-cyber-glow">01 //</span> Scope & Overview
          </h2>
          <p>
            Welcome to <strong>ThreatVaultZ</strong> ("we," "our," or "us"). We provide artificial-intelligence-driven threat classification, URL forensics, email Natural Language Processing (NLP), and website vulnerability scoring. This Privacy Policy details the types of information collected when you access the platform, submit diagnostic scan payloads, or sign up for cybersecurity bulletin feeds.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display font-bold uppercase tracking-wider text-slate-800 dark:text-white text-sm sm:text-base flex items-center gap-2">
            <span className="font-mono text-blue-500 dark:text-cyber-glow">02 //</span> Scanning Telemetry & Data Ingestion
          </h2>
          <p>
            When you perform a check (such as typing a URL, uploading email headers/text, or initiating a site scan), our system parses that data to evaluate malicious signatures.
          </p>
          <ul className="list-disc list-inside pl-4 space-y-1.5 pt-1">
            <li>
              <strong>URL Payloads:</strong> Subdomain counts, top-level domain (TLD) entropy, and character geometries are recorded to train and refine our local Random Forest classifiers.
            </li>
            <li>
              <strong>Email Scans:</strong> Email body text is analyzed for deceptive NLP traits (e.g., sense of urgency, structural impersonation) via automated tokenization. The contents are not read by human operators unless flagged for administrative analysis.
            </li>
            <li>
              <strong>Domain Inspections:</strong> The Target DOM, server IP nodes, SSL certificate details, and historical WHOIS records are compiled as structural signatures.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-display font-bold uppercase tracking-wider text-slate-800 dark:text-white text-sm sm:text-base flex items-center gap-2">
            <span className="font-mono text-blue-500 dark:text-cyber-glow">03 //</span> Sharing of Threat Intelligence
          </h2>
          <p>
            To contribute back to the cybersecurity ecosystem, ThreatVaultZ extracts anonymized threat signals (e.g., validated phishing URLs, bad actor host IP nodes) and merges them into our <em>Global Threat Intelligence</em> feed.
          </p>
          <div className="p-3.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded font-mono text-[11px] text-slate-500 dark:text-slate-400">
            🔒 RULE OF ENGAGEMENT: Personal Identifiable Information (PII) such as usernames, analyst profile names, and source device IP coordinates are strictly pruned BEFORE threat data is aggregated or distributed.
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="font-display font-bold uppercase tracking-wider text-slate-800 dark:text-white text-sm sm:text-base flex items-center gap-2">
            <span className="font-mono text-blue-500 dark:text-cyber-glow">04 //</span> Profile Information & Access Log Retention
          </h2>
          <p>
            When registering, we collect credentials (username, email, role) to enforce proper system authorization roles (Analyst / Admin). Operational logs, access time, and action logs are kept for security audits and threat tracebacks to defend the system from misuse.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-display font-bold uppercase tracking-wider text-slate-800 dark:text-white text-sm sm:text-base flex items-center gap-2">
            <span className="font-mono text-blue-500 dark:text-cyber-glow">05 //</span> Global Privacy Controls (GDPR / CCPA)
          </h2>
          <p>
            Depending on your jurisdiction, you possess the right to:
          </p>
          <ul className="list-disc list-inside pl-4 space-y-1 pt-1">
            <li>Request copies of threat scan histories connected to your account profile.</li>
            <li>Request immediate termination of your analyst account node and erasure of related PII.</li>
            <li>Opt-out of automated machine-learning model telemetry ingestion.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="font-display font-bold uppercase tracking-wider text-slate-800 dark:text-white text-sm sm:text-base flex items-center gap-2">
            <span className="font-mono text-blue-500 dark:text-cyber-glow">06 //</span> Contact & Operations Center
          </h2>
          <p>
            For compliance, technical audits, or data deletion queries, please dispatch an encrypted support request via our <Link to="/contact" className="text-blue-500 dark:text-cyber-glow hover:underline">Contact Center</Link> or address a request directly to:
          </p>
          <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400 pl-4 pt-1">
            ThreatVaultZ Security Compliance Node<br />
            Attn: Data Protection Officer (DPO)<br />
            Email: privacy@threatvaultz.com
          </p>
        </section>
      </div>
    </div>
  )
}
