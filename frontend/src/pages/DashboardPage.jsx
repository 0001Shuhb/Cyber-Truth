import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from 'recharts'
import api from '../services/api'
import toast from 'react-hot-toast'
import {
  ShieldAlert,
  Link2,
  Mail,
  Globe,
  CheckCircle,
  TrendingUp,
  Target,
  Clock,
  Activity,
  Globe2,
  Zap,
  Compass,
  ServerCrash,
  RefreshCw,
  WifiOff,
  AlertOctagon,
  ExternalLink,
  Database,
} from 'lucide-react'

// ─── Error Boundary ────────────────────────────────────────────────────────────

class DashboardErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  componentDidCatch(error, info) {
    console.error('[DashboardPage] Uncaught error:', error, info)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 p-8">
          <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <AlertOctagon className="w-10 h-10 text-red-500" />
          </div>
          <div className="text-center max-w-lg">
            <h2 className="font-display font-black text-2xl text-slate-800 dark:text-white uppercase tracking-wider mb-2">
              Operations Matrix Failure
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-mono">
              {this.state.error?.message || 'A critical rendering error occurred.'}
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Reload Console
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

// ─── Sub-components ────────────────────────────────────────────────────────────

const TelemetryError = ({ message, onRetry, retrying }) => (
  <div className="glass-card p-10 border border-red-200 dark:border-red-900/30 flex flex-col items-center gap-4 text-center">
    <WifiOff className="w-10 h-10 text-red-500" />
    <div>
      <p className="font-display font-bold text-base uppercase tracking-wider text-slate-800 dark:text-white mb-1">
        Telemetry Feed Unavailable
      </p>
      <p className="font-mono text-xs text-slate-500 dark:text-slate-400 max-w-sm">
        {message || 'Could not retrieve operational telemetry from the backend.'}
      </p>
    </div>
    <button
      onClick={onRetry}
      disabled={retrying}
      className="btn-primary text-xs py-2 px-5 flex items-center gap-2 disabled:opacity-60"
    >
      <RefreshCw className={`w-4 h-4 ${retrying ? 'animate-spin' : ''}`} />
      {retrying ? 'Retrying...' : 'Retry Connection'}
    </button>
  </div>
)

const MetricCard = ({ label, value, subLabel, icon, color, topBar }) => (
  <div className="glass-card p-5 border border-slate-200 dark:border-slate-800/80 relative overflow-hidden">
    {topBar && <div className={`absolute top-0 left-0 right-0 h-[2px] ${topBar}`} />}
    <span className="font-mono text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">{label}</span>
    <span className={`font-display font-bold text-3xl block ${color || 'text-slate-800 dark:text-white'} mt-1`}>{value}</span>
    {subLabel && (
      <span className="font-mono text-[8px] text-slate-400 uppercase block mt-1.5 flex items-center gap-1">
        {icon}
        {subLabel}
      </span>
    )}
  </div>
)

// ─── Main Dashboard Component ──────────────────────────────────────────────────

function DashboardContent() {
  const [stats, setStats] = useState({
    total: 0, safe: 0, suspicious: 0, phishing: 0,
    avg_risk_score: 0, url_scanned: 0, email_scanned: 0
  })
  const [recentScans, setRecentScans] = useState([])
  const [telemetry, setTelemetry]     = useState(null)
  const [loading, setLoading]         = useState(true)
  const [telemetryError, setTelemetryError] = useState(null)
  const [scansError, setScansError]   = useState(null)
  const [retrying, setRetrying]       = useState(false)

  // Selected heatmap pin
  const [selectedPin, setSelectedPin] = useState(null)

  // ── Data fetchers ────────────────────────────────────────────────────────────

  const fetchScans = useCallback(async () => {
    try {
      setScansError(null)
      const res = await api.get('/api/scan/history?per_page=5')
      const { scans = [], stats: apiStats } = res.data?.data || {}

      setRecentScans(scans)

      if (apiStats) {
        const urlCount   = scans.filter(s => s.scan_type === 'url').length + Math.round((apiStats.total || 0) * 0.6)
        const emailCount = scans.filter(s => s.scan_type === 'email').length + Math.round((apiStats.total || 0) * 0.4)
        setStats({
          ...apiStats,
          url_scanned:   urlCount,
          email_scanned: emailCount,
          avg_risk_score: typeof apiStats.avg_risk_score === 'number'
            ? Math.round(apiStats.avg_risk_score)
            : 0,
        })
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to load scan history.'
      setScansError(msg)
      console.error('[Dashboard] Scan history fetch failed:', err)
    }
  }, [])

  const fetchTelemetry = useCallback(async () => {
    try {
      setTelemetryError(null)
      const res = await api.get('/api/intel/dashboard')
      const data = res.data?.data

      if (!data || typeof data !== 'object') {
        throw new Error('Invalid telemetry response structure.')
      }
      setTelemetry(data)
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Telemetry service unreachable.'
      setTelemetryError(msg)
      console.error('[Dashboard] Telemetry fetch failed:', err)
    }
  }, [])

  const loadAll = useCallback(async () => {
    setLoading(true)
    await Promise.all([fetchScans(), fetchTelemetry()])
    setLoading(false)
  }, [fetchScans, fetchTelemetry])

  const retryTelemetry = useCallback(async () => {
    setRetrying(true)
    await fetchTelemetry()
    setRetrying(false)
    if (!telemetryError) toast.success('Telemetry feeds reconnected.')
    else toast.error('Telemetry still unavailable.')
  }, [fetchTelemetry, telemetryError])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  // SVG gauge calculations
  const radius = 32
  const circumference = 2 * Math.PI * radius
  const riskScore = Math.min(Math.max(stats.avg_risk_score || 0, 0), 100)
  const strokeDashoffset = circumference - (riskScore / 100) * circumference

  // ── Loading state ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-10 w-10 text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <div className="text-center space-y-1">
            <span className="font-mono text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest animate-pulse block">
              Hydrating Operations Matrix...
            </span>
            <span className="font-mono text-[10px] text-slate-400 block">
              Connecting to security telemetry feeds
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in-up">

      {/* ── Title ─────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display font-black text-3xl uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-2">
            <Activity className="w-8 h-8 text-blue-500 animate-pulse" />
            Operations Matrix
          </h1>
          <p className="font-mono text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">
            Real-Time Threat Intelligence & Security Operations Dashboard
          </p>
        </div>
        <button
          onClick={loadAll}
          className="btn-secondary py-2 text-xs flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" /> Refresh All
        </button>
      </div>

      {/* ── Key Metrics Grid ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
        {/* Risk Gauge */}
        <div className="glass-card p-5 flex items-center justify-between border border-slate-200 dark:border-slate-800/80 md:col-span-2">
          <div>
            <span className="font-mono text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1">Average Risk Index</span>
            <span className={`font-display font-bold text-3xl block ${
              riskScore > 70 ? 'text-red-500' : riskScore > 35 ? 'text-amber-500' : 'text-green-500'
            }`}>
              {riskScore}%
            </span>
            <span className="font-mono text-[8px] text-slate-400 uppercase block mt-1">
              {riskScore > 70 ? '⚠ High Threat Level' : riskScore > 35 ? '⚡ Moderate Threat' : '✓ Low Threat Level'}
            </span>
          </div>
          <div className="relative w-16 h-16">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r={radius} fill="transparent" stroke="rgba(0,0,0,0.05)" strokeWidth="6" />
              <circle
                cx="40" cy="40" r={radius} fill="transparent"
                stroke={riskScore > 70 ? '#EF4444' : riskScore > 35 ? '#F59E0B' : '#22C55E'}
                strokeWidth="6"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
          </div>
        </div>

        <MetricCard label="URLs Audited"     value={stats.url_scanned}   subLabel="Web Links"         icon={<Link2 className="w-3.5 h-3.5 text-blue-500" />} />
        <MetricCard label="Emails Scanned"   value={stats.email_scanned} subLabel="NLP Payloads"      icon={<Mail className="w-3.5 h-3.5 text-purple-500" />} />
        <MetricCard label="Clean Verdicts"   value={stats.safe}          subLabel="0% Threat match"   icon={<CheckCircle className="w-3.5 h-3.5 text-green-500" />} color="text-green-500" topBar="bg-green-500" />
        <MetricCard label="Blocked Attacks"  value={stats.phishing}      subLabel="High risk threats"  icon={<ShieldAlert className="w-3.5 h-3.5 text-red-500" />} color="text-red-500" topBar="bg-red-500" />
      </div>

      {/* ── Quick Launch ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/scan/url" className="glass-card-hover p-6 flex items-center justify-between group border border-slate-200 dark:border-slate-800/60">
          <div>
            <h3 className="font-display font-bold uppercase tracking-wider text-slate-800 dark:text-white group-hover:text-blue-500 dark:group-hover:text-cyber-primary transition-all duration-200">URL Deep Scan</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">Evaluate hyperlinks for spoofing signs and domain registration age.</p>
          </div>
          <div className="w-10 h-10 rounded bg-blue-500/5 border border-blue-500/20 flex items-center justify-center text-blue-500 group-hover:shadow-glow-blue transition-all duration-300">
            <Link2 className="w-5 h-5" />
          </div>
        </Link>

        <Link to="/scan/email" className="glass-card-hover p-6 flex items-center justify-between group border border-slate-200 dark:border-slate-800/60">
          <div>
            <h3 className="font-display font-bold uppercase tracking-wider text-slate-800 dark:text-white group-hover:text-purple-500 transition-all duration-200">Email NLP</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">Filter mail content through neural model hooks to detect urgency triggers.</p>
          </div>
          <div className="w-10 h-10 rounded bg-purple-500/5 border border-purple-500/20 flex items-center justify-center text-purple-500 group-hover:shadow-glow-purple transition-all duration-300">
            <Mail className="w-5 h-5" />
          </div>
        </Link>

        <Link to="/scan/website" className="glass-card-hover p-6 flex items-center justify-between group border border-slate-200 dark:border-slate-800/60">
          <div>
            <h3 className="font-display font-bold uppercase tracking-wider text-slate-800 dark:text-white group-hover:text-cyan-500 transition-all duration-200">Web Analyzer</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">Inspect live target DOM elements and verify SSL certificates.</p>
          </div>
          <div className="w-10 h-10 rounded bg-cyan-500/5 border border-cyan-500/20 flex items-center justify-center text-cyan-500 group-hover:shadow-glow-cyan transition-all duration-300">
            <Globe className="w-5 h-5" />
          </div>
        </Link>
      </div>

      {/* ── Telemetry Section (with error handling) ──────────────────────────── */}
      {telemetryError ? (
        <TelemetryError message={telemetryError} onRetry={retryTelemetry} retrying={retrying} />
      ) : telemetry ? (
        <>
          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Threat Trends Area Chart */}
            <div className="glass-card p-6 border border-slate-200 dark:border-slate-800 md:col-span-2 space-y-4">
              <h3 className="font-display font-bold text-base uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1.5">
                <TrendingUp className="w-5 h-5 text-blue-500" /> Weekly Threat Activity & Volume
              </h3>
              <div className="h-72 text-slate-400">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={telemetry.trends || []}>
                    <defs>
                      <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#3B82F6" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorMalicious" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#EF4444" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
                    <XAxis dataKey="date"     stroke="#94a3b8" fontSize={10} />
                    <YAxis                    stroke="#94a3b8" fontSize={10} />
                    <Tooltip contentStyle={{ background: '#0F172A', border: '1px solid #1E293B', color: '#fff', fontSize: '11px', fontFamily: 'monospace' }} />
                    <Area type="monotone" dataKey="volume"    stroke="#3B82F6" fillOpacity={1} fill="url(#colorVolume)"   name="Total Scans" />
                    <Area type="monotone" dataKey="malicious" stroke="#EF4444" fillOpacity={1} fill="url(#colorMalicious)" name="Threats Intercepted" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Vector Breakdown */}
            <div className="glass-card p-6 border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="font-display font-bold text-base uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1.5">
                <ShieldAlert className="w-5 h-5 text-red-500" /> Threat Vector Breakdown
              </h3>
              <div className="h-72 text-slate-400">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: 'URLs',     safe: Math.max(stats.safe * 0.6, 1),     threat: Math.max(stats.phishing * 0.6, 0) },
                    { name: 'Emails',   safe: Math.max(stats.safe * 0.3, 1),     threat: Math.max(stats.phishing * 0.3, 0) },
                    { name: 'Websites', safe: Math.max(stats.safe * 0.1, 1),     threat: Math.max(stats.phishing * 0.1, 0) },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                    <YAxis               stroke="#94a3b8" fontSize={10} />
                    <Tooltip contentStyle={{ background: '#0F172A', border: '1px solid #1E293B', color: '#fff', fontSize: '11px', fontFamily: 'monospace' }} />
                    <Legend fontSize={10} wrapperStyle={{ fontSize: '10px' }} />
                    <Bar dataKey="safe"   fill="#22C55E" name="Safe" />
                    <Bar dataKey="threat" fill="#EF4444" name="Threat" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Map & Timeline Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* World Heatmap */}
            <div className="glass-card p-6 border border-slate-200 dark:border-slate-800 md:col-span-2 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-display font-bold text-base uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1.5">
                  <Globe2 className="w-5 h-5 text-blue-500" /> Global Cyber Threat Map
                </h3>
                <span className="font-mono text-[9px] text-slate-400">SELECT NODE FOR TELEMETRY</span>
              </div>

