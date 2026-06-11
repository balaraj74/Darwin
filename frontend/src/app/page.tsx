'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import FadingVideo from '../components/FadingVideo'

// ── Icon helpers ─────────────────────────────────────────────────────────────
function ArrowUpRight({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 17L17 7" />
      <path d="M7 7h10v10" />
    </svg>
  )
}

function Play({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <polygon points="6 4 20 12 6 20 6 4" />
    </svg>
  )
}



// ── Shared motion presets ──────────────────────────────────────────────────────
const fadeUp = (delay = 0) => ({
  initial: { filter: 'blur(10px)', opacity: 0, y: 20 },
  animate: { filter: 'blur(0px)', opacity: 1, y: 0 },
  transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const, delay },
})

const fadeUpView = (delay = 0) => ({
  initial: { filter: 'blur(8px)', opacity: 0, y: 24 },
  whileInView: { filter: 'blur(0px)', opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const, delay },
})

// ── Data ───────────────────────────────────────────────────────────────────────
const CAPABILITIES = [
  {
    icon: (
      // Office / operations icon
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white">
        <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4L12 21l7-3.82v-4L12 17l-7-3.82z" />
      </svg>
    ),
    title: 'Digital Twin',
    body: 'Your constraints, skills, and runway are modeled precisely. Every board decision is filtered through your actual founder profile — not a generic template.',
    tags: ['Skill Mapping', 'Budget Reality', 'Network Fit', 'Constraint-First'],
  },
  {
    icon: (
      // Board room / movie icon
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white">
        <path d="M4 6.47L5.76 10H20v8H4V6.47M22 4h-4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4c-1.1 0-1.99.89-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4z" />
      </svg>
    ),
    title: 'Board Debate',
    body: 'CEO, CFO, CTO, CMO and an Office agent debate your idea across 3 structured rounds. Vetoes are hard — if capital doesn\'t reach revenue, the board pivots.',
    tags: ['5 AI Agents', 'Hard Vetoes', 'Live Debate', 'Pivot Engine'],
  },
  {
    icon: (
      // Execution / lightbulb icon
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 text-white">
        <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z" />
      </svg>
    ),
    title: 'Full Execution',
    body: 'After the board decides, agents generate your PRD, financial model, pitch deck, and GitLab issues — then hand over the complete execution package.',
    tags: ['PRD Generator', 'Financial Model', 'Pitch Deck', 'GitLab Issues'],
  },
]

const STATS = [
  { icon: '⚡', number: '3', label: 'Debate Rounds\nPer Startup Idea' },
  { icon: '🧠', number: '5', label: 'AI Agents\nIn Your Boardroom' },
]

const PARTNERS = ['CEO', 'CFO', 'CTO', 'CMO', 'Office']

const HOW_IT_WORKS = [
  { step: '01', title: 'Build Your Twin', body: 'Answer 7 questions — budget, skills, risk appetite, network. Your DigitalTwin becomes the constraint layer for every board decision.' },
  { step: '02', title: 'Pitch to the Board', body: 'Enter your idea in the boardroom. Five AI executives debate across three structured rounds — questioning, cross-examining, and stress-testing your concept.' },
  { step: '03', title: 'Execution Handoff', body: 'The board reaches a verdict: Proceed, Pivot, or Reject. If green-lit, the execution engine generates your full startup package in minutes.' },
]

// ── Navbar ─────────────────────────────────────────────────────────────────────
function Navbar() {
  const NAV_LINKS = ['How It Works', 'The Board', 'Execution', 'Pricing']
  return (
    <nav style={{
      position: 'fixed', top: 16, left: 0, right: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 32px',
    }}>
      {/* Logo mark */}
      <div className="liquid-glass" style={{
        width: 48, height: 48, borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <span style={{ fontFamily: "'Instrument Serif', serif", fontStyle: 'italic', fontSize: 22, color: '#fff', lineHeight: 1 }}>d</span>
      </div>

      {/* Center pill nav — desktop */}
      <div className="liquid-glass" style={{
        borderRadius: 9999, padding: '6px 6px',
        display: 'flex', alignItems: 'center', gap: 2,
      }}>
        {NAV_LINKS.map(link => (
          <a key={link} href={`#${link.toLowerCase().replace(/\s+/g, '-')}`}
            className="nav-link"
            style={{ padding: '8px 16px', fontSize: 14, fontWeight: 500, borderRadius: 9999 }}>
            {link}
          </a>
        ))}
        <Link href="/onboarding" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '8px 20px', borderRadius: 9999,
          background: '#fff', color: '#0a0a0c',
          fontSize: 14, fontWeight: 600, textDecoration: 'none',
          fontFamily: "'Barlow', sans-serif", whiteSpace: 'nowrap',
          marginLeft: 4,
        }}>
          Build My Twin <ArrowUpRight size={14} />
        </Link>
      </div>

      {/* Spacer for balance */}
      <div style={{ width: 48, flexShrink: 0 }} />
    </nav>
  )
}

