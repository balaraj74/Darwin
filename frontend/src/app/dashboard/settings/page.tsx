'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User, Github, Linkedin, Instagram, Globe, Twitter,
  Camera, Save, RefreshCw, CheckCircle, AlertCircle,
  ArrowLeft, Cpu, Clock, Sparkles, ExternalLink, Loader2
} from 'lucide-react'
import { useAuthStore } from '../../../hooks/useAuth'
import { UserProfile, SocialLinks } from '../../../types'
import { auth } from '../../../lib/firebase'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// ─── Theme tokens (matches dashboard) ────────────────────────────────────────
const T = {
  bg: '#0a0a0c',
  card: 'rgba(14,14,22,0.72)',
  cardBorder: 'rgba(201,168,76,0.14)',
  text: '#eeeef5',
  muted: '#7878a0',
  dim: '#44445a',
  gold: '#c9a84c',
  gold2: '#e8c96a',
  green: '#2fc96e',
  red: '#ff453a',
  blue: '#2997ff',
  purple: '#bf48ff',
  input: 'rgba(255,255,255,0.04)',
  inputBorder: 'rgba(255,255,255,0.10)',
  inputFocus: 'rgba(201,168,76,0.30)',
}

// ─── Social link config ───────────────────────────────────────────────────────
const SOCIAL_FIELDS: {
  key: keyof SocialLinks
  label: string
  icon: React.ReactNode
  placeholder: string
  color: string
}[] = [
  { key: 'github',    label: 'GitHub',    icon: <Github size={16} />,    placeholder: 'https://github.com/yourusername', color: '#f0f6fc' },
  { key: 'linkedin',  label: 'LinkedIn',  icon: <Linkedin size={16} />,  placeholder: 'https://linkedin.com/in/yourprofile', color: '#0a66c2' },
  { key: 'instagram', label: 'Instagram', icon: <Instagram size={16} />, placeholder: 'https://instagram.com/yourhandle', color: '#e1306c' },
  { key: 'portfolio', label: 'Portfolio', icon: <Globe size={16} />,     placeholder: 'https://yourwebsite.com', color: T.gold },
  { key: 'twitter',   label: 'Twitter/X', icon: <Twitter size={16} />,   placeholder: 'https://twitter.com/yourhandle', color: '#1d9bf0' },
]

// ─── Utility ──────────────────────────────────────────────────────────────────
function fmtDate(iso?: string | null) {
  if (!iso) return 'Never'
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

// ─── Glass card ───────────────────────────────────────────────────────────────
function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: T.card,
      backdropFilter: 'blur(40px) saturate(180%)',
      WebkitBackdropFilter: 'blur(40px) saturate(180%)',
      border: `1px solid ${T.cardBorder}`,
      borderRadius: 16,
      padding: 24,
      ...style,
    }}>
      {children}
    </div>
  )
}

