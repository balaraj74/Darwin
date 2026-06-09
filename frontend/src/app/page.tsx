'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import BackgroundSlideshow from '../components/BackgroundSlideshow'
import { useAuthStore } from '../hooks/useAuth'

const AGENT_LABELS = ['Office', 'CEO', 'CFO', 'CTO', 'Engineer']

// ─── Landing Page Sections ────────────────────────────────────────────────────

const PIVOT_CARDS = [
  { from: 'User', text: '"I want to build an AI platform for EdTech."', color: '#a0a0c0' },
  { from: 'CFO', text: '"Hard constraint violated — CAC exceeds runway in Month 3."', color: '#f87171', badge: 'VETO' },
  { from: 'Board', text: 'Unanimous pivot — this idea does not fit this founder.', color: '#fbbf24' },
  { from: 'System', text: '"Here is a better idea built for you specifically: AI CRM for coaching institutes. Your uncle is your first customer."', color: 'var(--accent)' },
]

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Build Your Digital Twin',
    body: 'Answer 7 questions to model your skills, budget, and constraints. Access your twin via the dashboard and edit details anytime.',
  },
  {
    step: '02',
    title: 'Setup Office & Pitch',
    body: 'Enter your startup office and pitch your idea. The AI board will debate your pitch step-by-step, evaluating viability against your constraints.',
  },
  {
    step: '03',
    title: 'Execution & Handoff',
    body: 'Technical agents build your startup via GitLab. An engineer acknowledges completion, and the office agent hands over the final report.',
  },
]

const FEATURES = [
  { agent: 'Office', role: 'Operations & Handoff', desc: 'Synthesizes the board\'s step-by-step debate and hands over the final executed report to the founder.', color: 'var(--accent)' },
  { agent: 'CEO', role: 'Market & Viability', desc: 'Leads the debate, evaluating TAM/SAM/SOM and viability against your actual network distribution.', color: 'var(--accent-2)' },
  { agent: 'CFO', role: 'Budget Reality Check', desc: 'Checks your CAC against runway. Hard veto if capital doesn\'t reach first revenue.', color: '#f472b6' },
  { agent: 'CTO', role: 'Technical Feasibility', desc: 'Scopes the build. The Engineering agent then takes over to execute code via GitLab.', color: '#34d399' },
  { agent: 'Eng', role: 'Execution & Delivery', desc: 'Clones the repo, builds the technical foundation, and sends formal acknowledgment upon completion.', color: '#fbbf24' },
]

