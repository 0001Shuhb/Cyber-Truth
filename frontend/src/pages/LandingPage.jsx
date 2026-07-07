import React, { useState, useEffect, useContext } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ThemeContext } from '../context/ThemeContext'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Shield, 
  Link2, 
  Mail, 
  Globe, 
  ArrowRight, 
  Activity, 
  CheckCircle, 
  Users, 
  Cpu, 
  HelpCircle, 
  Moon, 
  Sun,
  Globe2,
  Terminal,
  Zap,
  Server,
  ExternalLink,
  Radio,
  WifiOff,
  RefreshCw,
  Clock
} from 'lucide-react'
import { getNews } from '../services/intelService'
import Footer from '../components/common/Footer'

export default function LandingPage() {
  const { isAuthenticated } = useAuth()
  const { theme, toggleTheme } = useContext(ThemeContext)
  const [scanStep, setScanStep] = useState(0)
  
  // Dynamic Threat Counter state
  const [threatCount, setThreatCount] = useState(482310)

  // News wire state
  const [news, setNews] = useState([])
  const [newsLoading, setNewsLoading] = useState(true)
  const [newsError, setNewsError] = useState(null)

  const fetchNewsData = async () => {
    try {
      setNewsLoading(true)
      setNewsError(null)
      const articles = await getNews({ limit: 3 })
      setNews(articles)
    } catch (err) {
      console.error('Error fetching landing page news:', err)
      setNewsError(err.message || 'Unable to connect to security news feed.')
    } finally {
      setNewsLoading(false)
    }
  }

  useEffect(() => {
    fetchNewsData()
  }, [])

  // Simulation steps for mock scanner
  const scanTimeline = [
    { text: 'CYBER TRUTH INTELLIGENCE GATEWAY INITIALIZED...', type: 'info' },
    { text: 'INGESTING STREAM: http://paypal-security-update.com/login', type: 'info' },
    { text: 'PARSING STRUCTURAL INDICATORS & DNS ROOT RECORDS...', type: 'info' },
    { text: 'WARNING: DOMAIN AGE IS LESS THAN 24 HOURS (WHOIS SENSITIVE)', type: 'warn' },
    { text: 'WARNING: KEYWORD MATCH TRIPPED ON SENSITIVE BRAND STRINGS', type: 'warn' },
    { text: 'EVALUATING DOM CONTENT AND RE-ROUTING SCRIPTS...', type: 'info' },
    { text: 'RUNNING MACHINE LEARNING DEEP INFERENCE CLASSIFIER...', type: 'info' },
    { text: 'ML THREAT CLASSIFICATION COMPLETE: 98.6% [PHISHING RISK]', type: 'danger' },
    { text: 'ALERT: BLOCK MATCH FOUND ON ABUSEIPDB MALICIOUS IP LIST', type: 'danger' },
    { text: 'VERDICT RESOLVED: PROACTIVE THREAT BLOCKED SUCCESSFULLY', type: 'success' },
  ]

  // Statistics
  const statistics = [
    { value: "94%", label: "of breaches start with a phishing attack", icon: <Mail className="w-5 h-5 text-blue-500" /> },
    { value: "3.2B", label: "spam emails sent globally every day", icon: <Globe className="w-5 h-5 text-cyan-500" /> },
    { value: "43%", label: "of cyber attacks target small businesses", icon: <Shield className="w-5 h-5 text-emerald-500" /> },
    { value: "<400ms", label: "Cyber Truth model inference latency", icon: <Cpu className="w-5 h-5 text-purple-500" /> }
  ]

  // Testimonials
  const testimonials = [
    { quote: "Cyber Truth's NLP scanner caught a spear-phishing campaign that bypassed our traditional security gateways.", analyst: "Sarah Jenkins", role: "SOC Manager, Securitas Corp" },
    { quote: "The circular risk dashboards and API speeds are top tier. We integrated URL scanning directly into our Slack bot.", analyst: "Marcus Vance", role: "Principal Cloud Architect, FinTech Global" }
  ]

  // FAQ Accordion
  const [openFaq, setOpenFaq] = useState(null)
  const faqs = [
    { q: "How does the AI model score threats?", a: "Cyber Truth extracts 28 features from URL geometry (subdomains, character count, TLD risk) and applies a random forest classifier trained on millions of verified malicious domains." },
    { q: "What does the Email NLP Scanner detect?", a: "It scans raw mail text bodies for urgency cues, impersonation headers, bank fraud tokens, and dangerous redirections." },
    { q: "Can I download security reports?", a: "Yes, every completed scan triggers a comprehensive PDF audit report containing WHOIS, SSL configurations, and MITRE ATT&CK recommendations." }
  ]

  useEffect(() => {
    // Tick mock threat scanner timeline
    const timer = setInterval(() => {
      setScanStep((prev) => (prev + 1) % (scanTimeline.length + 3))
    }, 1600)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    // Increment threat counter randomly
    const counterTimer = setInterval(() => {
      setThreatCount(prev => prev + Math.floor(Math.random() * 3) + 1)
    }, 3000)
    return () => clearInterval(counterTimer)
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-cyber-bg-dark text-slate-800 dark:text-slate-100 font-body relative overflow-hidden flex flex-col justify-between transition-colors duration-300">
      
      {/* Background Grid Overlay */}
      <div className="absolute inset-0 bg-cyber-grid bg-grid opacity-[0.03] dark:opacity-[0.08] pointer-events-none z-0"></div>

      {/* Cyberpunk Glow Accents */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/5 dark:bg-cyber-primary/5 blur-[130px] rounded-full pointer-events-none z-0"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[500px] h-[500px] bg-purple-500/5 blur-[130px] rounded-full pointer-events-none z-0"></div>

      {/* Floating particles (CSS Keyframe based) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute w-2 h-2 bg-blue-500/20 rounded-full top-20 left-10 animate-pulse"></div>
        <div className="absolute w-3.5 h-3.5 bg-cyan-500/10 rounded-full bottom-40 right-20 animate-bounce" style={{ animationDuration: '6s' }}></div>
        <div className="absolute w-1.5 h-1.5 bg-emerald-500/30 rounded-full top-1/2 left-3/4 animate-pulse"></div>
      </div>

      {/* Header / Navbar */}
      <header className="w-full h-20 border-b border-slate-200 dark:border-slate-900 bg-white/70 dark:bg-slate-950/40 backdrop-blur-md px-8 flex items-center justify-between z-10 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-blue-500/10 dark:bg-cyber-primary/10 border border-blue-500/30 dark:border-cyber-primary/40 flex items-center justify-center shadow-sm">
            <Shield className="w-4 h-4 text-blue-500 dark:text-cyber-primary" />
          </div>
          <div>
            <span className="font-display font-black tracking-wider text-xl text-blue-500 dark:text-cyber-primary block">CYBER TRUTH</span>
            <span className="font-mono text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-widest block">AI Threat Intel</span>
          </div>
        </div>

      {/* Scroll Navigation Links */}
      <div className="hidden md:flex items-center gap-8 font-mono text-[11px] uppercase tracking-wider">
        <a href="#features" className="text-slate-500 hover:text-blue-500 dark:text-slate-400 dark:hover:text-cyber-glow transition-colors">Heuristics</a>
        <a href="#news" className="text-slate-500 hover:text-blue-500 dark:text-slate-400 dark:hover:text-cyber-glow transition-colors">News Wire</a>
        <a href="#faq" className="text-slate-500 hover:text-blue-500 dark:text-slate-400 dark:hover:text-cyber-glow transition-colors">FAQ</a>
      </div>

      <div className="flex items-center gap-4">
          {/* Light/Dark Toggle */}
          <button 
            onClick={toggleTheme}
            className="p-2 hover:bg-slate-200/60 dark:hover:bg-slate-900/60 rounded-full text-slate-500 dark:text-slate-400 transition-colors"
            title="Toggle theme"
          >
            {theme === 'light' ? <Moon className="w-4.5 h-4.5" /> : <Sun className="w-4.5 h-4.5" />}
          </button>

          {isAuthenticated ? (
            <Link to="/dashboard" className="btn-secondary py-2 text-xs">
              Operations Center
            </Link>
          ) : (
            <>
              <Link to="/login" className="px-3 py-2 text-xs font-display tracking-widest uppercase text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-cyber-primary transition-all duration-200">
                Sign In
              </Link>
              <Link to="/register" className="btn-primary py-2 text-xs">
                Establish Session
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center text-center px-6 max-w-6xl mx-auto py-16 z-10 w-full">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-blue-500/20 dark:border-cyber-primary/30 bg-blue-500/5 dark:bg-cyber-primary/5 font-mono text-[10px] text-blue-500 dark:text-cyber-primary uppercase tracking-widest mb-8 shadow-sm"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-blue-500 dark:bg-cyber-primary animate-ping"></span>
          SECURE SHIELD ACTIVE // BLOCKED: {threatCount.toLocaleString()}
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="font-display font-black text-4xl sm:text-6xl md:text-7xl uppercase tracking-tight text-slate-800 dark:text-white mb-6 leading-[1.1]"
        >
          AI-Powered <br />
          <span className="text-gradient-cyber text-glow-blue">Cyber Threat Intelligence</span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-slate-500 dark:text-slate-400 font-body text-sm md:text-base max-w-3xl mb-12 leading-relaxed"
        >
          An enterprise-level platform utilizing Natural Language Processing (NLP) models, structural heuristics analysis, and live threat feed aggregation to scoring and intercepting deceptive phishing threats.
        </motion.p>

        {/* Action Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-16 w-full sm:w-auto"
        >
          {isAuthenticated ? (
            <Link to="/dashboard" className="btn-primary text-xs px-9 py-4 flex items-center gap-2">
              Enter Dashboard Console <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn-primary text-xs px-9 py-4 flex items-center gap-2">
                Initialize System Access <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/register" className="btn-secondary text-xs px-9 py-4">
                Establish Analyst Profile
              </Link>
            </>
          )}
        </motion.div>

        {/* Live Mock Threat Simulator Panel */}
        <div className="w-full max-w-3xl glass-card border border-slate-200 dark:border-slate-800/80 rounded-xl overflow-hidden shadow-xl mb-20 relative">
          <div className="h-10 bg-slate-100 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-900 px-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-green-500/80"></span>
            </div>
            <span className="font-mono text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-blue-500" /> AI INTERACTIVE INGESTION terminal
            </span>
            <span className="w-4"></span>
          </div>

          <div className="p-6 bg-slate-50/50 dark:bg-slate-950/40 min-h-[160px] text-left font-mono text-[11px] space-y-2.5 max-h-[220px] overflow-y-auto">
            {scanTimeline.slice(0, scanStep + 1).map((line, idx) => {
              let color = 'text-slate-500 dark:text-slate-400'
              if (line.type === 'warn') color = 'text-cyber-warning'
              if (line.type === 'danger') color = 'text-cyber-danger'
              if (line.type === 'success') color = 'text-cyber-accent font-bold text-glow-green'
              
              return (
                <div key={idx} className={`${color} flex items-start gap-2.5 animate-fade-in-up`}>
                  <span className="text-slate-400 dark:text-slate-600 select-none">&gt;&gt;</span>
                  <span>{line.text}</span>
                </div>
              )
            })}
            
            {scanStep < scanTimeline.length && (
              <div className="flex items-center gap-1.5 text-blue-500 dark:text-cyber-secondary animate-pulse">
                <span className="text-slate-400 dark:text-slate-600 select-none">&gt;&gt;</span>
                <span>PROCESSING INTEL STREAM...</span>
              </div>
            )}
          </div>
        </div>

        {/* Cybersecurity Statistics Section */}
        <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
          {statistics.map((stat, idx) => (
            <motion.div 
              key={idx}
              whileHover={{ y: -3 }}
              className="glass-card p-5 border border-slate-200 dark:border-slate-800 text-center flex flex-col items-center"
            >
              <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center mb-3">
                {stat.icon}
              </div>
              <span className="font-display font-black text-2xl md:text-3xl text-slate-800 dark:text-white">{stat.value}</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block mt-1 leading-relaxed">{stat.label}</span>
            </motion.div>
          ))}
        </div>

        {/* Feature Cards Grid */}
        <div id="features" className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left mb-20 scroll-mt-24">
          {/* Card 1 */}
          <div className="glass-card-hover p-7 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-blue-500"></div>
            <div className="w-11 h-11 rounded bg-blue-500/5 border border-blue-500/20 flex items-center justify-center mb-5 text-blue-500">
              <Link2 className="w-5 h-5" />
            </div>
            <h3 className="font-display font-bold text-base uppercase tracking-wider text-slate-800 dark:text-white mb-2">URL Deep Scan</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
              Extracts 28 structural indicators (entropy, subdomains, SSL presence) and runs them through our ML classifier for instant risk scoring.
            </p>
          </div>

          {/* Card 2 */}
          <div className="glass-card-hover p-7 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-purple-500"></div>
            <div className="w-11 h-11 rounded bg-purple-500/5 border border-purple-500/20 flex items-center justify-center mb-5 text-purple-500">
              <Mail className="w-5 h-5" />
            </div>
            <h3 className="font-display font-bold text-base uppercase tracking-wider text-slate-800 dark:text-white mb-2">Email NLP Scanner</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
              Parses email text bodies using Natural Language Processing models to detect urgency keywords, domain mismatches, and phishing rhetoric.
            </p>
          </div>

          {/* Card 3 */}
          <div className="glass-card-hover p-7 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-emerald-500"></div>
            <div className="w-11 h-11 rounded bg-emerald-500/5 border border-emerald-500/20 flex items-center justify-center mb-5 text-emerald-500">
              <Globe className="w-5 h-5" />
            </div>
            <h3 className="font-display font-bold text-base uppercase tracking-wider text-slate-800 dark:text-white mb-2">Website DOM Check</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
              Retrieves target pages, parses DOM elements for malicious redirect forms, SSL trust chains, and WHOIS domain ages.
            </p>
          </div>
        </div>

        {/* Real-time Cybersecurity News Wire Section */}
        <section id="news" className="w-full mb-20 text-left scroll-mt-24">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
            <div>
              <h2 className="font-display font-black text-2xl uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-2">
                <Radio className="w-6 h-6 text-blue-500 dark:text-cyber-glow animate-pulse" />
                Latest Threat Bulletins
              </h2>
              <p className="font-mono text-xs text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest">
                Real-time cybersecurity alerts and advisories enriched by AI
              </p>
            </div>
            
            {news.length > 0 && (
              <button 
                onClick={fetchNewsData}
                disabled={newsLoading}
                className="text-xs text-blue-500 dark:text-cyber-glow font-mono uppercase tracking-wider hover:underline flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${newsLoading ? 'animate-spin' : ''}`} />
                {newsLoading ? 'Syncing...' : 'Sync Feed'}
              </button>
            )}
          </div>

          {newsLoading ? (
            /* News Loading Skeleton */
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((idx) => (
                <div key={idx} className="glass-card p-6 border border-slate-200 dark:border-slate-800/80 animate-pulse space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
                    <div className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded-full" />
                  </div>
                  <div className="h-5 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="space-y-2">
                    <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded" />
                    <div className="h-3 w-5/6 bg-slate-200 dark:bg-slate-800 rounded" />
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-900/50 rounded-lg p-3 h-12" />
                  <div className="flex justify-between items-center pt-2">
                    <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
                    <div className="h-6 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : newsError ? (
            /* News Error State */
            <div className="glass-card p-10 border border-red-200 dark:border-red-950 text-center flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <WifiOff className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <p className="font-display font-bold text-base uppercase text-slate-800 dark:text-white">Feed offline</p>
                <p className="font-mono text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md">{newsError}</p>
              </div>
              <button 
                onClick={fetchNewsData}
                className="btn-secondary py-1.5 px-4 text-xs flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Reconnect Feed
              </button>
            </div>
          ) : news.length === 0 ? (
            /* Empty State */
            <div className="glass-card p-10 text-center border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center">
              <Radio className="w-8 h-8 text-slate-400 mb-2" />
              <p className="font-display font-bold text-sm text-slate-700 dark:text-slate-300">No threat advisories available</p>
              <p className="font-mono text-[10px] text-slate-400 mt-1">Check back shortly for intelligence feeds.</p>
            </div>
          ) : (
            /* Actual News Grid */
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {news.map((art) => {
                  const severityStyle = 
                    art.severity === 'Critical' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                    art.severity === 'High'     ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                    art.severity === 'Medium'   ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
                                                  'bg-green-500/10 text-green-500 border-green-500/20';

                  const dateStr = art.published_at
                    ? new Date(art.published_at).toLocaleDateString(undefined, {
                        month: 'short', day: 'numeric', year: 'numeric'
                      })
                    : 'Recent';

                  return (
                    <motion.div
                      key={art.id}
                      whileHover={{ y: -4 }}
                      className="glass-card-hover border border-slate-200 dark:border-slate-800/80 p-6 flex flex-col justify-between"
                    >
                      <div className="space-y-3.5">
                        {/* Header metadata */}
                        <div className="flex justify-between items-center">
                          <span className="font-mono text-[9px] uppercase tracking-wider text-slate-400 dark:text-slate-500 truncate max-w-[150px]">
                            {art.source || 'Intel Feed'}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full border text-[8px] font-mono font-bold uppercase tracking-wider ${severityStyle}`}>
                            {art.severity || 'Medium'}
                          </span>
                        </div>

                        {/* Title */}
                        <h3 className="font-display font-bold text-sm text-slate-800 dark:text-white leading-snug line-clamp-2 h-10">
                          {art.title}
                        </h3>

                        {/* Snippet / Description */}
                        <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed line-clamp-3">
                          {art.description}
                        </p>

                        {/* AI Summary Snippet */}
                        {art.ai_summary && (
                          <div className="bg-slate-100/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-900/60 p-3 rounded-lg space-y-1.5">
                            <div className="flex items-center gap-1 font-display font-bold text-[9px] uppercase tracking-wider text-slate-600 dark:text-slate-400">
                              <Cpu className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
                              AI Threat Brief
                            </div>
                            <p className="text-slate-500 dark:text-slate-300 text-[10px] leading-relaxed line-clamp-2 font-body">
                              {art.ai_summary}
                            </p>
                          </div>
                        )}

                        {/* Technical Indicator Tags */}
                        {(art.cves?.length > 0 || art.malware?.length > 0 || art.affected_orgs?.length > 0) && (
                          <div className="flex flex-wrap gap-1 font-mono text-[8px] pt-1">
                            {art.cves?.slice(0, 1).map(c => (
                              <span key={c} className="bg-red-500/5 border border-red-500/15 text-red-500 px-1.5 py-0.5 rounded">
                                {c}
                              </span>
                            ))}
                            {art.malware?.slice(0, 1).map(m => (
                              <span key={m} className="bg-purple-500/5 border border-purple-500/15 text-purple-500 px-1.5 py-0.5 rounded truncate max-w-[80px]">
                                {m}
                              </span>
                            ))}
                            {art.affected_orgs?.slice(0, 1).map(o => (
                              <span key={o} className="bg-blue-500/5 border border-blue-500/15 text-blue-500 px-1.5 py-0.5 rounded truncate max-w-[80px]">
                                {o}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Footer Actions */}
                      <div className="flex justify-between items-center pt-5 mt-4 border-t border-slate-100 dark:border-slate-900/60">
                        <span className="font-mono text-[9px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {dateStr}
                        </span>
                        
                        {art.link && (
                          <a 
                            href={art.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] font-mono text-blue-500 dark:text-cyber-glow uppercase tracking-wider flex items-center gap-1 hover:underline"
                          >
                            Full Bulletin <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              {/* View All CTA */}
              <div className="text-center pt-2">
                <Link 
                  to={isAuthenticated ? "/threat-intel" : "/login"}
                  className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 hover:text-blue-500 dark:hover:text-cyber-glow transition-colors py-2 group"
                >
                  View All Enriched Intelligence Reports & Analytics 
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          )}
        </section>

        {/* Testimonials */}
        <div className="w-full mb-20 text-left">
          <h2 className="font-display font-black text-2xl uppercase tracking-wider text-slate-800 dark:text-white text-center mb-8">
            TRUSTED BY SECURITIES ANALYSTS
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="glass-card p-6 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
                <p className="text-slate-600 dark:text-slate-300 italic text-xs leading-relaxed mb-4">
                  "{t.quote}"
                </p>
                <div>
                  <span className="font-display font-bold text-xs text-slate-800 dark:text-white block">{t.analyst}</span>
                  <span className="font-mono text-[9px] text-slate-400 dark:text-slate-500 uppercase block mt-0.5">{t.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQs */}
        <div id="faq" className="w-full text-left mb-10 max-w-3xl mx-auto scroll-mt-24">
          <h2 className="font-display font-black text-2xl uppercase tracking-wider text-slate-800 dark:text-white text-center mb-8 flex items-center justify-center gap-2">
            <HelpCircle className="w-6 h-6 text-blue-500" /> FREQUENTLY ASKED QUESTIONS
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div key={idx} className="glass-card border border-slate-200 dark:border-slate-800 overflow-hidden">
                <button 
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-5 text-left font-display font-bold text-xs md:text-sm uppercase tracking-wider flex justify-between items-center text-slate-800 dark:text-white"
                >
                  {faq.q}
                  <span className="text-blue-500">{openFaq === idx ? '−' : '+'}</span>
                </button>
                <AnimatePresence>
                  {openFaq === idx && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-slate-100 dark:border-slate-900"
                    >
                      <p className="p-5 text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-body">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}
