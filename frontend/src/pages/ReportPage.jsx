import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../services/api'
import toast from 'react-hot-toast'
import { 
  FileText, 
  Download, 
  ArrowLeft, 
  Cpu, 
  ShieldAlert, 
  Database, 
  Lock, 
  FileCode,
  AlertOctagon,
  Clock,
  Compass
} from 'lucide-react'

export default function ReportPage() {
  const { id } = useParams()
  const [scan, setScan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    const fetchScanReport = async () => {
      try {
        const response = await api.get(`/api/scan/${id}`)
        setScan(response.data.data.scan)
      } catch (err) {
        toast.error('Failed to load incident report records.')
      } finally {
        setLoading(false)
      }
    }
    fetchScanReport()
  }, [id])

  const handleDownloadPdf = async () => {
    setDownloading(true)
    try {
      // 1. Call backend generator
      const genResponse = await api.post(`/api/report/generate/${id}`)
      const downloadUrl = genResponse.data.data.download_url
      
      // 2. Fetch binary PDF blob using the authenticated axios instance
      const fileResponse = await api.get(downloadUrl, { responseType: 'blob' })
      
      // 3. Trigger download dialog
      const blob = new Blob([fileResponse.data], { type: 'application/pdf' })
      const blobUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = `CyberTruth_Report_${id.substring(0, 8)}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(blobUrl)
      
      toast.success('Report downloaded successfully.')
    } catch (err) {
      toast.error('Failed to compile PDF report.')
    } finally {
      setDownloading(false)
    }
  }

  // Recommendations mapping based on risk label
  const getRecommendations = (label) => {
    switch (label?.toLowerCase()) {
      case 'phishing':
        return [
          { title: "Block Immediately", detail: "Add this host/domain to your DNS sinkhole and corporate firewall blocklist." },
          { title: "Revoke Credentials", detail: "If any analyst or employee interacted with this page, force password resets immediately." },
          { title: "Registrar Abuse Report", detail: "File an abuse report with the domain registrar to fast-track DNS shutdown." }
        ]
      case 'suspicious':
        return [
          { title: "Restrict Access", detail: "Implement warnings on proxy servers to warn analysts before proceeding." },
          { title: "Monitor SSL Registry", detail: "Track certificate transparency logs for changes on this subdomain." }
        ]
      default:
        return [
          { title: "No Urgent Remediation", detail: "No malicious signatures were triggered during heuristics scans." }
        ]
    }
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display font-black text-3xl uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-2">
            <FileText className="w-8 h-8 text-blue-500" /> Security Audit Report
          </h1>
          <p className="font-mono text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">Incident Token: {id}</p>
        </div>
        <div className="flex gap-3">
          <Link to="/dashboard" className="btn-secondary py-2 text-xs flex items-center gap-1.5 font-display">
            <ArrowLeft className="w-4 h-4" /> Console Home
          </Link>
          {scan && (
            <button
              onClick={handleDownloadPdf}
              className="btn-primary py-2 text-xs flex items-center gap-1.5 font-display"
              disabled={downloading}
            >
              <Download className={`w-4 h-4 ${downloading ? 'animate-bounce' : ''}`} />
              {downloading ? 'Compiling PDF...' : 'Download PDF Audit'}
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <svg className="animate-spin h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="font-mono text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest">Generating Audit Details...</span>
          </div>
        </div>
      ) : !scan ? (
        <div className="glass-card p-8 text-center text-slate-500 font-mono text-sm border border-slate-200 dark:border-slate-800">
          Report signature could not be verified in server records.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Main Verdict Summary */}
          <div className={`glass-card p-6 border-l-4 ${
            scan.risk_label === 'safe'
              ? 'border-l-green-500 bg-green-500/[0.01] border border-slate-200 dark:border-slate-800'
              : scan.risk_label === 'suspicious'
              ? 'border-l-amber-500 bg-amber-500/[0.01] border border-slate-200 dark:border-slate-800'
              : 'border-l-red-500 bg-red-500/[0.01] border border-slate-200 dark:border-slate-800 dark:shadow-[0_0_30px_rgba(239,68,68,0.03)]'
          }`}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
              <div className="md:col-span-2">
                <span className="font-mono text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Security Ingestion Payload</span>
                <span className="font-mono text-sm text-slate-800 dark:text-white block break-all font-semibold mt-1">{scan.input_data}</span>
              </div>
              <div>
                <span className="font-mono text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Timestamp Audited</span>
                <span className="font-mono text-xs text-slate-600 dark:text-slate-300 block mt-1">{new Date(scan.created_at).toLocaleString()}</span>
              </div>
              <div className="flex justify-end gap-4 items-center">
                <div className="text-right">
                  <span className="font-mono text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Incident Score</span>
                  <span className={`font-display font-black text-3xl block ${
                    scan.risk_label === 'safe' ? 'text-green-500' : scan.risk_label === 'suspicious' ? 'text-amber-500' : 'text-red-500 text-glow-red'
                  }`}>
                    {scan.risk_score}%
                  </span>
                </div>
                <span className={`px-4 py-2 font-display font-black text-sm uppercase tracking-widest rounded border ${
                  scan.risk_label === 'safe'
                    ? 'bg-green-500/5 border-green-500/20 text-green-500'
                    : scan.risk_label === 'suspicious'
                    ? 'bg-amber-500/5 border-amber-500/20 text-amber-500'
                    : 'bg-red-500/5 border-red-500/20 text-red-500 animate-pulse'
                }`}>
                  {scan.risk_label}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column: AI analysis & timeline info */}
            <div className="md:col-span-2 space-y-6">
              <div className="glass-card p-6 border border-slate-200 dark:border-slate-800 space-y-4">
                <h3 className="font-display font-bold text-lg uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1.5">
                  <Cpu className="w-5 h-5 text-blue-500 animate-pulse" /> AI Explanation & Context
                </h3>
                {scan.ai_analysis ? (
                  <div className="text-xs text-slate-600 dark:text-slate-300 font-body leading-relaxed whitespace-pre-line bg-slate-100/50 dark:bg-slate-950/40 p-4.5 rounded-lg border border-slate-200 dark:border-slate-900">
                    {scan.ai_analysis}
                  </div>
                ) : (
                  <p className="font-mono text-xs text-slate-500 bg-slate-100/30 dark:bg-slate-950/40 p-4 rounded-lg border border-slate-200 dark:border-slate-800">
                    AI analytical explainer is not available for this record.
                  </p>
                )}
              </div>

              {/* Recommendations */}
              <div className="glass-card p-6 border border-slate-200 dark:border-slate-800 space-y-4">
                <h3 className="font-display font-bold text-lg uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1.5">
                  <Compass className="w-5 h-5 text-blue-500" /> Security Recommendations
                </h3>
                <div className="space-y-3">
                  {getRecommendations(scan.risk_label).map((rec, i) => (
                    <div key={i} className="p-3.5 bg-slate-100/40 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-900/60 rounded-lg">
                      <h4 className="font-display font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-200 mb-1">{rec.title}</h4>
                      <p className="text-slate-500 dark:text-slate-400 text-xs font-body leading-relaxed">{rec.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Indicators, Features & Metrics */}
            <div className="space-y-6">
              {/* Timeline Metrics */}
              <div className="glass-card p-6 border border-slate-200 dark:border-slate-800 space-y-4">
                <h3 className="font-display font-bold text-lg uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1.5">
                  <Clock className="w-5 h-5 text-blue-500" /> Session Audits
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-100/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-900 rounded-lg text-xs font-mono">
                    <span className="text-slate-500 block uppercase tracking-wider text-[8px] mb-0.5">Analyst Vector</span>
                    <span className="text-slate-800 dark:text-white uppercase font-bold">{scan.scan_type}</span>
                  </div>
                  <div className="p-3 bg-slate-100/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-900 rounded-lg text-xs font-mono">
                    <span className="text-slate-500 block uppercase tracking-wider text-[8px] mb-0.5">Response latency</span>
                    <span className="text-blue-500 dark:text-cyber-glow font-bold">{scan.scan_duration_ms || '0'} ms</span>
                  </div>
                </div>
              </div>

              {/* Triggered Indicators */}
              <div className="glass-card p-6 border border-slate-200 dark:border-slate-800 space-y-4">
                <h3 className="font-display font-bold text-lg uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1.5">
                  <ShieldAlert className="w-5 h-5 text-red-500" /> Active Signatures
                </h3>
                {(!scan.indicators || scan.indicators.length === 0) ? (
                  <p className="font-mono text-xs text-slate-500 py-2">No indicators triggered.</p>
                ) : (
                  <div className="space-y-3">
                    {scan.indicators.map((ind, idx) => (
                      <div key={idx} className="p-3.5 bg-slate-100/40 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-900/60 rounded-lg text-xs">
                        <span className="font-display font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 block mb-1">
                          {ind.label || ind.title || (typeof ind === 'string' ? ind : 'Threat Signature')}
                        </span>
                        <p className="text-slate-500 dark:text-slate-400 font-body leading-normal">
                          {ind.detail || ind.description || 'Signature matched.'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Raw Features */}
              <div className="glass-card p-6 border border-slate-200 dark:border-slate-800 space-y-4">
                <h3 className="font-display font-bold text-lg uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1.5">
                  <FileCode className="w-5 h-5 text-blue-500" /> Extraction Keys
                </h3>
                <div className="bg-slate-100/50 dark:bg-slate-950/40 p-4 rounded-lg border border-slate-200 dark:border-slate-900 overflow-hidden">
                  <pre className="text-[10px] font-mono text-blue-500 dark:text-cyber-glow overflow-x-auto max-h-64 scrollbar-thin">
                    {JSON.stringify(scan.raw_features || {}, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
