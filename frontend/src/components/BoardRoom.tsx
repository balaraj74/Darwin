"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  DigitalTwin, BoardSession, AgentOpinion, BoardDecision, AgentRole,
  ExecutionPackage,
} from "../types";
import {
  TrendingUp, DollarSign, Cpu, MessageCircle, Sparkles,
  Play, CheckCircle, ShieldAlert, ArrowRight, Flame,
  Mic, Clock, AlertTriangle, Target, Zap, BarChart3,
  X, ChevronRight, History, RefreshCw,
} from "lucide-react";

interface BoardRoomProps {
  twin: DigitalTwin;
  onDecisionReached: (session: BoardSession, pkg?: ExecutionPackage | null, isReplay?: boolean) => void;
  apiBaseUrl: string;
  initialSession?: BoardSession | null;
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
function GCard({ children, style, onClick, onMouseEnter, onMouseLeave }: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  onClick?: (e: React.MouseEvent) => void;
  onMouseEnter?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onMouseLeave?: (e: React.MouseEvent<HTMLDivElement>) => void;
}) {
  return (
    <div onClick={onClick} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} style={{
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

// ── Mini Arc Gauge ────────────────────────────────────────────────────────────
function MiniArc({ value, max = 100, color, label }: { value: number; max?: number; color: string; label: string }) {
  const r = 36, circ = Math.PI * r;
  const dash = (value / max) * circ;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <svg viewBox="0 0 84 52" style={{ width: 84 }}>
        <path d="M 6,46 A 36,36 0 0,1 78,46" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
        <path d="M 6,46 A 36,36 0 0,1 78,46" fill="none" stroke={color}
          strokeWidth="6" strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
        <text x="42" y="40" textAnchor="middle" style={{ fontSize: 16, fontWeight: 800, fill: T.text, fontFamily: 'monospace' }}>{Math.round(value)}</text>
      </svg>
      <span style={{ fontSize: 9, color: T.dim, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
    </div>
  );
}

// ── Agent Modal ───────────────────────────────────────────────────────────────
function AgentModal({
  role, opinions, onClose
}: {
  role: AgentRole; opinions: AgentOpinion[]; onClose: () => void;
}) {
  const meta = AGENTS[role];
  const [activeRound, setActiveRound] = useState(1);
  const rounds = [1, 2, 3] as const;
  const roundLabels = { 1: 'Initial Position', 2: 'Cross-Examination', 3: 'Final Vote' };
  const roundOpinion = opinions.find(o => o.round === activeRound);
  const availableRounds = [...new Set(opinions.map(o => o.round))];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(16px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }} onClick={onClose}>
      <GCard style={{
        width: '100%', maxWidth: 680, maxHeight: '88vh', overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        borderColor: `${meta.accent}40`,
        boxShadow: `0 0 60px ${meta.glow}, 0 24px 64px rgba(0,0,0,0.7)`,
        animation: 'modalSlide 0.25s ease',
      }} onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div style={{
          padding: '18px 22px', borderBottom: `1px solid ${T.border}`,
          display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0,
        }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: `${meta.accent}18`, border: `1px solid ${meta.accent}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: meta.accent }}>
            {meta.icon}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: meta.accent }}>{meta.label}</div>
            <div style={{ fontSize: 10, color: T.dim, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{meta.tag}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, display: 'flex', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {/* Round Tabs */}
        <div style={{ display: 'flex', padding: '0 22px', borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
          {rounds.map(r => {
            const available = availableRounds.includes(r);
            const active = activeRound === r;
            return (
              <button key={r} onClick={() => available && setActiveRound(r)}
                style={{
                  padding: '10px 16px', background: 'none',
                  border: 'none', borderBottom: active ? `2px solid ${meta.accent}` : '2px solid transparent',
                  color: !available ? T.dim : active ? meta.accent : T.muted,
                  fontSize: 11, fontWeight: active ? 700 : 400,
                  fontFamily: 'monospace', letterSpacing: '0.06em', cursor: available ? 'pointer' : 'default',
                  textTransform: 'uppercase', whiteSpace: 'nowrap',
                }}>
                R{r} · {roundLabels[r]}
              </button>
            );
          })}
        </div>

        {/* Opinion Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 22 }}>
          {roundOpinion ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Score */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  padding: '6px 14px', borderRadius: 999, fontFamily: 'monospace',
                  fontSize: 18, fontWeight: 900,
                  color: roundOpinion.score >= 7 ? T.green : roundOpinion.score >= 5 ? T.amber : T.red,
                  background: `${roundOpinion.score >= 7 ? T.green : roundOpinion.score >= 5 ? T.amber : T.red}14`,
                  border: `1px solid ${roundOpinion.score >= 7 ? T.green : roundOpinion.score >= 5 ? T.amber : T.red}35`,
                }}>
                  {roundOpinion.score.toFixed(1)}<span style={{ fontSize: 11, opacity: 0.5 }}>/10</span>
                </div>
                {roundOpinion.responding_to && (
                  <span style={{ fontSize: 11, color: T.dim, fontFamily: 'monospace' }}>
                    ↩ Responding to {roundOpinion.responding_to}
                  </span>
                )}
              </div>

              {/* Reasoning */}
              <div style={{ background: `${meta.accent}08`, border: `1px solid ${meta.accent}20`, borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ fontSize: 9.5, color: meta.accent, fontFamily: 'monospace', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8, fontWeight: 700 }}>Full Reasoning</div>
                <p style={{ fontSize: 13, color: T.text, lineHeight: 1.8, margin: 0, fontStyle: 'italic' }}>
                  &ldquo;{roundOpinion.reasoning}&rdquo;
                </p>
              </div>

              {/* Opportunities + Concerns */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {roundOpinion.opportunities.length > 0 && (
                  <div style={{ background: `${T.green}10`, border: `1px solid ${T.green}25`, borderRadius: 10, padding: '12px 14px' }}>
                    <div style={{ fontSize: 9.5, fontWeight: 800, color: T.green, fontFamily: 'monospace', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Target size={10} /> Opportunities
                    </div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {roundOpinion.opportunities.map((o, i) => (
                        <li key={i} style={{ fontSize: 11.5, color: T.muted, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                          <span style={{ color: T.green, marginTop: 2, flexShrink: 0 }}>▸</span> {o}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {roundOpinion.concerns.length > 0 && (
                  <div style={{ background: `${T.red}10`, border: `1px solid ${T.red}25`, borderRadius: 10, padding: '12px 14px' }}>
                    <div style={{ fontSize: 9.5, fontWeight: 800, color: T.red, fontFamily: 'monospace', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <AlertTriangle size={10} /> Concerns
                    </div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {roundOpinion.concerns.map((c, i) => (
                        <li key={i} style={{ fontSize: 11.5, color: T.muted, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                          <span style={{ color: T.red, marginTop: 2, flexShrink: 0 }}>▸</span> {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 160, gap: 10, color: T.dim }}>
              <Clock size={28} />
              <span style={{ fontSize: 12, fontFamily: 'monospace' }}>Round {activeRound} hasn't started yet</span>
            </div>
          )}
        </div>
      </GCard>
    </div>
  );
}

// ── Final Verdict Card ────────────────────────────────────────────────────────
function VerdictCard({ decision, onLaunch }: { decision: BoardDecision; onLaunch: () => void }) {
  const decisionColor = decision.decision === 'PROCEED' ? T.green : decision.decision === 'PIVOT' ? T.amber : T.red;
  const decisionEmoji = decision.decision === 'PROCEED' ? '✅' : decision.decision === 'PIVOT' ? '🔄' : '❌';
  const voteMap = { PROCEED: T.green, NO: T.red, NEUTRAL: T.amber };

  return (
    <GCard style={{ padding: 24, borderColor: `${decisionColor}35` }}>
      {/* Verdict header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, paddingBottom: 18, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: `${decisionColor}18`, border: `2px solid ${decisionColor}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
          {decisionEmoji}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 9, fontFamily: 'monospace', color: T.dim, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 4 }}>BOARD VERDICT</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: decisionColor, letterSpacing: '0.06em', fontFamily: 'monospace' }}>{decision.decision}</div>
        </div>
        <div style={{ display: 'flex', gap: 18 }}>
          <MiniArc value={decision.founder_fit_score} color={T.gold} label="Founder Fit" />
          <MiniArc value={decision.viability_score} color={T.blue} label="Viability" />
          <MiniArc value={decision.overall_score} color={decisionColor} label="Overall" />
        </div>
      </div>

      {/* Key insight */}
      <div style={{ background: `${decisionColor}09`, border: `1px solid ${decisionColor}25`, borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
        <div style={{ fontSize: 9, fontFamily: 'monospace', color: decisionColor, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 6 }}>Key Insight</div>
        <p style={{ margin: 0, fontSize: 13, color: T.text, lineHeight: 1.7, fontStyle: 'italic' }}>
          &ldquo;{decision.key_insight}&rdquo;
        </p>
      </div>

      {/* Vote tally */}
      {decision.votes.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 9, fontFamily: 'monospace', color: T.dim, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>Agent Votes</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {decision.votes.map(v => (
              <div key={v.agent} title={v.vote_reason} style={{
                padding: '5px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700, fontFamily: 'monospace',
                color: voteMap[v.vote] || T.dim,
                background: `${voteMap[v.vote] || T.dim}14`,
                border: `1px solid ${voteMap[v.vote] || T.dim}35`,
                cursor: 'help',
              }}>
                {v.agent} · {v.vote}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Constraint violations */}
      {decision.hard_constraint_violations.length > 0 && (
        <div style={{ background: `${T.red}09`, border: `1px solid ${T.red}25`, borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
          <div style={{ fontSize: 9, fontFamily: 'monospace', color: T.red, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
            <ShieldAlert size={11} /> Hard Constraint Violations
          </div>
          {decision.hard_constraint_violations.map((v, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 5, fontSize: 11.5, color: T.muted }}>
              <span style={{ color: v.severity === 'fatal' ? T.red : T.amber, marginTop: 2, flexShrink: 0 }}>▸</span>
              <span><strong style={{ color: v.severity === 'fatal' ? T.red : T.amber }}>{v.constraint}:</strong> {v.details}</span>
            </div>
          ))}
        </div>
      )}

      {/* Pivot section */}
      {decision.decision === 'PIVOT' && decision.recommended_idea && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
          <div style={{ background: `${T.red}08`, border: `1px solid ${T.red}20`, borderRadius: 10, padding: '10px 12px' }}>
            <div style={{ fontSize: 9, color: T.red, fontFamily: 'monospace', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 5 }}>Original Concept</div>
            <div style={{ fontSize: 12, color: T.muted, textDecoration: 'line-through', lineHeight: 1.5 }}>{decision.original_idea}</div>
          </div>
          <div style={{ background: `${T.blue}08`, border: `1px solid ${T.blue}20`, borderRadius: 10, padding: '10px 12px' }}>
            <div style={{ fontSize: 9, color: T.blue, fontFamily: 'monospace', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 5 }}>Recommended Pivot</div>
            <div style={{ fontSize: 12, color: T.blue, fontWeight: 700, lineHeight: 1.5 }}>{decision.recommended_idea}</div>
          </div>
        </div>
      )}

      <button onClick={onLaunch} style={{
        width: '100%', padding: '13px 0',
        background: `linear-gradient(135deg, ${decisionColor}, ${decisionColor}cc)`,
        border: 'none', borderRadius: 12,
        color: '#fff', fontSize: 12.5, fontWeight: 900,
        letterSpacing: '0.06em', textTransform: 'uppercase',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        boxShadow: `0 6px 28px ${decisionColor}40`,
      }}>
        <Zap size={14} /> Launch Full Blueprint Suite <ArrowRight size={14} />
      </button>
    </GCard>
  );
}

// ── Session History Item ──────────────────────────────────────────────────────
type SessionSummary = {
  session_id: string;
  status: string;
  created_at: string | null;
  decision: string | null;
  overall_score: number | null;
  key_insight: string | null;
  original_idea: string | null;
};

function SessionHistoryPanel({
  twin, apiBaseUrl, onReplay
}: {
  twin: DigitalTwin;
  apiBaseUrl: string;
  onReplay: (session: BoardSession, pkg: ExecutionPackage | null) => void;
}) {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${apiBaseUrl}/board/sessions/${twin.twin_id}`)
      .then(r => r.ok ? r.json() : [])
      .then(data => { setSessions(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [twin.twin_id, apiBaseUrl]);

  const decided = sessions.filter(s => s.status === 'decided');

  if (loading) return null;
  if (!decided.length) return null;

  const dc = (d: string | null) => d === 'PROCEED' ? T.green : d === 'PIVOT' ? T.amber : d === 'REJECT' ? T.red : T.dim;

  return (
    <GCard style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, paddingBottom: 12, borderBottom: `1px solid ${T.border}` }}>
        <History size={13} color={T.muted} />
        <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 700, color: T.muted, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Past Sessions</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {decided.map(s => (
          <button key={s.session_id} onClick={async () => {
            const res = await fetch(`${apiBaseUrl}/board/session/${s.session_id}`);
            if (res.ok) {
              const data = await res.json();
              onReplay(data.session as BoardSession, data.execution_package || null);
            }
          }} style={{
            width: '100%', textAlign: 'left',
            background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.border}`,
            borderRadius: 10, padding: '10px 12px', cursor: 'pointer',
            transition: 'all 0.2s',
          }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = `${T.gold}40`)}
            onMouseLeave={e => (e.currentTarget.style.borderColor = T.border)}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 700, color: dc(s.decision), textTransform: 'uppercase' }}>
                {s.decision || 'Unknown'}
              </span>
              <span style={{ fontSize: 9, color: T.dim, fontFamily: 'monospace' }}>
                {s.overall_score ? `${Math.round(s.overall_score)}/100` : ''}
              </span>
            </div>
            <div style={{ fontSize: 11, color: T.muted, lineHeight: 1.4, marginBottom: 3 }}>
              {s.original_idea ? (s.original_idea.length > 60 ? s.original_idea.slice(0, 60) + '…' : s.original_idea) : '—'}
            </div>
            <div style={{ fontSize: 9, color: T.dim, fontFamily: 'monospace' }}>
              {s.created_at ? new Date(s.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
            </div>
          </button>
        ))}
      </div>
    </GCard>
  );
}


