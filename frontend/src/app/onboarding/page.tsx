'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import BackgroundSlideshow from '../../components/BackgroundSlideshow'
import { useAuthStore } from '../../hooks/useAuth'

// ─── Questions ───────────────────────────────────────────────────────────────

const QUESTIONS = [
  {
    id: 'what_can_you_build',
    question: 'What can you build right now, today, without learning anything new?',
    hint: 'Be specific — list actual technologies, frameworks, or skills.',
    placeholder: 'e.g. Next.js frontends, FastAPI backends, Gemini-based AI features...',
  },
  {
    id: 'capital_available',
    question: 'How much capital can you deploy in the next 6 months?',
    hint: 'Be honest. Include everything — savings, side income, family support.',
    placeholder: 'e.g. ₹50,000 total',
  },
  {
    id: 'what_makes_you_quit',
    question: 'What would make you quit — be honest.',
    hint: 'No revenue after X months? Running out of money? Loneliness?',
    placeholder: 'e.g. If I\'m still at zero users after 5 months, I\'d walk away',
  },
  {
    id: 'first_potential_customer',
    question: 'Name one person you could call tomorrow who might pay for something you built.',
    hint: 'This tests your network. A real person, not a vague demographic.',
    placeholder: 'e.g. My uncle who runs a coaching institute in Mysore',
  },
  {
    id: 'hardest_thing_shipped',
    question: 'What\'s the hardest thing you\'ve ever shipped? How long did it take?',
    hint: 'This tells us your execution velocity.',
    placeholder: 'e.g. Built a full healthcare platform in 3 weeks for Imagine Cup',
  },
  {
    id: 'draining_work',
    question: 'What kind of work drains you even when you\'re good at it?',
    hint: 'This reveals your blind spots — things you\'ll avoid under stress.',
    placeholder: 'e.g. Cold calling, writing long-form content, managing spreadsheets',
  },
  {
    id: 'most_likely_failure',
    question: 'If this fails in 12 months, what\'s the most likely reason?',
    hint: 'Honest self-awareness here is your most powerful startup tool.',
    placeholder: 'e.g. I\'ll over-engineer the product and never talk to customers',
  },
]

type Answers = Record<string, string>

// ─── Twin Building Animation ──────────────────────────────────────────────────

function TwinBuildingScreen({ visible }: { visible: boolean }) {
  const steps = [
    'Parsing your skill matrix...',
    'Extracting hard constraints...',
    'Mapping blind spots...',
    'Calibrating quit triggers...',
    'Assembling digital twin...',
    'Preparing dashboard...',
  ]

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'var(--bg)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 999,
          }}
        >
          {/* Pulsing orb */}
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              width: 80, height: 80,
              borderRadius: '50%',
              background: 'radial-gradient(circle, var(--accent) 0%, var(--accent-2) 60%, transparent 100%)',
              marginBottom: 48,
              boxShadow: '0 0 60px rgba(110,231,247,0.5)',
            }}
          />

          <h2 style={{ fontFamily: 'Inter, sans-serif', fontSize: 28, fontWeight: 800, marginBottom: 8 }}>
            Building Your Twin
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 40 }}>
            Preparing your workspace...
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: 320 }}>
            {steps.map((step, i) => (
              <motion.div
                key={step}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.5 + 0.2 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  color: 'var(--text-secondary)', fontSize: 14,
                }}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.5 + 0.4, type: 'spring' }}
                  style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: 'var(--accent)', flexShrink: 0,
                  }}
                />
                {step}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── Main Onboarding Page ─────────────────────────────────────────────────────

