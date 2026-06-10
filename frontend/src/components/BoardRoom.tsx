"use client";

import React, { useState, useEffect } from "react";
import { DigitalTwin, BoardSession, AgentOpinion, BoardDecision, AgentRole } from "../types";
import {
  TrendingUp, DollarSign, Cpu, MessageCircle, Sparkles,
  Play, CheckCircle, ShieldAlert, ArrowRight, Flame,
  Mic, Clock, AlertTriangle, Target, Zap, BarChart3
} from "lucide-react";

interface BoardRoomProps {
  twin: DigitalTwin;
  onDecisionReached: (session: BoardSession) => void;
  apiBaseUrl: string;
}

// ── Design tokens ──────────────────────────────────────────────────────────────
const T = {
  bg:         '#0a0a0c',
  card:       'rgba(14,14,22,0.80)',
  cardBorder: 'rgba(201,168,76,0.14)',
  text:       '#eeeef5',
  muted:      '#7878a0',
  dim:        '#44445a',
  gold:       '#c9a84c',
  gold2:      '#e8c96a',
  green:      '#2fc96e',
  red:        '#ff453a',
  blue:       '#2997ff',
  purple:     '#bf48ff',
  amber:      '#ffb340',
  teal:       '#32d2c9',
  border:     'rgba(255,255,255,0.07)',
};

// ── Agent config ───────────────────────────────────────────────────────────────
const AGENTS: Record<AgentRole, {
  label: string; tag: string; icon: React.ReactNode;
  accent: string; glow: string;
}> = {
  CEO: { label: 'CEO Agent', tag: 'Market Strategy & Valuation',     icon: <TrendingUp size={17} />,   accent: T.gold,   glow: 'rgba(201,168,76,0.18)'   },
  CFO: { label: 'CFO Agent', tag: 'Prudent Budget Calibration',       icon: <DollarSign size={17} />,   accent: T.red,    glow: 'rgba(255,69,58,0.18)'    },
  CTO: { label: 'CTO Agent', tag: 'Stack Feasibility & Velocity',    icon: <Cpu size={17} />,          accent: T.blue,   glow: 'rgba(41,151,255,0.18)'   },
  CMO: { label: 'CMO Agent', tag: 'Distribution & Network Arbitrage', icon: <MessageCircle size={17}/>, accent: T.amber,  glow: 'rgba(255,179,64,0.18)'   },
  CPO: { label: 'CPO Agent', tag: 'MVP Scope & Pain Remediation',    icon: <Sparkles size={17} />,     accent: T.green,  glow: 'rgba(47,201,110,0.18)'   },
};

const ROLES: AgentRole[] = ['CEO', 'CFO', 'CTO', 'CMO', 'CPO'];

// ── Glassmorphic card ─────────────────────────────────────────────────────────
function GCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: T.card,
      backdropFilter: 'blur(36px) saturate(160%)',
      WebkitBackdropFilter: 'blur(36px) saturate(160%)',
      border: `1px solid ${T.cardBorder}`,
      borderRadius: 14,
      ...style,
    }}>
      {children}
    </div>
  );
}