export default function LandingPage() {
  return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh' }}>

      {/* ── HERO ── */}
      <section style={{ position: 'relative', height: '100vh', display: 'flex', alignItems: 'center' }}>
        
        {/* Slideshow Canvas */}
        <BackgroundSlideshow />

        {/* Radial gradient overlay for readable text */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1,
          background: 'radial-gradient(ellipse 70% 80% at 50% 50%, transparent 0%, var(--bg) 90%)',
        }} />

        {/* Agent orbit labels */}
        <div style={{ position: 'absolute', bottom: '20%', left: '50%', transform: 'translateX(-50%)', zIndex: 2, display: 'flex', gap: 12 }}>
          {AGENT_LABELS.map((label, i) => (
            <span key={label} style={{
              padding: '4px 10px',
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.08em',
              fontFamily: 'Inter, sans-serif',
              background: `rgba(255,255,255,0.05)`,
              color: 'var(--text-primary)',
              border: `1px solid rgba(255,255,255,0.1)`,
            }}>{label}</span>
          ))}
        </div>

        {/* Hero Content */}
        <div className="container" style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <p style={{
              fontSize: 12, fontWeight: 700, letterSpacing: '0.15em',
              textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 20,
              fontFamily: 'Inter, sans-serif',
            }}>Darwin · Survival of the fittest startup.</p>

            <h1 style={{
              fontSize: 'clamp(36px, 6vw, 64px)',
              fontWeight: 800,
              lineHeight: 1.05,
              marginBottom: 24,
            }}>
              Your AI Executive Board.<br />
              <span className="gradient-text">Built Around You.</span>
            </h1>

            <p style={{
              fontSize: 'clamp(16px, 2vw, 20px)',
              color: 'var(--text-secondary)',
              maxWidth: 560,
              margin: '0 auto 40px',
              lineHeight: 1.65,
            }}>
              Darwin creates a digital model of your skills and constraints —
              then opens your dashboard. Setup your office, pitch your idea,
              and watch your AI board debate, build, and hand over the final product.
            </p>

            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href="/onboarding" className="btn-primary">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 1l7 7-7 7M1 8h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Build My Twin
              </a>
              <a href="#how-it-works" className="btn-ghost">Watch How It Works</a>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <div style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', zIndex: 2 }}>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            style={{ color: 'var(--text-muted)', fontSize: 22 }}
          >↓</motion.div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="section">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            style={{ textAlign: 'center', marginBottom: 64 }}
          >
            <h2 style={{ fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 800, marginBottom: 16 }}>
              How It Works
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 18, maxWidth: 480, margin: '0 auto' }}>
              Three steps. Built around your reality, not a template.
            </p>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
            {HOW_IT_WORKS.map((item, i) => (
              <motion.div
                key={item.step}
                className="glow-card"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.12 }}
                style={{ padding: 36 }}
              >
                <div style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 56,
                  fontWeight: 800,
                  color: 'var(--border-bright)',
                  lineHeight: 1,
                  marginBottom: 20,
                }}>{item.step}</div>
                <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>{item.title}</h3>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>{item.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES (5 Agent GlowCards) ── */}
      <section className="section" style={{ background: 'linear-gradient(180deg, var(--bg) 0%, var(--bg-surface) 100%)' }}>
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: 'center', marginBottom: 64 }}
          >
            <h2 style={{ fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 800, marginBottom: 16 }}>
              Your Board of Directors
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 18, maxWidth: 480, margin: '0 auto' }}>
              Each agent has a mandate, a bias, and veto authority.
            </p>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20 }}>
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.agent}
                className="glow-card"
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                style={{ padding: 28 }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  background: `${f.color}20`,
                  border: `1px solid ${f.color}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 16,
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 800, fontSize: 13,
                  color: f.color,
                }}>{f.agent}</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: f.color }}>{f.role}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.65 }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PIVOT MOMENT ── */}
      <section className="section">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: 'center', marginBottom: 56 }}
          >
            <h2 style={{ fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 800, marginBottom: 16 }}>
              The Board Will Overrule You.<br />
              <span className="gradient-text">That&apos;s the Point.</span>
            </h2>
          </motion.div>

          <div style={{ maxWidth: 620, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {PIVOT_CARDS.map((card, i) => (
              <motion.div
                key={i}
                className="glow-card"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.18 }}
                style={{ padding: '20px 24px', display: 'flex', alignItems: 'flex-start', gap: 16 }}
              >
                <div style={{
                  padding: '3px 10px',
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  background: `${card.color}18`,
                  color: card.color,
                  border: `1px solid ${card.color}30`,
                  whiteSpace: 'nowrap',
                  fontFamily: 'Inter, sans-serif',
                }}>
                  {card.from}
                  {card.badge && <span style={{ marginLeft: 6, color: '#f87171' }}>·{card.badge}</span>}
                </div>
                <p style={{ color: card.color === '#a0a0c0' ? 'var(--text-secondary)' : card.color, fontSize: 15, lineHeight: 1.6 }}>
                  {card.text}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        padding: '48px 0',
        borderTop: '1px solid var(--border)',
        background: 'var(--bg)',
      }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
          <div>
            <p style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: 18, marginBottom: 6 }}>
              Darwin · <span className="gradient-text">Survival of the fittest startup.</span>
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, maxWidth: 400 }}>
              An AI executive board that builds startups tailored to the founder, not just the idea.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 20 }}>
            {['GitHub', 'Devpost', 'LinkedIn'].map(link => (
              <a key={link} href="#" style={{ color: 'var(--text-muted)', fontSize: 14, textDecoration: 'none', transition: 'color 0.2s ease' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
                {link}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </main>
  )
}
