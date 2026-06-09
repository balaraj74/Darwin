'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExecutionPackage {
  session_id: string
  prd: {
    product_name: string
    problem_statement: string
    target_customer: string
    build_weeks: number
    mvp_features: { name: string; description: string; priority: string; exclusion_reason: string | null }[]
    explicitly_excluded: { name: string; description: string; priority: string; exclusion_reason: string | null }[]
    exclusion_note: string
  }
  financial_model: {
    cac_inr: number
    ltv_inr: number
    ltv_cac_ratio: number
    monthly_projections: { month: number; burn_inr: number; mrr_inr: number; cumulative_spend_inr: number; milestone: string }[]
    break_even_month: number
    capital_recovered_month: number
    verdict: string
  }
  pitch_deck: {
    slides: { slide_number: number; title: string; content: string; founder_specific_note: string }[]
    key_differentiator: string
  }
  tech_architecture: {
    frontend: string
    backend: string
    ai_layer: string
    database: string
    infra: string
    explicitly_avoided: string[]
    avoidance_note: string
  }
  gitlab_output: {
    project_url: string
    project_id: number
    milestones_created: string[]
    epics_created: string[]
    issues_created: { title: string; milestone: string; epic: string; estimated_hours: number }[]
    note: string
  } | null
}

// ─── Tab Panels ───────────────────────────────────────────────────────────────