// ── Pulsing dot ───────────────────────────────────────────────────────────────
function PulseDot({ color }: { color: string }) {
  return (
    <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}`, animation: 'pulse 1.5s ease-in-out infinite' }} />
  );
}

export default function BoardRoom({ twin, onDecisionReached, apiBaseUrl }: BoardRoomProps) {
  const [session,        setSession]        = useState<BoardSession | null>(null);
  const [opinions,       setOpinions]       = useState<AgentOpinion[]>([]);
  const [activeSpeech,   setActiveSpeech]   = useState<AgentOpinion | null>(null);
  const [speakingAgent,  setSpeakingAgent]  = useState<AgentRole | null>(null);
  const [isDebating,     setIsDebating]     = useState(false);
  const [decision,       setDecision]       = useState<BoardDecision | null>(null);
  const [showPivot,      setShowPivot]      = useState(false);

  const startBoardMeeting = async () => {
    setIsDebating(true);
    setOpinions([]);
    setActiveSpeech(null);
    setSpeakingAgent(null);
    setDecision(null);

    try {
      const initResp = await fetch(`${apiBaseUrl}/board/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ twin_id: twin.twin_id }),
      });
      if (!initResp.ok) throw new Error('Failed to initialize board.');
      const activeSession: BoardSession = await initResp.json();
      setSession(activeSession);

      const sseUrl = `${apiBaseUrl}/board/${activeSession.session_id}/stream`;
      const es = new EventSource(sseUrl);

      es.onmessage = (event) => {
        if (event.data === '[DONE]') { es.close(); finishDebate(activeSession); return; }
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.type === 'decision') {
            const dec: BoardDecision = parsed.data;
            setDecision(dec);
            activeSession.decision = dec;
          } else if (parsed.agent) {
            const op: AgentOpinion = parsed;
            setOpinions(prev => [...prev, op]);
            setActiveSpeech(op);
            setSpeakingAgent(op.agent);
          }
        } catch { /* parse error noop */ }
      };

      es.onerror = () => { es.close(); finishDebate(activeSession); };
    } catch {
      setIsDebating(false);
    }
  };

  const finishDebate = (activeSession: BoardSession) => {
    const all: AgentOpinion[] = [];
    activeSession.rounds.forEach(r => r.forEach(op => all.push(op)));
    setOpinions(all);
    if (activeSession.decision) {
      setDecision(activeSession.decision);
      if (activeSession.decision.decision === 'PIVOT') setShowPivot(true);
    }
    setSpeakingAgent(null);
    setActiveSpeech(all[all.length - 1] || null);
    setIsDebating(false);
  };

  useEffect(() => {
    if (twin.twin_id === 'darwinagent') startBoardMeeting();
  }, [twin]);

  const viewDeliverables = () => {
    if (session) onDecisionReached({ ...session, decision: decision || session.decision });
  };

  const isDone = decision !== null;

  return (
    <div style={{ width: '100%', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes speaking { 0%,100%{transform:scaleY(1)} 50%{transform:scaleY(1.4)} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes slideIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* ── PIVOT Overlay ─────────────────────────────────────────────────────── */}
      {showPivot && decision && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(20px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <GCard style={{ maxWidth: 520, width: '100%', padding: 36, textAlign: 'center', borderColor: `${T.red}35` }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: `${T.red}18`, border: `1px solid ${T.red}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: T.red }}>
              <ShieldAlert size={26} />
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: T.red, letterSpacing: '0.06em', marginBottom: 6 }}>THE BOARD HAS PIVOTED YOUR IDEA</div>
            <div style={{ fontSize: 10, color: T.dim, fontFamily: 'monospace', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 24 }}>[SYSTEM: HARD BUDGET/TIMELINE VETO TRIGGERED]</div>
            <GCard style={{ textAlign: 'left', padding: 18, marginBottom: 22, borderColor: `${T.border}` }}>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, color: T.dim, fontFamily: 'monospace', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 5 }}>Original Concept</div>
                <div style={{ fontSize: 13, color: T.muted, textDecoration: 'line-through' }}>{decision.original_idea}</div>
              </div>
              <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 12, marginBottom: 12 }}>
                <div style={{ fontSize: 10, color: T.blue, fontFamily: 'monospace', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 5 }}>Revised Strategy</div>
                <div style={{ fontSize: 13, color: T.blue, fontWeight: 700 }}>{decision.recommended_idea}</div>
              </div>
              <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 12 }}>
                <div style={{ fontSize: 10, color: T.dim, fontFamily: 'monospace', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 5 }}>Veto Reasoning</div>
                <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.6 }}>{decision.pivot_reasoning}</div>
              </div>
            </GCard>
            <button onClick={() => { setShowPivot(false); viewDeliverables(); }}
              style={{ width: '100%', padding: '13px 24px', background: `linear-gradient(135deg, ${T.blue}, #1a6fd4)`, border: 'none', borderRadius: 12, color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, letterSpacing: '0.04em' }}>
              ACCESS RE-CONFIGURED STARTUP BLUEPRINTS <ArrowRight size={15} />
            </button>
          </GCard>
        </div>
      )}

      {/* ── MAIN LAYOUT ───────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16 }}>

        {/* ── LEFT: Agent panel ─────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Board header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 2px' }}>
            <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.12em', color: T.muted, textTransform: 'uppercase' }}>The Executive Board</span>
            <PulseDot color={isDebating ? T.blue : isDone ? T.green : T.dim} />
          </div>

          {/* Agent cards */}
          {ROLES.map(role => {
            const meta = AGENTS[role];
            const agentOpinions = opinions.filter(o => o.agent === role);
            const latest = agentOpinions[agentOpinions.length - 1];
            const isSpeaking = speakingAgent === role;

            return (
              <GCard key={role} style={{
                padding: '12px 14px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                borderColor: isSpeaking ? `${meta.accent}50` : latest ? `${T.cardBorder}` : 'rgba(255,255,255,0.05)',
                background: isSpeaking ? meta.glow : T.card,
                boxShadow: isSpeaking ? `0 0 20px ${meta.glow}` : 'none',
                transition: 'all 0.35s',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 11, overflow: 'hidden' }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: `${meta.accent}18`, border: `1px solid ${meta.accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: meta.accent, flexShrink: 0 }}>
                    {meta.icon}
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: isSpeaking ? meta.accent : T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{meta.label}</div>
                    <div style={{ fontSize: 9.5, color: T.dim, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{meta.tag}</div>
                  </div>
                </div>

                <div style={{ flexShrink: 0, marginLeft: 8 }}>
                  {isSpeaking ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 9, fontFamily: 'monospace', fontWeight: 700, color: meta.accent, background: `${meta.accent}15`, border: `1px solid ${meta.accent}40`, padding: '3px 8px', borderRadius: 999 }}>
                      <Mic size={9} /> LIVE
                    </span>
                  ) : isDone ? (
                    <span style={{ fontSize: 9, fontFamily: 'monospace', fontWeight: 700, color: T.green, background: `${T.green}12`, border: `1px solid ${T.green}30`, padding: '3px 8px', borderRadius: 999 }}>VOTED</span>
                  ) : latest ? (
                    <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 800, color: latest.score >= 7 ? T.green : latest.score >= 5 ? T.amber : T.red }}>
                      {latest.score.toFixed(1)}<span style={{ fontSize: 8, color: T.dim }}>/10</span>
                    </span>
                  ) : (
                    <span style={{ fontSize: 9, color: T.dim, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{isDebating ? '...' : 'IDLE'}</span>
                  )}
                </div>
              </GCard>
            );
          })}

          {/* Action buttons */}
          <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {!isDebating && !isDone && (
              <button onClick={startBoardMeeting} style={{
                width: '100%', padding: '13px 0',
                background: `linear-gradient(135deg, ${T.gold}, ${T.gold2})`,
                border: 'none', borderRadius: 12,
                color: '#0a0a0c', fontSize: 12, fontWeight: 900,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
                boxShadow: `0 6px 28px ${T.gold}40`,
                transition: 'all 0.2s',
              }}>
                <Play size={14} /> Convene Court Debate
              </button>
            )}
            {isDebating && !isDone && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '13px 0', background: `${T.blue}12`, border: `1px solid ${T.blue}30`, borderRadius: 12, color: T.blue, fontSize: 12, fontWeight: 700, fontFamily: 'monospace' }}>
                <div style={{ width: 14, height: 14, borderRadius: '50%', border: `2px solid ${T.blue}40`, borderTopColor: T.blue, animation: 'spin 1s linear infinite' }} />
                BOARD IN SESSION
              </div>
            )}
            {isDone && (
              <button onClick={viewDeliverables} style={{
                width: '100%', padding: '13px 0',
                background: `linear-gradient(135deg, ${T.green}, #1faa5c)`,
                border: 'none', borderRadius: 12,
                color: '#fff', fontSize: 12, fontWeight: 900,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
                boxShadow: `0 6px 28px ${T.green}35`,
              }}>
                <CheckCircle size={14} /> Launch Blueprints Suite
              </button>
            )}
          </div>
        </div>

        {/* ── RIGHT: Speech feed + stats ─────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Speech console */}
          <GCard style={{ padding: 22, minHeight: 300, display: 'flex', flexDirection: 'column' }}>
            {activeSpeech ? (
              <>
                {/* Feed header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 14, borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <PulseDot color={T.blue} />
                    <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 700, color: T.blue, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                      Speech Feed › R{activeSpeech.round} › {activeSpeech.agent}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 10, fontFamily: 'monospace', color: T.dim }}>VERDICT SCORE</span>
                    <span style={{ fontSize: 16, fontWeight: 900, color: activeSpeech.score >= 7 ? T.green : activeSpeech.score >= 5 ? T.amber : T.red, fontFamily: 'monospace' }}>
                      {activeSpeech.score.toFixed(1)}<span style={{ fontSize: 10, color: T.dim }}>/10</span>
                    </span>
                  </div>
                </div>

                {/* Reasoning */}
                <p style={{ fontSize: 13.5, color: T.text, lineHeight: 1.7, fontStyle: 'italic', marginBottom: 18, animation: 'slideIn 0.3s ease' }}>
                  &ldquo;{activeSpeech.reasoning}&rdquo;
                </p>

                {/* Opportunities + Concerns grid */}
                {(activeSpeech.opportunities.length > 0 || activeSpeech.concerns.length > 0) && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 'auto' }}>
                    {activeSpeech.opportunities.length > 0 && (
                      <div style={{ background: `${T.green}10`, border: `1px solid ${T.green}25`, borderRadius: 10, padding: '12px 14px' }}>
                        <div style={{ fontSize: 9.5, fontWeight: 800, color: T.green, fontFamily: 'monospace', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Target size={10} /> Opportunities
                        </div>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
                          {activeSpeech.opportunities.map((o, i) => (
                            <li key={i} style={{ fontSize: 11.5, color: T.muted, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                              <span style={{ color: T.green, marginTop: 2, flexShrink: 0 }}>▸</span> {o}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {activeSpeech.concerns.length > 0 && (
                      <div style={{ background: `${T.red}10`, border: `1px solid ${T.red}25`, borderRadius: 10, padding: '12px 14px' }}>
                        <div style={{ fontSize: 9.5, fontWeight: 800, color: T.red, fontFamily: 'monospace', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <AlertTriangle size={10} /> Veto Concerns
                        </div>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
                          {activeSpeech.concerns.map((c, i) => (
                            <li key={i} style={{ fontSize: 11.5, color: T.muted, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                              <span style={{ color: T.red, marginTop: 2, flexShrink: 0 }}>▸</span> {c}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, textAlign: 'center' }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: `${T.gold}10`, border: `1px solid ${T.gold}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Flame size={24} color={T.gold} style={{ animation: 'pulse 2s ease-in-out infinite' }} />
                </div>
                <div style={{ color: T.muted, fontFamily: 'monospace', fontSize: 12, maxWidth: 320, lineHeight: 1.6 }}>
                  The executive board chamber is silent.<br />
                  <span style={{ color: T.dim }}>Click <strong style={{ color: T.gold }}>Convene Court Debate</strong> to engage the state-engine.</span>
                </div>
              </div>
            )}
          </GCard>

          {/* ── Stats row ────────────────────────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

            {/* Digital Twin Limits */}
            <GCard style={{ padding: '16px 18px' }}>
              <div style={{ fontSize: 9.5, fontFamily: 'monospace', fontWeight: 800, color: T.muted, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 7 }}>
                <BarChart3 size={11} color={T.gold} /> Digital Twin Limits
              </div>
              {[
                { label: 'Runway Budget', value: `₹${twin.profile.hard_constraints.budget_inr.toLocaleString()}`, color: T.blue },
                { label: 'Quit Threshold', value: `${twin.profile.hard_constraints.months_to_first_revenue} Months`, color: T.amber },
                { label: 'Founder Skills', value: twin.profile.hard_constraints.technical_skills.join(', ') || 'Fullstack Web', color: T.text },
                { label: 'Exec Velocity', value: twin.profile.execution_velocity, color: T.green },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 9, marginBottom: 9, borderBottom: `1px solid ${T.border}` }}>
                  <span style={{ fontSize: 10.5, fontFamily: 'monospace', color: T.dim, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{row.label}</span>
                  <span style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 800, color: row.color, textTransform: 'uppercase', textAlign: 'right', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.value}</span>
                </div>
              ))}
            </GCard>

            {/* Inferred Cognitive Edge */}
            <GCard style={{ padding: '16px 18px' }}>
              <div style={{ fontSize: 9.5, fontFamily: 'monospace', fontWeight: 800, color: T.muted, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 7 }}>
                <Zap size={11} color={T.purple} /> Inferred Cognitive Edge
              </div>
              {[
                { label: 'Risk Tolerance', value: twin.profile.risk_tolerance, color: T.amber },
                { label: 'Marketing Score', value: twin.profile.marketing_aptitude, color: T.teal },
                { label: 'Core Advantage', value: twin.profile.competitive_edge, color: T.purple },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 9, marginBottom: 9, borderBottom: `1px solid ${T.border}` }}>
                  <span style={{ fontSize: 10.5, fontFamily: 'monospace', color: T.dim, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{row.label}</span>
                  <span style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 800, color: row.color, textTransform: 'uppercase', textAlign: 'right', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.value}</span>
                </div>
              ))}

              {/* Decision verdict badge */}
              {decision && (
                <div style={{ marginTop: 6, padding: '10px 14px', background: decision.decision === 'PROCEED' ? `${T.green}14` : decision.decision === 'PIVOT' ? `${T.red}14` : `${T.amber}14`, border: `1px solid ${decision.decision === 'PROCEED' ? T.green : decision.decision === 'PIVOT' ? T.red : T.amber}35`, borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18 }}>{decision.decision === 'PROCEED' ? '✅' : decision.decision === 'PIVOT' ? '🔄' : '⚠️'}</span>
                  <div>
                    <div style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 900, color: decision.decision === 'PROCEED' ? T.green : decision.decision === 'PIVOT' ? T.red : T.amber, letterSpacing: '0.1em' }}>BOARD VERDICT: {decision.decision}</div>
                  </div>
                </div>
              )}
            </GCard>
          </div>
        </div>
      </div>
    </div>
  );
}
