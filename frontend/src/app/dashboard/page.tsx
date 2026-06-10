'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import {
  User, Cpu, Zap, Target, TrendingUp, AlertTriangle,
  XCircle, Heart, ChevronRight, LayoutDashboard,
  GitMerge, Map, Lightbulb, BarChart2, Settings,
  Download, RefreshCw, CheckCircle, Shield,
  Brain, Activity, Clock, SunMedium, Moon, LogOut, UserCircle
} from 'lucide-react'
import { DigitalTwin, BoardSession } from '../../types'
import BoardRoom from '../../components/BoardRoom'
import ExecutionTracker from '../../components/ExecutionTracker'
import { useAuthStore } from '../../hooks/useAuth'

// ─── Theme Hook ──────────────────────────────────────────────────────────────
function useTheme() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  useEffect(() => {
    const stored = localStorage.getItem('theme') as 'dark' | 'light' | null
    const initial = stored ?? 'dark'
    setTheme(initial)
    document.documentElement.setAttribute('data-theme', initial)

    const observer = new MutationObserver(() => {
      const current = document.documentElement.getAttribute('data-theme') as 'dark' | 'light'
      setTheme(current ?? 'dark')
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => observer.disconnect()
  }, [])
  return theme
}

// ─── Theme-aware colour tokens ────────────────────────────────────────────────
function tokens(theme: 'dark' | 'light') {
  const dark = theme === 'dark'
  return {
    bg:     dark ? '#0a0a0c'                      : '#f4f2ee',
    bg2:    dark ? 'rgba(14,14,20,0.92)'           : 'rgba(255,255,255,0.88)',
    card:   dark ? 'rgba(12,12,20,0.55)'           : 'rgba(255,255,255,0.45)',
    cardBorder: dark ? 'rgba(201,168,76,0.10)'     : 'rgba(201,168,76,0.18)',
    border: dark ? 'rgba(255,255,255,0.07)'        : 'rgba(0,0,0,0.08)',
    text:   dark ? '#eeeef5'                       : '#1a1a2e',
    muted:  dark ? '#7878a0'                       : '#7878a0',
    dim:    dark ? '#44445a'                       : '#aaa',
    gold:   '#c9a84c',
    gold2:  '#e8c96a',
    green:  '#2fc96e',
    red:    '#ff453a',
    blue:   '#2997ff',
    orange: '#ff9f0a',
    purple: '#bf48ff',
  }
}

// ─── Background Slideshow ─────────────────────────────────────────────────────
function BgSlideshow() {
  const [idx, setIdx] = useState(0)
  const images = ['/bg1.png', '/bg2.png', '/bg3.png']
  useEffect(() => {
    const t = setInterval(() => setIdx(i => (i + 1) % images.length), 7000)
    return () => clearInterval(t)
  }, [])
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <AnimatePresence initial={false}>
        <motion.div key={idx}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.8, ease: 'easeInOut' }}
          style={{ position: 'absolute', inset: 0 }}>
          <Image src={images[idx]} alt="" fill priority style={{ objectFit: 'cover', opacity: 0.18 }} />
        </motion.div>
      </AnimatePresence>
      {/* Gradient overlay so cards stay legible */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(10,10,12,0.85) 0%, rgba(10,10,12,0.65) 100%)' }} />
    </div>
  )
}

