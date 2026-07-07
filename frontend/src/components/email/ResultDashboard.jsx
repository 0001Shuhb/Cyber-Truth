import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ShieldCheck, ShieldAlert, Shield, AlertTriangle,
  CheckCircle2, XCircle, Link2, Paperclip, User,
  Key, FileText, Ban, Trash2, Flag, Eye,
  ChevronDown, ChevronUp, AlertCircle, Info,
  Lock, Unlock, Mail, Globe, Cpu
} from 'lucide-react'

// ── Severity config ─────────────────────────────────────────────────────────
const SEVERITY_CONFIG = {
  critical: { color: 'text-red-500',    bg: 'bg-red-500/8 border-red-500/20',    dot: 'bg-red-500',    label: 'CRITICAL' },
  high:     { color: 'text-orange-400', bg: 'bg-orange-400/8 border-orange-400/20', dot: 'bg-orange-400', label: 'HIGH' },
  medium:   { color: 'text-amber-400',  bg: 'bg-amber-400/8 border-amber-400/20',  dot: 'bg-amber-400',  label: 'MEDIUM' },
  low:      { color: 'text-yellow-400', bg: 'bg-yellow-400/8 border-yellow-400/20', dot: 'bg-yellow-400', label: 'LOW' },
  info:     { color: 'text-blue-400',   bg: 'bg-blue-400/8 border-blue-400/20',    dot: 'bg-blue-400',   label: 'INFO' },
}

const ACTION_ICON_MAP = {
  ban: Ban, trash: Trash2, shield: Shield, flag: Flag,
  'user-x': XCircle, 'link-off': Link2, paperclip: Paperclip,
  eye: Eye, 'check-circle': CheckCircle2,
}

const ACTION_PRIORITY = {
  critical: 'bg-red-500/10 border-red-500/30 text-red-400',
  high:     'bg-orange-400/10 border-orange-400/30 text-orange-400',
  medium:   'bg-amber-400/10 border-amber-400/30 text-amber-400',
  info:     'bg-green-500/10 border-green-500/30 text-green-400',
}

// ── Animated circular score ring ─────────────────────────────────────────────
function RiskScoreRing({ score, label }) {
  const radius = 52
  const circ = 2 * Math.PI * radius
  const [displayScore, setDisplayScore] = useState(0)
  const [strokeDash, setStrokeDash] = useState(circ)

  useEffect(() => {
    const target = Math.round(score)
    let current = 0
    const step = Math.ceil(target / 40)
    const timer = setInterval(() => {
      current = Math.min(current + step, target)
      setDisplayScore(current)
      setStrokeDash(circ - (current / 100) * circ)
      if (current >= target) clearInterval(timer)
    }, 30)
    return () => clearInterval(timer)
  }, [score])

  const color = label === 'safe' ? '#22c55e'
    : label === 'suspicious' ? '#f59e0b'
    : '#ef4444'

  const glowColor = label === 'safe' ? '0 0 24px rgba(34,197,94,0.35)'
    : label === 'suspicious' ? '0 0 24px rgba(245,158,11,0.35)'
    : '0 0 24px rgba(239,68,68,0.4)'

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ filter: label !== 'safe' ? `drop-shadow(${glowColor})` : 'none' }}>
        <svg width="130" height="130" viewBox="0 0 130 130">
          {/* Track */}
          <circle cx="65" cy="65" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
          {/* Progress */}
          <circle
            cx="65" cy="65" r={radius} fill="none"
            stroke={color} strokeWidth="10"
            strokeDasharray={circ}
            strokeDashoffset={strokeDash}
            strokeLinecap="round"
            transform="rotate(-90 65 65)"
            style={{ transition: 'stroke-dashoffset 0.03s linear' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display font-black text-3xl" style={{ color }}>
            {displayScore}
          </span>
          <span className="font-mono text-[9px] text-slate-400 uppercase tracking-widest">/ 100</span>
        </div>
      </div>
      <span className="font-mono text-[9px] uppercase tracking-widest text-slate-400">Risk Score</span>
    </div>
  )
}

