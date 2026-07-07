// src/pages/AboutPage.jsx
import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Shield, Brain, Terminal, Code, Award, ArrowLeft } from 'lucide-react'
import { FaLinkedinIn } from 'react-icons/fa6'

export default function AboutPage() {
  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0 })
    const scrollContainers = document.querySelectorAll('.overflow-y-auto')
    scrollContainers.forEach(container => {
      container.scrollTo({ top: 0 })
    })
  }, [])

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 space-y-12 animate-fade-in-up">
      
      {/* Title / Header */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-6">
        <Link 
          to="/" 
          className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-cyber-glow mb-4 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Return to Terminal
        </Link>
        <h1 className="font-display font-black text-3xl sm:text-4xl uppercase tracking-wider text-slate-800 dark:text-white">
          About ThreatVaultZ
        </h1>
        <p className="font-mono text-xs text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
          Mission Overview & Core Infrastructure
        </p>
      </div>

      {/* Hero Mission */}
      <div className="relative glass-card p-6 sm:p-8 border border-blue-500/20 dark:border-cyber-primary/30 bg-blue-500/5 dark:bg-cyber-primary/5 rounded-xl">
        <div className="absolute top-4 right-4 text-blue-500 opacity-20">
          <Shield className="w-20 h-20" />
        </div>
        <h2 className="font-display font-black text-lg uppercase tracking-wider text-slate-800 dark:text-white mb-2">
          The Mission
        </h2>
        <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed max-w-2xl">
          Phishing attacks remain the leading catalyst for enterprise security breaches, accounting for over 90% of compromises. ThreatVaultZ was created to democratize threat intelligence, providing security analysts and end-users with instant, automated, machine-learning-driven phishing evaluation tools.
        </p>
      </div>

      {/* Core Technology Pillars */}
      <div className="space-y-6">
        <h2 className="font-display font-black text-xl uppercase tracking-wider text-slate-800 dark:text-white text-center">
          Core Pillars of Protection
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 border border-slate-200 dark:border-slate-800 flex flex-col items-center text-center space-y-3">
            <div className="p-3 rounded-full bg-blue-500/10 dark:bg-cyber-primary/10 text-blue-500 dark:text-cyber-glow">
              <Brain className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-sm uppercase tracking-wider text-slate-800 dark:text-white">
              Heuristic Forensics
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
              We extract 28 structural properties from incoming URLs, checking for homograph mimics, suspicious subdomains, and domain ages.
            </p>
          </div>

          <div className="glass-card p-6 border border-slate-200 dark:border-slate-800 flex flex-col items-center text-center space-y-3">
            <div className="p-3 rounded-full bg-purple-500/10 text-purple-500">
              <Terminal className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-sm uppercase tracking-wider text-slate-800 dark:text-white">
              NLP Email Parsing
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
              Our models parse text bodies, scoring key terms for urgency, banking fraud triggers, and lookalike brand identifiers.
            </p>
          </div>

          <div className="glass-card p-6 border border-slate-200 dark:border-slate-800 flex flex-col items-center text-center space-y-3">
            <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-500">
              <Code className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-sm uppercase tracking-wider text-slate-800 dark:text-white">
              Active DOM Scan
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
              We audit site assets and form redirect targets to ensure external assets aren't mimicking legitimate financial or portal gateways.
            </p>
          </div>
        </div>
      </div>

      {/* Developer Section */}
      <div className="glass-card p-6 sm:p-8 border border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-950/30 flex flex-col md:flex-row items-center gap-6 sm:gap-8">
        <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-2 border-blue-500 dark:border-cyber-primary bg-slate-200 dark:bg-slate-900 flex items-center justify-center shrink-0 shadow-lg relative overflow-hidden">
          {/* Fallback initials styling or avatar placeholder */}
          <span className="font-display font-black text-3xl uppercase tracking-wider text-blue-500 dark:text-cyber-glow">
            SP
          </span>
        </div>
        
        <div className="space-y-3 text-center md:text-left flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-center md:justify-start gap-2.5">
            <h3 className="font-display font-black text-lg uppercase tracking-wider text-slate-800 dark:text-white">
              Shubham Pandey
            </h3>
            <span className="bg-blue-500/10 text-blue-500 dark:bg-cyber-primary/10 dark:text-cyber-primary px-2.5 py-0.5 rounded font-mono text-[9px] font-bold uppercase tracking-wider self-center">
              Founder & Lead Architect
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
            ThreatVaultZ was architected and developed by Shubham Pandey to bridge the gap between complex machine learning paradigms and direct SOC analyst operations. Shubham designed the system to run highly responsive inference classifiers with sub-400ms latencies, ensuring analysts can intercept threats quickly.
          </p>
          
          <div className="pt-2">
            <a 
              href="https://www.linkedin.com/in/shubhampand3y/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 border border-blue-500/20 hover:border-blue-500 hover:bg-blue-500/5 text-blue-500 dark:border-cyber-secondary dark:hover:border-cyber-glow dark:text-cyber-glow rounded font-mono text-xs transition-all cursor-pointer"
            >
              <FaLinkedinIn className="w-3.5 h-3.5" /> Connect on LinkedIn
            </a>
          </div>
        </div>
      </div>

    </div>
  )
}