// ─── Radar Chart ─────────────────────────────────────────────────────────────
function RadarChart({ data, gold }: { data: { label: string; value: number }[]; gold: string }) {
  const cx = 110, cy = 110, r = 78
  const n = data.length
  const ang = (i: number) => (i / n) * Math.PI * 2 - Math.PI / 2
  const pt = (i: number, rad: number) => ({ x: cx + Math.cos(ang(i)) * rad, y: cy + Math.sin(ang(i)) * rad })
  const poly = (rad: number) => data.map((_, i) => `${pt(i, rad).x},${pt(i, rad).y}`).join(' ')
  const dataPoly = data.map((d, i) => { const p = pt(i, (d.value / 100) * r); return `${p.x},${p.y}` }).join(' ')
  return (
    <svg viewBox="0 0 220 220" style={{ width: '100%', maxWidth: 200 }}>
      {[25, 50, 75, 100].map(p => <polygon key={p} points={poly((p / 100) * r)} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />)}
      {data.map((_, i) => { const { x, y } = pt(i, r); return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" /> })}
      <polygon points={dataPoly} fill={`${gold}22`} stroke={gold} strokeWidth="1.5" />
      {data.map((d, i) => { const { x, y } = pt(i, (d.value / 100) * r); return <circle key={i} cx={x} cy={y} r="3.5" fill={gold} /> })}
      {data.map((d, i) => {
        const lp = pt(i, r + 24)
        return (
          <text key={i} x={lp.x} y={lp.y} textAnchor="middle" dominantBaseline="middle">
            <tspan style={{ fontSize: 8, fill: '#7878a0', fontFamily: 'monospace' }}>{d.label}</tspan>
            <tspan x={lp.x} dy="11" style={{ fontSize: 8, fill: gold, fontWeight: 700, fontFamily: 'monospace' }}>{d.value}</tspan>
          </text>
        )
      })}
    </svg>
  )
}

// ─── Arc Gauge ────────────────────────────────────────────────────────────────
function ArcGauge({ score, gold, text }: { score: number; gold: string; text: string }) {
  const r = 50, circ = Math.PI * r, dash = (score / 100) * circ
  return (
    <svg viewBox="0 0 120 72" style={{ width: 130 }}>
      <path d="M 10,62 A 50,50 0 0,1 110,62" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="8" />
      <path d="M 10,62 A 50,50 0 0,1 110,62" fill="none" stroke={gold}
        strokeWidth="8" strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      <text x="60" y="55" textAnchor="middle" style={{ fontSize: 22, fontWeight: 800, fill: text, fontFamily: 'sans-serif' }}>{score}</text>
      <text x="60" y="68" textAnchor="middle" style={{ fontSize: 9, fill: '#7878a0', fontFamily: 'monospace' }}>/100</text>
    </svg>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────
function Card({ children, style = {}, t }: { children: React.ReactNode; style?: React.CSSProperties; t: ReturnType<typeof tokens> }) {
  return (
    <div style={{
      background: t.card,
      backdropFilter: 'blur(40px) saturate(180%)',
      WebkitBackdropFilter: 'blur(40px) saturate(180%)',
      border: `1px solid ${t.cardBorder}`,
      borderTop: `1px solid rgba(201,168,76,0.22)`,
      borderRadius: 16,
      padding: 18,
      boxShadow: '0 8px 32px rgba(0,0,0,0.38), inset 0 1px 0 rgba(255,255,255,0.06)',
      ...style
    }}>
      {children}
    </div>
  )
}

// ─── Card Title ───────────────────────────────────────────────────────────────
function CardTitle({ icon, text, color }: { icon: React.ReactNode; text: string; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <span style={{ color, display: 'flex' }}>{icon}</span>
      <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color, fontFamily: 'monospace' }}>{text}</span>
    </div>
  )
}

// ─── Row ──────────────────────────────────────────────────────────────────────
function Row({ label, value, vc, t }: { label: string; value: string; vc: string; t: ReturnType<typeof tokens> }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: `1px solid ${t.border}` }}>
      <span style={{ fontSize: 12, color: t.muted }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: vc, fontFamily: 'monospace' }}>{value}</span>
    </div>
  )
}

// ─── Check / Warn / Stop ─────────────────────────────────────────────────────
function BulletItem({ icon, text, muted }: { icon: React.ReactNode; text: string; muted: string }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 8 }}>
      <span style={{ flexShrink: 0, marginTop: 1, display: 'flex' }}>{icon}</span>
      <span style={{ fontSize: 12, color: muted, lineHeight: 1.55 }}>{text}</span>
    </div>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
