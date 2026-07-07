import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { 
  Link2, 
  Terminal, 
  ShieldCheck, 
  AlertTriangle, 
  AlertOctagon, 
  Cpu, 
  FileText 
} from 'lucide-react'

// Diagnostic terminal UI displayed during deep scanning
const ScanningHud = () => {
  const [logIndex, setLogIndex] = useState(0)
  const logs = [
    'CONNECTING TO CYBER TRUTH ANALYSIS CLOUD...',
    'EXTRACTING URL ENTROPY & SUBDOMAIN VECTORS...',
    'EVALUATING DOMAIN REGISTRATION AND AGENT AGE...',
    'SUBMITTING CHARACTER INDICATORS TO MACHINE LEARNING MODEL...',
    'RETRIEVING INFERENCE SCORE & VERDICT SIGNATURES...',
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setLogIndex((p) => Math.min(p + 1, logs.length - 1))
    }, 600)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="glass-card p-6 border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-950/60 font-mono text-xs space-y-2.5 max-w-xl mx-auto shadow-md dark:shadow-glow-blue text-left select-none relative overflow-hidden">
      <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500/10 dark:via-cyber-glow/10 to-transparent top-0 animate-scan-line"></div>
      <div className="text-blue-500 dark:text-cyber-glow/90 font-bold uppercase border-b border-slate-200 dark:border-slate-900 pb-2 mb-2 flex justify-between items-center">
        <span className="flex items-center gap-1.5"><Terminal className="w-4 h-4" /> URL ANALYSIS ENGINE ACTIVE</span>
        <span className="w-2.5 h-2.5 rounded-full bg-blue-500 dark:bg-cyber-glow animate-ping"></span>
      </div>
      {logs.slice(0, logIndex + 1).map((log, i) => (
        <div key={i} className="flex gap-2 text-slate-600 dark:text-slate-300 animate-fade-in-up">
          <span className="text-slate-400 dark:text-slate-600">&gt;&gt;</span>
          <span>{log}</span>
        </div>
      ))}
      {logIndex < logs.length - 1 && (
        <div className="flex items-center gap-1.5 text-blue-500 dark:text-cyber-glow animate-pulse">
          <span className="text-slate-400 dark:text-slate-600">&gt;&gt;</span>
          <span>COMPILING VECTORS...</span>
        </div>
      )}
    </div>
  )
}

