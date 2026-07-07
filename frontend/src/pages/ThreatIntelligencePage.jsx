import React, { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../services/api'
import toast from 'react-hot-toast'
import {
  Search,
  Filter,
  Bookmark,
  BookmarkCheck,
  Eye,
  ExternalLink,
  Globe,
  AlertOctagon,
  RefreshCw,
  Cpu,
  Radio,
  AlertTriangle,
  WifiOff,
  ChevronDown,
  ShieldAlert,
  Tag,
  Clock,
  Activity,
} from 'lucide-react'

// ─── Error Boundary ────────────────────────────────────────────────────────────

class ThreatIntelErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  componentDidCatch(error, info) {
    console.error('[ThreatIntelligencePage] Uncaught error:', error, info)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 p-8">
          <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <AlertOctagon className="w-10 h-10 text-red-500" />
          </div>
          <div className="text-center">
            <h2 className="font-display font-black text-2xl text-slate-800 dark:text-white uppercase tracking-wider mb-2">
              Component Failure
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-mono max-w-md">
              {this.state.error?.message || 'An unexpected error occurred in the Threat Intelligence module.'}
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Reload Module
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

// ─── Severity helpers ──────────────────────────────────────────────────────────

const SEVERITY_STYLES = {
  Critical: 'bg-red-500/10 text-red-500 border-red-500/25',
  High:     'bg-orange-500/10 text-orange-500 border-orange-500/25',
  Medium:   'bg-yellow-500/10 text-yellow-500 border-yellow-500/25',
  Low:      'bg-green-500/10 text-green-500 border-green-500/25',
}

const getSeverityStyle = (sev) =>
  SEVERITY_STYLES[sev] || 'bg-slate-500/10 text-slate-500 border-slate-500/20'

// ─── Article Card ─────────────────────────────────────────────────────────────

const ArticleCard = React.memo(({ art, isBookmarked, isRead, onBookmark, onRead }) => {
  const [expanded, setExpanded] = useState(false)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className={`glass-card border flex flex-col gap-4 p-6 ${
        !isRead
          ? 'border-blue-300 dark:border-blue-900/60 bg-blue-50/5'
          : 'border-slate-200 dark:border-slate-800/80'
      }`}
    >
      {/* Header row */}
      <div className="flex justify-between items-start gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {!isRead && (
            <span className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 dark:bg-cyber-secondary" />
          )}
          <span className="font-mono text-[9px] uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate">
            {art.source || 'Unknown'} &nbsp;//&nbsp;
            {art.published_at
              ? new Date(art.published_at).toLocaleString(undefined, {
                  month: 'short', day: 'numeric', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })
              : 'Unknown date'}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={`px-2 py-0.5 rounded-full border text-[9px] font-mono font-bold uppercase tracking-wider ${getSeverityStyle(art.severity)}`}>
            {art.severity || 'Medium'}
          </span>

          <button
            onClick={() => onBookmark(art.id)}
            title={isBookmarked ? 'Remove bookmark' : 'Bookmark article'}
            className="text-slate-400 hover:text-blue-500 dark:hover:text-cyber-primary transition-colors p-1"
          >
            {isBookmarked
              ? <BookmarkCheck className="w-4 h-4 text-blue-500 dark:text-cyber-primary" />
              : <Bookmark className="w-4 h-4" />}
          </button>

          <button
            onClick={() => onRead(art.id)}
            title={isRead ? 'Mark as unread' : 'Mark as read'}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors p-1"
          >
            <Eye className={`w-4 h-4 ${isRead ? 'opacity-30' : 'opacity-100'}`} />
          </button>
        </div>
      </div>

      {/* Title */}
      <h3 className="font-display font-bold text-base text-slate-800 dark:text-white leading-snug">
        {art.title || 'Untitled Threat Report'}
      </h3>

      {/* Description */}
      {art.description && (
        <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">
          {art.description}
        </p>
      )}

      {/* AI Summary Panel */}
      <div className="bg-slate-100/50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-900 p-4 rounded-lg space-y-3">
        <div className="flex items-center gap-1.5 font-display font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
          <Cpu className="w-4 h-4 text-blue-500 dark:text-cyber-secondary animate-pulse" />
          AI Threat Analysis
        </div>

        <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
          {art.ai_summary || 'Analysis not available for this article.'}
        </p>

        {/* Technical tags */}
        {(art.cves?.length > 0 || art.malware?.length > 0 || art.affected_orgs?.length > 0 || art.mitre_techniques?.length > 0) && (
          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-200 dark:border-slate-900/60 font-mono text-[9px]">
            {art.cves?.slice(0, 3).map(c => (
              <span key={c} className="bg-red-500/5 border border-red-500/15 text-red-500 px-2 py-0.5 rounded">
                {c}
              </span>
            ))}
            {art.malware?.slice(0, 2).map(m => (
              <span key={m} className="bg-purple-500/5 border border-purple-500/15 text-purple-500 px-2 py-0.5 rounded">
                Malware: {m}
              </span>
            ))}
            {art.affected_orgs?.slice(0, 2).map(o => (
              <span key={o} className="bg-blue-500/5 border border-blue-500/15 text-blue-500 px-2 py-0.5 rounded">
                Entity: {o}
              </span>
            ))}
            {expanded && art.mitre_techniques?.slice(0, 3).map(mt => (
              <span key={mt} className="bg-green-500/5 border border-green-500/15 text-green-500 px-2 py-0.5 rounded">
                MITRE: {mt}
              </span>
            ))}
            {(art.mitre_techniques?.length > 0 || art.cves?.length > 3) && (
              <button
                onClick={() => setExpanded(e => !e)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex items-center gap-0.5 px-1"
              >
                {expanded ? 'Less' : `+${(art.mitre_techniques?.length || 0)} more`}
                <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
              </button>
            )}
            <span className="bg-slate-500/5 border border-slate-500/10 text-slate-500 px-2 py-0.5 rounded">
              {art.attack_type || 'Unknown'}
            </span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center">
        <span className="font-mono text-[9px] text-slate-400 flex items-center gap-1">
          <Globe className="w-3.5 h-3.5" />
          {art.country || 'Global'} // {art.category || 'Intelligence'}
        </span>

        {art.link ? (
          <a
            href={art.link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => { if (!isRead) onRead(art.id) }}
            className="btn-secondary py-1.5 px-3 text-[10px] flex items-center gap-1.5"
          >
            Read Full Article <ExternalLink className="w-3 h-3" />
          </a>
        ) : (
          <span className="text-[9px] text-slate-400 font-mono">No external link</span>
        )}
      </div>
    </motion.div>
  )
})

ArticleCard.displayName = 'ArticleCard'

// ─── Empty State ──────────────────────────────────────────────────────────────

const EmptyState = ({ hasFilters, onClear }) => (
  <div className="glass-card p-16 text-center border border-slate-200 dark:border-slate-800 flex flex-col items-center gap-4">
    <div className="w-16 h-16 rounded-full bg-slate-200/50 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-800 flex items-center justify-center">
      <Radio className="w-8 h-8 text-slate-400" />
    </div>
    <div>
      <p className="font-display font-bold text-lg text-slate-700 dark:text-slate-300 uppercase tracking-wider">
        {hasFilters ? 'No matching articles' : 'No threat intel available'}
      </p>
      <p className="font-mono text-xs text-slate-400 mt-1">
        {hasFilters
          ? 'No articles match your current filter criteria.'
          : 'Threat feeds are being fetched. Refresh in a moment.'}
      </p>
    </div>
    {hasFilters && (
      <button onClick={onClear} className="btn-secondary text-xs py-2 px-4">
        Clear Filters
      </button>
    )}
  </div>
)

// ─── Error State ──────────────────────────────────────────────────────────────

const ErrorState = ({ message, onRetry, retryCount }) => (
  <div className="glass-card p-16 text-center border border-red-200 dark:border-red-900/30 flex flex-col items-center gap-5">
    <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center animate-pulse">
      <WifiOff className="w-8 h-8 text-red-500" />
    </div>
    <div>
      <p className="font-display font-black text-xl text-slate-800 dark:text-white uppercase tracking-wider mb-2">
        Feed Fetch Failed
      </p>
      <p className="font-mono text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
        {message || 'Unable to reach threat intelligence sources. Check backend connectivity.'}
      </p>
    </div>
    <div className="flex items-center gap-3">
      <button onClick={onRetry} className="btn-primary flex items-center gap-2">
        <RefreshCw className="w-4 h-4" />
        Retry{retryCount > 0 ? ` (Attempt ${retryCount + 1})` : ''}
      </button>
      <a
        href="http://localhost:5000/health"
        target="_blank"
        rel="noopener noreferrer"
        className="btn-secondary text-xs py-2.5 flex items-center gap-2"
      >
        Check Backend <ExternalLink className="w-3 h-3" />
      </a>
    </div>
    {retryCount > 0 && (
      <p className="font-mono text-[10px] text-slate-400">
        {retryCount} retry attempt{retryCount > 1 ? 's' : ''} made
      </p>
    )}
  </div>
)

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

const LoadingSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {[1, 2, 3, 4, 5, 6].map(idx => (
      <div key={idx} className="glass-card p-6 border border-slate-200 dark:border-slate-800 animate-pulse space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-3 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-5 w-16 bg-slate-200 dark:bg-slate-800 rounded-full" />
        </div>
        <div className="h-5 w-3/4 bg-slate-200 dark:bg-slate-800 rounded" />
        <div className="space-y-2">
          <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-3 w-5/6 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-3 w-4/6 bg-slate-200 dark:bg-slate-800 rounded" />
        </div>
        <div className="bg-slate-100 dark:bg-slate-900/50 rounded-lg p-3 space-y-2">
          <div className="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded" />
        </div>
        <div className="flex justify-between">
          <div className="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-7 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
        </div>
      </div>
    ))}
  </div>
)

// ─── Main Page Component ──────────────────────────────────────────────────────

function ThreatIntelligenceContent() {
  const [articles, setArticles]             = useState([])
  const [loading, setLoading]               = useState(true)
  const [refreshing, setRefreshing]         = useState(false)
  const [error, setError]                   = useState(null)
  const [retryCount, setRetryCount]         = useState(0)

  // Filters
  const [search, setSearch]                 = useState('')
  const [selectedSeverity, setSelectedSeverity] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [showOnlyBookmarks, setShowOnlyBookmarks] = useState(false)
  const [showOnlyUnread, setShowOnlyUnread] = useState(false)
  const [visibleCount, setVisibleCount]     = useState(8)

  // Persist read/bookmark state in localStorage
  const [bookmarks, setBookmarks] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ct_news_bookmarks') || '[]') } catch { return [] }
  })
  const [readArticles, setReadArticles] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ct_news_read') || '[]') } catch { return [] }
  })

  // Auto-refresh interval ref
  const intervalRef = useRef(null)

  // ── Fetch logic ─────────────────────────────────────────────────────────────
  const fetchNews = useCallback(async (opts = {}) => {
    const { showToast = false, forceRefresh = false, isRetry = false } = opts

    try {
      setError(null)
      if (showToast || forceRefresh) setRefreshing(true)

      const params = forceRefresh ? '?force_refresh=true' : ''
      const response = await api.get(`/api/intel/news${params}`)
      const data = response.data?.data

      if (!data || !Array.isArray(data.articles)) {
        throw new Error('Invalid response structure from server.')
      }

      setArticles(data.articles)
      setRetryCount(0)

      if (showToast) {
        toast.success(`Threat feeds refreshed — ${data.articles.length} articles loaded.`)
      }
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Network error — unable to reach threat intelligence service.'

      setError(msg)

      if (showToast) {
        toast.error('Failed to load threat intelligence feeds.')
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  // Initial load + auto-refresh every 12 minutes
  useEffect(() => {
    fetchNews()

    intervalRef.current = setInterval(() => {
      fetchNews({ showToast: false })
    }, 720_000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [fetchNews])

  // ── Retry handler ────────────────────────────────────────────────────────────
  const handleRetry = useCallback(() => {
    setLoading(true)
    setRetryCount(c => c + 1)
    fetchNews({ showToast: true })
  }, [fetchNews])

  // ── Bookmark / read helpers ──────────────────────────────────────────────────
  const toggleBookmark = useCallback((id) => {
    setBookmarks(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      localStorage.setItem('ct_news_bookmarks', JSON.stringify(next))
      toast.success(prev.includes(id) ? 'Bookmark removed' : 'Article bookmarked')
      return next
    })
  }, [])

  const toggleRead = useCallback((id) => {
    setReadArticles(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      localStorage.setItem('ct_news_read', JSON.stringify(next))
      return next
    })
  }, [])

  const markAllRead = useCallback(() => {
    const ids = articles.map(a => a.id)
    setReadArticles(ids)
    localStorage.setItem('ct_news_read', JSON.stringify(ids))
    toast.success('All articles marked as read.')
  }, [articles])

  const clearFilters = useCallback(() => {
    setSearch('')
    setSelectedSeverity('')
    setSelectedCategory('')
    setShowOnlyBookmarks(false)
    setShowOnlyUnread(false)
  }, [])

  // ── Filtering ────────────────────────────────────────────────────────────────
  const filteredArticles = articles.filter(art => {
    const title       = (art.title       || '').toLowerCase()
    const description = (art.description || '').toLowerCase()
    const aiSummary   = (art.ai_summary  || '').toLowerCase()
    const q           = search.toLowerCase()

    const matchesSearch    = !q || title.includes(q) || description.includes(q) || aiSummary.includes(q)
    const matchesSeverity  = !selectedSeverity || art.severity === selectedSeverity
    const matchesCategory  = !selectedCategory || art.category === selectedCategory
    const matchesBookmark  = !showOnlyBookmarks || bookmarks.includes(art.id)
    const matchesUnread    = !showOnlyUnread || !readArticles.includes(art.id)

    return matchesSearch && matchesSeverity && matchesCategory && matchesBookmark && matchesUnread
  })

  const hasActiveFilters = !!(search || selectedSeverity || selectedCategory || showOnlyBookmarks || showOnlyUnread)
  const categories = [...new Set(articles.map(a => a.category).filter(Boolean))]

  // Stats counters
  const criticalCount = articles.filter(a => a.severity === 'Critical').length
  const unreadCount   = articles.filter(a => !readArticles.includes(a.id)).length

  return (
    <div className="space-y-8 animate-fade-in-up">

      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-display font-black text-3xl uppercase tracking-wider text-slate-800 dark:text-white flex items-center gap-2">
            <Radio className="w-8 h-8 text-blue-500 dark:text-cyber-secondary animate-pulse" />
            Global Threat Intelligence
          </h1>
          <p className="font-mono text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">
            Real-time cyber threat advisories from 12+ trusted sources — AI enriched
          </p>
        </div>

        <div className="flex gap-3 flex-wrap">
          <button
            onClick={markAllRead}
            disabled={articles.length === 0 || loading}
            className="btn-secondary py-2 text-xs flex items-center gap-2 disabled:opacity-40"
          >
            <Eye className="w-4 h-4" /> Mark all read
          </button>
          <button
            onClick={() => fetchNews({ showToast: true, forceRefresh: true })}
            disabled={refreshing || loading}
            className="btn-primary py-2 text-xs flex items-center gap-2 disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh Feeds'}
          </button>
        </div>
      </div>

      {/* ── Summary Stats ───────────────────────────────────────────────────── */}
      {articles.length > 0 && !loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Articles', value: articles.length, icon: <Activity className="w-4 h-4 text-blue-500" />, color: 'text-blue-500' },
            { label: 'Critical Threats', value: criticalCount, icon: <ShieldAlert className="w-4 h-4 text-red-500" />, color: 'text-red-500' },
            { label: 'Unread', value: unreadCount, icon: <Eye className="w-4 h-4 text-yellow-500" />, color: 'text-yellow-500' },
            { label: 'Bookmarked', value: bookmarks.length, icon: <Bookmark className="w-4 h-4 text-purple-500" />, color: 'text-purple-500' },
          ].map(stat => (
            <div key={stat.label} className="glass-card p-4 border border-slate-200 dark:border-slate-800 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center">
                {stat.icon}
              </div>
              <div>
                <div className={`font-display font-black text-2xl ${stat.color}`}>{stat.value}</div>
                <div className="font-mono text-[9px] text-slate-400 uppercase tracking-wider">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Filters ─────────────────────────────────────────────────────────── */}
      <div className="glass-card p-6 border border-slate-200/80 dark:border-slate-800/80 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative md:col-span-2">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search CVEs, threats, organizations, techniques..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-cyber pl-10"
            />
          </div>

          {/* Severity filter */}
          <select
            value={selectedSeverity}
            onChange={e => setSelectedSeverity(e.target.value)}
            className="input-cyber"
          >
            <option value="">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          {/* Category filter */}
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="input-cyber"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap justify-between items-center gap-4 pt-2 border-t border-slate-100 dark:border-slate-900/60">
          <div className="flex gap-5 flex-wrap">
            <label className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showOnlyBookmarks}
                onChange={e => setShowOnlyBookmarks(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-700 text-blue-500 focus:ring-blue-500 h-4 w-4"
              />
              Bookmarked ({bookmarks.length})
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showOnlyUnread}
                onChange={e => setShowOnlyUnread(e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-700 text-blue-500 focus:ring-blue-500 h-4 w-4"
              />
              Unread Only
            </label>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-red-500 hover:text-red-600 font-mono underline underline-offset-2"
              >
                Clear Filters
              </button>
            )}
          </div>

          <span className="font-mono text-[10px] text-slate-400">
            SHOWING {Math.min(visibleCount, filteredArticles.length)} OF {filteredArticles.length} INTEL REPORTS
            {articles.length > 0 && ` (${articles.length} TOTAL)`}
          </span>
        </div>
      </div>

      {/* ── Content Area ─────────────────────────────────────────────────────── */}
      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorState message={error} onRetry={handleRetry} retryCount={retryCount} />
      ) : filteredArticles.length === 0 ? (
        <EmptyState hasFilters={hasActiveFilters} onClear={clearFilters} />
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredArticles.slice(0, visibleCount).map(art => (
                <ArticleCard
                  key={art.id}
                  art={art}
                  isBookmarked={bookmarks.includes(art.id)}
                  isRead={readArticles.includes(art.id)}
                  onBookmark={toggleBookmark}
                  onRead={toggleRead}
                />
              ))}
            </AnimatePresence>
          </div>

          {/* Load more */}
          {visibleCount < filteredArticles.length && (
            <div className="flex justify-center pt-2">
              <button
                onClick={() => setVisibleCount(c => c + 8)}
                className="btn-primary py-3 px-10 text-xs font-semibold flex items-center gap-2"
              >
                Load More Reports
                <span className="text-blue-200">
                  ({filteredArticles.length - visibleCount} remaining)
                </span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Default Export with Error Boundary ───────────────────────────────────────

export default function ThreatIntelligencePage() {
  return (
    <ThreatIntelErrorBoundary>
      <ThreatIntelligenceContent />
    </ThreatIntelErrorBoundary>
  )
}