function DecisionTab({ data }: { data: ExecutionPackage }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="glow-card" style={{ padding: 32, textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: 36, fontWeight: 800, marginBottom: 8 }}>
          {data.prd.product_name}
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 16, maxWidth: 560, margin: '0 auto 20px' }}>
          {data.prd.problem_statement}
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 32 }}>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 4 }}>TARGET CUSTOMER</p>
            <p style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{data.prd.target_customer}</p>
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 4 }}>BUILD TIME</p>
            <p style={{ color: 'var(--accent)', fontWeight: 700, fontFamily: 'Syne, sans-serif' }}>{data.prd.build_weeks} weeks</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function PRDTab({ prd }: { prd: ExecutionPackage['prd'] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="glow-card" style={{ padding: 28 }}>
        <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, marginBottom: 16, color: '#4ade80' }}>
          MVP Features
        </h3>
        {prd.mvp_features.map((f, i) => (
          <div key={i} style={{
            padding: '12px 0',
            borderBottom: i < prd.mvp_features.length - 1 ? '1px solid var(--border)' : 'none',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontWeight: 600, fontSize: 15 }}>{f.name}</span>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                background: 'rgba(74,222,128,0.15)', color: '#4ade80',
              }}>MUST HAVE</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{f.description}</p>
          </div>
        ))}
      </div>

      <div className="glow-card" style={{ padding: 28 }}>
        <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, marginBottom: 12, color: '#f87171' }}>
          Explicitly Excluded
        </h3>
        <div style={{
          padding: 16, background: 'rgba(110,231,247,0.06)',
          borderRadius: 8, borderLeft: '2px solid var(--accent)',
          marginBottom: 16, fontSize: 14, color: 'var(--text-secondary)',
        }}>
          {prd.exclusion_note}
        </div>
        {prd.explicitly_excluded.map((f, i) => (
          <div key={i} style={{
            padding: '10px 0',
            borderBottom: i < prd.explicitly_excluded.length - 1 ? '1px solid var(--border)' : 'none',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-secondary)' }}>{f.name}</span>
              <span style={{ fontSize: 11, color: '#f87171', fontWeight: 600 }}>WON&apos;T HAVE</span>
            </div>
            {f.exclusion_reason && (
              <p style={{ color: '#f8717180', fontSize: 12 }}>Why: {f.exclusion_reason}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function FinancialsTab({ fm }: { fm: ExecutionPackage['financial_model'] }) {
  const verdictColor = fm.verdict === 'Viable' ? '#4ade80' : fm.verdict === 'Marginal' ? '#fbbf24' : '#f87171'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
        {[
          { label: 'CAC', value: `₹${fm.cac_inr.toLocaleString()}`, color: 'var(--accent)' },
          { label: 'LTV', value: `₹${fm.ltv_inr.toLocaleString()}`, color: 'var(--accent-2)' },
          { label: 'LTV:CAC', value: `${fm.ltv_cac_ratio.toFixed(1)}x`, color: fm.ltv_cac_ratio > 3 ? '#4ade80' : '#fbbf24' },
          { label: 'Break-even', value: `Month ${fm.break_even_month}`, color: 'var(--text-primary)' },
          { label: 'Verdict', value: fm.verdict, color: verdictColor },
        ].map(m => (
          <div key={m.label} className="glow-card" style={{ padding: 20, textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>{m.label}</p>
            <p style={{ color: m.color, fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 22 }}>{m.value}</p>
          </div>
        ))}
      </div>

      <div className="glow-card" style={{ padding: 28, overflowX: 'auto' }}>
        <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, marginBottom: 16 }}>6-Month Projection</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ color: 'var(--text-muted)', textAlign: 'left' }}>
              {['Month', 'Burn (₹)', 'MRR (₹)', 'Total Spent (₹)', 'Milestone'].map(h => (
                <th key={h} style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fm.monthly_projections.map(p => (
              <tr key={p.month} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '10px 12px', color: 'var(--accent)', fontWeight: 700 }}>M{p.month}</td>
                <td style={{ padding: '10px 12px', color: '#f87171' }}>{p.burn_inr.toLocaleString()}</td>
                <td style={{ padding: '10px 12px', color: p.mrr_inr > 0 ? '#4ade80' : 'var(--text-muted)' }}>{p.mrr_inr.toLocaleString()}</td>
                <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>{p.cumulative_spend_inr.toLocaleString()}</td>
                <td style={{ padding: '10px 12px', color: 'var(--text-muted)', fontSize: 12 }}>{p.milestone}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function PitchTab({ pitch }: { pitch: ExecutionPackage['pitch_deck'] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="glow-card" style={{ padding: 20, borderColor: 'rgba(110,231,247,0.3)' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 4 }}>KEY DIFFERENTIATOR</p>
        <p style={{ color: 'var(--accent)', fontWeight: 600, fontFamily: 'Syne, sans-serif' }}>{pitch.key_differentiator}</p>
      </div>
      {pitch.slides.map((slide, i) => (
        <motion.div
          key={slide.slide_number}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
          className="glow-card"
          style={{ padding: 24 }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
            <span style={{
              fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 28,
              color: 'var(--border-bright)', lineHeight: 1, flexShrink: 0,
            }}>
              {String(slide.slide_number).padStart(2, '0')}
            </span>
            <div>
              <h4 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, marginBottom: 8 }}>{slide.title}</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 10, lineHeight: 1.6 }}>{slide.content}</p>
              <p style={{ fontSize: 12, color: 'var(--accent)', background: 'rgba(110,231,247,0.06)', padding: '8px 12px', borderRadius: 6, lineHeight: 1.6 }}>
                💡 {slide.founder_specific_note}
              </p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

function GitLabTab({ gl, sessionId }: { gl: ExecutionPackage['gitlab_output']; sessionId: string }) {
  const [token, setToken] = useState('')
  const [namespace, setNamespace] = useState('')
  const [creating, setCreating] = useState(false)

  const handleCreate = async () => {
    if (!token || !namespace) return
    setCreating(true)
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    await fetch(`${apiUrl}/execution/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, gitlab_token: token, gitlab_namespace: namespace }),
    })
    setCreating(false)
    window.location.reload()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {gl && gl.project_id > 0 ? (
        <>
          <div className="glow-card" style={{ padding: 28, borderColor: 'rgba(110,231,247,0.3)' }}>
            <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, marginBottom: 12, color: 'var(--accent)' }}>
              Project Created
            </h3>
            <a href={gl.project_url} target="_blank" rel="noreferrer"
              style={{ color: 'var(--accent)', fontSize: 16, fontWeight: 600, textDecoration: 'none' }}>
              → {gl.project_url}
            </a>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="glow-card" style={{ padding: 20 }}>
              <h4 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, marginBottom: 10, fontSize: 14, color: 'var(--text-muted)' }}>MILESTONES</h4>
              {gl.milestones_created.map((m, i) => (
                <p key={i} style={{ color: 'var(--text-secondary)', fontSize: 13, padding: '4px 0' }}>✓ {m}</p>
              ))}
            </div>
            <div className="glow-card" style={{ padding: 20 }}>
              <h4 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, marginBottom: 10, fontSize: 14, color: 'var(--text-muted)' }}>EPICS</h4>
              {gl.epics_created.map((e, i) => (
                <p key={i} style={{ color: 'var(--text-secondary)', fontSize: 13, padding: '4px 0' }}>⬡ {e}</p>
              ))}
            </div>
          </div>
          <div className="glow-card" style={{ padding: 20 }}>
            <h4 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, marginBottom: 12, fontSize: 14, color: 'var(--text-muted)' }}>
              ISSUES ({gl.issues_created.length})
            </h4>
            {gl.issues_created.map((issue, i) => (
              <div key={i} style={{ padding: '8px 0', borderBottom: i < gl.issues_created.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{issue.title}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{issue.estimated_hours}h</span>
                </div>
              </div>
            ))}
          </div>
          
          <div style={{ marginTop: 8, padding: 16, background: 'rgba(74, 222, 128, 0.1)', border: '1px solid #4ade80', borderRadius: 8 }}>
            <h4 style={{ color: '#4ade80', fontFamily: 'Syne, sans-serif', fontWeight: 700, marginBottom: 4 }}>🚀 AI Engineering Team Dispatched</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
              Your Lead Engineer and Developer agents are currently scaffolding the MVP codebase in the background based on your PRD and Tech Architecture. 
              <strong> Open your GitLab repository and watch the commits roll in over the next few minutes!</strong>
            </p>
          </div>
          
          <p style={{ color: 'var(--text-muted)', fontSize: 13, padding: '0 4px', marginTop: 8 }}>{gl.note}</p>
        </>
      ) : (
        <div className="glow-card" style={{ padding: 32 }}>
          <h3 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, marginBottom: 8 }}>Connect GitLab</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20, lineHeight: 1.7 }}>
            Provide your GitLab personal access token (api scope) to create a real project with milestones, epics, and sprint issues.
          </p>
          {[
            { label: 'Personal Access Token', val: token, set: setToken, ph: 'glpat-...' },
            { label: 'GitLab Namespace', val: namespace, set: setNamespace, ph: 'yourusername' },
          ].map(f => (
            <div key={f.label} style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>{f.label}</label>
              <input
                type={f.label.includes('Token') ? 'password' : 'text'}
                value={f.val}
                onChange={e => f.set(e.target.value)}
                placeholder={f.ph}
                style={{
                  width: '100%', background: 'var(--bg-surface)',
                  border: '1px solid var(--border)', borderRadius: 8,
                  color: 'var(--text-primary)', fontSize: 14, padding: '10px 14px',
                  outline: 'none', fontFamily: 'DM Sans, sans-serif',
                }}
              />
            </div>
          ))}
          <button onClick={handleCreate} disabled={!token || !namespace || creating} className="btn-primary">
            {creating ? 'Creating...' : 'Create GitLab Project →'}
          </button>
          {gl && (
            <div style={{ marginTop: 24 }}>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 12 }}>Preview (demo mode):</p>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{gl.note}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main Results Page ────────────────────────────────────────────────────────

const TABS = ['Startup Decision', 'PRD', 'Financials', 'Pitch Deck', 'GitLab']

function ResultsContent() {
  const params = useSearchParams()
  const sessionId = params.get('session_id')
  const [pkg, setPkg] = useState<ExecutionPackage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState(0)

  useEffect(() => {
    if (!sessionId) return
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    fetch(`${apiUrl}/execution/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId }),
    })
      .then(r => r.json())
      .then(data => { setPkg(data); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [sessionId])

  if (loading) return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          style={{ width: 48, height: 48, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', margin: '0 auto 20px' }}
        />
        <p style={{ color: 'var(--text-secondary)' }}>Generating execution outputs...</p>
        <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 8 }}>PRD · Financials · Pitch · GitLab</p>
      </div>
    </div>
  )

  if (error || !pkg) return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#f87171' }}>Error: {error || 'Package not found'}</p>
    </div>
  )

  return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      {/* Header */}
      <header style={{
        borderBottom: '1px solid var(--border)',
        padding: '16px 24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'rgba(5,5,10,0.8)', backdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <a href="/" style={{ color: 'var(--text-muted)', fontSize: 14, textDecoration: 'none' }}>← Darwin</a>
          <span style={{ color: 'var(--border)' }}>|</span>
          <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, color: 'var(--text-primary)' }}>{pkg.prd.product_name}</span>
        </div>
      </header>

      {/* Tabs */}
      <div style={{
        display: 'flex', borderBottom: '1px solid var(--border)',
        background: 'var(--bg-surface)', padding: '0 24px',
        overflowX: 'auto',
      }}>
        {TABS.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActiveTab(i)}
            style={{
              padding: '14px 20px',
              borderBottom: activeTab === i ? '2px solid var(--accent)' : '2px solid transparent',
              color: activeTab === i ? 'var(--accent)' : 'var(--text-muted)',
              fontFamily: 'Syne, sans-serif', fontWeight: 600, fontSize: 13,
              background: 'transparent', border: 'none', cursor: 'pointer',
              whiteSpace: 'nowrap', transition: 'all 0.2s ease',
            }}
          >{tab}</button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="container" style={{ padding: '40px 24px', maxWidth: 900 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
          >
            {activeTab === 0 && <DecisionTab data={pkg} />}
            {activeTab === 1 && <PRDTab prd={pkg.prd} />}
            {activeTab === 2 && <FinancialsTab fm={pkg.financial_model} />}
            {activeTab === 3 && <PitchTab pitch={pkg.pitch_deck} />}
            {activeTab === 4 && <GitLabTab gl={pkg.gitlab_output} sessionId={sessionId!} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  )
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div style={{ background: 'var(--bg)', minHeight: '100vh' }} />}>
      <ResultsContent />
    </Suspense>
  )
}
