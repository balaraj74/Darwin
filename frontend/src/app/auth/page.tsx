'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import BackgroundSlideshow from '../../components/BackgroundSlideshow'
import { useAuthStore } from '../../hooks/useAuth'

export default function AuthPage() {
  const router = useRouter()
  const { login } = useAuthStore()
  
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const endpoint = isLogin ? '/auth/login' : '/auth/register'
    try {
      const res = await fetch(`http://localhost:8000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.detail || 'Authentication failed')
      }

      login(data.access_token, data.user_id)
      router.push('/onboarding')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      <BackgroundSlideshow />
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1,
        background: 'radial-gradient(circle at center, transparent 0%, var(--bg) 80%)'
      }} />

      <div style={{
        position: 'relative', zIndex: 10,
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: '2rem'
      }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'rgba(255,255,255,0.03)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '16px',
            padding: '3rem',
            width: '100%',
            maxWidth: '400px',
            textAlign: 'center'
          }}
        >
          <h1 style={{ 
            fontFamily: "'Inter', sans-serif", fontSize: '2rem', fontWeight: 600, 
            marginBottom: '0.5rem', color: 'var(--fg)' 
          }}>
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h1>
          <p style={{ 
            fontFamily: "'Inter', sans-serif", fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', marginBottom: '2rem' 
          }}>
            {isLogin ? 'Sign in to access your digital twin.' : 'Register to start building your twin.'}
          </p>

          {error && (
            <div style={{
              background: 'rgba(255,0,0,0.1)', border: '1px solid rgba(255,0,0,0.2)',
              color: '#ff6b6b', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem',
              fontSize: '0.875rem'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                background: 'rgba(0,0,0,0.2)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'var(--fg)',
                padding: '1rem',
                borderRadius: '8px',
                fontSize: '1rem',
                outline: 'none',
                fontFamily: "'Inter', sans-serif"
              }}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              style={{
                background: 'rgba(0,0,0,0.2)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'var(--fg)',
                padding: '1rem',
                borderRadius: '8px',
                fontSize: '1rem',
                outline: 'none',
                fontFamily: "'Inter', sans-serif"
              }}
            />
            
            <button 
              type="submit" 
              disabled={loading}
              style={{
                background: 'var(--accent)',
                color: '#fff',
                padding: '1rem',
                borderRadius: '8px',
                border: 'none',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                marginTop: '1rem',
                fontFamily: "'Inter', sans-serif",
                transition: 'all 0.2s'
              }}
            >
              {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Register')}
            </button>
          </form>

          <div style={{ marginTop: '2rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)' }}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              style={{
                background: 'none', border: 'none', color: 'var(--accent)', 
                cursor: 'pointer', fontFamily: "'Inter', sans-serif", fontWeight: 500,
                padding: 0
              }}
            >
              {isLogin ? 'Register' : 'Sign In'}
            </button>
          </div>
        </motion.div>
      </div>
    </main>
  )
}
