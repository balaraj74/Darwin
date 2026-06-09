'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { DigitalTwin, BoardSession } from '../../types'
import BoardRoom from '../../components/BoardRoom'
import ExecutionTracker from '../../components/ExecutionTracker'
import { Sparkles, TrendingUp, Cpu, Target, ArrowRight, FileText } from 'lucide-react'

type ViewState = 'setup' | 'board' | 'execution' | 'report'

export default function DashboardPage() {
  const params = useSearchParams()
  const twinId = params.get('twin_id')

  const [twin, setTwin] = useState<DigitalTwin | null>(null)
  const [session, setSession] = useState<BoardSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [idea, setIdea] = useState('')
  const [isSubmittingIdea, setIsSubmittingIdea] = useState(false)
  
  const [viewState, setViewState] = useState<ViewState>('setup')

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

  useEffect(() => {
    if (!twinId) return
    fetch(`${apiUrl}/twin/${twinId}`)
      .then(res => res.json())
      .then(data => {
        setTwin(data)
        if (data.startup_idea) {
          setIdea(data.startup_idea)
          setViewState('board')
        }
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
      })
  }, [twinId, apiUrl])

  const submitIdea = async () => {
    if (!idea.trim() || !twin) return
    setIsSubmittingIdea(true)
    try {
      const res = await fetch(`${apiUrl}/twin/${twin.twin_id}/idea`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startup_idea: idea })
      })
      const updatedTwin = await res.json()
      setTwin(updatedTwin)
      setViewState('board')
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmittingIdea(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="pulse w-16 h-16 rounded-full bg-blue-500/30 border border-blue-400" />
      </div>
    )
  }

  if (!twin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white font-sans">
        <p>Twin not found.</p>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-black text-white p-6 md:p-12" style={{ background: 'var(--bg)' }}>
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex justify-between items-center mb-12 fade-in-up">
          <div>
            <h1 className="text-3xl font-bold font-display tracking-tight text-white mb-2">Founder Dashboard</h1>
            <p className="text-slate-400 text-sm font-mono tracking-widest uppercase">ID: {twin.twin_id}</p>
          </div>
          <div className="flex space-x-4">
            {/* Action buttons could go here */}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Twin Profile Overview */}
          <div className="lg:col-span-4 space-y-6 fade-in-up">
            <div className="glass-panel p-6 space-y-6">
              <div className="flex items-center space-x-3 text-blue-400 border-b border-white/10 pb-4">
                <Target className="w-5 h-5" />
                <h2 className="text-sm font-bold uppercase tracking-widest font-mono">Cognitive Profile</h2>
              </div>
              
              <div className="space-y-4 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Execution Velocity</span>
                  <span className="text-emerald-400 font-bold uppercase">{twin.profile.execution_velocity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Technical Depth</span>
                  <span className="text-blue-400 font-bold uppercase">{twin.profile.technical_depth}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Risk Tolerance</span>
                  <span className="text-amber-400 font-bold uppercase">{twin.profile.risk_tolerance}</span>
                </div>
              </div>

              <div className="border-t border-white/10 pt-4 space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Competitive Edge</span>
                <p className="text-sm text-slate-200 leading-relaxed font-sans">{twin.profile.competitive_edge}</p>
              </div>
            </div>

            <div className="glass-panel p-6 space-y-6">
              <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <div className="flex items-center space-x-3 text-rose-400">
                  <TrendingUp className="w-5 h-5" />
                  <h2 className="text-sm font-bold uppercase tracking-widest font-mono">Hard Constraints</h2>
                </div>
                {/* Edit could be fully implemented with a form here, currently read-only presentation */}
              </div>
              
              <div className="space-y-4 font-mono text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Runway Budget</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-white font-bold text-sm">₹{twin.profile.hard_constraints.budget_inr.toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Quit Threshold</span>
                  <span className="text-white font-bold">{twin.profile.hard_constraints.months_to_first_revenue} Months</span>
                </div>
                <div className="space-y-2">
                  <span className="text-slate-500 block">Technical Skills</span>
                  <div className="flex flex-wrap gap-2">
                    {twin.profile.hard_constraints.technical_skills.map((s: string) => (
                      <span key={s} className="px-2 py-1 bg-white/5 border border-white/10 rounded-md text-[10px] text-slate-300 uppercase">{s}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Office Setup / Board Debate / Execution Tracker */}
          <div className="lg:col-span-8 space-y-6 fade-in-up" style={{ animationDelay: '0.1s' }}>
            
            {viewState === 'setup' && (
              <div className="glass-panel p-8 md:p-12 space-y-8 min-h-[500px] flex flex-col justify-center">
                <div className="space-y-3 text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 mx-auto flex items-center justify-center mb-6">
                    <Sparkles className="w-8 h-8 text-blue-400" />
                  </div>
                  <h2 className="text-3xl font-display font-bold text-white">Setup Office for Startup</h2>
                  <p className="text-slate-400 text-sm max-w-md mx-auto">
                    Your digital twin is ready. Describe the idea you want to build. 
                    The Executive Board will evaluate it against your actual constraints.
                  </p>
                </div>

                <div className="space-y-4 max-w-xl mx-auto w-full">
                  <textarea
                    value={idea}
                    onChange={(e) => setIdea(e.target.value)}
                    placeholder="e.g. I want to build an AI CRM for coaching institutes..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all font-sans min-h-[120px] resize-none"
                  />
                  <button
                    onClick={submitIdea}
                    disabled={!idea.trim() || isSubmittingIdea}
                    className="w-full btn-primary justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmittingIdea ? 'Submitting...' : 'Propose to the Board'}
                    {!isSubmittingIdea && <ArrowRight className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {viewState === 'board' && (
              <div className="glass-panel p-6">
                <BoardRoom 
                  twin={twin} 
                  apiBaseUrl={apiUrl} 
                  onDecisionReached={(s) => {
                    setSession(s)
                    setViewState('execution')
                  }} 
                />
              </div>
            )}

            {viewState === 'execution' && session && (
              <ExecutionTracker 
                session={session} 
                twin={twin} 
                apiBaseUrl={apiUrl}
                onComplete={() => setViewState('report')} 
              />
            )}

            {viewState === 'report' && (
              <div className="glass-panel p-8 md:p-12 space-y-6">
                <div className="flex items-center gap-4 text-emerald-400 mb-6">
                  <FileText className="w-8 h-8" />
                  <h2 className="text-2xl font-display font-bold text-white">Final CEO Report</h2>
                </div>
                <div className="space-y-6 text-slate-300 font-sans leading-relaxed">
                  <p>
                    <strong>Subject:</strong> MVP Handoff Acknowledgment
                  </p>
                  <p>
                    The technical team has completed the blueprint suite and initialized the MVP repository. 
                    Your idea has been validated against your constraints, debated by the board, and successfully mapped to a production-ready tech stack.
                  </p>
                  <p>
                    The board recommends focusing your immediate execution velocity on acquiring the first 10 users. Do not write any more code until you have validated the core value proposition with a real customer.
                  </p>
                  <div className="p-4 bg-white/5 border border-white/10 rounded-lg text-sm text-slate-400 font-mono mt-8">
                    // GitLab repository configured<br/>
                    // PRD and architecture finalized<br/>
                    // Handing over keys to Founder
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </main>
  )
}