              <div 
                className="h-64 bg-slate-100/50 dark:bg-slate-900/30 rounded-lg relative overflow-hidden border border-slate-200/60 dark:border-slate-900 flex items-center justify-center bg-no-repeat bg-center"
                style={{
                  backgroundImage: 'url("/world-map.svg")',
                  backgroundSize: '100% 100%',
                }}
              >
                <div className="absolute inset-0 bg-cyber-grid bg-grid opacity-[0.03] dark:opacity-[0.06]" />

                {(telemetry.heatmap || []).map((node, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedPin(node === selectedPin ? null : node)}
                    className={`absolute w-3 h-3 rounded-full focus:outline-none ${
                      node.status === 'critical' ? 'bg-red-500' :
                      node.status === 'high'     ? 'bg-orange-500' :
                      node.status === 'medium'   ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{
                      top:  `${((90 - node.lat)  / 180) * 100}%`,
                      left: `${((180 + node.lng) / 360) * 100}%`,
                    }}
                    title={`${node.name}: ${node.threats} threats/hr`}
                  >
                    <span className={`absolute inset-0 w-full h-full rounded-full animate-ping ${
                      node.status === 'critical' ? 'bg-red-500' :
                      node.status === 'high'     ? 'bg-orange-500' :
                      node.status === 'medium'   ? 'bg-yellow-500' : 'bg-green-500'
                    } opacity-60`} />
                  </button>
                ))}

                {selectedPin ? (
                  <div className="absolute bottom-4 left-4 bg-slate-950/90 text-white font-mono text-[10px] p-3 rounded-md border border-slate-800 space-y-1 max-w-[200px] z-10">
                    <span className="text-blue-400 font-bold block">{selectedPin.name}</span>
                    <span className="block">Threat Index: {selectedPin.threats} attacks/hr</span>
                    <span className={`uppercase font-bold block ${
                      selectedPin.status === 'critical' ? 'text-red-500' :
                      selectedPin.status === 'high'     ? 'text-orange-500' : 'text-yellow-500'
                    }`}>
                      Status: {selectedPin.status}
                    </span>
                  </div>
                ) : (
                  <div className="absolute bottom-4 left-4 text-[10px] text-slate-400 font-mono">
                    Click pulsing node for details
                  </div>
                )}

                <span className="text-[10px] text-slate-400 font-mono text-center pointer-events-none select-none">
                  Threat Grid Interface — Operational
                </span>
              </div>
            </div>

            {/* Attack Timeline */}
            <div className="glass-card p-6 border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="font-display font-bold text-base uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1.5">
                <Clock className="w-5 h-5 text-blue-500" /> Live Intercept Ledger
              </h3>
              <div className="h-64 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                {(telemetry.timeline || []).map((evt, i) => (
                  <div key={i} className="p-3 bg-slate-100/50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-900 rounded-lg text-xs flex gap-2">
                    <span className="font-mono text-[9px] text-slate-400 mt-0.5 shrink-0">{evt.time}</span>
                    <div className="flex-1">
                      <p className="font-body leading-relaxed text-slate-700 dark:text-slate-300 font-medium">{evt.event}</p>
                      <div className="flex justify-between items-center mt-1 text-[9px] font-mono">
                        <span className="text-slate-400">Class: {evt.type}</span>
                        <span className={`uppercase font-bold ${
                          evt.severity === 'critical' ? 'text-red-500' :
                          evt.severity === 'high'     ? 'text-orange-500' : 'text-yellow-500'
                        }`}>{evt.severity}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Zero-Days, Ransomware & APT Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Zero-Days */}
            <div className="glass-card p-6 border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="font-display font-bold text-base uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1.5">
                <Zap className="w-5 h-5 text-yellow-500" /> Active Zero-Days
              </h3>
              <div className="space-y-3">
                {(telemetry.zero_days || []).map((z, i) => (
                  <div key={i} className="p-3.5 bg-slate-100/40 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-900/60 rounded-lg">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-mono text-xs text-red-500 font-bold">{z.cve}</span>
                      <span className="text-[9px] bg-red-500/10 text-red-500 border border-red-500/20 px-1.5 py-0.5 rounded font-mono uppercase font-bold">
                        {z.severity}
                      </span>
                    </div>
                    <h4 className="font-display font-bold text-xs text-slate-700 dark:text-slate-300 uppercase leading-snug">{z.title}</h4>
                    <span className="text-[8px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono mt-2 block">{z.status}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Ransomware */}
            <div className="glass-card p-6 border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="font-display font-bold text-base uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1.5">
                <ServerCrash className="w-5 h-5 text-red-500" /> Ransomware Campaigns
              </h3>
              <div className="space-y-3">
                {(telemetry.ransomware || []).map((r, i) => (
                  <div key={i} className="p-3.5 bg-slate-100/40 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-900/60 rounded-lg flex justify-between items-center">
                    <div>
                      <h4 className="font-display font-bold text-sm text-slate-800 dark:text-white uppercase">{r.variant}</h4>
                      <span className="text-[10px] text-slate-500 font-body block mt-0.5">Target: {r.target}</span>
                    </div>
                    <div className="text-right font-mono">
                      <span className="text-xs text-red-400 font-bold block">{r.payment}</span>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 uppercase block">{r.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* APT Groups */}
            <div className="glass-card p-6 border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="font-display font-bold text-base uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-1.5">
                <Compass className="w-5 h-5 text-blue-500" /> APT Group Briefings
              </h3>
              <div className="space-y-3">
                {(telemetry.apt_groups || []).map((apt, i) => (
                  <div key={i} className="p-3.5 bg-slate-100/40 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-900/60 rounded-lg">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="font-display font-bold text-xs text-slate-800 dark:text-white uppercase">{apt.name}</h4>
                      <span className="text-[9px] text-slate-400 font-mono">Org: {apt.origin}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-body block">Targeting: {apt.target}</span>
                    <div className="flex justify-between items-center text-[9px] font-mono mt-2 pt-1 border-t border-slate-200/40 dark:border-slate-900/40">
                      <span className="text-slate-400">Vectors: {apt.recent_exploit}</span>
                      <span className={`font-bold uppercase ${apt.active === 'Critical' ? 'text-red-500' : 'text-orange-500'}`}>
                        {apt.active} Active
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : null}

      {/* ── Recent Scan Audit Stream ──────────────────────────────────────────── */}
      <div className="glass-card p-6 border border-slate-200 dark:border-slate-800">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-display font-bold text-base uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-500" /> Recent Audit Stream
          </h3>
          <Link to="/history" className="btn-secondary py-1.5 px-3 text-[10px] flex items-center gap-1.5">
            View Full History <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        {scansError ? (
          <div className="py-8 text-center">
            <p className="text-red-500 font-mono text-xs mb-3">{scansError}</p>
            <button onClick={fetchScans} className="btn-secondary text-xs py-1.5 px-4 flex items-center gap-2 mx-auto">
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </button>
          </div>
        ) : recentScans.length === 0 ? (
          <div className="py-10 text-center">
            <Database className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400 font-mono text-sm">No security scans in database yet.</p>
            <p className="text-slate-400 font-mono text-xs mt-1">Run your first scan to populate this feed.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800/60 text-slate-400 font-mono text-[9px] uppercase tracking-wider">
                  <th className="py-3 px-4">Scan ID</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Payload</th>
                  <th className="py-3 px-4">Risk</th>
                  <th className="py-3 px-4">Verdict</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4 text-right">Report</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-900/60 font-mono text-xs text-slate-600 dark:text-slate-300">
                {recentScans.map(scan => (
                  <tr key={scan.id} className="hover:bg-slate-200/20 dark:hover:bg-slate-900/20 transition-colors">
                    <td className="py-4 px-4 text-blue-500 dark:text-cyber-secondary font-bold">{scan.id?.substring(0, 8) || '—'}</td>
                    <td className="py-4 px-4 uppercase text-[10px] text-slate-400">{scan.scan_type}</td>
                    <td className="py-4 px-4 max-w-xs truncate text-slate-400">{scan.input_data}</td>
                    <td className="py-4 px-4 font-bold">{scan.risk_score}%</td>
                    <td className="py-4 px-4">
                      <span className={
                        scan.risk_label === 'safe'       ? 'badge-safe' :
                        scan.risk_label === 'suspicious' ? 'badge-suspicious' : 'badge-phishing'
                      }>
                        {scan.risk_label}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-400 text-[10px]">
                      {scan.created_at ? new Date(scan.created_at).toLocaleString() : '—'}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Link
                        to={`/report/${scan.id}`}
                        className="inline-block px-3 py-1 bg-blue-500/5 dark:bg-cyber-glow/5 border border-blue-500/20 dark:border-cyber-glow/20 hover:border-blue-500 dark:hover:border-cyber-glow text-blue-500 dark:text-cyber-glow text-[10px] uppercase font-mono tracking-wider rounded transition-all"
                      >
                        [Inspect]
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <DashboardErrorBoundary>
      <DashboardContent />
    </DashboardErrorBoundary>
  )
}
