'use client'

import { useState, useEffect, Suspense, useRef, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import {
  User, Cpu, Zap, Target, TrendingUp, AlertTriangle,
  XCircle, Heart, ChevronRight, LayoutDashboard,
  GitMerge, Map, Lightbulb, BarChart2, Settings,
  Download, RefreshCw, CheckCircle, Shield,
  Brain, Activity, Clock, SunMedium, Moon, LogOut, UserCircle,
  Camera, Save, Github, Linkedin, Instagram, Globe, Twitter,
  Sparkles, Loader2, AlertCircle, ExternalLink
} from 'lucide-react'
import { DigitalTwin, BoardSession, UserProfile, SocialLinks, ExecutionPackage } from '../../types'
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
function Sidebar({ twin, t, view, setView, profilePhoto, debateComplete }: {
  twin: DigitalTwin | null
  t: ReturnType<typeof tokens>
  view: string
  setView: (v: any) => void
  profilePhoto?: string | null
  debateComplete?: boolean
}) {
  const router = useRouter()
  const logout = useAuthStore(state => state.logout)

  const handleLogout = () => {
    logout()
    router.push('/auth')
  }
  const nav = [
    { icon: <User size={15} />, label: 'Founder Twin', id: 'profile' },
    { icon: <LayoutDashboard size={15} />, label: 'Boardroom', id: 'board' },
    { icon: <Lightbulb size={15} />, label: 'Opportunities', id: 'opps' },
    { icon: <GitMerge size={15} />, label: 'Startup Blueprint', id: 'blueprint' },
    { icon: <Map size={15} />, label: 'Roadmap', id: 'roadmap' },
    { icon: <Shield size={15} />, label: 'GitLab Workspace', id: 'gitlab' },
    { icon: <BarChart2 size={15} />, label: 'Reports', id: 'reports' },
    { icon: <UserCircle size={15} />, label: 'My Profile', id: 'my-profile' },
    { icon: <Settings size={15} />, label: 'Settings', id: 'settings' },
  ]
  const handleNavClick = (id: string) => {
    setView(id as any)
  }
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
          // Tabs that require a completed debate to be active
          const requiresDebate = ['opps', 'blueprint', 'roadmap', 'gitlab', 'reports'].includes(item.id)
          const locked = requiresDebate && !debateComplete
          return (
            <div key={item.id} onClick={() => !locked && handleNavClick(item.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 9, marginBottom: 2, cursor: locked ? 'not-allowed' : 'pointer', background: active ? `${t.gold}18` : 'transparent', border: `1px solid ${active ? t.gold + '35' : 'transparent'}`, transition: 'all 0.2s', opacity: locked ? 0.45 : 1 }}>
              <span style={{ color: active ? t.gold : locked ? t.dim : t.muted, display: 'flex' }}>{item.icon}</span>
              <span style={{ fontSize: 12.5, fontWeight: active ? 600 : 400, color: active ? t.gold : locked ? t.dim : t.muted, flex: 1 }}>{item.label}</span>
              {active && <ChevronRight size={11} color={t.gold} />}
              {requiresDebate && debateComplete && !active && (
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: t.green, flexShrink: 0 }} />
              )}
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
      <div
        onClick={() => setView('my-profile')}
        style={{ padding: '12px 14px', borderTop: `1px solid ${t.border}`, display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer' }}
      >
        <div style={{
          width: 30, height: 30, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
          background: profilePhoto ? 'transparent' : `linear-gradient(135deg, ${t.gold}70, ${t.purple}70)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `1.5px solid ${t.gold}40`,
        }}>
          {profilePhoto
            ? <img src={profilePhoto} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <User size={14} color={t.text} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: t.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{twin?.founder_name || 'Founder'}</div>
          <div style={{ fontSize: 10, color: t.dim }}>Edit Profile</div>
        </div>
        <div
          onClick={e => { e.stopPropagation(); handleLogout() }}
          style={{ cursor: 'pointer', color: t.dim, padding: '4px', display: 'flex', flexShrink: 0 }}
          title="Log Out"
        >
          <LogOut size={15} />
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

// ─── Inline Profile Settings Panel ──────────────────────────────────────────
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const SOCIAL_FIELDS_CFG: { key: keyof SocialLinks; label: string; icon: React.ReactNode; placeholder: string; color: string }[] = [
  { key: 'github',    label: 'GitHub',    icon: <Github size={14} />,    placeholder: 'https://github.com/yourusername', color: '#f0f6fc' },
  { key: 'linkedin',  label: 'LinkedIn',  icon: <Linkedin size={14} />,  placeholder: 'https://linkedin.com/in/yourprofile', color: '#0a66c2' },
  { key: 'instagram', label: 'Instagram', icon: <Instagram size={14} />, placeholder: 'https://instagram.com/yourhandle', color: '#e1306c' },
  { key: 'portfolio', label: 'Portfolio', icon: <Globe size={14} />,     placeholder: 'https://yourwebsite.com', color: '#c9a84c' },
  { key: 'twitter',   label: 'Twitter/X', icon: <Twitter size={14} />,   placeholder: 'https://twitter.com/yourhandle', color: '#1d9bf0' },
]

function ProfilePanel({ t, token, userId, onPhotoChange }: {
  t: ReturnType<typeof tokens>
  token: string | null
  userId: string | null
  onPhotoChange: (b64: string) => void
}) {
  const [profile, setProfile]         = useState<UserProfile | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio]                 = useState('')
  const [links, setLinks]             = useState<SocialLinks>({})
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoFile, setPhotoFile]     = useState<File | null>(null)
  const [saving, setSaving]           = useState(false)
  const [crawling, setCrawling]       = useState(false)
  const [toast, setToast]             = useState<{ msg: string; kind: 'ok' | 'err' } | null>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)

  const authH = useCallback(() => ({ Authorization: `Bearer ${token}` }), [token])
  const showToast = (msg: string, kind: 'ok' | 'err') => { setToast({ msg, kind }); setTimeout(() => setToast(null), 3200) }

  useEffect(() => {
    if (!token || !userId) return
    fetch(`${API}/profile`, { headers: authH() }).then(r => r.ok ? r.json() : null).then(data => {
      if (!data) return
      setProfile(data)
      setDisplayName(data.display_name || '')
      setBio(data.bio || '')
      setLinks(data.social_links || {})
      if (data.profile_photo_b64) { setPhotoPreview(data.profile_photo_b64); onPhotoChange(data.profile_photo_b64) }
    })
  }, [token, userId, authH, onPhotoChange])

  const handlePhotoPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setPhotoFile(file)
    const reader = new FileReader()
    reader.onload = ev => { const src = ev.target?.result as string; setPhotoPreview(src); onPhotoChange(src) }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (photoFile) {
        const fd = new FormData(); fd.append('file', photoFile)
        await fetch(`${API}/profile/photo`, { method: 'POST', headers: authH(), body: fd })
      }
      const r = await fetch(`${API}/profile`, { method: 'PUT', headers: { ...authH(), 'Content-Type': 'application/json' }, body: JSON.stringify({ display_name: displayName, bio, ...links }) })
      if (r.ok) { const d = await r.json(); setProfile(d); showToast('Profile saved!', 'ok') }
      else showToast('Save failed', 'err')
    } catch { showToast('Save failed', 'err') } finally { setSaving(false) }
  }

  const handleCrawlNow = async () => {
    setCrawling(true)
    try {
      const r = await fetch(`${API}/profile/crawl-now`, { method: 'POST', headers: authH() })
      showToast(r.ok ? 'Crawler running! Twin will update shortly.' : 'Crawl failed', r.ok ? 'ok' : 'err')
    } catch { showToast('Crawl failed', 'err') } finally { setCrawling(false) }
  }

  const inp = (value: string, onChange: (v: string) => void, placeholder?: string, multiline?: boolean) => {
    const style: React.CSSProperties = { width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 8, color: t.text, fontSize: 12, fontFamily: 'inherit', outline: 'none', padding: '8px 12px', boxSizing: 'border-box', resize: multiline ? 'vertical' : 'none' }
    return multiline
      ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3} style={style} />
      : <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ ...style, height: 38 }} />
  }

  return (
    <div style={{ position: 'relative' }}>
      <style>{`input::placeholder,textarea::placeholder{color:#44445a} input:focus,textarea:focus{outline:none}`}</style>
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        {/* Avatar column */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div onClick={() => photoInputRef.current?.click()} style={{ width: 90, height: 90, borderRadius: '50%', overflow: 'hidden', border: `2px solid ${t.gold}40`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: photoPreview ? 'transparent' : `linear-gradient(135deg, ${t.gold}40, ${t.purple}40)`, position: 'relative' }}>
            {photoPreview ? <img src={photoPreview} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={32} color={t.gold} />}
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', opacity: 0, transition: 'opacity 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '1')} onMouseLeave={e => (e.currentTarget.style.opacity = '0')}>
              <Camera size={20} color="#fff" />
            </div>
          </div>
          <input ref={photoInputRef} type="file" accept="image/*" onChange={handlePhotoPick} style={{ display: 'none' }} />
          <span style={{ fontSize: 10, color: t.dim, cursor: 'pointer' }} onClick={() => photoInputRef.current?.click()}>Change Photo</span>
        </div>

        {/* Identity column */}
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 10, color: t.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5, display: 'block' }}>Display Name</label>
            {inp(displayName, setDisplayName, 'e.g. Balaraj R')}
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={{ fontSize: 10, color: t.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5, display: 'block' }}>Bio</label>
            {inp(bio, setBio, 'I build AI-powered products...', true)}
          </div>
          <div style={{ fontSize: 10, color: t.dim }}>Email: <span style={{ color: t.muted }}>{profile?.email || '—'}</span></div>
        </div>
      </div>

      {/* Social Links */}
      <div style={{ marginTop: 20, paddingTop: 18, borderTop: `1px solid ${t.border}` }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: t.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 7 }}>
          <ExternalLink size={13} color={t.gold} /> Public Social Links
          <span style={{ fontSize: 9, fontWeight: 400, color: t.dim, textTransform: 'none', letterSpacing: 0 }}>— crawled every 3 days to enrich your Twin</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '10px 20px' }}>
          {SOCIAL_FIELDS_CFG.map(sf => (
            <div key={sf.key}>
              <label style={{ fontSize: 10, color: sf.color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5, display: 'flex', alignItems: 'center', gap: 5 }}>
                {sf.icon} {sf.label}
              </label>
              <input value={links[sf.key] || ''} onChange={e => setLinks(p => ({ ...p, [sf.key]: e.target.value }))} placeholder={sf.placeholder}
                style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 8, color: t.text, fontSize: 12, fontFamily: 'inherit', outline: 'none', padding: '8px 12px', height: 36, boxSizing: 'border-box' }} />
            </div>
          ))}
        </div>
      </div>

      {/* Crawler + Actions */}
      <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: `${t.purple}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Cpu size={16} color={t.purple} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: t.text }}>Profile Crawler</div>
            <div style={{ fontSize: 10, color: t.dim, display: 'flex', alignItems: 'center', gap: 5 }}>
              <Clock size={10} /> Last crawled: {profile?.last_crawled_at ? new Date(profile.last_crawled_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Never'}
            </div>
          </div>
          <button onClick={handleCrawlNow} disabled={crawling} style={{ display: 'flex', alignItems: 'center', gap: 6, background: `${t.purple}18`, border: `1px solid ${t.purple}35`, borderRadius: 8, padding: '7px 14px', color: crawling ? t.dim : t.purple, cursor: crawling ? 'not-allowed' : 'pointer', fontSize: 11, fontWeight: 600 }}>
            {crawling ? <><Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> Crawling…</> : <><Sparkles size={12} /> Crawl Now</>}
          </button>
        </div>
        <button onClick={handleSave} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 8, background: saving ? `${t.gold}25` : `linear-gradient(135deg, ${t.gold}, #e8c96a)`, border: 'none', borderRadius: 10, padding: '10px 24px', color: saving ? t.muted : '#0a0a0c', fontSize: 13, fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer', boxShadow: saving ? 'none' : `0 4px 20px ${t.gold}35` }}>
          {saving ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</> : <><Save size={14} /> Save Profile</>}
        </button>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div key="toast" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
            style={{ position: 'fixed', bottom: 24, right: 24, background: toast.kind === 'ok' ? 'rgba(47,201,110,0.15)' : 'rgba(255,69,58,0.15)', border: `1px solid ${toast.kind === 'ok' ? '#2fc96e' : '#ff453a'}50`, backdropFilter: 'blur(20px)', borderRadius: 10, padding: '10px 18px', color: toast.kind === 'ok' ? '#2fc96e' : '#ff453a', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, zIndex: 9999 }}>
            {toast.kind === 'ok' ? <CheckCircle size={14} /> : <AlertCircle size={14} />} {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Main Content ─────────────────────────────────────────────────────────────
type ViewState = 'profile' | 'board' | 'execution' | 'report' | 'my-profile' | 'opps' | 'blueprint' | 'roadmap' | 'gitlab' | 'reports'

function DashboardContent() {
  const params = useSearchParams()
  const router = useRouter()
  const twinId = params.get('twin_id')
  const theme  = useTheme()
  const t      = tokens(theme)

  const [twin, setTwin]           = useState<DigitalTwin | null>(null)
  const [session, setSession]     = useState<BoardSession | null>(null)
  const [execPkg, setExecPkg]     = useState<ExecutionPackage | null>(null)
  const [loading, setLoading]     = useState(true)
  const [viewState, setViewState] = useState<ViewState>('profile')
  const [idea, setIdea]           = useState('')
  const [isSubmitting, setSubmit] = useState(false)
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null)
  const [debateComplete, setDebateComplete] = useState(false)
  const [isGeneratingPkg, setIsGeneratingPkg] = useState(false)

  const { token, userId, twinId: storedTwinId } = useAuthStore()

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  useEffect(() => {
    const load = async () => {
      // 1. Try URL param first
      const idFromUrl = twinId || storedTwinId
      let loadedTwin: DigitalTwin | null = null

      if (idFromUrl) {
        try {
          const r = await fetch(`${apiUrl}/twin/${idFromUrl}`)
          if (r.ok) {
            loadedTwin = await r.json()
            setTwin(loadedTwin!)
            if (loadedTwin?.startup_idea) setIdea(loadedTwin.startup_idea)
          }
        } catch { /* fall through */ }
      }

      // 2. Fall back to fetching by userId
      if (!loadedTwin && userId) {
        try {
          const r = await fetch(`${apiUrl}/twin/by-user/${userId}`)
          if (r.ok) {
            loadedTwin = await r.json()
            setTwin(loadedTwin!)
            if (loadedTwin?.startup_idea) setIdea(loadedTwin.startup_idea)
          }
        } catch { /* noop */ }
      }

      // 3. Auto-restore debateComplete from past sessions
      if (loadedTwin?.twin_id) {
        try {
          const sessionsRes = await fetch(`${apiUrl}/board/sessions/${loadedTwin.twin_id}`)
          if (sessionsRes.ok) {
            const sessionsList: Array<{
              session_id: string; status: string; decision: string | null;
            }> = await sessionsRes.json()
            const latest = sessionsList.find(s => s.status === 'decided')
            if (latest) {
              // Load the full session so board can show history
              const detailRes = await fetch(`${apiUrl}/board/session/${latest.session_id}`)
              if (detailRes.ok) {
                const detail = await detailRes.json()
                setSession(detail.session)
                if (detail.execution_package) {
                  setExecPkg(detail.execution_package)
                }
                setDebateComplete(true)
              }
            }
          }
        } catch { /* noop — sessions API might not exist yet */ }
      }

      setLoading(false)
    }
    load()
    // Also pre-fetch profile photo so sidebar avatar shows immediately
    if (token && userId) {
      fetch(`${apiUrl}/profile`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : null)
        .then(data => { if (data?.profile_photo_b64) setProfilePhoto(data.profile_photo_b64) })
        .catch(() => { /* noop */ })
    }
  }, [twinId, storedTwinId, token, userId, apiUrl])


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
          <Sidebar twin={twin} t={t} view={viewState} setView={setViewState} profilePhoto={profilePhoto} debateComplete={debateComplete} />
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

            {/* ── MY PROFILE (settings) ────────────────────────────────── */}
            {viewState === 'my-profile' && (
              <motion.div key="my-profile" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                <Card style={{ padding: 28 }} t={t}>
                  <div style={{ marginBottom: 22, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: `${t.gold}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <UserCircle size={20} color={t.gold} />
                    </div>
                    <div>
                      <div style={{ color: t.text, fontWeight: 800, fontSize: 16 }}>Founder Profile</div>
                      <div style={{ color: t.dim, fontSize: 11, marginTop: 1 }}>Your public identity & social links — used to enrich your Digital Twin</div>
                    </div>
                  </div>
                  <ProfilePanel t={t} token={token} userId={userId} onPhotoChange={setProfilePhoto} />
                </Card>
              </motion.div>
            )}

            {/* ── PROFILE ─────────────────────────────────────────────────── */}
            {viewState === 'profile' && (
              <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                {/* ROW 1: Identity card */}
                <Card t={t} style={{ display: 'flex', gap: 18, alignItems: 'flex-start', padding: '18px 22px' }}>
                  <div style={{ width: 66, height: 66, borderRadius: '50%', background: profilePhoto ? 'transparent' : `linear-gradient(135deg, ${t.gold}55, ${t.purple}55)`, border: `2px solid ${t.gold}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                    {profilePhoto ? <img src={profilePhoto} alt="Founder" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User size={28} color={t.gold} />}
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
                  <BoardRoom twin={twin} apiBaseUrl={apiUrl} initialSession={session} onDecisionReached={async (s, pkg, isReplay) => {
                    setSession(s)
                    setDebateComplete(true)
                    if (pkg) {
                      // Called from replay AND package exists — just store data
                      setExecPkg(pkg)
                    } else if (!isReplay) {
                      // Missing package BUT it is NOT a replay (i.e. fresh debate, or user clicked Launch Full Blueprint)
                      // Trigger the execution engine automatically and switch tabs
                      setIsGeneratingPkg(true)
                      setViewState('blueprint')
                      try {
                        const r = await fetch(`${apiUrl}/execution/run`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ session_id: s.session_id }),
                        })
                        if (r.ok) {
                          const packageData: ExecutionPackage = await r.json()
                          setExecPkg(packageData)
                        }
                      } catch { /* noop */ } finally {
                        setIsGeneratingPkg(false)
                      }
                    } else {
                      // It IS a replay, but package is missing. 
                      // Do nothing, let the user stay on the Board tab. They can click "Launch Full Blueprint Suite" manually.
                      setExecPkg(null)
                    }
                  }} />

                )}

              </motion.div>
            )}

            {viewState === 'execution' && session && (
              <motion.div key="exec" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <ExecutionTracker session={session} twin={twin} apiBaseUrl={apiUrl} onComplete={() => setViewState('report')} />
              </motion.div>
            )}

            {/* ── OPPORTUNITIES ───────────────────────────────────────────── */}
            {viewState === 'opps' && (
              <motion.div key="opps" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Card t={t} style={{ padding: '18px 22px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: `${t.gold}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Lightbulb size={20} color={t.gold} />
                    </div>
                    <div>
                      <div style={{ fontSize: 17, fontWeight: 800, color: t.text }}>Opportunities Identified</div>
                      <div style={{ fontSize: 11, color: t.dim, marginTop: 1 }}>Aggregated from all 5 board agents across 3 rounds of debate</div>
                    </div>
                  </div>
                  {session?.rounds?.length ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
                      {session.rounds.flatMap(round => round).map((op, i) => (
                        op.opportunities.length > 0 ? (
                          <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${t.border}`, borderRadius: 12, padding: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                              <span style={{ fontSize: 9.5, fontFamily: 'monospace', fontWeight: 700, color: t.gold, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{op.agent} · R{op.round}</span>
                              <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 800, color: op.score >= 7 ? t.green : op.score >= 5 ? t.orange : t.red }}>{op.score.toFixed(1)}/10</span>
                            </div>
                            {op.opportunities.map((o, j) => (
                              <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 7, fontSize: 12, color: t.muted }}>
                                <span style={{ color: t.green, flexShrink: 0, marginTop: 2 }}>▸</span> {o}
                              </div>
                            ))}
                          </div>
                        ) : null
                      ))}
                    </div>
                  ) : (
                    <div style={{ padding: 32, textAlign: 'center', color: t.dim, fontSize: 13 }}>Run a board debate to see opportunities here.</div>
                  )}
                  {session?.decision?.recommended_idea && (
                    <div style={{ marginTop: 16, padding: '14px 18px', background: `${t.blue}10`, border: `1px solid ${t.blue}25`, borderRadius: 12 }}>
                      <div style={{ fontSize: 10, fontFamily: 'monospace', color: t.blue, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Board Recommended Direction</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: t.text }}>{session.decision.recommended_idea}</div>
                    </div>
                  )}
                </Card>
              </motion.div>
            )}

            {/* ── STARTUP BLUEPRINT ──────────────────────────────────────── */}
            {viewState === 'blueprint' && (
              <motion.div key="blueprint" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Card t={t} style={{ padding: '18px 22px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: `${t.purple}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <GitMerge size={20} color={t.purple} />
                    </div>
                    <div>
                      <div style={{ fontSize: 17, fontWeight: 800, color: t.text }}>Startup Blueprint</div>
                      <div style={{ fontSize: 11, color: t.dim }}>Product Requirements Document generated by your AI board</div>
                    </div>
                  </div>
                  {execPkg?.prd ? (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                        <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${t.border}`, borderRadius: 10, padding: 14 }}>
                          <div style={{ fontSize: 9.5, color: t.gold, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Product Name</div>
                          <div style={{ fontSize: 15, fontWeight: 800, color: t.text }}>{execPkg.prd.product_name}</div>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${t.border}`, borderRadius: 10, padding: 14 }}>
                          <div style={{ fontSize: 9.5, color: t.gold, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Target Customer</div>
                          <div style={{ fontSize: 13, color: t.text }}>{execPkg.prd.target_customer}</div>
                        </div>
                      </div>
                      <div style={{ background: `${t.blue}08`, border: `1px solid ${t.blue}20`, borderRadius: 10, padding: 14, marginBottom: 16 }}>
                        <div style={{ fontSize: 9.5, color: t.blue, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Problem Statement</div>
                        <div style={{ fontSize: 13, color: t.muted, lineHeight: 1.7 }}>{execPkg.prd.problem_statement}</div>
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: t.text, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <CheckCircle size={14} color={t.green} /> MVP Features ({execPkg.prd.build_weeks}w to build)
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                        {execPkg.prd.mvp_features.map((f, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${t.border}`, borderRadius: 9 }}>
                            <span style={{ padding: '1px 7px', borderRadius: 4, fontSize: 9, fontWeight: 700, fontFamily: 'monospace', background: f.priority === 'must_have' ? `${t.green}20` : `${t.orange}20`, color: f.priority === 'must_have' ? t.green : t.orange, flexShrink: 0, marginTop: 1 }}>
                              {f.priority.replace('_', ' ').toUpperCase()}
                            </span>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 600, color: t.text }}>{f.name}</div>
                              <div style={{ fontSize: 11.5, color: t.dim, marginTop: 2 }}>{f.description}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                      {execPkg.prd.explicitly_excluded?.length > 0 && (
                        <div style={{ background: `${t.red}08`, border: `1px solid ${t.red}20`, borderRadius: 10, padding: 14 }}>
                          <div style={{ fontSize: 9.5, color: t.red, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}><AlertTriangle size={11} /> Explicitly Excluded</div>
                          {execPkg.prd.explicitly_excluded.map((f, i) => (
                            <div key={i} style={{ fontSize: 12, color: t.dim, marginBottom: 4, display: 'flex', alignItems: 'flex-start', gap: 7 }}>
                              <span style={{ color: t.red, flexShrink: 0 }}>✕</span> <span><strong style={{ color: t.muted }}>{f.name}:</strong> {f.exclusion_reason}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : isGeneratingPkg ? (
                    <div style={{ padding: 32, textAlign: 'center', color: t.dim, fontSize: 13 }}>
                      <div style={{ color: t.gold, marginBottom: 12 }}><Loader2 className="animate-spin" size={32} style={{ margin: '0 auto' }} /></div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: t.text }}>Generating Blueprint...</div>
                      <div style={{ fontSize: 12, color: t.muted }}>Synthesizing debate into execution architecture...</div>
                    </div>
                  ) : (
                    <div style={{ padding: 32, textAlign: 'center', color: t.dim, fontSize: 13 }}>Run a board debate to generate your full executive report.</div>
                  )}
                </Card>
              </motion.div>
            )}

            {/* ── ROADMAP ────────────────────────────────────────────────── */}
            {viewState === 'roadmap' && (
              <motion.div key="roadmap" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Card t={t} style={{ padding: '18px 22px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: `${t.blue}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Map size={20} color={t.blue} />
                    </div>
                    <div>
                      <div style={{ fontSize: 17, fontWeight: 800, color: t.text }}>Execution Roadmap</div>
                      <div style={{ fontSize: 11, color: t.dim }}>Financial projections & milestone timeline</div>
                    </div>
                  </div>
                  {execPkg?.financial_model ? (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
                        {[
                          { label: 'CAC', value: `₹${execPkg.financial_model.cac_inr.toLocaleString()}`, color: t.red },
                          { label: 'LTV', value: `₹${execPkg.financial_model.ltv_inr.toLocaleString()}`, color: t.green },
                          { label: 'LTV/CAC', value: execPkg.financial_model.ltv_cac_ratio.toFixed(1) + 'x', color: execPkg.financial_model.ltv_cac_ratio >= 3 ? t.green : t.orange },
                          { label: 'Break-even', value: `Month ${execPkg.financial_model.break_even_month}`, color: t.blue },
                        ].map(m => (
                          <div key={m.label} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${t.border}`, borderRadius: 10, padding: '14px 16px', textAlign: 'center' }}>
                            <div style={{ fontSize: 9, color: t.dim, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>{m.label}</div>
                            <div style={{ fontSize: 18, fontWeight: 900, color: m.color, fontFamily: 'monospace' }}>{m.value}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: t.muted, marginBottom: 12, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Monthly Milestones</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {execPkg.financial_model.monthly_projections.map((m, i) => (
                          <div key={i} style={{ display: 'grid', gridTemplateColumns: '60px 1fr 120px 120px', gap: 12, alignItems: 'center', padding: '10px 14px', background: 'rgba(255,255,255,0.025)', border: `1px solid ${t.border}`, borderRadius: 9 }}>
                            <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 800, color: t.gold }}>Mo {m.month}</span>
                            <span style={{ fontSize: 12, color: t.text }}>{m.milestone}</span>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: 9, color: t.dim, marginBottom: 2 }}>BURN</div>
                              <div style={{ fontSize: 11, fontWeight: 700, color: t.red, fontFamily: 'monospace' }}>₹{m.burn_inr.toLocaleString()}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: 9, color: t.dim, marginBottom: 2 }}>MRR</div>
                              <div style={{ fontSize: 11, fontWeight: 700, color: m.mrr_inr > 0 ? t.green : t.dim, fontFamily: 'monospace' }}>₹{m.mrr_inr.toLocaleString()}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div style={{ marginTop: 14, padding: '12px 16px', background: execPkg.financial_model.verdict === 'Viable' ? `${t.green}10` : `${t.orange}10`, border: `1px solid ${execPkg.financial_model.verdict === 'Viable' ? t.green : t.orange}25`, borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <CheckCircle size={16} color={execPkg.financial_model.verdict === 'Viable' ? t.green : t.orange} />
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: execPkg.financial_model.verdict === 'Viable' ? t.green : t.orange }}>Financial Verdict: {execPkg.financial_model.verdict}</div>
                          <div style={{ fontSize: 11, color: t.dim, marginTop: 1 }}>Capital recovered by Month {execPkg.financial_model.capital_recovered_month}</div>
                        </div>
                      </div>
                    </>
                  ) : isGeneratingPkg ? (
                    <div style={{ padding: 32, textAlign: 'center', color: t.dim, fontSize: 13 }}>
                      <div style={{ color: t.gold, marginBottom: 12 }}><Loader2 className="animate-spin" size={32} style={{ margin: '0 auto' }} /></div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: t.text }}>Generating Roadmap...</div>
                      <div style={{ fontSize: 12, color: t.muted }}>Projecting timeline and metrics...</div>
                    </div>
                  ) : (
                    <div style={{ padding: 32, textAlign: 'center', color: t.dim, fontSize: 13 }}>Run a board debate to generate your full executive report.</div>
                  )}
                </Card>
              </motion.div>
            )}

            {/* ── GITLAB WORKSPACE ───────────────────────────────────────── */}
            {viewState === 'gitlab' && (
              <motion.div key="gitlab" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Card t={t} style={{ padding: '18px 22px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: `${t.orange}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Shield size={20} color={t.orange} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 17, fontWeight: 800, color: t.text }}>GitLab Workspace</div>
                      <div style={{ fontSize: 11, color: t.dim }}>Auto-generated issues, milestones and epics</div>
                    </div>
                    {execPkg?.gitlab_output?.project_url && (
                      <a href={execPkg.gitlab_output.project_url} target="_blank" rel="noopener noreferrer"
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, background: `${t.orange}18`, border: `1px solid ${t.orange}35`, color: t.orange, fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
                        <ExternalLink size={12} /> Open Repository
                      </a>
                    )}
                  </div>
                  {execPkg?.gitlab_output ? (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
                        {[
                          { label: 'Milestones', items: execPkg.gitlab_output.milestones_created, color: t.blue },
                          { label: 'Epics', items: execPkg.gitlab_output.epics_created, color: t.purple },
                          { label: 'Total Issues', items: [String(execPkg.gitlab_output.issues_created.length)], color: t.green },
                        ].map(g => (
                          <div key={g.label} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${t.border}`, borderRadius: 10, padding: 14 }}>
                            <div style={{ fontSize: 9.5, color: g.color, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>{g.label}</div>
                            {g.items.map((item, i) => (
                              <div key={i} style={{ fontSize: 12, color: t.text, marginBottom: 4 }}>{item}</div>
                            ))}
                          </div>
                        ))}
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: t.muted, marginBottom: 10, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Issues Created</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {execPkg.gitlab_output.issues_created.map((issue, i) => (
                          <div key={i} style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.025)', border: `1px solid ${t.border}`, borderRadius: 9 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                              <span style={{ fontSize: 12, fontWeight: 600, color: t.text }}>{issue.title}</span>
                              <span style={{ fontSize: 9, fontFamily: 'monospace', color: t.dim, padding: '1px 6px', borderRadius: 4, border: `1px solid ${t.border}` }}>{issue.estimated_hours}h</span>
                            </div>
                            <div style={{ display: 'flex', gap: 6 }}>
                              {issue.labels?.slice(0, 3).map((l, j) => (
                                <span key={j} style={{ fontSize: 9, padding: '1px 6px', borderRadius: 4, background: `${t.purple}18`, color: t.purple, border: `1px solid ${t.purple}30` }}>{l}</span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                      {execPkg.gitlab_output.note && (
                        <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${t.border}`, borderRadius: 9, fontSize: 11, color: t.dim }}>{execPkg.gitlab_output.note}</div>
                      )}
                    </>
                  ) : (
                    <div style={{ padding: 32, textAlign: 'center', color: t.dim, fontSize: 13 }}>GitLab workspace requires a GitLab token. Add it in Settings to auto-create your project.</div>
                  )}
                </Card>
              </motion.div>
            )}

            {/* ── REPORTS ────────────────────────────────────────────────── */}
            {(viewState === 'reports' || viewState === 'report') && (
              <motion.div key="reports" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Card t={t} style={{ padding: '18px 22px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: `${t.green}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <BarChart2 size={20} color={t.green} />
                    </div>
                    <div>
                      <div style={{ fontSize: 17, fontWeight: 800, color: t.text }}>Executive Summary Report</div>
                      <div style={{ fontSize: 11, color: t.dim }}>Full board session output — shareable with co-founders & investors</div>
                    </div>
                  </div>

                  {session?.decision ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {/* Verdict section */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                        {[
                          { label: 'Board Verdict', value: session.decision.decision, color: session.decision.decision === 'PROCEED' ? t.green : session.decision.decision === 'PIVOT' ? t.orange : t.red },
                          { label: 'Overall Score', value: `${Math.round(session.decision.overall_score)}/100`, color: t.gold },
                          { label: 'Confidence', value: `${Math.round(session.decision.confidence)}%`, color: t.blue },
                        ].map(s => (
                          <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${t.border}`, borderRadius: 10, padding: '14px 18px', textAlign: 'center' }}>
                            <div style={{ fontSize: 9, color: t.dim, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>{s.label}</div>
                            <div style={{ fontSize: 20, fontWeight: 900, color: s.color, fontFamily: 'monospace' }}>{s.value}</div>
                          </div>
                        ))}
                      </div>

                      {/* Key insight */}
                      <div style={{ padding: '14px 18px', background: `${t.gold}09`, border: `1px solid ${t.gold}25`, borderRadius: 12 }}>
                        <div style={{ fontSize: 9.5, color: t.gold, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Key Insight</div>
                        <div style={{ fontSize: 14, color: t.text, lineHeight: 1.7, fontStyle: 'italic' }}>&ldquo;{session.decision.key_insight}&rdquo;</div>
                      </div>

                      {/* Vote breakdown */}
                      {session.decision.votes?.length > 0 && (
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: t.muted, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Agent Vote Breakdown</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {session.decision.votes.map(v => (
                              <div key={v.agent} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 14px', background: 'rgba(255,255,255,0.025)', border: `1px solid ${t.border}`, borderRadius: 9 }}>
                                <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 700, color: v.vote === 'PROCEED' ? t.green : v.vote === 'NO' ? t.red : t.orange, minWidth: 80 }}>{v.agent} · {v.vote}</span>
                                <span style={{ fontSize: 12, color: t.muted, lineHeight: 1.5 }}>{v.vote_reason}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Tech architecture */}
                      {execPkg?.tech_architecture && (
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: t.muted, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Recommended Tech Architecture</div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            {Object.entries({
                              Frontend: execPkg.tech_architecture.frontend,
                              Backend: execPkg.tech_architecture.backend,
                              'AI Layer': execPkg.tech_architecture.ai_layer,
                              Database: execPkg.tech_architecture.database,
                              Infrastructure: execPkg.tech_architecture.infra,
                            }).map(([k, v]) => (
                              <div key={k} style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.025)', border: `1px solid ${t.border}`, borderRadius: 8 }}>
                                <span style={{ fontSize: 9.5, color: t.dim, fontFamily: 'monospace', textTransform: 'uppercase' }}>{k}</span>
                                <div style={{ fontSize: 12, color: t.text, marginTop: 3 }}>{v}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <button onClick={() => setViewState('profile')} style={{ alignSelf: 'flex-start', padding: '9px 22px', borderRadius: 999, background: `${t.gold}15`, border: `1px solid ${t.gold}30`, color: t.gold, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <ChevronRight size={12} style={{ transform: 'rotate(180deg)' }} /> Back to Profile
                      </button>
                    </div>
                  ) : (
                    <div style={{ padding: 32, textAlign: 'center', color: t.dim, fontSize: 13 }}>Run a board debate to generate your full executive report.</div>
                  )}
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