export default function OnboardingFlow() {
  const router = useRouter()
  const { isAuthenticated, userId, setTwinId } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/auth')
    }
  }, [isAuthenticated, router])

  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<Answers>({})
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [isBuilding, setIsBuilding] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const question = QUESTIONS[currentQ]
  const isLast = currentQ === QUESTIONS.length - 1
  const progress = (currentQ / QUESTIONS.length) * 100

  const handleNext = useCallback(async () => {
    if (!currentAnswer.trim()) return

    const newAnswers: Answers = { ...answers, [question.id]: currentAnswer.trim() }
    setAnswers(newAnswers)

    if (!isLast) {
      setCurrentQ(prev => prev + 1)
      setCurrentAnswer('')
      return
    }

    // Final submit — POST to backend
    setIsBuilding(true)
    setError(null)

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const query = userId ? `?user_id=${userId}` : ''
      const response = await fetch(`${apiUrl}/onboarding/analyze${query}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAnswers),
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.detail || `API error: ${response.status}`)
      }

      const twin = await response.json()
      setTwinId(twin.twin_id)

      // We don't start the board debate here anymore.
      // Redirect to dashboard where they can see their twin and enter their idea.
      router.push(`/dashboard?twin_id=${twin.twin_id}`)
    } catch (err: unknown) {
      setIsBuilding(false)
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    }
  }, [currentAnswer, answers, question, isLast, router])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && currentAnswer.trim()) {
      e.preventDefault()
      handleNext()
    }
  }

  return (
    <>
      <TwinBuildingScreen visible={isBuilding} />

      <main style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        position: 'relative',
      }}>
        {/* Slideshow Canvas */}
        <BackgroundSlideshow />

        {/* Radial gradient overlay for readable text */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1,
          background: 'radial-gradient(ellipse 70% 80% at 50% 50%, transparent 0%, var(--bg) 90%)',
        }} />

        {/* Header */}
        <div style={{ position: 'absolute', top: 24, left: 24, display: 'flex', alignItems: 'center', gap: 8, zIndex: 2 }}>
          <a href="/" style={{ color: 'var(--text-muted)', fontSize: 14, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
            ← Darwin
          </a>
        </div>

        {/* Progress bar */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: 2,
          background: 'var(--border)',
          zIndex: 2,
        }}>
          <motion.div
            style={{
              height: '100%',
              background: 'linear-gradient(90deg, var(--accent), var(--accent-2))',
            }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>

        {/* Question counter */}
        <div style={{ marginBottom: 48, textAlign: 'center', position: 'relative', zIndex: 2 }}>
          <span style={{ color: 'var(--text-muted)', fontSize: 13, fontFamily: 'Inter, sans-serif', letterSpacing: '0.08em' }}>
            {currentQ + 1} of {QUESTIONS.length}
          </span>
        </div>

        {/* Question Card */}
        <div style={{ width: '100%', maxWidth: 640, position: 'relative', zIndex: 2 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQ}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35 }}
            >
              <h2 style={{
                fontSize: 'clamp(22px, 4vw, 32px)',
                fontWeight: 800,
                lineHeight: 1.2,
                marginBottom: 12,
                fontFamily: 'Inter, sans-serif',
              }}>
                {question.question}
              </h2>

              <p style={{
                color: 'var(--accent)',
                fontSize: 14,
                marginBottom: 28,
                padding: '10px 16px',
                background: 'rgba(110,231,247,0.06)',
                borderRadius: 8,
                borderLeft: '2px solid var(--accent)',
                lineHeight: 1.6,
              }}>
                {question.hint}
              </p>

              {/* Input */}
              <input
                type="text"
                autoFocus
                value={currentAnswer}
                onChange={e => setCurrentAnswer(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={question.placeholder}
                style={{
                  width: '100%',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: 17,
                  padding: '16px 20px',
                  outline: 'none',
                  fontFamily: 'DM Sans, sans-serif',
                  transition: 'border-color 0.2s ease',
                }}
                onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')}
              />

              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ color: '#f87171', marginTop: 12, fontSize: 14 }}
                >
                  {error}
                </motion.p>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 }}>
                <button
                  onClick={() => {
                    if (currentQ > 0) {
                      setCurrentQ(prev => prev - 1)
                      setCurrentAnswer(answers[QUESTIONS[currentQ - 1].id] || '')
                    }
                  }}
                  disabled={currentQ === 0}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: currentQ === 0 ? 'var(--text-muted)' : 'var(--text-secondary)',
                    fontSize: 14,
                    cursor: currentQ === 0 ? 'default' : 'pointer',
                    padding: '8px 0',
                  }}
                >
                  ← Back
                </button>

                <button
                  onClick={handleNext}
                  disabled={!currentAnswer.trim()}
                  className="btn-primary"
                  style={{
                    opacity: currentAnswer.trim() ? 1 : 0.4,
                    cursor: currentAnswer.trim() ? 'pointer' : 'not-allowed',
                  }}
                >
                  {isLast ? 'Go to Dashboard →' : 'Next →'}
                </button>
              </div>

              {!isLast && (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, marginTop: 20 }}>
                  Press Enter to continue
                </p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </>
  )
}