function Sidebar({ twin, t, view, setView }: {
  twin: DigitalTwin | null
  t: ReturnType<typeof tokens>
  view: string
  setView: (v: any) => void
}) {
  const router = useRouter()
  const logout = useAuthStore(state => state.logout)

  const handleLogout = () => {
    logout()
    router.push('/auth')
  }
  const nav = [
    { icon: <User size={15} />, label: 'Founder Twin', id: 'profile', route: null },
    { icon: <LayoutDashboard size={15} />, label: 'Boardroom', id: 'board', route: null },
    { icon: <Lightbulb size={15} />, label: 'Opportunities', id: 'opps', route: null },
    { icon: <GitMerge size={15} />, label: 'Startup Blueprint', id: 'blueprint', route: null },
    { icon: <Map size={15} />, label: 'Roadmap', id: 'roadmap', route: null },
    { icon: <Shield size={15} />, label: 'GitLab Workspace', id: 'gitlab', route: null },
    { icon: <BarChart2 size={15} />, label: 'Reports', id: 'reports', route: null },
    { icon: <UserCircle size={15} />, label: 'My Profile', id: 'my-profile', route: '/dashboard/settings' },
    { icon: <Settings size={15} />, label: 'Settings', id: 'settings', route: null },
  ]
  return (
    <div style={{
      width: 218, flexShrink: 0,
      background: 'rgba(10,10,16,0.6)',
      backdropFilter: 'blur(40px) saturate(180%)',
      WebkitBackdropFilter: 'blur(40px) saturate(180%)',
      border: `1px solid rgba(201,168,76,0.12)`,
      borderTop: '1px solid rgba(201,168,76,0.22)',
      borderRadius: 16,
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
      position: 'sticky',
      top: 14,
      height: 'calc(100vh - 28px)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.05)',
    }}>
      {/* Logo */}
      <div style={{ padding: '18px 16px 16px', borderBottom: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <Image src="/darwin-logo.png" alt="Darwin" width={36} height={36} style={{ borderRadius: 8 }} />
        <div>
          <div style={{ fontSize: 15, fontWeight: 900, color: t.gold, letterSpacing: '0.06em', fontFamily: 'monospace', lineHeight: 1.1 }}>DARWIN</div>
          <div style={{ fontSize: 8.5, color: t.dim, letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: 'monospace' }}>AI Board for Founders</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: '10px 8px', flex: 1 }}>
        {nav.map(item => {
          const active = view === item.id
          const handleClick = () => {
            if (item.route) { router.push(item.route); return }
            if (item.id === 'profile' || item.id === 'board') setView(item.id)
          }
          return (
            <div key={item.id} onClick={handleClick}
              style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 9, marginBottom: 2, cursor: 'pointer', background: active ? `${t.gold}18` : 'transparent', border: `1px solid ${active ? t.gold + '35' : 'transparent'}`, transition: 'all 0.2s' }}>
              <span style={{ color: active ? t.gold : t.muted, display: 'flex' }}>{item.icon}</span>
              <span style={{ fontSize: 12.5, fontWeight: active ? 600 : 400, color: active ? t.gold : t.muted }}>{item.label}</span>
              {active && <ChevronRight size={11} color={t.gold} style={{ marginLeft: 'auto' }} />}
            </div>
          )
        })}
      </nav>

      {/* Active session */}
      {twin?.startup_idea && (
        <div style={{ padding: '12px 14px 10px', borderTop: `1px solid ${t.border}` }}>
          <div style={{ fontSize: 9, color: t.dim, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'monospace', marginBottom: 5 }}>Active Session</div>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: t.text, marginBottom: 4, lineHeight: 1.4 }}>
            {twin.startup_idea.length > 30 ? twin.startup_idea.slice(0, 30) + '…' : twin.startup_idea}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: t.green }} />
            <span style={{ fontSize: 10, color: t.dim }}>Evaluated just now</span>
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ padding: '12px 14px', borderTop: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 9 }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: `linear-gradient(135deg, ${t.gold}70, ${t.purple}70)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <User size={14} color={t.text} />
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: t.text }}>{twin?.founder_name || 'Founder'}</div>
          <div style={{ fontSize: 10, color: t.dim }}>Founder Profile</div>
        </div>
        <div 
          onClick={handleLogout}
          style={{ marginLeft: 'auto', cursor: 'pointer', color: t.dim, padding: '4px', display: 'flex' }}
          title="Log Out"
        >
          <LogOut size={16} />
        </div>
      </div>
    </div>
  )
}

// ─── Theme Toggle (inline in dashboard) ──────────────────────────────────────
function ThemeBtn({ t }: { t: ReturnType<typeof tokens> }) {
  const theme = useTheme()
  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    localStorage.setItem('theme', next)
    document.documentElement.setAttribute('data-theme', next)
  }
  return (
    <button onClick={toggle} title="Toggle theme" style={{ width: 34, height: 34, borderRadius: '50%', border: `1px solid ${t.border}`, background: t.card, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: t.muted, backdropFilter: 'blur(12px)' }}>
      {theme === 'dark' ? <SunMedium size={15} /> : <Moon size={15} />}
    </button>
  )
}

// ─── Main Content ─────────────────────────────────────────────────────────────
type ViewState = 'profile' | 'board' | 'execution' | 'report'

function DashboardContent() {
  const params = useSearchParams()
  const router = useRouter()
  const twinId = params.get('twin_id')
  const theme  = useTheme()
  const t      = tokens(theme)

  const [twin, setTwin]           = useState<DigitalTwin | null>(null)
  const [session, setSession]     = useState<BoardSession | null>(null)
  const [loading, setLoading]     = useState(true)
  const [viewState, setViewState] = useState<ViewState>('profile')
  const [idea, setIdea]           = useState('')
  const [isSubmitting, setSubmit] = useState(false)

  const { userId, twinId: storedTwinId } = useAuthStore()

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  useEffect(() => {
    const load = async () => {
      // 1. Try URL param first
      const idFromUrl = twinId || storedTwinId
      if (idFromUrl) {
        try {
          const r = await fetch(`${apiUrl}/twin/${idFromUrl}`)
          if (r.ok) {
            const data = await r.json()
            setTwin(data)
            if (data.startup_idea) setIdea(data.startup_idea)
            setLoading(false)
            return
          }
        } catch { /* fall through */ }
      }
      // 2. Fall back to fetching by userId (covers back-navigation from settings page)
      if (userId) {
        try {
          const r = await fetch(`${apiUrl}/twin/by-user/${userId}`)
          if (r.ok) {
            const data = await r.json()
            setTwin(data)
            if (data.startup_idea) setIdea(data.startup_idea)
          }
        } catch { /* noop */ }
      }
      setLoading(false)
    }
    load()
  }, [twinId, storedTwinId, userId, apiUrl])

  const submitIdea = async () => {
    if (!idea.trim() || !twin) return
    setSubmit(true)
    try {
      const r = await fetch(`${apiUrl}/twin/${twin.twin_id}/idea`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ startup_idea: idea }) })
      setTwin(await r.json()); setViewState('board')
    } catch { /* noop */ } finally { setSubmit(false) }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: t.bg }}>
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
        style={{ width: 36, height: 36, borderRadius: '50%', border: `2px solid ${t.gold}40`, borderTopColor: t.gold }} />
    </div>
  )

  if (!twin) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, background: t.bg }}>
      <Brain size={40} color={t.gold} />
      <p style={{ color: t.muted, fontFamily: 'monospace', fontSize: 12 }}>Twin not found. Please complete onboarding first.</p>
      <button onClick={() => router.push('/onboarding')} style={{ padding: '10px 24px', borderRadius: 999, border: `1px solid ${t.gold}`, background: 'transparent', color: t.gold, cursor: 'pointer', fontSize: 13 }}>Go to Onboarding →</button>
    </div>
  )

  const p  = twin.profile
  const hc = p.hard_constraints

  const techScore = p.technical_depth === 'high' ? 95 : p.technical_depth === 'medium' ? 65 : 35
  const execScore = p.execution_velocity === 'fast' ? 90 : p.execution_velocity === 'medium' ? 60 : 30
  const riskScore = p.risk_tolerance === 'high' ? 80 : (p.risk_tolerance ?? '').includes('medium') ? 60 : 35
  const mktScore  = p.marketing_aptitude === 'high' ? 70 : p.marketing_aptitude === 'medium' ? 45 : 25
  const healthScore = Math.min(100, Math.round((techScore + execScore + riskScore + 85) / 4))

  const radar = [
    { label: 'Technical', value: techScore },
    { label: 'Execution', value: execScore },
    { label: 'Problem Solving', value: 88 },
    { label: 'Learning Agility', value: 85 },
    { label: 'Risk Tolerance', value: riskScore },
    { label: 'Marketing', value: mktScore },
  ]

  return (
    <div style={{ minHeight: '100vh', fontFamily: "'Inter', -apple-system, sans-serif", color: t.text, position: 'relative', zIndex: 1 }}>
      <BgSlideshow />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: 14, padding: 14, minHeight: '100vh', boxSizing: 'border-box', alignItems: 'flex-start' }}>

        {/* SIDEBAR */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
          <Sidebar twin={twin} t={t} view={viewState} setView={setViewState} />
        </motion.div>

        {/* MAIN */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>

          {/* TOP BAR */}
          <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, letterSpacing: '-0.03em', color: t.text }}>Founder Twin</h1>
                <span style={{ padding: '2px 9px', borderRadius: 999, fontSize: 9.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'monospace', background: `${t.green}18`, color: t.green, border: `1px solid ${t.green}30` }}>ACTIVE</span>
              </div>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: t.dim }}>Your digital twin that guides every strategic decision</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: t.dim, fontFamily: 'monospace', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Twin Accuracy</div>
                <div style={{ fontSize: 21, fontWeight: 800, color: t.gold, lineHeight: 1.1 }}>92%</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 9, color: t.dim, fontFamily: 'monospace', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Last Updated</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: t.text }}>Just now</div>
              </div>
              <RefreshCw size={14} color={t.dim} style={{ cursor: 'pointer' }} />
              <ThemeBtn t={t} />
              {(['profile', 'board'] as const).map(v => (
                <button key={v} onClick={() => setViewState(v)} style={{ padding: '7px 14px', borderRadius: 9, border: `1px solid ${viewState === v ? t.gold : t.border}`, background: viewState === v ? `${t.gold}18` : 'transparent', color: viewState === v ? t.gold : t.muted, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {v === 'board' ? <><LayoutDashboard size={13} /> Boardroom</> : <><User size={13} /> Profile</>}
                </button>
              ))}
              <button style={{ padding: '7px 14px', borderRadius: 9, border: `1px solid ${t.gold}`, background: `${t.gold}15`, color: t.gold, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Download size={13} /> Export Report
              </button>
            </div>
          </motion.div>

          {/* VIEWS */}
          <AnimatePresence mode="wait">

            {/* ── PROFILE ─────────────────────────────────────────────────── */}
            {viewState === 'profile' && (
              <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                {/* ROW 1: Identity card */}
                <Card t={t} style={{ display: 'flex', gap: 18, alignItems: 'flex-start', padding: '18px 22px' }}>
                  <div style={{ width: 66, height: 66, borderRadius: '50%', background: `linear-gradient(135deg, ${t.gold}55, ${t.purple}55)`, border: `2px solid ${t.gold}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <User size={28} color={t.gold} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 7 }}>
                      <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, letterSpacing: '-0.02em', color: t.text }}>{twin.founder_name || 'Founder'}</h2>
                      <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 9, fontWeight: 700, fontFamily: 'monospace', background: `${t.gold}18`, color: t.gold, border: `1px solid ${t.gold}30`, letterSpacing: '0.1em' }}>TWIN ID: {twin.twin_id.toUpperCase().slice(-8)}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 28px' }}>
                      {[
                        [<Cpu size={11} />, p.technical_depth === 'high' ? 'AI Engineer & Builder' : 'Product Builder'],
                        [<Target size={11} />, 'India'],
                        [<Zap size={11} />, `${p.execution_velocity ?? 'fast'} executor`],
                        [<Activity size={11} />, 'Building for impact'],
                      ].map(([icon, label], i) => (
                        <div key={i} style={{ display: 'flex', gap: 5, alignItems: 'center', fontSize: 12, color: t.muted }}>
                          <span style={{ color: t.gold, display: 'flex' }}>{icon as React.ReactNode}</span>
                          <span>{label as string}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div style={{ width: 1, alignSelf: 'stretch', background: t.border, margin: '0 6px' }} />
                  <div style={{ flex: 1.2 }}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: t.gold, fontFamily: 'monospace', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 7 }}>Founder DNA Summary</div>
                    <p style={{ fontSize: 12.5, color: t.muted, lineHeight: 1.75, margin: 0 }}>{p.competitive_edge}</p>
                  </div>
                  <div style={{ width: 1, alignSelf: 'stretch', background: t.border, margin: '0 6px' }} />
                  <div style={{ flexShrink: 0 }}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: t.gold, fontFamily: 'monospace', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>Twin Health Score</div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <ArcGauge score={healthScore} gold={t.gold} text={t.text} />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {[
                          { l: 'Strengths', v: `${Math.round(techScore * 0.4)}/40`, c: t.green },
                          { l: 'Execution', v: `${Math.round(execScore * 0.3)}/30`, c: t.gold },
                          { l: 'Mindset', v: `17/20`, c: t.blue },
                          { l: 'Risks', v: `${Math.round(riskScore * 0.2)}/20`, c: t.orange },
                        ].map(s => (
                          <div key={s.l} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: s.c, flexShrink: 0 }} />
                            <span style={{ color: t.muted, width: 58 }}>{s.l}</span>
                            <span style={{ color: t.text, fontWeight: 600, fontFamily: 'monospace', fontSize: 10.5 }}>{s.v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>

                {/* ROW 2: 4-column grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '200px 210px 1fr 1fr', gap: 12 }}>
                  <Card t={t} style={{ padding: 14 }}>
                    <CardTitle icon={<Brain size={13} />} text="Founder DNA" color={t.gold} />
                    <RadarChart data={radar} gold={t.gold} />
                  </Card>
                  <Card t={t} style={{ padding: 14 }}>
                    <CardTitle icon={<Cpu size={13} />} text="Core Attributes" color={t.gold} />
                    {[
                      { l: 'Technical Depth', v: p.technical_depth ?? '—' },
                      { l: 'Execution Velocity', v: p.execution_velocity ?? '—' },
                      { l: 'Risk Tolerance', v: p.risk_tolerance ?? '—' },
                      { l: 'Capital Runway', v: `₹${((hc.budget_inr ?? 0) / 100000).toFixed(1)}L (~${hc.months_to_first_revenue ?? '?'} mo)` },
                      { l: 'Team Size', v: (hc.team_size ?? 1) === 1 ? 'Solo Founder' : `${hc.team_size} people` },
                      { l: 'Network', v: p.network_strength ?? '—' },
                    ].map(r => <Row key={r.l} label={r.l} value={String(r.v)} vc={t.gold} t={t} />)}
                  </Card>
                  <Card t={t} style={{ padding: 14 }}>
                    <CardTitle icon={<CheckCircle size={13} />} text="Strengths" color={t.green} />
                    {[
                      p.technical_depth === 'high' ? 'Builds AI products rapidly' : 'Strong product intuition',
                      'Strong problem-solving ability', 'High learning agility',
                      'Disciplined and consistent', 'Clear long-term thinking',
                    ].map(s => <BulletItem key={s} icon={<CheckCircle size={12} color={t.green} />} text={s} muted={t.muted} />)}
                    <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${t.border}` }}>
                      <CardTitle icon={<Heart size={13} />} text="Motivators" color={t.purple} />
                      {['Solving meaningful problems', 'Building products people love', 'Financial freedom', 'Long-term compounding impact']
                        .map(m => <BulletItem key={m} icon={<Heart size={12} color={t.purple} />} text={m} muted={t.muted} />)}
                    </div>
                  </Card>
                  <Card t={t} style={{ padding: 14 }}>
                    <CardTitle icon={<AlertTriangle size={13} />} text="Blind Spots" color={t.orange} />
                    {(p.blind_spots?.length ? p.blind_spots : ['Distribution & marketing', 'Enterprise sales', 'Pricing psychology', 'Delegation & team building']).slice(0, 4)
                      .map((b: string) => <BulletItem key={b} icon={<AlertTriangle size={12} color={t.orange} />} text={b} muted={t.muted} />)}
                    <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px solid ${t.border}` }}>
                      <CardTitle icon={<XCircle size={13} />} text="Quit Triggers" color={t.red} />
                      {(p.quit_triggers?.length ? p.quit_triggers : ['No traction after 6 months', 'Running out of money', "Building something I don't believe in"]).slice(0, 3)
                        .map((q: string) => <BulletItem key={q} icon={<XCircle size={12} color={t.red} />} text={q} muted={t.muted} />)}
                    </div>
                  </Card>
                </div>

                {/* ROW 3: Fit Matrix + Behavioral + Hard Constraints */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 215px 210px', gap: 12 }}>
                  <Card t={t} style={{ padding: 14 }}>
                    <CardTitle icon={<Target size={13} />} text="Founder Fit Matrix" color={t.red} />
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead><tr>{['Opportunity', 'Fit Score', 'Why'].map(h => <th key={h} style={{ textAlign: 'left', padding: '4px 6px', color: t.dim, fontWeight: 600, fontFamily: 'monospace', fontSize: 9.5, letterSpacing: '0.08em', borderBottom: `1px solid ${t.border}` }}>{h}</th>)}</tr></thead>
                      <tbody>
                        {[{ o: 'AI Tutoring for K12', s: 42, c: t.red, w: 'High CAC, long sales cycle' }, { o: 'AI Interview Coach', s: 78, c: t.gold, w: 'Quick validation, low CAC' }, { o: 'Dev Productivity Tool', s: 73, c: t.gold, w: 'Strong technical fit' }, { o: 'AI Resume Analyzer', s: 65, c: t.orange, w: 'Low competition, easy MVP' }].map(r => (
                          <tr key={r.o}>
                            <td style={{ padding: '7px 6px', color: t.text, borderBottom: `1px solid ${t.border}` }}>{r.o}</td>
                            <td style={{ padding: '7px 6px', borderBottom: `1px solid ${t.border}` }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                <div style={{ flex: 1, height: 4, borderRadius: 99, background: t.border, overflow: 'hidden' }}>
                                  <div style={{ width: `${r.s}%`, height: '100%', background: r.c, borderRadius: 99 }} />
                                </div>
                                <span style={{ color: r.c, fontFamily: 'monospace', fontWeight: 700, fontSize: 10.5, width: 30 }}>{r.s}%</span>
                              </div>
                            </td>
                            <td style={{ padding: '7px 6px', color: t.muted, borderBottom: `1px solid ${t.border}`, fontSize: 11 }}>{r.w}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div style={{ display: 'flex', gap: 14, marginTop: 10 }}>
                      {[[t.red, '0% Poor Fit'], [t.gold, '50% Moderate Fit'], [t.green, '100% Excellent Fit']].map(([c, l]) => (
                        <div key={String(l)} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: t.dim }}>
                          <div style={{ width: 7, height: 7, borderRadius: '50%', background: String(c) }} /><span>{String(l)}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                  <Card t={t} style={{ padding: 14 }}>
                    <CardTitle icon={<Brain size={13} />} text="Behavioral Profile" color={t.blue} />
                    {[{ l: 'Decision Style', v: 'Analytical' }, { l: 'Work Style', v: 'Deep Work' }, { l: 'Adaptability', v: 'High' }, { l: 'Resilience', v: 'High' }, { l: 'Communication', v: 'Medium' }, { l: 'Leadership', v: 'Developing' }]
                      .map(r => <Row key={r.l} label={r.l} value={r.v} vc={t.blue} t={t} />)}
                  </Card>
                  <Card t={t} style={{ padding: 14 }}>
                    <CardTitle icon={<Zap size={13} />} text="Hard Constraints" color={t.red} />
                    {[
                      { l: 'Budget', v: `₹${((hc.budget_inr ?? 0) / 100000).toFixed(1)}L` },
                      { l: 'Time to First Revenue', v: `${hc.months_to_first_revenue ?? '?'} months` },
                      { l: 'Team', v: (hc.team_size ?? 1) === 1 ? 'Solo' : `${hc.team_size}p` },
                      { l: 'Monthly Burn', v: `₹${Math.round((hc.budget_inr ?? 50000) / ((hc.months_to_first_revenue ?? 6) * 1000))}K max` },
                      { l: 'Runway', v: `~${hc.months_to_first_revenue ?? '?'} months` },
                    ].map(r => <Row key={r.l} label={r.l} value={r.v} vc={t.text} t={t} />)}
                    <div style={{ marginTop: 10, paddingTop: 8, borderTop: `1px solid ${t.border}` }}>
                      <div style={{ fontSize: 9.5, color: t.dim, fontFamily: 'monospace', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 7 }}>Technical Stack</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {(hc.technical_skills ?? []).map((s: string) => (
                          <span key={s} style={{ padding: '2px 7px', borderRadius: 999, background: `${t.gold}15`, border: `1px solid ${t.gold}28`, fontSize: 9.5, fontWeight: 600, color: t.gold, fontFamily: 'monospace' }}>{s.toUpperCase()}</span>
                        ))}
                      </div>
                    </div>
                  </Card>
                </div>

                {/* ROW 4: Timeline + Notes + Next Update */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px 185px', gap: 12 }}>
                  <Card t={t} style={{ padding: 14 }}>
                    <CardTitle icon={<TrendingUp size={13} />} text="Twin Evolution Timeline" color={t.gold} />
                    <div style={{ display: 'flex', alignItems: 'center', position: 'relative', marginTop: 8 }}>
                      <div style={{ position: 'absolute', top: '28%', left: 6, right: 6, height: 2, background: `linear-gradient(90deg, ${t.gold}, ${t.gold}40)`, zIndex: 0 }} />
                      {['Twin Created', 'Board Analysis', 'Blind Spots ID', 'Pivot Suggested', 'Updated'].map((ev, i) => (
                        <div key={ev} style={{ flex: 1, textAlign: 'center', position: 'relative', zIndex: 1 }}>
                          <div style={{ width: 11, height: 11, borderRadius: '50%', background: i < 4 ? t.gold : t.green, border: `2px solid ${t.bg}`, margin: '0 auto 7px' }} />
                          <div style={{ fontSize: 9.5, color: t.text, fontWeight: 600, lineHeight: 1.4 }}>{ev}</div>
                          <div style={{ fontSize: 9, color: t.dim, marginTop: 2 }}>Today</div>
                        </div>
                      ))}
                    </div>
                  </Card>
                  <Card t={t} style={{ padding: 14 }}>
                    <CardTitle icon={<Activity size={13} />} text="Twin Notes" color={t.blue} />
                    <blockquote style={{ margin: 0, padding: '10px 12px', borderLeft: `3px solid ${t.gold}`, background: `${t.gold}08`, borderRadius: '0 8px 8px 0' }}>
                      <p style={{ fontSize: 12.5, color: t.muted, lineHeight: 1.75, margin: '0 0 6px', fontStyle: 'italic' }}>"Focus on leverage. Build small, charge early, and talk to customers obsessively."</p>
                      <footer style={{ fontSize: 10, color: t.gold, fontFamily: 'monospace' }}>— Darwin AI</footer>
                    </blockquote>
                  </Card>
                  <Card t={t} style={{ padding: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <CardTitle icon={<Clock size={13} />} text="Next Update In" color={t.green} />
                    <div style={{ fontSize: 42, fontWeight: 900, color: t.gold, fontFamily: 'monospace', letterSpacing: '-0.04em', lineHeight: 1 }}>6</div>
                    <div style={{ fontSize: 12, color: t.dim }}>Days</div>
                    <p style={{ fontSize: 11, color: t.dim, margin: '6px 0 0', textAlign: 'center' }}>Continue building. I'm learning.</p>
                  </Card>
                </div>

                {twin.startup_idea && (
                  <div style={{ textAlign: 'center' }}>
                    <button onClick={() => setViewState('board')} style={{ padding: '11px 28px', borderRadius: 999, background: `${t.gold}18`, border: `1px solid ${t.gold}35`, color: t.gold, fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <LayoutDashboard size={14} /> Open Boardroom for this idea →
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── BOARD ──────────────────────────────────────────────────── */}
            {viewState === 'board' && (
              <motion.div key="board" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <button onClick={() => setViewState('profile')} style={{ alignSelf: 'flex-start', padding: '7px 14px', borderRadius: 9, background: 'transparent', border: `1px solid ${t.border}`, color: t.muted, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <ChevronRight size={12} style={{ transform: 'rotate(180deg)' }} /> Back to Profile
                </button>
                {!twin.startup_idea ? (
                  <Card t={t} style={{ padding: 36, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22 }}>
                    <LayoutDashboard size={40} color={t.gold} />
                    <div style={{ fontSize: 24, fontWeight: 800, color: t.text }}>Activate Your Board</div>
                    <p style={{ fontSize: 13, color: t.muted, textAlign: 'center', maxWidth: 440, lineHeight: 1.8, margin: 0 }}>Describe your startup idea. Your AI Executive Board will debate and plan it in real time.</p>
                    <textarea value={idea} onChange={e => setIdea(e.target.value)} rows={4} placeholder="e.g. I want to build an AI CRM for coaching institutes in Tier 2 cities…"
                      style={{ width: '100%', maxWidth: 500, boxSizing: 'border-box', background: 'rgba(255,255,255,0.04)', border: `1px solid ${t.border}`, borderRadius: 12, padding: '13px 15px', color: t.text, fontSize: 13, fontFamily: 'inherit', resize: 'none', outline: 'none' }} />
                    <button onClick={submitIdea} disabled={!idea.trim() || isSubmitting} style={{ padding: '12px 32px', borderRadius: 999, border: 'none', background: `linear-gradient(135deg, ${t.gold}, ${t.gold2})`, color: '#0a0a0c', fontSize: 14, fontWeight: 800, cursor: 'pointer' }}>
                      {isSubmitting ? 'Calibrating board…' : 'Propose to the Board →'}
                    </button>
                  </Card>
                ) : (
                  <Card t={t}>
                    <BoardRoom twin={twin} apiBaseUrl={apiUrl} onDecisionReached={s => { setSession(s); setViewState('execution') }} />
                  </Card>
                )}
              </motion.div>
            )}

            {viewState === 'execution' && session && (
              <motion.div key="exec" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <ExecutionTracker session={session} twin={twin} apiBaseUrl={apiUrl} onComplete={() => setViewState('report')} />
              </motion.div>
            )}

            {viewState === 'report' && (
              <motion.div key="report" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <Card t={t} style={{ padding: 30, display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Shield size={32} color={t.green} />
                    <div>
                      <h2 style={{ margin: 0, fontSize: 19, fontWeight: 800, color: t.text }}>Final CEO Report</h2>
                      <p style={{ margin: 0, fontSize: 10.5, color: t.dim, fontFamily: 'monospace' }}>Board session complete</p>
                    </div>
                  </div>
                  <p style={{ fontSize: 13, color: t.muted, lineHeight: 1.9, margin: 0 }}>The technical team has completed the blueprint suite. Your idea has been validated, debated by the board, and mapped to a production-ready tech stack.</p>
                  <div style={{ padding: '13px 16px', background: 'rgba(0,0,0,0.25)', border: `1px solid ${t.border}`, borderRadius: 10, fontFamily: 'monospace', fontSize: 12, color: t.dim, lineHeight: 2 }}>
                    <div>// GitLab repository configured ✓</div>
                    <div>// PRD and architecture finalized ✓</div>
                    <div style={{ color: t.green }}>// Handing over keys to Founder ✓</div>
                  </div>
                  <button onClick={() => setViewState('profile')} style={{ alignSelf: 'flex-start', padding: '9px 22px', borderRadius: 999, background: `${t.gold}15`, border: `1px solid ${t.gold}30`, color: t.gold, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ChevronRight size={12} style={{ transform: 'rotate(180deg)' }} /> Back to Profile
                  </button>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0c' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
          style={{ width: 34, height: 34, borderRadius: '50%', border: '2px solid #c9a84c40', borderTopColor: '#c9a84c' }} />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}