// ── Main BoardRoom Component ──────────────────────────────────────────────────
export default function BoardRoom({ twin, onDecisionReached, apiBaseUrl, initialSession }: BoardRoomProps) {
  const [session,        setSession]        = useState<BoardSession | null>(initialSession || null);
  
  // Compute initial states from initialSession
  const initialOpinions: AgentOpinion[] = [];
  if (initialSession && initialSession.rounds) {
    initialSession.rounds.forEach(r => r.forEach(op => initialOpinions.push(op)));
  }
  
  const [opinions,       setOpinions]       = useState<AgentOpinion[]>(initialOpinions);
  const [activeSpeech,   setActiveSpeech]   = useState<AgentOpinion | null>(initialOpinions.length > 0 ? initialOpinions[initialOpinions.length - 1] : null);
  const [speakingAgent,  setSpeakingAgent]  = useState<AgentRole | null>(null);
  const [isDebating,     setIsDebating]     = useState(false);
  const [decision,       setDecision]       = useState<BoardDecision | null>(initialSession?.decision || null);
  const [showPivot,      setShowPivot]      = useState(false);
  const [activeRound,    setActiveRound]    = useState<1|2|3>(initialSession?.decision ? 3 : 1);
  const [completedRounds, setCompletedRounds] = useState<Set<number>>(initialSession?.decision ? new Set([1, 2, 3]) : new Set());
  const [selectedAgent,  setSelectedAgent]  = useState<AgentRole | null>(null);
  const [isReplay,       setIsReplay]       = useState(!!initialSession);
  const sessionRef = useRef<BoardSession | null>(initialSession || null);

  const roundLabels = {
    1: 'R1 · Initial Positions',
    2: 'R2 · Cross-Examination',
    3: 'R3 · Final Vote',
  };

  const startBoardMeeting = async () => {
    setIsDebating(true);
    setOpinions([]);
    setActiveSpeech(null);
    setSpeakingAgent(null);
    setDecision(null);
    setCompletedRounds(new Set());
    setActiveRound(1);
    setIsReplay(false);

    try {
      const initResp = await fetch(`${apiBaseUrl}/board/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ twin_id: twin.twin_id }),
      });
      if (!initResp.ok) throw new Error('Failed to initialize board.');
      const activeSession: BoardSession = await initResp.json();
      setSession(activeSession);
      sessionRef.current = activeSession;

      const sseUrl = `${apiBaseUrl}/board/${activeSession.session_id}/stream`;
      const es = new EventSource(sseUrl);

      es.onmessage = (event) => {
        if (event.data === '[DONE]') { es.close(); finishDebate(sessionRef.current!); return; }
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.type === 'decision') {
            const dec: BoardDecision = parsed.data;
            setDecision(dec);
            if (sessionRef.current) sessionRef.current.decision = dec;
          } else if (parsed.agent) {
            const op: AgentOpinion = parsed;
            setOpinions(prev => [...prev, op]);
            setActiveSpeech(op);
            setSpeakingAgent(op.agent);
            setActiveRound(op.round as 1|2|3);
            // Mark previous rounds complete when we get round 2 or 3
            if (op.round > 1) {
              setCompletedRounds(prev => {
                const next = new Set(prev);
                for (let r = 1; r < op.round; r++) next.add(r);
                return next;
              });
            }
          }
        } catch { /* parse error noop */ }
      };

      es.onerror = () => { es.close(); finishDebate(sessionRef.current!); };
    } catch {
      setIsDebating(false);
    }
  };

  const finishDebate = (activeSession: BoardSession) => {
    const all: AgentOpinion[] = [];
    activeSession.rounds.forEach(r => r.forEach(op => all.push(op)));
    setOpinions(all);
    setCompletedRounds(new Set([1, 2, 3]));
    if (activeSession.decision) {
      setDecision(activeSession.decision);
      if (activeSession.decision.decision === 'PIVOT') setShowPivot(true);
    }
    setSpeakingAgent(null);
    setActiveSpeech(all[all.length - 1] || null);
    setIsDebating(false);
  };

  const replaySession = (replayedSession: BoardSession, pkg: ExecutionPackage | null) => {
    setIsReplay(true);
    setDecision(replayedSession.decision || null);
    setSession(replayedSession);
    sessionRef.current = replayedSession;
    const all: AgentOpinion[] = [];
    replayedSession.rounds.forEach(r => r.forEach(op => all.push(op)));
    setOpinions(all);
    setActiveSpeech(all[all.length - 1] || null);
    setSpeakingAgent(null);
    setIsDebating(false);
    setCompletedRounds(new Set([1, 2, 3]));
    setActiveRound(3);
    // Immediately unlock the sidebar tabs in the parent dashboard, passing isReplay=true
    onDecisionReached(replayedSession, pkg, true);
  };

  const viewDeliverables = () => {
    if (session) onDecisionReached({ ...session, decision: decision || session.decision }, null, false);
  };

  const isDone = decision !== null;

  // Opinions filtered by selected round tab
  const roundOpinions = opinions.filter(o => o.round === activeRound);
  const currentSpeech = activeSpeech && activeSpeech.round === activeRound ? activeSpeech : roundOpinions[roundOpinions.length - 1] || null;
  const displaySpeech = currentSpeech;

  return (
    <div style={{ width: '100%', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes speaking { 0%,100%{transform:scaleY(1)} 50%{transform:scaleY(1.4)} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes slideIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes modalSlide { from{opacity:0;transform:scale(0.96) translateY(8px)} to{opacity:1;transform:scale(1) translateY(0)} }
      `}</style>

      {/* ── Agent Modal ──────────────────────────────────────────────────────── */}
      {selectedAgent && (
        <AgentModal
          role={selectedAgent}
          opinions={opinions.filter(o => o.agent === selectedAgent)}
          onClose={() => setSelectedAgent(null)}
        />
      )}

      {/* ── PIVOT Overlay ─────────────────────────────────────────────────────── */}
      {showPivot && decision && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(20px)', zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <GCard style={{ maxWidth: 520, width: '100%', padding: 36, textAlign: 'center', borderColor: `${T.red}35` }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: `${T.red}18`, border: `1px solid ${T.red}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: T.red }}>
              <ShieldAlert size={26} />
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: T.red, letterSpacing: '0.06em', marginBottom: 6 }}>THE BOARD HAS PIVOTED YOUR IDEA</div>
            <div style={{ fontSize: 10, color: T.dim, fontFamily: 'monospace', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 24 }}>[SYSTEM: HARD BUDGET/TIMELINE VETO TRIGGERED]</div>
            <GCard style={{ textAlign: 'left', padding: 18, marginBottom: 22 }}>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, color: T.dim, fontFamily: 'monospace', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 5 }}>Original Concept</div>
                <div style={{ fontSize: 13, color: T.muted, textDecoration: 'line-through' }}>{decision.original_idea}</div>
              </div>
              <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 12, marginBottom: 12 }}>
                <div style={{ fontSize: 10, color: T.blue, fontFamily: 'monospace', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 5 }}>Revised Strategy</div>
                <div style={{ fontSize: 13, color: T.blue, fontWeight: 700 }}>{decision.recommended_idea}</div>
              </div>
              {decision.pivot_reasoning && (
                <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 12 }}>
                  <div style={{ fontSize: 10, color: T.dim, fontFamily: 'monospace', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 5 }}>Veto Reasoning</div>
                  <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.6 }}>{decision.pivot_reasoning}</div>
                </div>
              )}
            </GCard>
            <button onClick={() => { setShowPivot(false); viewDeliverables(); }}
              style={{ width: '100%', padding: '13px 24px', background: `linear-gradient(135deg, ${T.blue}, #1a6fd4)`, border: 'none', borderRadius: 12, color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, letterSpacing: '0.04em' }}>
              ACCESS RE-CONFIGURED STARTUP BLUEPRINTS <ArrowRight size={15} />
            </button>
          </GCard>
        </div>
      )}

      {/* ── MAIN LAYOUT ───────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16 }}>

        {/* ── LEFT: Agent panel ─────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Board header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 2px' }}>
            <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.12em', color: T.muted, textTransform: 'uppercase' }}>The Executive Board</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {isReplay && <span style={{ fontSize: 9, color: T.amber, fontFamily: 'monospace', letterSpacing: '0.08em', textTransform: 'uppercase' }}>REPLAY</span>}
              <PulseDot color={isDebating ? T.blue : isDone ? T.green : T.dim} />
            </div>
          </div>

          {/* Agent cards — now clickable */}
          {ROLES.map(role => {
            const meta = AGENTS[role];
            const agentOpinions = opinions.filter(o => o.agent === role);
            const latest = agentOpinions[agentOpinions.length - 1];
            const isSpeaking = speakingAgent === role;
            const hasSpoken = agentOpinions.length > 0;

            return (
              <GCard key={role} onClick={() => hasSpoken && setSelectedAgent(role)} style={{
                padding: '12px 14px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                borderColor: isSpeaking ? `${meta.accent}50` : hasSpoken ? `${meta.accent}25` : 'rgba(255,255,255,0.05)',
                background: isSpeaking ? meta.glow : T.card,
                boxShadow: isSpeaking ? `0 0 20px ${meta.glow}` : 'none',
                transition: 'all 0.35s',
                cursor: hasSpoken ? 'pointer' : 'default',
              }}
                onMouseEnter={e => hasSpoken && (e.currentTarget.style.borderColor = `${meta.accent}55`)}
                onMouseLeave={e => !isSpeaking && (e.currentTarget.style.borderColor = hasSpoken ? `${meta.accent}25` : 'rgba(255,255,255,0.05)')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 11, overflow: 'hidden' }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: `${meta.accent}18`, border: `1px solid ${meta.accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: meta.accent, flexShrink: 0 }}>
                    {meta.icon}
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: isSpeaking ? meta.accent : T.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{meta.label}</div>
                    <div style={{ fontSize: 9.5, color: T.dim, fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{meta.tag}</div>
                  </div>
                </div>

                <div style={{ flexShrink: 0, marginLeft: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                  {hasSpoken && !isSpeaking && (
                    <span style={{ fontSize: 8, color: meta.accent, opacity: 0.6 }}>View →</span>
                  )}
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
            {isDone && !isReplay && (
              <button onClick={startBoardMeeting} style={{
                width: '100%', padding: '10px 0',
                background: 'transparent',
                border: `1px solid ${T.border}`, borderRadius: 12,
                color: T.muted, fontSize: 11, fontWeight: 600,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              }}>
                <RefreshCw size={12} /> Run New Session
              </button>
            )}
          </div>

          {/* Session history */}
          <SessionHistoryPanel twin={twin} apiBaseUrl={apiBaseUrl} onReplay={replaySession} />
        </div>

        {/* ── RIGHT: Round tabs + Speech feed + Verdict ──────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Round navigation tabs */}
          {(opinions.length > 0 || isDone) && (
            <GCard style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ display: 'flex' }}>
                {([1, 2, 3] as const).map(r => {
                  const available = completedRounds.has(r) || (isDebating && activeRound === r);
                  const active = activeRound === r;
                  const roundColor = r === 1 ? T.gold : r === 2 ? T.blue : T.green;
                  return (
                    <button key={r} onClick={() => available && setActiveRound(r)} style={{
                      flex: 1, padding: '12px 10px',
                      background: active ? `${roundColor}14` : 'transparent',
                      border: 'none', borderBottom: active ? `2px solid ${roundColor}` : '2px solid transparent',
                      borderRight: r < 3 ? `1px solid ${T.border}` : 'none',
                      color: !available ? T.dim : active ? roundColor : T.muted,
                      fontSize: 10.5, fontWeight: active ? 700 : 400,
                      fontFamily: 'monospace', letterSpacing: '0.06em',
                      cursor: available ? 'pointer' : 'default',
                      textTransform: 'uppercase', transition: 'all 0.2s',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    }}>
                      {isDebating && activeRound === r && !completedRounds.has(r) && (
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: roundColor, animation: 'pulse 1.2s ease-in-out infinite' }} />
                      )}
                      {roundLabels[r]}
                    </button>
                  );
                })}
              </div>
            </GCard>
          )}

          {/* Speech console */}
          <GCard style={{ padding: 22, minHeight: 260, display: 'flex', flexDirection: 'column' }}>
            {displaySpeech ? (
              <>
                {/* Feed header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, paddingBottom: 14, borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <PulseDot color={speakingAgent === displaySpeech.agent && isDebating ? T.blue : T.dim} />
                    <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 700, color: T.blue, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                      {AGENTS[displaySpeech.agent]?.label} › R{displaySpeech.round}
                    </span>
                    {displaySpeech.responding_to && (
                      <span style={{ fontSize: 9.5, color: T.dim, fontFamily: 'monospace' }}>↩ responding to {displaySpeech.responding_to}</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 10, fontFamily: 'monospace', color: T.dim }}>VERDICT SCORE</span>
                    <span style={{ fontSize: 16, fontWeight: 900, color: displaySpeech.score >= 7 ? T.green : displaySpeech.score >= 5 ? T.amber : T.red, fontFamily: 'monospace' }}>
                      {displaySpeech.score.toFixed(1)}<span style={{ fontSize: 10, color: T.dim }}>/10</span>
                    </span>
                  </div>
                </div>

                {/* Reasoning */}
                <p style={{ fontSize: 13.5, color: T.text, lineHeight: 1.7, fontStyle: 'italic', marginBottom: 18, animation: 'slideIn 0.3s ease', margin: '0 0 18px' }}>
                  &ldquo;{displaySpeech.reasoning}&rdquo;
                </p>

                {/* Opportunities + Concerns grid */}
                {(displaySpeech.opportunities.length > 0 || displaySpeech.concerns.length > 0) && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 'auto' }}>
                    {displaySpeech.opportunities.length > 0 && (
                      <div style={{ background: `${T.green}10`, border: `1px solid ${T.green}25`, borderRadius: 10, padding: '12px 14px' }}>
                        <div style={{ fontSize: 9.5, fontWeight: 800, color: T.green, fontFamily: 'monospace', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Target size={10} /> Opportunities
                        </div>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
                          {displaySpeech.opportunities.map((o, i) => (
                            <li key={i} style={{ fontSize: 11.5, color: T.muted, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                              <span style={{ color: T.green, marginTop: 2, flexShrink: 0 }}>▸</span> {o}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {displaySpeech.concerns.length > 0 && (
                      <div style={{ background: `${T.red}10`, border: `1px solid ${T.red}25`, borderRadius: 10, padding: '12px 14px' }}>
                        <div style={{ fontSize: 9.5, fontWeight: 800, color: T.red, fontFamily: 'monospace', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <AlertTriangle size={10} /> Veto Concerns
                        </div>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
                          {displaySpeech.concerns.map((c, i) => (
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

          {/* Final Verdict — shown when done */}
          {isDone && decision && (
            <div style={{ animation: 'slideIn 0.4s ease' }}>
              <VerdictCard decision={decision} onLaunch={viewDeliverables} />
            </div>
          )}

          {/* Stats row — only show when not yet decided */}
          {!isDone && (
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
              </GCard>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
