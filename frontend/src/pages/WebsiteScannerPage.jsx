import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import toast from 'react-hot-toast'
import { 
  Globe, 
  Terminal, 
  Cpu, 
  FileText 
} from 'lucide-react'

// Diagnostic terminal UI displayed during deep scanning
const ScanningHud = () => {
  const [logIndex, setLogIndex] = useState(0)
  const logs = [
    'ESTABLISHING CONNECTION TO REMOTE DOMAIN STREAM...',
    'RETRIEVING TARGET PAGE LAYOUT & DOM INSTANCE...',
    'SCANNIG FOR INPUT CHANNELS AND REDIRECT ATTRIBUTES...',
    'QUERYING WHOIS RECORDS AND SSL TRUST CHAIN ROOT...',
    'PROCESSING THREAT INTELLIGENCE DATABASES...',
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
        <span className="flex items-center gap-1.5"><Terminal className="w-4 h-4" /> WEBSITE DIAGNOSTICS ACTIVE</span>
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
          <span>EVALUATING DOM VECTORS...</span>
        </div>
      )}
    </div>
  )
}

export default function WebsiteScannerPage() {
  const [url, setUrl] = useState('')
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState(null)
  const [aiAnalysis, setAiAnalysis] = useState(null)
  const [polling, setPolling] = useState(false)
  const [activeTab, setActiveTab] = useState('summary')
  const navigate = useNavigate()

  const handleScan = async (e) => {
    e.preventDefault()
    if (!url) {
      toast.error('Website URL target is required.')
      return
    }

    setScanning(true)
    setResult(null)
    setAiAnalysis(null)

    try {
      const response = await api.post('/api/scan/website', { url })
      const data = response.data.data
      setResult(data)

      if (data.scan?.id) {
        startPollingForAi(data.scan.id)
      }
      toast.success('DOM parsed. Cert chain extracted.')
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Website scan failed.')
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
          <Globe className="w-8 h-8 text-blue-500" /> Website DOM Scanner
        </h1>
        <p className="font-mono text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">Deep DOM & SSL Diagnostic Node</p>
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
              placeholder="https://mysecurebanking-online.com"
              disabled={scanning}
              required
            />
          </div>
          <button
            type="submit"
            className="btn-primary py-3.5 px-8 shrink-0 w-full sm:w-auto justify-center"
            disabled={scanning}
          >
            {scanning ? 'Injecting Diagnostic Probe...' : 'Run DOM Scan'}
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
                <span className="font-mono text-sm text-slate-800 dark:text-slate-200 block font-bold">Dynamic DOM Analyzer & Cert Evaluator</span>
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

          {/* Diagnostic Tabs */}
          <div className="flex gap-2.5 border-b border-slate-200 dark:border-slate-900 pb-2">
            <button
              onClick={() => setActiveTab('summary')}
              className={`px-4 py-2 text-xs font-display uppercase tracking-widest transition-all rounded ${
                activeTab === 'summary'
                  ? 'bg-blue-500/5 dark:bg-cyber-glow/5 border border-blue-500/20 dark:border-cyber-glow/20 text-blue-500 dark:text-cyber-glow font-bold'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              Summary Analysis
            </button>
            <button
              onClick={() => setActiveTab('ssl')}
              className={`px-4 py-2 text-xs font-display uppercase tracking-widest transition-all rounded ${
                activeTab === 'ssl'
                  ? 'bg-blue-500/5 dark:bg-cyber-glow/5 border border-blue-500/20 dark:border-cyber-glow/20 text-blue-500 dark:text-cyber-glow font-bold'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              SSL Diagnostic
            </button>
            <button
              onClick={() => setActiveTab('whois')}
              className={`px-4 py-2 text-xs font-display uppercase tracking-widest transition-all rounded ${
                activeTab === 'whois'
                  ? 'bg-blue-500/5 dark:bg-cyber-glow/5 border border-blue-500/20 dark:border-cyber-glow/20 text-blue-500 dark:text-cyber-glow font-bold'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              }`}
            >
              WHOIS Records
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {activeTab === 'summary' && (
              <>
                <div className="glass-card p-6 border border-slate-200 dark:border-slate-800 md:col-span-2 space-y-4">
                  <h3 className="font-display font-bold text-lg uppercase tracking-wider text-slate-800 dark:text-white">DOM Structure Metrics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3.5 bg-slate-100/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-900 rounded-lg text-xs font-mono">
                      <span className="text-slate-500 block uppercase tracking-wider text-[8px] mb-1">Form inputs</span>
                      <span className="text-slate-800 dark:text-white font-bold">{result.features?.num_forms || 0} Detected</span>
                    </div>
                    <div className="p-3.5 bg-slate-100/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-900 rounded-lg text-xs font-mono">
                      <span className="text-slate-500 block uppercase tracking-wider text-[8px] mb-1">Pass Fields</span>
                      <span className="text-slate-800 dark:text-white font-bold">{result.features?.password_inputs || 0} Fields</span>
                    </div>
                    <div className="p-3.5 bg-slate-100/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-900 rounded-lg text-xs font-mono">
                      <span className="text-slate-500 block uppercase tracking-wider text-[8px] mb-1">Redirects</span>
                      <span className="text-slate-800 dark:text-white font-bold">{result.features?.num_redirects || 0} Jumps</span>
                    </div>
                    <div className="p-3.5 bg-slate-100/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-900 rounded-lg text-xs font-mono">
                      <span className="text-slate-500 block uppercase tracking-wider text-[8px] mb-1">External scripts</span>
                      <span className="text-slate-800 dark:text-white font-bold">{result.features?.external_scripts || 0} Scripts</span>
                    </div>
                  </div>

                  <div className="bg-slate-100/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-900 p-4.5 rounded-lg">
                    <h4 className="font-display font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-white mb-2.5 flex items-center gap-1.5">
                      <Cpu className="w-4.5 h-4.5 text-blue-500" /> AI Diagnostic Explainer
                    </h4>
                    <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed font-body">
                      {aiAnalysis || (polling ? 'Generating explanation...' : 'Narrative not available.')}
                    </p>
                  </div>
                </div>

                <div className="glass-card p-6 border border-slate-200 dark:border-slate-800 space-y-4 flex flex-col justify-between">
                  <div>
                    <h3 className="font-display font-bold text-lg uppercase tracking-wider text-slate-800 dark:text-white">Threat Indicators</h3>
                    {(!result.indicators || result.indicators.length === 0) ? (
                      <p className="font-mono text-xs text-slate-500 py-2">No danger vectors detected in DOM.</p>
                    ) : (
                      <div className="space-y-3">
                        {result.indicators.map((ind, idx) => (
                          <div key={idx} className="p-3 bg-slate-100/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-900 rounded-lg text-xs">
                            <span className="font-display font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 block mb-1">
                              {ind.label || ind.title || (typeof ind === 'string' ? ind : 'Threat Trigger')}
                            </span>
                            <span className="text-slate-500 dark:text-slate-400 font-body block">
                              {ind.detail || ind.description || 'Signature matched.'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-200 dark:border-slate-900">
                    <button
                      onClick={() => navigate(`/report/${result.scan.id}`)}
                      className="btn-secondary py-2 text-xs flex items-center gap-1.5 ml-auto font-display"
                    >
                      <FileText className="w-4 h-4" /> Full Audit Report
                    </button>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'ssl' && (
              <div className="glass-card p-6 border border-slate-200 dark:border-slate-800 md:col-span-3 space-y-4 font-mono text-xs text-slate-600 dark:text-slate-300">
                <h3 className="font-display font-bold text-lg uppercase tracking-wider text-slate-800 dark:text-white">SSL Trust Certificate Evaluation</h3>
                {result.ssl_details ? (
                  <div className="bg-slate-100/50 dark:bg-slate-950/40 p-5 rounded-lg border border-slate-200 dark:border-slate-900 space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-slate-500 uppercase text-[9px] block">Issuer Common Name</span>
                        <span className="font-bold text-slate-800 dark:text-white">{result.ssl_details.issuer?.CN || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 uppercase text-[9px] block">Subject Organization</span>
                        <span className="font-bold text-slate-800 dark:text-white">{result.ssl_details.subject?.O || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 uppercase text-[9px] block">Cipher Protocol Version</span>
                        <span className="font-bold text-slate-800 dark:text-white">{result.ssl_details.version || 'TLSv1.3'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 uppercase text-[9px] block">Validation Expiry Date</span>
                        <span className="font-bold text-slate-800 dark:text-white">{result.ssl_details.notAfter || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="py-4 text-slate-500">SSL certificate parameters could not be verified securely for this target.</p>
                )}
              </div>
            )}

            {activeTab === 'whois' && (
              <div className="glass-card p-6 border border-slate-200 dark:border-slate-800 md:col-span-3 space-y-4 font-mono text-xs text-slate-600 dark:text-slate-300">
                <h3 className="font-display font-bold text-lg uppercase tracking-wider text-slate-800 dark:text-white">WHOIS Domain Registration Database</h3>
                {result.whois_details ? (
                  <div className="bg-slate-100/50 dark:bg-slate-950/40 p-5 rounded-lg border border-slate-200 dark:border-slate-900 space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-slate-500 uppercase text-[9px] block">Registered Registrar</span>
                        <span className="font-bold text-slate-800 dark:text-white">{result.whois_details.registrar || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 uppercase text-[9px] block">Creation Timestamp</span>
                        <span className="font-bold text-slate-800 dark:text-white">{result.whois_details.creation_date || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 uppercase text-[9px] block">Host Country location</span>
                        <span className="font-bold text-slate-800 dark:text-white">{result.whois_details.country || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 uppercase text-[9px] block">Domain Age</span>
                        <span className="font-bold text-blue-500">{result.whois_details.age_days || 0} days</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="py-4 text-slate-500">WHOIS record signatures could not be retrieved from registration database.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