// ── Verdict banner ────────────────────────────────────────────────────────────
function VerdictBanner({ riskLabel, riskScore }) {
  const cfg = {
    safe:       { Icon: ShieldCheck, color: 'text-green-400', border: 'border-l-green-500', bg: 'bg-green-500/5',  pulse: false, headline: 'EMAIL APPEARS SAFE',       sub: 'No significant phishing indicators detected.' },
    suspicious: { Icon: ShieldAlert, color: 'text-amber-400', border: 'border-l-amber-500', bg: 'bg-amber-500/5',  pulse: false, headline: 'SUSPICIOUS EMAIL',          sub: 'Potential phishing signals detected. Exercise caution.' },
    phishing:   { Icon: AlertTriangle, color: 'text-red-400', border: 'border-l-red-500',   bg: 'bg-red-500/5',   pulse: true,  headline: '⚠ PHISHING DETECTED',       sub: 'High-confidence phishing email. Do not click anything.' },
  }[riskLabel] || { Icon: Shield, color: 'text-slate-400', border: 'border-l-slate-500', bg: '', pulse: false, headline: 'ANALYSIS COMPLETE', sub: '' }

  return (
    <div className={`glass-card p-6 border-l-4 ${cfg.border} ${cfg.bg} border border-slate-800/80 relative overflow-hidden`}>
      <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500/10 to-transparent top-0 animate-scan-line" />
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
        {/* Icon + headline */}
        <div className="flex items-center gap-4 flex-1">
          <div className={`p-3 rounded-xl border ${riskLabel === 'phishing' ? 'border-red-500/30 bg-red-500/10' : riskLabel === 'suspicious' ? 'border-amber-500/30 bg-amber-500/10' : 'border-green-500/30 bg-green-500/10'}`}>
            <cfg.Icon className={`w-8 h-8 ${cfg.color} ${cfg.pulse ? 'animate-pulse' : ''}`} />
          </div>
          <div>
            <div className="font-mono text-[9px] text-slate-500 uppercase tracking-widest mb-1">Final Verdict</div>
            <div className={`font-display font-black text-2xl uppercase tracking-wide ${cfg.color}`}>{cfg.headline}</div>
            <div className="text-slate-400 text-xs font-body mt-1">{cfg.sub}</div>
          </div>
        </div>
        {/* Score ring */}
        <RiskScoreRing score={riskScore} label={riskLabel} />
      </div>
    </div>
  )
}

// ── Auth badge ─────────────────────────────────────────────────────────────────
function AuthBadge({ label, value }) {
  const pass = value === 'pass'
  const unknown = !value || value === 'unknown' || value === ''
  return (
    <div className={`px-3 py-1.5 rounded-lg border font-mono text-[9px] uppercase tracking-widest flex items-center gap-1.5
      ${unknown ? 'border-slate-700 text-slate-500 bg-slate-800/40'
        : pass   ? 'border-green-500/30 text-green-400 bg-green-500/10'
                 : 'border-red-500/30 text-red-400 bg-red-500/10'}`}>
      {unknown ? <AlertCircle className="w-3 h-3" /> : pass ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
      {label}: {unknown ? 'N/A' : value.toUpperCase()}
    </div>
  )
}

// ── Collapsible section wrapper ───────────────────────────────────────────────
function Section({ title, icon: Icon, iconColor = 'text-blue-400', children, defaultOpen = true, badge }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="glass-card border border-slate-800/80 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between p-5 hover:bg-slate-800/20 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Icon className={`w-4.5 h-4.5 ${iconColor}`} />
          <span className="font-display font-bold uppercase tracking-wider text-slate-200 text-sm">{title}</span>
          {badge !== undefined && (
            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono text-[9px]">{badge}</span>
          )}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
      </button>
      {open && <div className="px-5 pb-5 border-t border-slate-800/60">{children}</div>}
    </div>
  )
}

