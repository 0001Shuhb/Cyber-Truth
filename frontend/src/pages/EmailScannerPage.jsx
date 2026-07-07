import React, { useState, useRef, useEffect, useCallback } from 'react'
import api from '../services/api'
import toast from 'react-hot-toast'
import {
  Mail, Upload, Image as ImageIcon, FileText,
  Terminal, Clipboard, Cpu, ChevronRight,
  AlertTriangle, CheckCircle2, Info
} from 'lucide-react'
import ResultDashboard from '../components/email/ResultDashboard'

// ── Animated scanning HUD ─────────────────────────────────────────────────────
function ScanningHUD({ mode }) {
  const [logIndex, setLogIndex] = useState(0)
  const logs = {
    paste: [
      'INGESTING RAW EMAIL HEADERS AND BODY TEXT...',
      'RUNNING NATURAL LANGUAGE ANALYSIS...',
      'EXTRACTING URL SIGNATURES AND DOMAINS...',
      'EVALUATING SENDER AUTHENTICATION HEADERS...',
      'CROSS-REFERENCING AGAINST THREAT INTELLIGENCE...',
      'SCORING PHISHING PROBABILITY WITH ML ENGINE...',
      'COMPILING THREAT INDICATORS AND VERDICT...',
    ],
    file: [
      'PARSING .EML FILE STRUCTURE...',
      'EXTRACTING SMTP HEADERS AND RELAY CHAIN...',
      'ANALYZING MIME PARTS AND ATTACHMENT METADATA...',
      'RUNNING SPF / DKIM / DMARC VALIDATION...',
      'EXTRACTING EMBEDDED URLS AND LINK TARGETS...',
      'SCORING WITH PHISHING CLASSIFICATION MODEL...',
      'GENERATING THREAT INTELLIGENCE REPORT...',
    ],
    image: [
      'PROCESSING SCREENSHOT IMAGE...',
      'PERFORMING OPTICAL CHARACTER RECOGNITION...',
      'EXTRACTING TEXT CONTENT FROM IMAGE...',
      'ANALYZING EXTRACTED EMAIL CONTENT...',
      'RUNNING PHISHING PATTERN DETECTION...',
      'COMPILING ANALYSIS RESULTS...',
    ],
  }[mode] || []

  useEffect(() => {
    const timer = setInterval(() => {
      setLogIndex(p => Math.min(p + 1, logs.length - 1))
    }, 700)
    return () => clearInterval(timer)
  }, [logs.length])

  return (
    <div className="glass-card p-5 border border-slate-800/80 font-mono text-xs space-y-2 relative overflow-hidden">
      <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent top-0 animate-scan-line" />
      <div className="text-blue-400 font-bold uppercase border-b border-slate-800 pb-2 mb-3 flex justify-between items-center">
        <span className="flex items-center gap-1.5"><Terminal className="w-4 h-4" /> ANALYSIS ENGINE ONLINE</span>
        <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
      </div>
      {logs.slice(0, logIndex + 1).map((log, i) => (
        <div key={i} className="flex gap-2 text-slate-300 animate-fade-in-up">
          <span className="text-slate-600">&gt;&gt;</span>
          <span>{log}</span>
        </div>
      ))}
      {logIndex < logs.length - 1 && (
        <div className="flex items-center gap-1.5 text-blue-400 animate-pulse">
          <span className="text-slate-600">&gt;&gt;</span>
          <span>PROCESSING...</span>
          <span className="inline-block w-1 h-3 bg-blue-400 animate-pulse ml-0.5" />
        </div>
      )}
    </div>
  )
}