export default function UrlScannerPage() {
  const [url, setUrl] = useState('')
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState(null)
  const [aiAnalysis, setAiAnalysis] = useState(null)
  const [polling, setPolling] = useState(false)
  const navigate = useNavigate()

  const handleScan = async (e) => {
    e.preventDefault()
    if (!url) {
      toast.error('URL endpoint is required.')
      return
    }

    setScanning(true)
    setResult(null)
    setAiAnalysis(null)

    try {
      const response = await api.post('/api/scan/url', { url })
      const data = response.data.data
      setResult(data)
      
      if (data.scan?.id) {
        startPollingForAi(data.scan.id)
      }
      toast.success('Features extracted. Verdict obtained.')
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Scan failure. Check URL target.')
    } finally {
      setScanning(false)
    }
  }

  const startPollingForAi = async (scanId) => {
    setPolling(true)
    let attempts = 0
    const maxAttempts = 15

    const interval = setInterval(async () => {
      attempts++
      try {
        const response = await api.get(`/api/scan/${scanId}/status`)
        const statusData = response.data.data
        if (statusData.ai_analysis) {
          setAiAnalysis(statusData.ai_analysis)
          clearInterval(interval)
          setPolling(false)
        } else if (attempts >= maxAttempts) {
          clearInterval(interval)
          setPolling(false)
          toast.error('AI narration request timed out.')
        }
      } catch (err) {
        clearInterval(interval)
        setPolling(false)
      }
    }, 2000)
  }

  return (
    <div className="space-y-8 animate-fade-in-up max-w-4xl">
      {/* Title */}
      <div>
        <h1 className="font-display font-black text-3xl uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-2">
          <Link2 className="w-8 h-8 text-blue-500" /> URL Deep Analyzer
        </h1>
        <p className="font-mono text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">Multi-Heuristic URL Classifier</p>
      </div>

      {/* Input panel */}
      <div className="glass-card p-6 border border-slate-200 dark:border-slate-800/80">
        <form onSubmit={handleScan} className="flex flex-col sm:flex-row gap-4 items-center">
          <div className="flex-1 w-full">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="input-cyber"
              placeholder="https://example-phish-domain.com/login"
              disabled={scanning}
              required
            />
          </div>
          <button
            type="submit"
            className="btn-primary py-3.5 px-8 shrink-0 w-full sm:w-auto justify-center"
            disabled={scanning}
          >
            {scanning ? 'Analyzing URL...' : 'Execute Scan'}
          </button>
        </form>
      </div>

      {/* Scanning HUD loader */}
      {scanning && <ScanningHud />}

      {/* Results panel */}
      {result && !scanning && (
        <div className="space-y-6">
          {/* Header Verdict Card */}
          <div className={`glass-card p-6 relative overflow-hidden border-l-4 ${
            result.risk_label === 'safe'
              ? 'border-l-green-500 bg-green-500/[0.02] border border-slate-200 dark:border-slate-800'
              : result.risk_label === 'suspicious'
              ? 'border-l-amber-500 bg-amber-500/[0.02] border border-slate-200 dark:border-slate-800'
              : 'border-l-red-500 bg-red-500/[0.02] border border-slate-200 dark:border-slate-800 dark:shadow-[0_0_30px_rgba(239,68,68,0.05)]'
          }`}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <span className="font-mono text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Scanner Engine</span>
                <span className="font-mono text-sm text-slate-800 dark:text-slate-200 block font-bold">ML Classifier Model v1.0 // Heuristics Engine</span>
              </div>
              <div className="flex items-center gap-6 shrink-0">
                <div className="text-right">
                  <span className="font-mono text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Risk Score</span>
                  <span className={`font-display font-black text-3xl block ${
                    result.risk_label === 'safe'
                      ? 'text-green-500'
                      : result.risk_label === 'suspicious'
                      ? 'text-amber-500'
                      : 'text-red-500 text-glow-red animate-pulse'
                  }`}>
                    {result.risk_score}%
                  </span>
                </div>
                <span className={`px-4 py-2 font-display font-black text-sm uppercase tracking-widest rounded border ${
                  result.risk_label === 'safe'
                    ? 'bg-green-500/5 border-green-500/20 text-green-500'
                    : result.risk_label === 'suspicious'
                    ? 'bg-amber-500/5 border-amber-500/20 text-amber-500'
                    : 'bg-red-500/5 border-red-500/20 text-red-500 animate-pulse'
                }`}>
                  {result.risk_label}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Indicators */}
            <div className="glass-card p-6 border border-slate-200 dark:border-slate-800/80">
              <h3 className="font-display font-bold text-lg uppercase tracking-wider text-slate-800 dark:text-white mb-4">Matched Signatures</h3>
              {result.indicators?.length === 0 ? (
                <p className="font-mono text-xs text-slate-500 py-4">No risk flags matched url parameters.</p>
              ) : (
                <div className="space-y-3.5">
                  {result.indicators.map((ind, idx) => (
                    <div key={idx} className="p-4 bg-slate-100/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-900 rounded-lg text-xs">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="font-display font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                          {ind.label || ind.title || (typeof ind === 'string' ? ind : 'Threat Signature')}
                        </span>
                        <span className={`font-mono text-[8px] uppercase font-bold px-2 py-0.5 rounded border ${
                          ind.severity === 'critical' || ind.severity === 'high'
                            ? 'bg-red-500/5 text-red-500 border-red-500/10'
                            : 'bg-amber-500/5 text-amber-500 border-amber-500/10'
                        }`}>
                          {ind.severity || 'medium'}
                        </span>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 font-body leading-relaxed">
                        {ind.detail || ind.description || 'Diagnostic parameter match'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AI Narrative */}
            <div className="glass-card p-6 border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between">
              <div>
                <h3 className="font-display font-bold text-lg uppercase tracking-wider text-slate-800 dark:text-white mb-4 flex items-center gap-1.5">
                  <Cpu className="w-5 h-5 text-blue-500 animate-pulse" /> AI Explanation
                </h3>
                {aiAnalysis ? (
                  <div className="text-xs text-slate-600 dark:text-slate-300 font-body leading-relaxed whitespace-pre-line bg-slate-100/50 dark:bg-slate-950/40 p-4.5 rounded-lg border border-slate-200 dark:border-slate-900">
                    {aiAnalysis}
                  </div>
                ) : polling ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3 bg-slate-100/20 dark:bg-slate-950/20 rounded-lg border border-dashed border-slate-200 dark:border-slate-800">
                    <svg className="animate-spin h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="font-mono text-[10px] text-slate-500 uppercase tracking-widest animate-pulse">Generating AI Summary...</span>
                  </div>
                ) : (
                  <p className="font-mono text-xs text-slate-500 py-4">AI explanation was not generated for this scan record.</p>
                )}
              </div>

              <div className="mt-8 pt-4 border-t border-slate-200 dark:border-slate-900/60 text-right">
                <button
                  onClick={() => navigate(`/report/${result.scan.id}`)}
                  className="btn-secondary py-2 text-xs flex items-center gap-1.5 ml-auto"
                >
                  <FileText className="w-4 h-4" /> Full Audit Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