// ─── Input field ──────────────────────────────────────────────────────────────
function Field({
  label, value, onChange, placeholder, icon, color, type = 'text', multiline = false
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  icon?: React.ReactNode
  color?: string
  type?: string
  multiline?: boolean
}) {
  const [focused, setFocused] = useState(false)
  const base = {
    width: '100%',
    background: T.input,
    border: `1px solid ${focused ? T.inputFocus : T.inputBorder}`,
    borderRadius: 10,
    color: T.text,
    fontSize: 13,
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box' as const,
  }

  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11.5, fontWeight: 600, color: color || T.muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {icon && <span style={{ color: color || T.muted }}>{icon}</span>}
        {label}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{ ...base, padding: '10px 14px', resize: 'vertical' }}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{ ...base, padding: '10px 14px', height: 42 }}
        />
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProfileSettingsPage() {
  const router = useRouter()
  const { token, userId } = useAuthStore()

  // Form state
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio]                 = useState('')
  const [links, setLinks]             = useState<SocialLinks>({})
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoFile, setPhotoFile]     = useState<File | null>(null)

  // Remote state
  const [profile, setProfile]         = useState<UserProfile | null>(null)
  const [loading, setLoading]         = useState(true)
  const [saving, setSaving]           = useState(false)
  const [crawling, setCrawling]       = useState(false)

  // Toast
  const [toast, setToast] = useState<{ msg: string; kind: 'ok' | 'err' } | null>(null)

  const photoInputRef = useRef<HTMLInputElement>(null)

  // ── Auth header ──────────────────────────────────────────────────────────────
  const authHeader = useCallback(() => ({
    Authorization: `Bearer ${token}`,
  }), [token])

  // ── Toast helper ─────────────────────────────────────────────────────────────
  const showToast = (msg: string, kind: 'ok' | 'err') => {
    setToast({ msg, kind })
    setTimeout(() => setToast(null), 3500)
  }

  // ── Fetch profile ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token || !userId) {
      router.push('/auth')
      return
    }
    ;(async () => {
      try {
        const r = await fetch(`${API}/profile`, { headers: authHeader() })
        if (r.ok) {
          const data: UserProfile = await r.json()
          setProfile(data)
          setDisplayName(data.display_name || '')
          setBio(data.bio || '')
          setLinks(data.social_links || {})
          if (data.profile_photo_b64) {
            setPhotoPreview(data.profile_photo_b64)
          } else if (data.photo_url) {
            setPhotoPreview(data.photo_url)
          } else if (auth.currentUser?.photoURL) {
            setPhotoPreview(auth.currentUser.photoURL)
          }
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [token, userId, router, authHeader])

  // ── Photo pick ───────────────────────────────────────────────────────────────
  const handlePhotoPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    const reader = new FileReader()
    reader.onload = ev => setPhotoPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  // ── Upload photo ─────────────────────────────────────────────────────────────
  const uploadPhoto = async () => {
    if (!photoFile) return
    const fd = new FormData()
    fd.append('file', photoFile)
    const r = await fetch(`${API}/profile/photo`, {
      method: 'POST',
      headers: authHeader(),
      body: fd,
    })
    if (!r.ok) throw new Error('Photo upload failed')
  }

  // ── Save profile ─────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true)
    try {
      if (photoFile) await uploadPhoto()

      const r = await fetch(`${API}/profile`, {
        method: 'PUT',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: displayName,
          bio,
          ...links,
        }),
      })
      if (!r.ok) throw new Error('Save failed')
      const updated: UserProfile = await r.json()
      setProfile(updated)
      showToast('Profile saved successfully!', 'ok')
    } catch (err) {
      showToast('Failed to save profile. Please try again.', 'err')
    } finally {
      setSaving(false)
    }
  }

  // ── Trigger crawl ─────────────────────────────────────────────────────────────
  const handleCrawlNow = async () => {
    setCrawling(true)
    try {
      const r = await fetch(`${API}/profile/crawl-now`, {
        method: 'POST',
        headers: authHeader(),
      })
      if (!r.ok) throw new Error()
      showToast('Crawler running! Your Twin will be updated shortly.', 'ok')
    } catch {
      showToast('Crawl failed — check your social links are valid URLs.', 'err')
    } finally {
      setCrawling(false)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: T.gold, fontSize: 13, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
          Loading profile...
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: T.bg,
      backgroundImage: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(201,168,76,0.07), transparent)',
      padding: '32px 20px',
      fontFamily: '"Inter", "SF Pro Display", system-ui, sans-serif',
    }}>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input::placeholder, textarea::placeholder { color: #44445a; }
        input:focus, textarea:focus { outline: none; }
        * { box-sizing: border-box; }
      `}</style>

      <div style={{ maxWidth: 760, margin: '0 auto' }}>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: 32, display: 'flex', alignItems: 'center', gap: 16 }}
        >
          <button
            onClick={() => router.push('/dashboard')}
            style={{ background: 'none', border: `1px solid ${T.cardBorder}`, borderRadius: 8, padding: '6px 10px', color: T.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}
          >
            <ArrowLeft size={14} /> Dashboard
          </button>
          <div>
            <h1 style={{ color: T.gold, fontSize: 22, fontWeight: 800, letterSpacing: '0.04em', margin: 0 }}>
              Founder Profile
            </h1>
            <p style={{ color: T.muted, fontSize: 12, margin: '2px 0 0' }}>
              Your public identity & social links — the crawler uses these to enrich your Digital Twin.
            </p>
          </div>
        </motion.div>

        {/* ── Row 1: Photo + Identity ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Card style={{ marginBottom: 20, display: 'flex', gap: 28, alignItems: 'flex-start', flexWrap: 'wrap' }}>

            {/* Avatar */}
            <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div
                onClick={() => photoInputRef.current?.click()}
                style={{
                  width: 96, height: 96, borderRadius: '50%',
                  background: photoPreview ? 'transparent' : `linear-gradient(135deg, ${T.gold}50, ${T.purple}50)`,
                  border: `2px solid ${T.gold}40`,
                  cursor: 'pointer',
                  overflow: 'hidden',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  position: 'relative',
                  transition: 'border-color 0.2s',
                }}
              >
                {photoPreview ? (
                  <img src={photoPreview} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <User size={36} color={T.gold} />
                )}
                <div style={{
                  position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  opacity: 0, transition: 'opacity 0.2s',
                  borderRadius: '50%',
                }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
                >
                  <Camera size={22} color="#fff" />
                </div>
              </div>
              <input ref={photoInputRef} type="file" accept="image/*" onChange={handlePhotoPick} style={{ display: 'none' }} />
              <button
                onClick={() => photoInputRef.current?.click()}
                style={{ background: 'none', border: `1px solid ${T.cardBorder}`, borderRadius: 8, padding: '5px 12px', color: T.muted, cursor: 'pointer', fontSize: 11 }}
              >
                Change Photo
              </button>
            </div>

            {/* Identity fields */}
            <div style={{ flex: 1, minWidth: 240 }}>
              <Field
                label="Display Name"
                icon={<User size={14} />}
                value={displayName}
                onChange={setDisplayName}
                placeholder="e.g. Balaraj"
                color={T.gold}
              />
              <Field
                label="Bio"
                value={bio}
                onChange={setBio}
                placeholder="I build AI-powered products that ship fast..."
                multiline
              />
              <div style={{ fontSize: 11, color: T.dim }}>
                Email: <span style={{ color: T.muted }}>{profile?.email || '—'}</span>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* ── Row 2: Social Links ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card style={{ marginBottom: 20 }}>
            <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: `${T.gold}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ExternalLink size={15} color={T.gold} />
              </div>
              <div>
                <div style={{ color: T.text, fontWeight: 700, fontSize: 14 }}>Public Social Links</div>
                <div style={{ color: T.dim, fontSize: 11 }}>These are crawled every 3 days to enrich your Digital Twin</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '0 24px' }}>
              {SOCIAL_FIELDS.map(sf => (
                <Field
                  key={sf.key}
                  label={sf.label}
                  icon={sf.icon}
                  color={sf.color}
                  value={links[sf.key] || ''}
                  onChange={v => setLinks(prev => ({ ...prev, [sf.key]: v }))}
                  placeholder={sf.placeholder}
                />
              ))}
            </div>
          </Card>
        </motion.div>

        {/* ── Row 3: Crawler Status ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card style={{ marginBottom: 28, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: `${T.purple}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Cpu size={18} color={T.purple} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: T.text, fontWeight: 700, fontSize: 13 }}>Profile Crawler</div>
              <div style={{ color: T.dim, fontSize: 11, marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={11} />
                Last crawled: <span style={{ color: T.muted }}>{fmtDate(profile?.last_crawled_at)}</span>
                &nbsp;·&nbsp;Runs automatically every 3 days
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={handleCrawlNow}
                disabled={crawling}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  background: `${T.purple}20`, border: `1px solid ${T.purple}40`,
                  borderRadius: 10, padding: '9px 18px',
                  color: crawling ? T.dim : T.purple, cursor: crawling ? 'not-allowed' : 'pointer',
                  fontSize: 12, fontWeight: 600, transition: 'all 0.2s',
                }}
              >
                {crawling
                  ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Crawling…</>
                  : <><Sparkles size={14} /> Crawl Now</>
                }
              </button>
            </div>
          </Card>
        </motion.div>

        {/* ── Save Button ── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              width: '100%', padding: '15px 24px',
              background: saving ? `${T.gold}30` : `linear-gradient(135deg, ${T.gold}, ${T.gold2})`,
              border: 'none', borderRadius: 12,
              color: saving ? T.muted : '#0a0a0c',
              fontSize: 14, fontWeight: 800, letterSpacing: '0.04em',
              cursor: saving ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              transition: 'all 0.2s',
              boxShadow: saving ? 'none' : `0 4px 24px ${T.gold}40`,
            }}
          >
            {saving
              ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</>
              : <><Save size={16} /> Save Profile</>
            }
          </button>
        </motion.div>
      </div>

      {/* ── Toast ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            style={{
              position: 'fixed', bottom: 28, right: 28,
              background: toast.kind === 'ok' ? `${T.green}18` : `${T.red}18`,
              border: `1px solid ${toast.kind === 'ok' ? T.green : T.red}50`,
              backdropFilter: 'blur(20px)',
              borderRadius: 12, padding: '12px 20px',
              color: toast.kind === 'ok' ? T.green : T.red,
              fontSize: 13, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 10,
              maxWidth: 360,
              zIndex: 9999,
            }}
          >
            {toast.kind === 'ok' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
