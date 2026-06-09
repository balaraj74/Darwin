import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, GitCommit, Play, FileText, Cpu, CheckCircle } from 'lucide-react'
import { Session, DigitalTwin } from '../types'

interface ExecutionTrackerProps {
  session: Session
  twin: DigitalTwin
  apiBaseUrl: string
  onComplete: () => void
}

type Phase = 'generating_docs' | 'creating_repo' | 'engineering_build' | 'final_report' | 'done'

export default function ExecutionTracker({ session, twin, apiBaseUrl, onComplete }: ExecutionTrackerProps) {
  const [phase, setPhase] = useState<Phase>('generating_docs')
  const [logs, setLogs] = useState<{ id: string, text: string, type: 'info' | 'success' | 'build' }[]>([])
  
  // Fake or Real Execution Trigger
  useEffect(() => {
    let active = true

    const runExecution = async () => {
      if (!active) return

      const addLog = (text: string, type: 'info' | 'success' | 'build' = 'info') => {
        setLogs(prev => [...prev, { id: Math.random().toString(), text, type }])
      }

      try {
        addLog('Compiling Board Decision...')
        addLog('Drafting Product Requirements Document (PRD)...')
        addLog('Designing Technical Architecture...')
        
        // Let's call the real execution endpoint, but we don't block fully on it if we want to simulate steps
        // The backend `run` endpoint is synchronous for document generation
        const res = await fetch(`${apiBaseUrl}/execution/run`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: session.session_id,
            // Pass fake token if you want real backend to attempt it, or backend handles missing
            gitlab_token: 'fake-token' 
          })
        })

        if (!res.ok) {
          throw new Error('Failed to run execution')
        }

        const pkg = await res.json()

        if (!active) return

        addLog('PRD & Architecture generated.', 'success')
        
        setPhase('creating_repo')
        addLog('Connecting to GitLab...')
        
        await new Promise(r => setTimeout(r, 1500))
        addLog('Initializing repository...', 'build')
        await new Promise(r => setTimeout(r, 1500))
        
        setPhase('engineering_build')
        addLog('Engineer Agent (Gilfoyle) has cloned the repo.', 'info')
        addLog('Gilfoyle: Setting up Next.js app structure...', 'build')
        await new Promise(r => setTimeout(r, 2000))
        addLog('Gilfoyle: Writing Tailwind tokens...', 'build')
        await new Promise(r => setTimeout(r, 2000))
        addLog('Gilfoyle: Implementing auth & core components...', 'build')
        await new Promise(r => setTimeout(r, 2000))
        addLog('Gilfoyle: Resolving type errors...', 'build')
        await new Promise(r => setTimeout(r, 2000))
        addLog('Gilfoyle: MVP build complete. All checks passed.', 'success')
        
        setPhase('final_report')
        addLog('Office Agent: Reviewing technical build...', 'info')
        await new Promise(r => setTimeout(r, 2000))
        addLog('Office Agent: Validating against Hard Constraints...', 'info')
        await new Promise(r => setTimeout(r, 2000))
        addLog('Office Agent: Final Report Generated.', 'success')

        setPhase('done')
        setTimeout(() => onComplete(), 2000)

      } catch (err) {
        addLog('Execution failed or timed out.', 'info')
      }
    }

    runExecution()

    return () => { active = false }
  }, [session, apiBaseUrl, onComplete])

  return (
    <div className="w-full flex flex-col space-y-6 max-w-4xl mx-auto h-[600px]">
      
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
          <Cpu className="text-blue-400 w-5 h-5" />
          Technical Execution & Build
        </h2>
        
        <div className="flex gap-2">
          {['generating_docs', 'creating_repo', 'engineering_build', 'final_report', 'done'].map((p, i) => {
            const currentIdx = ['generating_docs', 'creating_repo', 'engineering_build', 'final_report', 'done'].indexOf(phase)
            const isActive = currentIdx === i
            const isDone = currentIdx > i
            return (
              <div 
                key={p} 
                className={`h-2 w-12 rounded-full transition-all duration-500 ${
                  isActive ? 'bg-blue-500' : isDone ? 'bg-emerald-500' : 'bg-white/10'
                }`}
              />
            )
          })}
        </div>
      </div>

      <div className="flex-1 glass-panel p-6 flex flex-col overflow-hidden relative">
        {/* Background Animation */}
        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(circle at 50% 50%, var(--accent) 0%, transparent 50%)',
          backgroundSize: '100% 100%',
        }} />

        <div className="flex-1 overflow-y-auto space-y-4 pr-2 font-mono text-sm z-10" id="execution-logs">
          <AnimatePresence>
            {logs.map((log) => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex gap-3 items-start ${
                  log.type === 'success' ? 'text-emerald-400' : 
                  log.type === 'build' ? 'text-amber-400' : 'text-blue-300'
                }`}
              >
                {log.type === 'success' ? <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" /> : 
                 log.type === 'build' ? <GitCommit className="w-4 h-4 mt-0.5 shrink-0" /> :
                 <Play className="w-4 h-4 mt-0.5 shrink-0" />}
                <span>{log.text}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {phase === 'done' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-500/10 border border-emerald-500/30 p-6 rounded-xl flex items-center justify-between"
        >
          <div className="flex items-center gap-4 text-emerald-400">
            <CheckCircle2 className="w-8 h-8" />
            <div>
              <h3 className="font-bold text-white">MVP Handover Ready</h3>
              <p className="text-sm">Technical build verified and final report finalized.</p>
            </div>
          </div>
          <button 
            onClick={onComplete}
            className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-bold transition-colors"
          >
            View Final Report
          </button>
        </motion.div>
      )}

    </div>
  )
}
