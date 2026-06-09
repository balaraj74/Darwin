"use client";

import React, { useState, useEffect, useRef } from "react";
import { DigitalTwin, BoardSession, AgentOpinion, BoardDecision, AgentRole } from "../types";
import { 
  Bot, ShieldAlert, Cpu, Sparkles, TrendingUp, DollarSign, 
  MessageCircle, Scale, ShieldCheck, Flame, ArrowRight, Play, CheckCircle
} from "lucide-react";
import GlowCard from "./GlowCard";

interface BoardRoomProps {
  twin: DigitalTwin;
  onDecisionReached: (session: BoardSession) => void;
  apiBaseUrl: string;
}

export default function BoardRoom({ twin, onDecisionReached, apiBaseUrl }: BoardRoomProps) {
  const [session, setSession] = useState<BoardSession | null>(null);
  const [activeRound, setActiveRound] = useState<number>(1);
  const [opinions, setOpinions] = useState<AgentOpinion[]>([]);
  const [activeSpeech, setActiveSpeech] = useState<AgentOpinion | null>(null);
  const [speakingAgent, setSpeakingAgent] = useState<AgentRole | null>(null);
  const [isDebating, setIsDebating] = useState(false);
  const [decision, setDecision] = useState<BoardDecision | null>(null);
  const [showPivotOverlay, setShowPivotOverlay] = useState(false);

  // Agent meta records
  const AGENT_METADATA: Record<AgentRole, { name: string; tag: string; color: string; icon: any }> = {
    CEO: { name: "CEO Agent", tag: "Market Strategy & Valuation", color: "text-indigo-700 border-indigo-200 bg-indigo-50", icon: TrendingUp },
    CFO: { name: "CFO Agent", tag: "Prudent Budget Calibration", color: "text-rose-700 border-rose-200 bg-rose-50/70", icon: Scale },
    CTO: { name: "CTO Agent", tag: "Stack Feasibility & Velocity", color: "text-blue-700 border-blue-200 bg-blue-50/70", icon: Cpu },
    CMO: { name: "CMO Agent", tag: "Distribution & Network Arbitrage", color: "text-amber-700 border-amber-200 bg-amber-50/70", icon: MessageCircle },
    CPO: { name: "CPO Agent", tag: "MVP Scope & Pain Remediation", color: "text-emerald-700 border-emerald-200 bg-emerald-50/70", icon: Sparkles }
  };

  const startBoardMeeting = async () => {
    setIsDebating(true);
    setOpinions([]);
    setActiveRound(1);
    setActiveSpeech(null);
    setSpeakingAgent(null);
    setDecision(null);

    try {
      // POST to backend api to bootstrap debate
      const initResp = await fetch(`${apiBaseUrl}/board/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ twin_id: twin.twin_id })
      });
      if (!initResp.ok) throw new Error("Failed to initialize board.");
      const activeSession: BoardSession = await initResp.json();
      setSession(activeSession);

      // Connect to Server-Sent-Events stream
      const sseUrl = `${apiBaseUrl}/board/${activeSession.session_id}/stream`;
      const eventSource = new EventSource(sseUrl);

      eventSource.onmessage = (event) => {
        if (event.data === "[DONE]") {
          eventSource.close();
          finishDebate(activeSession);
          return;
        }

        try {
          const parsed = JSON.parse(event.data);
          
          if (parsed.type === "opinion") {
            const op: AgentOpinion = parsed.data;
            setOpinions(prev => [...prev, op]);
            setActiveSpeech(op);
            setSpeakingAgent(op.agent);
            setActiveRound(op.round);
          } else if (parsed.type === "decision") {
            const dec: BoardDecision = parsed.data;
            setDecision(dec);
            activeSession.decision = dec;
          }
        } catch (parseErr) {
          console.error("SSE parse error", parseErr);
        }
      };

      eventSource.onerror = (err) => {
        console.error("SSE Connection issue, falling back to full sequence pre-reveal", err);
        eventSource.close();
        finishDebate(activeSession);
      };

    } catch (err) {
      console.error(err);
      setIsDebating(false);
    }
  };

  const finishDebate = (activeSession: BoardSession) => {
    // Populate all opinions from database directly for guarantee
    const allOpinions: AgentOpinion[] = [];
    activeSession.rounds.forEach(r => r.forEach(op => allOpinions.push(op)));
    setOpinions(allOpinions);
    
    // Set final states
    if (activeSession.decision) {
      setDecision(activeSession.decision);
      if (activeSession.decision.decision === "PIVOT") {
        setShowPivotOverlay(true);
      }
    }
    setSpeakingAgent(null);
    setActiveSpeech(allOpinions[allOpinions.length - 1] || null);
    setIsDebating(false);
  };

  // Autostart meeting for seeded demo of darwinagent
  useEffect(() => {
    if (twin.twin_id === "darwinagent") {
      startBoardMeeting();
    }
  }, [twin]);

  const viewDeliverables = () => {
    if (session) {
      const finalSession = { ...session, decision: decision || session.decision };
      onDecisionReached(finalSession);
    }
  };

  return (
    <div className="relative w-full space-y-6">
      
      {/* Pivot Moment cinematic overlay */}
      {showPivotOverlay && decision && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="max-w-xl w-full border border-rose-200 p-8 text-center space-y-6 bg-white card-shadow rounded-2xl relative">
            <span className="inline-flex m-auto w-12 h-12 bg-rose-50 border border-rose-200 rounded-full items-center justify-center text-rose-600 shadow-xs">
              <ShieldAlert className="w-6 h-6" />
            </span>
            <div className="space-y-2">
              <h1 className="text-3xl font-display font-black tracking-tight text-rose-700">THE BOARD HAS PIVOTED YOUR IDEA</h1>
              <p className="text-xs font-mono text-slate-500 uppercase tracking-widest">[SYSTEM: HARD BUDGET/TIMELINE VETO TRIGGERED]</p>
            </div>
            
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left font-mono text-xs text-slate-700 space-y-3">
              <div>
                <span className="text-slate-400 font-bold">ORIGINAL CONCEPT:</span>
                <p className="text-rose-700 line-through mt-0.5">{decision.original_idea}</p>
              </div>
              <div className="border-t border-slate-200 pt-2">
                <span className="text-blue-700 font-bold">REVISION STRATEGY:</span>
                <p className="text-blue-700 font-bold mt-0.5">{decision.recommended_idea}</p>
              </div>
              <div className="border-t border-slate-200 pt-2">
                <span className="text-slate-400 font-bold">COGNITIVE RATIO ROADBLOCKS:</span>
                <p className="text-slate-600 leading-relaxed mt-0.5">{decision.pivot_reasoning}</p>
              </div>
            </div>

            <button
              onClick={() => {
                setShowPivotOverlay(false);
                viewDeliverables();
              }}
              className="w-full flex items-center justify-center space-x-2 py-3 bg-blue-600 text-white font-display font-bold text-xs tracking-wider rounded-xl hover:bg-blue-700 shadow-xs hover:shadow-md cursor-pointer transition-all"
            >
              <span>ACCESS RE-CONFIGURED STARTUP BLUEPRINTS</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Grid structure: Left side agent panel, right side speech console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: 5 Board Member Cards */}
        <div className="lg:col-span-4 space-y-3.5">
          <div className="flex justify-between items-center px-1">
            <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase">THE EXECUTIVE BOARD</span>
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
          </div>

          {(["CEO", "CFO", "CTO", "CMO", "CPO"] as AgentRole[]).map((role) => {
            const meta = AGENT_METADATA[role];
            const opinionOfAgent = opinions.filter(o => o.agent === role);
            const latestOpinion = opinionOfAgent[opinionOfAgent.length - 1];
            
            const isSpeaking = speakingAgent === role;
            const hasVoted = decision !== null;
            
            const Icon = meta.icon;

            return (
              <div
                key={role}
                className={`flex items-center justify-between p-4 bg-white/5 border rounded-xl transition-all ${
                  isSpeaking 
                    ? "border-blue-500 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.2)]" 
                    : latestOpinion 
                      ? "border-white/20" 
                      : "border-white/5"
                }`}
              >
                <div className="flex items-center space-x-3 overflow-hidden">
                  <div className={`w-10 h-10 border border-white/10 rounded-lg flex items-center justify-center shrink-0 ${
                    role === 'CEO' ? 'bg-indigo-500/20 text-indigo-400' :
                    role === 'CFO' ? 'bg-rose-500/20 text-rose-400' :
                    role === 'CTO' ? 'bg-blue-500/20 text-blue-400' :
                    role === 'CMO' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="overflow-hidden">
                    <span className="text-xs font-display font-bold text-white block truncate">{meta.name}</span>
                    <span className="text-[9px] font-mono text-slate-400 truncate block uppercase font-medium">{meta.tag}</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  {isSpeaking ? (
                    <span className="inline-block text-[8px] font-mono bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full animate-bounce font-bold">
                      SPEAKING
                    </span>
                  ) : hasVoted ? (
                    <span className="inline-block text-[8px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                      VOTED
                    </span>
                  ) : latestOpinion ? (
                    <span className="text-xs font-mono font-bold text-slate-300 bg-white/10 border border-white/10 px-2 py-0.5 rounded-lg">
                      {latestOpinion.score.toFixed(1)}/10
                    </span>
                  ) : (
                    <span className="text-[9px] font-mono text-slate-500 uppercase">THINKING...</span>
                  )}
                </div>
              </div>
            );
          })}

          {!isDebating && !isDecisionDone() && (
            <button
              onClick={startBoardMeeting}
              className="w-full py-3.5 bg-blue-600 text-white font-display font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/15 transition-all flex items-center justify-center space-x-2 shadow-xs"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>CONVENE COURT DEBATE</span>
            </button>
          )}

          {decision && (
            <button
              onClick={viewDeliverables}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-display font-black text-xs uppercase tracking-wider rounded-xl cursor-pointer hover:opacity-95 hover:shadow-lg hover:shadow-emerald-500/15 transition-all flex items-center justify-center space-x-2"
            >
              <CheckCircle className="w-4 h-4" />
              <span>LAUNCH BLUEPRINTS SUITE</span>
            </button>
          )}
        </div>

        {/* Right Side: Active Terminal Feed and Founder Profiles */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Active speech / debate feed bubble */}
          <GlowCard className="min-h-[280px]" accent="cyan">
            {activeSpeech ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center space-x-2">
                    <Bot className="w-4 h-4 text-blue-600" />
                    <span className="text-xs font-mono text-blue-600 uppercase tracking-widest font-bold">
                      SPEECH FEED &gt; ROUND {activeSpeech.round} &gt; {activeSpeech.agent}
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold bg-slate-50 text-slate-700 border border-slate-200 px-2.5 py-0.5 rounded-lg">
                    VERDICT SCORE: {activeSpeech.score.toFixed(1)} / 10
                  </span>
                </div>

                <div className="space-y-3">
                  <p className="text-sm text-slate-700 leading-relaxed font-sans italic">
                    &quot;{activeSpeech.reasoning}&quot;
                  </p>
                  
                  {/* Bullet points mapping */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 font-mono text-[11px]">
                    {activeSpeech.opportunities.length > 0 && (
                      <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg text-emerald-800 font-medium">
                        <span className="font-bold uppercase tracking-wider block mb-1 text-emerald-950">Opportunities:</span>
                        <ul className="list-disc list-inside space-y-1">
                          {activeSpeech.opportunities.map((o, idx) => <li key={idx}>{o}</li>)}
                        </ul>
                      </div>
                    )}
                    {activeSpeech.concerns.length > 0 && (
                      <div className="bg-rose-50 border border-rose-250 p-3 rounded-lg text-rose-800 font-medium font-medium">
                        <span className="font-bold uppercase tracking-wider block mb-1 text-rose-950">Constraints Veto Concerns:</span>
                        <ul className="list-disc list-inside space-y-1">
                          {activeSpeech.concerns.map((c, idx) => <li key={idx}>{c}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400 font-mono">
                <Flame className="w-8 h-8 text-slate-300 animate-pulse mb-3" />
                <span>The executive board chamber is silent. Click &apos;CONVENE COURT DEBATE&apos; to engage the state-engine.</span>
              </div>
            )}
          </GlowCard>

          {/* Quick Stats: Founder Profile parameters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Hard Constraints summary */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 font-mono card-shadow">
              <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">Digital Twin Limits</span>
              <div className="text-xs space-y-2 text-slate-600 font-medium">
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span>RUNWAY BUDGET:</span>
                  <span className="text-blue-600 font-bold">₹{twin.profile.hard_constraints.budget_inr.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span>QUIT THRESHOLD:</span>
                  <span className="text-amber-600 font-bold">{twin.profile.hard_constraints.months_to_first_revenue} Months</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span>FOUNDER SKILLS:</span>
                  <span className="text-slate-800 font-bold text-right truncate max-w-[150px]">
                    {twin.profile.hard_constraints.technical_skills.join(", ") || "Fullstack Web"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>EXEC VELOCITY:</span>
                  <span className="text-emerald-700 font-bold uppercase">{twin.profile.execution_velocity}</span>
                </div>
              </div>
            </div>

            {/* Inferred attributes */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 font-mono card-shadow">
              <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">Inferred Cognitive Edge</span>
              <div className="text-xs space-y-2 text-slate-600 font-medium">
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span>RISK GAP TOLERANCE:</span>
                  <span className="text-slate-750 font-bold uppercase">{twin.profile.risk_tolerance}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-1">
                  <span>MARKETING SCORE:</span>
                  <span className="text-slate-750 font-bold uppercase">{twin.profile.marketing_aptitude}</span>
                </div>
                <div className="flex justify-between">
                  <span>FOUNDER CORE ADVANTAGE:</span>
                  <span className="text-indigo-600 font-bold truncate max-w-[150px]">{twin.profile.competitive_edge}</span>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );

  function isDecisionDone(): boolean {
    return decision !== null;
  }
}