// ── Hero Section ───────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section style={{ position: 'relative', height: '100vh', background: '#000', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Background video — 120% wide, top-anchored */}
      <FadingVideo
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260418_080021_d598092b-c4c2-4e53-8e46-94cf9064cd50.mp4"
        style={{
          position: 'absolute',
          left: '50%', top: 0,
          transform: 'translateX(-50%)',
          width: '120%', height: '120%',
          objectFit: 'cover', objectPosition: 'top',
          zIndex: 0,
        }}
      />

      {/* z-10 content layer */}
      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', flex: 1 }}>
        <Navbar />

        {/* Hero content — centered */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 96, paddingLeft: 16, paddingRight: 16, textAlign: 'center' }}>

          {/* Badge */}
          <motion.div {...fadeUp(0.4)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
            <div className="liquid-glass" style={{ borderRadius: 9999, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 6px 6px 4px' }}>
              <span style={{ background: '#fff', color: '#0a0a0c', borderRadius: 9999, padding: '4px 12px', fontSize: 11, fontWeight: 700, fontFamily: "'Barlow', sans-serif" }}>New</span>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.90)', paddingRight: 12, fontFamily: "'Barlow', sans-serif" }}>v2 Board — 5 Agents, Hard Vetoes, Full Execution</span>
            </div>
          </motion.div>

          {/* Headline — word-by-word blur */}
          <BlurTextStyled text="Your AI Executive Board Built Around You" />

          {/* Subheading */}
          <motion.p {...fadeUp(0.8)} style={{
            marginTop: 20, fontSize: 16, color: '#fff',
            maxWidth: 540, lineHeight: 1.55,
            fontFamily: "'Barlow', sans-serif", fontWeight: 300,
          }}>
            Darwin creates a digital model of your skills and constraints — then opens your boardroom. Pitch your idea. Watch five AI executives debate, veto, and pivot until the right startup survives.
          </motion.p>

          {/* CTAs */}
          <motion.div {...fadeUp(1.1)} style={{ display: 'flex', alignItems: 'center', gap: 24, marginTop: 28, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link href="/onboarding">
              <button className="liquid-glass-strong" style={{
                borderRadius: 9999, padding: '10px 22px',
                fontSize: 14, fontWeight: 500, color: '#fff',
                display: 'inline-flex', alignItems: 'center', gap: 8,
                cursor: 'pointer', border: 'none', fontFamily: "'Barlow', sans-serif",
              }}>
                Start Your Debate <ArrowUpRight size={18} />
              </button>
            </Link>
            <a href="#how-it-works" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              color: '#fff', fontSize: 14, fontWeight: 400,
              textDecoration: 'none', fontFamily: "'Barlow', sans-serif",
            }}>
              <Play size={14} /> See How It Works
            </a>
          </motion.div>

          {/* Stats */}
          <motion.div {...fadeUp(1.3)} style={{ display: 'flex', alignItems: 'stretch', gap: 16, marginTop: 40, flexWrap: 'wrap', justifyContent: 'center' }}>
            {STATS.map((s, i) => (
              <div key={i} className="liquid-glass" style={{
                padding: 20, width: 210, borderRadius: '1.25rem',
                display: 'flex', flexDirection: 'column', gap: 10,
              }}>
                <div style={{ fontSize: 26 }}>{s.icon}</div>
                <div style={{
                  fontFamily: "'Instrument Serif', serif", fontStyle: 'italic',
                  fontSize: 40, color: '#fff', lineHeight: 1, letterSpacing: '-1px',
                }}>{s.number}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontFamily: "'Barlow', sans-serif", fontWeight: 300, lineHeight: 1.4, whiteSpace: 'pre-line' }}>{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Partners strip */}
        <motion.div {...fadeUp(1.4)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, paddingBottom: 40 }}>
          <div className="liquid-glass" style={{ borderRadius: 9999, padding: '4px 16px', display: 'inline-block' }}>
            <span style={{ fontSize: 12, fontFamily: "'Barlow', sans-serif", fontWeight: 500, color: 'rgba(255,255,255,0.80)' }}>Your Boardroom Agents</span>
          </div>
          <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap', justifyContent: 'center' }}>
            {PARTNERS.map(p => (
              <span key={p} style={{
                fontFamily: "'Instrument Serif', serif", fontStyle: 'italic',
                fontSize: 26, color: '#fff', letterSpacing: '-0.02em',
              }}>{p}</span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// BlurText with proper sizing via inline styles
function BlurTextStyled({ text }: { text: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.10 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const words = text.split(' ')

  return (
    <div ref={ref} style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', rowGap: '0.1em', maxWidth: 800 }}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ filter: 'blur(10px)', opacity: 0, y: 50 }}
          animate={visible ? {
            filter: ['blur(10px)', 'blur(5px)', 'blur(0px)'],
            opacity: [0, 0.5, 1],
            y: [50, -5, 0],
          } : {}}
          transition={{ duration: 0.7, times: [0, 0.5, 1], ease: 'easeOut', delay: (i * 100) / 1000 }}
          style={{
            display: 'inline-block',
            marginRight: '0.28em',
            fontFamily: "'Instrument Serif', serif",
            fontStyle: 'italic',
            fontSize: 'clamp(2.8rem, 6.5vw, 5.5rem)',
            color: '#fff',
            lineHeight: 0.88,
            letterSpacing: '-0.04em',
          }}
        >
          {word}
        </motion.span>
      ))}
    </div>
  )
}

// ── Capabilities Section ───────────────────────────────────────────────────────
function Capabilities() {
  return (
    <section id="the-board" style={{ position: 'relative', minHeight: '100vh', background: '#000', overflow: 'hidden' }}>
      {/* Background video — full bleed */}
      <FadingVideo
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260418_094631_d30ab262-45ee-4b7d-99f3-5d5848c8ef13.mp4"
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          objectFit: 'cover', zIndex: 0,
        }}
      />

      {/* Content z-10 */}
      <div style={{
        position: 'relative', zIndex: 10,
        padding: '100px 40px 48px',
        display: 'flex', flexDirection: 'column', minHeight: '100vh',
      }}>
        {/* Header */}
        <div style={{ marginBottom: 'auto' }}>
          <motion.div {...fadeUpView(0)}>
            <p style={{ fontSize: 13, fontFamily: "'Barlow', sans-serif", color: 'rgba(255,255,255,0.75)', marginBottom: 20, letterSpacing: '0.05em' }}>
              // Capabilities
            </p>
            <div style={{
              fontFamily: "'Instrument Serif', serif", fontStyle: 'italic',
              color: '#fff',
              fontSize: 'clamp(3.5rem, 7vw, 6rem)',
              lineHeight: 0.9, letterSpacing: '-0.03em',
            }}>
              Survival<br />of the fittest
            </div>
          </motion.div>
        </div>

        {/* Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 24, marginTop: 64,
        }}>
          {CAPABILITIES.map((cap, i) => (
            <motion.div
              key={i}
              {...fadeUpView(i * 0.12)}
              className="liquid-glass"
              style={{
                borderRadius: '1.25rem', padding: 24,
                minHeight: 360, display: 'flex', flexDirection: 'column',
              }}
            >
              {/* Top row: icon + tags */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                {/* Icon */}
                <div className="liquid-glass" style={{
                  width: 44, height: 44, borderRadius: '0.75rem', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {cap.icon}
                </div>

                {/* Tags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 6, maxWidth: '70%' }}>
                  {cap.tags.map(tag => (
                    <span key={tag} className="liquid-glass" style={{
                      borderRadius: 9999, padding: '4px 12px',
                      fontSize: 11, color: 'rgba(255,255,255,0.88)',
                      fontFamily: "'Barlow', sans-serif", whiteSpace: 'nowrap',
                    }}>{tag}</span>
                  ))}
                </div>
              </div>

              {/* Spacer */}
              <div style={{ flex: 1 }} />

              {/* Bottom: title + description */}
              <div style={{ marginTop: 24 }}>
                <h3 style={{
                  fontFamily: "'Instrument Serif', serif", fontStyle: 'italic',
                  color: '#fff', fontSize: 'clamp(1.75rem, 3vw, 2.25rem)',
                  letterSpacing: '-0.02em', lineHeight: 1, marginBottom: 0,
                }}>{cap.title}</h3>
                <p style={{
                  marginTop: 12, fontSize: 13, color: 'rgba(255,255,255,0.85)',
                  fontFamily: "'Barlow', sans-serif", fontWeight: 300,
                  lineHeight: 1.55, maxWidth: '32ch',
                }}>{cap.body}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── How It Works ───────────────────────────────────────────────────────────────
function HowItWorks() {
  return (
    <section id="how-it-works" style={{ background: '#000', padding: '120px 40px' }}>
      <div style={{ maxWidth: 1160, margin: '0 auto' }}>
        <motion.div {...fadeUpView(0)} style={{ marginBottom: 72 }}>
          <p style={{ fontSize: 13, fontFamily: "'Barlow', sans-serif", color: 'rgba(255,255,255,0.60)', marginBottom: 16, letterSpacing: '0.05em' }}>// Process</p>
          <div style={{
            fontFamily: "'Instrument Serif', serif", fontStyle: 'italic',
            color: '#fff', fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
            lineHeight: 0.92, letterSpacing: '-0.03em',
          }}>
            Three steps.<br />
            <span style={{ color: 'rgba(255,255,255,0.50)' }}>Built for your reality.</span>
          </div>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
          {HOW_IT_WORKS.map((item, i) => (
            <motion.div key={item.step} {...fadeUpView(i * 0.14)}>
              <div className="liquid-glass" style={{ borderRadius: '1.25rem', padding: '32px 28px', minHeight: 240 }}>
                <div style={{
                  fontFamily: "'Instrument Serif', serif", fontStyle: 'italic',
                  fontSize: 60, color: 'rgba(255,255,255,0.15)',
                  lineHeight: 1, marginBottom: 20,
                }}>{item.step}</div>
                <h3 style={{
                  fontFamily: "'Instrument Serif', serif", fontStyle: 'italic',
                  color: '#fff', fontSize: 26, marginBottom: 12, letterSpacing: '-0.02em',
                }}>{item.title}</h3>
                <p style={{ color: 'rgba(255,255,255,0.70)', fontSize: 14, fontFamily: "'Barlow', sans-serif", fontWeight: 300, lineHeight: 1.65 }}>{item.body}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ── Final CTA ──────────────────────────────────────────────────────────────────
function FinalCTA() {
  return (
    <section style={{ background: '#000', padding: '80px 40px 60px', textAlign: 'center' }}>
      <motion.div {...fadeUpView(0)}>
        <div style={{
          fontFamily: "'Instrument Serif', serif", fontStyle: 'italic',
          color: '#fff', fontSize: 'clamp(2.5rem, 5vw, 4rem)',
          lineHeight: 0.95, letterSpacing: '-0.03em', marginBottom: 12,
        }}>
          The Board Will Overrule You.<br />
          <span style={{ color: 'rgba(201, 168, 76, 0.85)' }}>That&apos;s the Point.</span>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 15, fontFamily: "'Barlow', sans-serif", fontWeight: 300, maxWidth: 460, margin: '20px auto 36px', lineHeight: 1.6 }}>
          Darwin doesn't validate your idea. It pressure-tests it against your actual constraints until only the right startup survives.
        </p>
        <Link href="/onboarding">
          <button className="liquid-glass-strong" style={{
            borderRadius: 9999, padding: '14px 36px',
            fontSize: 15, fontWeight: 600, color: '#fff',
            display: 'inline-flex', alignItems: 'center', gap: 10,
            cursor: 'pointer', border: 'none', fontFamily: "'Barlow', sans-serif",
          }}>
            Build My Twin <ArrowUpRight size={18} />
          </button>
        </Link>
      </motion.div>
    </section>
  )
}

// ── Footer ─────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{
      background: '#000', borderTop: '1px solid rgba(255,255,255,0.07)',
      padding: '40px',
    }}>
      <div style={{ maxWidth: 1160, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 20 }}>
        <div>
          <p style={{ fontFamily: "'Instrument Serif', serif", fontStyle: 'italic', fontSize: 22, color: '#fff', marginBottom: 6 }}>
            Darwin
          </p>
          <p style={{ color: 'rgba(255,255,255,0.40)', fontSize: 13, fontFamily: "'Barlow', sans-serif", maxWidth: 340 }}>
            Survival of the fittest startup. An AI board that builds around the founder, not just the idea.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 24 }}>
          {['GitHub', 'Devpost', 'LinkedIn'].map(link => (
            <a key={link} href="#" style={{ color: 'rgba(255,255,255,0.40)', fontSize: 14, textDecoration: 'none', fontFamily: "'Barlow', sans-serif", transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.40)')}>
              {link}
            </a>
          ))}
        </div>
      </div>
    </footer>
  )
}

// ── Page Root ──────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <main style={{ background: '#000' }}>
      <Hero />
      <Capabilities />
      <HowItWorks />
      <FinalCTA />
      <Footer />
    </main>
  )
}
