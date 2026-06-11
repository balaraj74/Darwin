'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup,
  onAuthStateChanged,
  User
} from 'firebase/auth'
import BackgroundSlideshow from '../../components/BackgroundSlideshow'
import { useAuthStore } from '../../hooks/useAuth'
import { auth, googleProvider } from '../../lib/firebase'

export default function AuthPage() {
  const router = useRouter()
  const { login, setTwinId, hasFreshTwin } = useAuthStore()
  
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Handle standard Firebase user state change (just to catch unexpected drops)
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        // You could theoretically auto-login here if you had local state empty,
        // but we manage our own token sync in handleSubmit and handleGoogleSignIn
      }
    });
    return () => unsub();
  }, [])

  const finalizeBackendLogin = async (user: User, isNewUser: boolean) => {
    try {
      const idToken = await user.getIdToken(true)
      const endpoint = isNewUser ? '/auth/register' : '/auth/login'
      
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_token: idToken }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.detail || 'Backend authentication failed')
      }

      login(idToken, data.user_id)
      
      // Try to find an existing twin for this user
      try {
        const twinRes = await fetch(`${API_URL}/twin/by-user/${data.user_id}`)
        if (twinRes.ok) {
          const twinData = await twinRes.json()
          setTwinId(twinData.twin_id)
          router.push(`/dashboard?twin_id=${twinData.twin_id}`)
          return
        }
      } catch(e) { /* ignore */ }

      router.push('/onboarding')
    } catch (err: any) {
      setError(err.message)
      auth.signOut()
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isLogin) {
        const cred = await signInWithEmailAndPassword(auth, email, password)
        await finalizeBackendLogin(cred.user, false)
      } else {
        const cred = await createUserWithEmailAndPassword(auth, email, password)
        await finalizeBackendLogin(cred.user, true)
      }
    } catch (err: any) {
      setLoading(false)
      setError(err.message || 'Authentication failed')
    }
  }

  const handleGoogleSignIn = async () => {
    setError('')
    setLoading(true)
    try {
      const cred = await signInWithPopup(auth, googleProvider)
      // Google sign-in could be a new user or existing, we can let backend /auth/register handle both safely
      // Or we just send it to /auth/login, the backend login now handles Google auto-creation
      await finalizeBackendLogin(cred.user, false)
    } catch (err: any) {
      setLoading(false)
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(err.message || 'Google Sign-In failed')
      }
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

          <div style={{ display: 'flex', alignItems: 'center', margin: '1.5rem 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
            <span style={{ margin: '0 1rem', color: 'rgba(255,255,255,0.4)', fontSize: '0.875rem' }}>OR</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
          </div>

          <button 
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            style={{
              background: '#fff',
              color: '#000',
              padding: '1rem',
              borderRadius: '8px',
              border: 'none',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              width: '100%',
              fontFamily: "'Inter', sans-serif",
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s'
            }}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </button>

          <div style={{ marginTop: '2rem', fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)' }}>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              type="button"
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