// ── Indicator card ─────────────────────────────────────────────────────────────
function IndicatorCard({ ind }) {
  const sev = SEVERITY_CONFIG[ind.severity] || SEVERITY_CONFIG.info
  return (
    <div className={`p-4 rounded-lg border ${sev.bg} flex gap-3`}>
      <span className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${sev.dot}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <span className="font-display font-bold text-xs uppercase tracking-wide text-slate-200 leading-tight">{ind.label}</span>
          <span className={`font-mono text-[8px] px-2 py-0.5 rounded border flex-shrink-0 ${sev.bg} ${sev.color}`}>{sev.label}</span>
        </div>
        <p className="text-xs text-slate-400 font-body leading-relaxed">{ind.detail}</p>
      </div>
    </div>
  )
}

// ── Main ResultDashboard ──────────────────────────────────────────────────────
export default function ResultDashboard({ result, aiAnalysis, polling, onNewScan }) {
  const navigate = useNavigate()
  const {
    risk_score, risk_label, indicators = [], safe_indicators = [],
    recommended_actions = [], features = {}, scan,
    extracted_text, ocr_available, filename,
  } = result

  const threatIndicators = indicators.filter(i => i.severity !== 'info')
  const infoIndicators   = indicators.filter(i => i.severity === 'info')

  const categoryGroups = {}
  threatIndicators.forEach(ind => {
    const cat = ind.category || 'other'
    if (!categoryGroups[cat]) categoryGroups[cat] = []
    categoryGroups[cat].push(ind)
  })

  return (
    <div className="space-y-4 animate-fade-in-up">

      {/* Verdict Banner */}
      <VerdictBanner riskLabel={risk_label} riskScore={risk_score} />

      {/* Recommended Actions */}
      {recommended_actions.length > 0 && (
        <Section title="Recommended Actions" icon={Shield} iconColor="text-blue-400" defaultOpen={true}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
            {recommended_actions.map((action, i) => {
              const ActionIcon = ACTION_ICON_MAP[action.icon] || Shield
              return (
                <div key={i} className={`p-3.5 rounded-lg border flex gap-3 items-start ${ACTION_PRIORITY[action.priority] || ACTION_PRIORITY.info}`}>
                  <ActionIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-display font-bold text-xs uppercase tracking-wide mb-0.5">{action.action}</div>
                    <p className="font-body text-[11px] opacity-80 leading-relaxed">{action.detail}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </Section>
      )}

      {/* Threat Indicators */}
      {threatIndicators.length > 0 && (
        <Section
          title="Threat Indicators"
          icon={AlertTriangle}
          iconColor="text-red-400"
          defaultOpen={true}
          badge={threatIndicators.length}
        >
          <div className="space-y-3 pt-4">
            {['critical','high','medium','low'].map(sev =>
              indicators.filter(i => i.severity === sev).map((ind, i) => (
                <IndicatorCard key={`${sev}-${i}`} ind={ind} />
              ))
            )}
          </div>
        </Section>
      )}

      {/* Safe Indicators */}
      {safe_indicators.length > 0 && (
        <Section title="Safe Signals" icon={CheckCircle2} iconColor="text-green-400" defaultOpen={risk_label === 'safe'} badge={safe_indicators.length}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
            {safe_indicators.map((s, i) => (
              <div key={i} className="p-3.5 rounded-lg border border-green-500/20 bg-green-500/5 flex gap-3">
                <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-display font-bold text-xs uppercase tracking-wide text-green-400 mb-0.5">{s.label}</div>
                  <p className="font-body text-[11px] text-slate-400 leading-relaxed">{s.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Sender & Domain Analysis */}
        <Section title="Sender Analysis" icon={User} iconColor="text-purple-400" defaultOpen={true}>
          <div className="space-y-4 pt-4">
            {features.from_header && (
              <div className="p-3.5 rounded-lg border border-slate-800/80 bg-slate-950/40">
                <div className="font-mono text-[9px] text-slate-500 uppercase tracking-widest mb-1.5">From</div>
                <div className="text-xs text-slate-300 font-mono break-all">{features.from_header}</div>
              </div>
            )}
            {features.reply_to_header && (
              <div className={`p-3.5 rounded-lg border ${features.reply_to_differs ? 'border-red-500/30 bg-red-500/5' : 'border-slate-800/80 bg-slate-950/40'}`}>
                <div className="font-mono text-[9px] text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                  Reply-To {features.reply_to_differs && <span className="text-red-400">⚠ DIFFERS</span>}
                </div>
                <div className="text-xs text-slate-300 font-mono break-all">{features.reply_to_header}</div>
              </div>
            )}
            {features.subject && (
              <div className="p-3.5 rounded-lg border border-slate-800/80 bg-slate-950/40">
                <div className="font-mono text-[9px] text-slate-500 uppercase tracking-widest mb-1.5">Subject</div>
                <div className="text-xs text-slate-300">{features.subject}</div>
              </div>
            )}
            {/* SPF / DKIM / DMARC */}
            <div>
              <div className="font-mono text-[9px] text-slate-500 uppercase tracking-widest mb-2.5">Email Authentication</div>
              <div className="flex flex-wrap gap-2">
                <AuthBadge label="SPF"   value={features.spf_result}  />
                <AuthBadge label="DKIM"  value={features.dkim_result} />
                <AuthBadge label="DMARC" value={features.dmarc_result}/>
              </div>
            </div>
          </div>
        </Section>

        {/* URL Analysis */}
        <Section title="URL Analysis" icon={Globe} iconColor="text-cyan-400" defaultOpen={true}>
          <div className="space-y-3 pt-4">
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Total URLs', value: features.num_urls ?? 0 },
                { label: 'HTTP (Insecure)', value: features.num_http_urls ?? 0, warn: features.num_http_urls > 0 },
                { label: 'Shortened', value: features.shortened_url_count ?? 0, warn: features.shortened_url_count > 0 },
              ].map((stat, i) => (
                <div key={i} className={`p-3 rounded-lg border text-center ${stat.warn ? 'border-amber-500/30 bg-amber-500/5' : 'border-slate-800/80 bg-slate-950/40'}`}>
                  <div className={`font-display font-black text-xl ${stat.warn ? 'text-amber-400' : 'text-slate-200'}`}>{stat.value}</div>
                  <div className="font-mono text-[8px] text-slate-500 uppercase tracking-wide mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>

            {features.extracted_urls?.length > 0 && (
              <div className="space-y-1.5">
                <div className="font-mono text-[9px] text-slate-500 uppercase tracking-widest mb-2">Extracted URLs (preview — do not click)</div>
                {features.extracted_urls.slice(0, 6).map((url, i) => {
                  const isShortened = (features.shortened_urls || []).includes(url)
                  const isBlacklisted = (features.blacklisted_domains || []).some(d => url.includes(d))
                  return (
                    <div key={i} className={`p-2.5 rounded border font-mono text-[10px] break-all flex items-start gap-2
                      ${isBlacklisted ? 'border-red-500/30 bg-red-500/5 text-red-300'
                        : isShortened ? 'border-amber-500/30 bg-amber-500/5 text-amber-300'
                        : 'border-slate-800/60 bg-slate-950/30 text-slate-400'}`}>
                      {isBlacklisted ? <XCircle className="w-3 h-3 text-red-400 flex-shrink-0 mt-0.5" />
                        : isShortened ? <AlertCircle className="w-3 h-3 text-amber-400 flex-shrink-0 mt-0.5" />
                        : <Link2 className="w-3 h-3 text-slate-500 flex-shrink-0 mt-0.5" />}
                      <span>{url}</span>
                    </div>
                  )
                })}
              </div>
            )}

            {(features.obfuscated_urls > 0 || features.href_text_mismatch > 0) && (
              <div className="grid grid-cols-2 gap-2">
                {features.href_text_mismatch > 0 && (
                  <div className="p-2.5 rounded border border-red-500/30 bg-red-500/5">
                    <div className="font-mono text-[9px] text-red-400 uppercase tracking-wide">{features.href_text_mismatch} Link Mismatch(es)</div>
                    <div className="font-mono text-[9px] text-slate-500 mt-0.5">Display ≠ Destination</div>
                  </div>
                )}
                {features.obfuscated_urls > 0 && (
                  <div className="p-2.5 rounded border border-orange-500/30 bg-orange-500/5">
                    <div className="font-mono text-[9px] text-orange-400 uppercase tracking-wide">{features.obfuscated_urls} Obfuscated URL(s)</div>
                    <div className="font-mono text-[9px] text-slate-500 mt-0.5">Encoded / suspicious</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </Section>
      </div>

      {/* Attachment Analysis */}
      {(features.attachment_count > 0 || features.has_attachment_hint) && (
        <Section title="Attachment Analysis" icon={Paperclip} iconColor={features.has_dangerous_attachment ? 'text-red-400' : 'text-slate-400'} defaultOpen={true}>
          <div className="space-y-3 pt-4">
            {features.attachments?.length > 0 ? (
              features.attachments.map((att, i) => (
                <div key={i} className={`p-3.5 rounded-lg border flex items-start gap-3
                  ${att.is_dangerous ? 'border-red-500/30 bg-red-500/5' : 'border-slate-800/80 bg-slate-950/40'}`}>
                  <Paperclip className={`w-4 h-4 flex-shrink-0 mt-0.5 ${att.is_dangerous ? 'text-red-400' : 'text-slate-500'}`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-slate-200">{att.filename || 'unnamed'}</span>
                      {att.is_dangerous && (
                        <span className="px-1.5 py-0.5 rounded border border-red-500/30 bg-red-500/5 text-red-400 font-mono text-[8px] uppercase">DANGEROUS</span>
                      )}
                    </div>
                    <div className="font-mono text-[10px] text-slate-500">{att.content_type} · {(att.size_bytes / 1024).toFixed(1)} KB</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-3.5 rounded-lg border border-amber-500/20 bg-amber-500/5 flex gap-3 mt-2">
                <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-display font-bold text-xs text-amber-400 uppercase tracking-wide mb-0.5">Attachment Reference Detected</div>
                  <p className="font-body text-[11px] text-slate-400">Email mentions attachments. If you have the .eml file, upload it for full attachment analysis.</p>
                </div>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* AI Explanation */}
      <Section title="AI Threat Analysis" icon={Cpu} iconColor="text-blue-400" defaultOpen={false}>
        <div className="pt-4">
          {aiAnalysis ? (
            <div className="p-4 rounded-lg border border-slate-800/60 bg-slate-950/40 text-xs text-slate-300 font-body leading-relaxed whitespace-pre-line">
              {aiAnalysis}
            </div>
          ) : polling ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3 border border-dashed border-slate-800 rounded-lg">
              <svg className="animate-spin h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="font-mono text-[10px] text-slate-500 uppercase tracking-widest animate-pulse">Generating AI Analysis...</span>
            </div>
          ) : (
            <p className="font-mono text-[10px] text-slate-500 py-4">AI explanation not generated for this scan.</p>
          )}
        </div>
      </Section>

      {/* Screenshot OCR note */}
      {ocr_available === false && extracted_text && (
        <div className="p-4 rounded-lg border border-blue-500/20 bg-blue-500/5 flex gap-3">
          <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-display font-bold text-xs text-blue-400 uppercase tracking-wide mb-1">Screenshot Mode — Limited Analysis</div>
            <p className="font-body text-[11px] text-slate-400 leading-relaxed">
              OCR (Tesseract) is not installed on this server, so full text extraction from the screenshot was not possible.
              For best results, paste the email text directly or upload the .eml file.
            </p>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center justify-between gap-4 pt-2">
        <button
          onClick={onNewScan}
          className="btn-secondary py-2.5 px-6 text-sm flex items-center gap-2"
        >
          <Mail className="w-4 h-4" /> Analyze Another Email
        </button>
        {scan?.id && (
          <button
            onClick={() => navigate(`/report/${scan.id}`)}
            className="btn-primary py-2.5 px-6 text-sm flex items-center gap-2"
          >
            <FileText className="w-4 h-4" /> Full Audit Report
          </button>
        )}
      </div>
    </div>
  )
}