// ── Tab button ────────────────────────────────────────────────────────────────
function TabButton({ id, active, icon: Icon, label, sublabel, onClick }) {
  return (
    <button
      onClick={() => onClick(id)}
      className={`flex-1 flex flex-col sm:flex-row items-center gap-2 p-4 rounded-xl border transition-all duration-200 text-left group
        ${active
          ? 'border-blue-500/40 bg-blue-500/10 text-blue-300 shadow-[0_0_16px_rgba(59,130,246,0.12)]'
          : 'border-slate-800/80 bg-slate-900/40 text-slate-500 hover:border-slate-700 hover:text-slate-400'
        }`}
    >
      <div className={`p-2 rounded-lg border flex-shrink-0 transition-colors
        ${active ? 'border-blue-500/30 bg-blue-500/10' : 'border-slate-800 bg-slate-800/50 group-hover:border-slate-700'}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <div className="font-display font-bold text-xs uppercase tracking-wide">{label}</div>
        <div className="font-mono text-[9px] opacity-60 mt-0.5 hidden sm:block">{sublabel}</div>
      </div>
    </button>
  )
}

// ── Paste tab ─────────────────────────────────────────────────────────────────
function PasteTab({ onSubmit, loading }) {
  const [content, setContent] = useState('')
  const charCount = content.length

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!content.trim()) { toast.error('Please paste email content first.'); return }
    onSubmit({ mode: 'paste', content })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="font-mono text-[9px] uppercase tracking-widest text-slate-500">
            Raw Email Content (Headers + Body)
          </label>
          <span className={`font-mono text-[9px] ${charCount > 45000 ? 'text-red-400' : 'text-slate-600'}`}>
            {charCount.toLocaleString()} / 50,000
          </span>
        </div>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          className="input-cyber resize-none"
          style={{ minHeight: '220px' }}
          placeholder={`Paste the full email content here, including headers if available.\n\nExample headers:\nFrom: "PayPal Support" <support@paypal-secure-verify.net>\nTo: you@example.com\nSubject: URGENT: Verify your account now!\n\nDear Customer,\nYour account has been temporarily suspended...`}
          disabled={loading}
          maxLength={50000}
        />
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 p-3 rounded-lg border border-blue-500/10 bg-blue-500/5 flex gap-2.5">
          <Info className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="font-mono text-[9px] text-slate-500 leading-relaxed">
            Include email headers (From, Reply-To, Authentication-Results) for SPF/DKIM/DMARC analysis. The more context, the better the detection.
          </p>
        </div>
        <button type="submit" className="btn-primary py-3 px-8 flex-shrink-0 flex items-center gap-2" disabled={loading || !content.trim()}>
          {loading ? 'Analyzing...' : <><ChevronRight className="w-4 h-4" />Analyze</>}
        </button>
      </div>
    </form>
  )
}

// ── File upload tab ───────────────────────────────────────────────────────────
function FileUploadTab({ onSubmit, loading }) {
  const [file, setFile] = useState(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef()

  const handleFile = (f) => {
    if (!f) return
    const ext = f.name.split('.').pop().toLowerCase()
    if (!['eml', 'txt', 'msg'].includes(ext)) {
      toast.error('Only .eml, .txt, or .msg files are accepted.')
      return
    }
    if (f.size > 5 * 1024 * 1024) {
      toast.error('File exceeds 5MB limit.')
      return
    }
    setFile(f)
  }

  const onDrop = (e) => {
    e.preventDefault(); setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!file) { toast.error('Please select an .eml file.'); return }
    onSubmit({ mode: 'file', file })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !file && inputRef.current?.click()}
        className={`relative rounded-xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center gap-4 p-10
          ${dragging ? 'border-blue-500 bg-blue-500/10 scale-[1.01]' : file ? 'border-green-500/40 bg-green-500/5' : 'border-slate-700 bg-slate-900/40 hover:border-slate-600 hover:bg-slate-800/30'}`}
      >
        <input ref={inputRef} type="file" accept=".eml,.txt,.msg" className="hidden" onChange={e => handleFile(e.target.files[0])} />
        {file ? (
          <>
            <CheckCircle2 className="w-10 h-10 text-green-400" />
            <div className="text-center">
              <div className="font-display font-bold text-sm text-green-400 uppercase tracking-wide">{file.name}</div>
              <div className="font-mono text-[10px] text-slate-500 mt-1">{(file.size / 1024).toFixed(1)} KB · Click to change</div>
            </div>
          </>
        ) : (
          <>
            <div className="p-4 rounded-full border border-slate-700 bg-slate-800/50">
              <Upload className="w-8 h-8 text-slate-400" />
            </div>
            <div className="text-center">
              <div className="font-display font-bold text-sm text-slate-300 uppercase tracking-wide">Drop .EML File Here</div>
              <div className="font-mono text-[10px] text-slate-500 mt-1">or click to browse · Max 5MB · .eml .txt .msg</div>
            </div>
          </>
        )}
      </div>

      <div className="p-3.5 rounded-lg border border-blue-500/10 bg-blue-500/5 flex gap-2.5">
        <Info className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
        <p className="font-mono text-[9px] text-slate-500 leading-relaxed">
          <strong className="text-slate-400">.eml files</strong> contain full email data including headers, body, and attachments. In Gmail: open email → ⋮ menu → "Download message". In Outlook: File → Save As → .msg.
          Full attachment analysis, SPF/DKIM/DMARC, and sender chain analysis available with .eml files.
        </p>
      </div>

      <div className="flex justify-end">
        <button type="submit" className="btn-primary py-3 px-8 flex items-center gap-2" disabled={loading || !file}>
          {loading ? 'Analyzing...' : <><ChevronRight className="w-4 h-4" />Analyze File</>}
        </button>
      </div>
    </form>
  )
}

// ── Screenshot upload tab ─────────────────────────────────────────────────────
function ScreenshotTab({ onSubmit, loading }) {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef()

  const handleFile = (f) => {
    if (!f) return
    const ext = f.name.split('.').pop().toLowerCase()
    if (!['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'].includes(ext)) {
      toast.error('Only image files are accepted (PNG, JPG, WEBP).')
      return
    }
    if (f.size > 10 * 1024 * 1024) {
      toast.error('Image exceeds 10MB limit.')
      return
    }
    setFile(f)
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target.result)
    reader.readAsDataURL(f)
  }

  const onDrop = (e) => {
    e.preventDefault(); setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!file) { toast.error('Please select a screenshot.'); return }
    onSubmit({ mode: 'image', file })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !preview && inputRef.current?.click()}
        className={`relative rounded-xl border-2 border-dashed transition-all overflow-hidden
          ${dragging ? 'border-blue-500 bg-blue-500/10' : preview ? 'border-blue-500/40 cursor-default' : 'border-slate-700 bg-slate-900/40 hover:border-slate-600 cursor-pointer'}`}
        style={{ minHeight: preview ? 'auto' : '200px' }}
      >
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => handleFile(e.target.files[0])} />
        {preview ? (
          <div className="relative group">
            <img src={preview} alt="Email screenshot preview" className="w-full max-h-72 object-contain bg-slate-950/40" />
            <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); inputRef.current?.click() }}
                className="btn-secondary py-2 px-4 text-xs"
              >Change Image</button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 p-10">
            <div className="p-4 rounded-full border border-slate-700 bg-slate-800/50">
              <ImageIcon className="w-8 h-8 text-slate-400" />
            </div>
            <div className="text-center">
              <div className="font-display font-bold text-sm text-slate-300 uppercase tracking-wide">Upload Email Screenshot</div>
              <div className="font-mono text-[10px] text-slate-500 mt-1">PNG, JPG, WEBP · Max 10MB</div>
            </div>
          </div>
        )}
      </div>

      <div className="p-3.5 rounded-lg border border-amber-500/10 bg-amber-500/5 flex gap-2.5">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="font-mono text-[9px] text-slate-500 leading-relaxed">
          <strong className="text-amber-400">Screenshot Mode</strong> requires OCR (Tesseract) for full text extraction. If unavailable on this server, analysis will be limited. For best results, use Paste or .eml upload modes.
          <strong className="text-slate-400 ml-1">Never take screenshots of links</strong> — use copy-paste instead.
        </p>
      </div>

      <div className="flex justify-end">
        <button type="submit" className="btn-primary py-3 px-8 flex items-center gap-2" disabled={loading || !file}>
          {loading ? 'Processing...' : <><ChevronRight className="w-4 h-4" />Analyze Screenshot</>}
        </button>
      </div>
    </form>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'paste', label: 'Paste Content', sublabel: 'Headers + body text', icon: Clipboard },
  { id: 'file',  label: 'Upload .EML',   sublabel: 'Full email file',     icon: FileText  },
  { id: 'image', label: 'Screenshot',    sublabel: 'Image of email',      icon: ImageIcon },
]

export default function EmailScannerPage() {
  const [activeTab, setActiveTab] = useState('paste')
  const [loading, setLoading]     = useState(false)
  const [result, setResult]       = useState(null)
  const [aiAnalysis, setAiAnalysis] = useState(null)
  const [polling, setPolling]     = useState(false)
  const resultRef = useRef()

  const scrollToResult = () => {
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
  }

  const startPollingForAi = useCallback((scanId) => {
    setPolling(true)
    let attempts = 0
    const MAX = 15
    const timer = setInterval(async () => {
      attempts++
      try {
        const res = await api.get(`/api/scan/${scanId}/status`)
        const s = res.data.data
        if (s.ai_analysis) {
          setAiAnalysis(s.ai_analysis)
          clearInterval(timer)
          setPolling(false)
        } else if (attempts >= MAX) {
          clearInterval(timer)
          setPolling(false)
        }
      } catch {
        clearInterval(timer)
        setPolling(false)
      }
    }, 2000)
  }, [])

  const handleSubmit = async ({ mode, content, file }) => {
    setLoading(true)
    setResult(null)
    setAiAnalysis(null)

    try {
      let response

      if (mode === 'paste') {
        response = await api.post('/api/scan/email', { content })

      } else if (mode === 'file') {
        const form = new FormData()
        form.append('file', file)
        response = await api.post('/api/scan/email/file', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })

      } else if (mode === 'image') {
        const form = new FormData()
        form.append('file', file)
        response = await api.post('/api/scan/email/image', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      }

      const data = response.data.data
      setResult(data)

      const label = data.risk_label
      if (label === 'phishing') {
        toast.error(`⚠ PHISHING DETECTED — Risk: ${data.risk_score}%`, { duration: 5000 })
      } else if (label === 'suspicious') {
        toast(`⚠ Suspicious email — Risk: ${data.risk_score}%`, { icon: '🟠', duration: 4000 })
      } else {
        toast.success(`✓ Email appears safe — Risk: ${data.risk_score}%`)
      }

      if (data.scan?.id) startPollingForAi(data.scan.id)
      scrollToResult()

    } catch (err) {
      const msg = err.response?.data?.error?.message || err.message || 'Analysis failed.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleNewScan = () => {
    setResult(null)
    setAiAnalysis(null)
    setPolling(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="space-y-8 animate-fade-in-up max-w-5xl">

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2.5 rounded-lg border border-blue-500/30 bg-blue-500/10">
            <Mail className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h1 className="font-display font-black text-3xl uppercase tracking-wider text-white">
              Email Threat Analyzer
            </h1>
            <p className="font-mono text-[9px] text-slate-500 uppercase tracking-widest mt-0.5">
              AI-Powered Phishing Detection · Never Click Suspicious Links
            </p>
          </div>
        </div>

        {/* Security note */}
        <div className="p-4 rounded-xl border border-green-500/20 bg-green-500/5 flex gap-3">
          <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
          <p className="font-mono text-[10px] text-slate-400 leading-relaxed">
            <strong className="text-green-400">Safe Analysis Mode</strong> — This system analyzes email content without
            opening any links, executing attachments, or contacting external servers. Your email content is analyzed
            locally and never stored permanently.
          </p>
        </div>
      </div>

      {/* Input section (hide when result is shown) */}
      {!result && (
        <div className="glass-card p-6 border border-slate-800/80 space-y-6">
          {/* Tab selector */}
          <div>
            <div className="font-mono text-[9px] uppercase tracking-widest text-slate-500 mb-3">Choose Analysis Mode</div>
            <div className="flex gap-3">
              {TABS.map(t => (
                <TabButton
                  key={t.id}
                  id={t.id}
                  active={activeTab === t.id}
                  icon={t.icon}
                  label={t.label}
                  sublabel={t.sublabel}
                  onClick={setActiveTab}
                />
              ))}
            </div>
          </div>

          {/* Active tab content */}
          <div className="border-t border-slate-800/60 pt-6">
            {activeTab === 'paste' && <PasteTab onSubmit={handleSubmit} loading={loading} />}
            {activeTab === 'file'  && <FileUploadTab onSubmit={handleSubmit} loading={loading} />}
            {activeTab === 'image' && <ScreenshotTab onSubmit={handleSubmit} loading={loading} />}
          </div>
        </div>
      )}

      {/* Scanning HUD */}
      {loading && <ScanningHUD mode={activeTab} />}

      {/* Result Dashboard */}
      {result && !loading && (
        <div ref={resultRef}>
          <ResultDashboard
            result={result}
            aiAnalysis={aiAnalysis}
            polling={polling}
            onNewScan={handleNewScan}
          />
        </div>
      )}
    </div>
  )
}
