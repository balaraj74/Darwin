"use client";

import React, { useState } from "react";
import { DigitalTwin, BoardSession } from "./types";
import Scene from "./components/Scene";
import GlowCard from "./components/GlowCard";
import OnboardingForm from "./components/OnboardingForm";
import BoardRoom from "./components/BoardRoom";
import ResultsDashboard from "./components/ResultsDashboard";
import { Sparkles, Trophy, GitBranch, ArrowRight, Layers, Layout, MessageSquare, Compass, ShieldCheck, DollarSign, Cpu, TrendingUp } from "lucide-react";

export default function App() {
  const [view, setView] = useState<"landing" | "onboarding" | "board" | "results">("landing");
  const [activeTwin, setActiveTwin] = useState<DigitalTwin | null>(null);
  const [activeSession, setActiveSession] = useState<BoardSession | null>(null);

  const API_BASE_URL = "/api";

  // Preloads the pre-seeded "darwinagent" environment setup immediately as requested
  const launchDarwinDemoState = () => {
    // Loaded from the pre-seeded server data directly!
    const mockTwin: DigitalTwin = {
      twin_id: "darwinagent",
      founder_name: "Darwin Founder",
      raw_intake: {
        what_can_you_build: "React/Next.js, Tailwind CSS, Node.js/FastAPI backends, Gemini AI API integration",
        capital_available: "₹1,500,000",
        what_makes_you_quit: "No pilot customers or feedback within 4 months, running out of execution budget.",
        first_potential_customer: "A network of 12 regional agricultural and supply chain coordinators in South India.",
        hardest_thing_shipped: "Shipped a real-time IoT cargo tracker with React dashboard in 3 weeks for an agri-conglomerate.",
        draining_work: "Manual phone sales, chasing cold emails, managing complex hosting/K8s DevOps setups.",
        most_likely_failure: "Over-scoping the digital sensor platform instead of creating highly usable mobile SMS/Web alerts.",
        startup_idea: "Darwin: An intelligent real-time supply chain monitoring platform for agricultural cooperatives in India."
      },
      profile: {
        technical_depth: "high",
        execution_velocity: "fast",
        risk_tolerance: "medium-high",
        network_strength: "strong",
        marketing_aptitude: "medium",
        competitive_edge: "High technical capability coupled with direct network pathway to 12 agriculture coordinators.",
        blind_spots: ["DevOps overhead", "Pricing strategy", "Manual customer acquisition"],
        quit_triggers: ["No revenue or engagement in 4 months", "Exceeded ₹1.5M budget"],
        hard_constraints: {
          budget_inr: 1500000,
          months_to_first_revenue: 4,
          team_size: 1,
          technical_skills: ["React", "Next.js", "Tailwind CSS", "Node.js", "FastAPI", "Gemini AI"],
          no_go_domains: ["DevOps heavy apps", "Enterprise sales with 12+ month cycles"]
        }
      },
      startup_idea: "Darwin: An intelligent real-time supply chain monitoring platform for agricultural cooperatives in India.",
      session_count: 1
    };
    
    setActiveTwin(mockTwin);
    setView("board");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-blue-150 selection:text-blue-700 pb-16">
      
      {/* Upper Navigation Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-40 backdrop-blur-md shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setView("landing")}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center p-0.5 animate-pulse">
              <div className="w-full h-full bg-slate-900 rounded-md flex items-center justify-center font-display font-black text-xs text-white tracking-tighter">
                D
              </div>
            </div>
            <div>
              <span className="text-sm font-display font-black tracking-widest text-slate-900">DARWIN</span>
              <span className="text-[9px] font-mono text-blue-600 block -mt-1 uppercase tracking-wider font-bold">darwin • platform</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={launchDarwinDemoState}
              className="text-xs font-mono font-bold text-blue-700 hover:text-blue-800 border border-blue-200 px-3 py-1.5 rounded-lg bg-blue-50/50 hover:bg-blue-100 cursor-pointer hidden sm:inline-flex items-center space-x-1.5 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              <span>LAUNCH DARWINTWIN PILOT</span>
            </button>

            <button
              onClick={() => {
                setActiveTwin(null);
                setActiveSession(null);
                setView("onboarding");
              }}
              className="px-4 py-2 bg-slate-900 text-white text-xs font-display font-bold rounded-lg hover:bg-slate-800 cursor-pointer transition-all shadow-xs"
            >
              BUILD NEW INSTANCE
            </button>
          </div>
        </div>
      </header>

      {/* Main Orchestrator Canvas */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* VIEW 1: LANDING WORKSPACE */}
        {view === "landing" && (
          <div className="space-y-16 py-4 md:py-8">
            
            {/* Hero Stage Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              <div className="lg:col-span-6 space-y-6">
                <span className="inline-flex items-center space-x-1.5 py-1 px-3 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-mono font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                  <span>PRE-RELEASE ALPHA ACCESS</span>
                </span>

                <h1 className="text-4xl md:text-5xl font-display font-black tracking-tight text-slate-900 leading-none">
                  Your AI Executive Board. <br />
                  <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Built Around You.
                  </span>
                </h1>

                <p className="text-sm md:text-base text-slate-600 leading-relaxed max-w-xl font-sans">
                  Darwin creates a digital twin representing your actual skills, budget limits, 
                  and quit thresholds — then assembles a 5-member AI board directly debating your 
                  startup concept, re-aligning it to fit you specifically. No templates. Instant GitLab issues.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                  <button
                    onClick={() => setView("onboarding")}
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white shadow-xs rounded-xl font-display font-black text-sm uppercase tracking-wider cursor-pointer flex items-center justify-center space-x-2 transition-all hover:-translate-y-0.5"
                  >
                    <span>CONVENE MY DIRECTORS</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={launchDarwinDemoState}
                    className="px-6 py-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs tracking-wider cursor-pointer text-slate-700 font-bold flex items-center justify-center space-x-2 shadow-xs transition-all"
                  >
                    <span>SEED DARWINAGENT DEMO</span>
                  </button>
                </div>
              </div>

              {/* Spectacular 3D scene mockup */}
              <div className="lg:col-span-6">
                <Scene />
              </div>

            </div>

            {/* How It Works Section */}
            <div className="space-y-8 border-t border-slate-200 pt-16">
              <div className="text-center max-w-xl mx-auto space-y-2">
                <h2 className="text-2xl font-display font-bold tracking-tight text-slate-900 uppercase">PROVE IDEVAL TO SEVERE BUDGET CAPS</h2>
                <p className="text-sm text-slate-500">Our structured 3-round debate acts as the validation system against unstable startup variables.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <GlowCard className="space-y-3" accent="cyan">
                  <span className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-mono font-bold text-xs shadow-xs">01</span>
                  <h4 className="text-sm font-display font-bold text-slate-800">Answer 7 Hard Questions</h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-sans">
                    Define what you can build, actual limits, quit triggers, and warm networks. We construct your inferred constraints layout profile.
                  </p>
                </GlowCard>

                <GlowCard className="space-y-3" accent="purple">
                  <span className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 font-mono font-bold text-xs shadow-xs">02</span>
                  <h4 className="text-sm font-display font-bold text-slate-800">The AI Board Debates Live</h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-sans">
                    CEO, CFO, CTO, CMO, and CPO evaluate budget overlays. The CFO can veto high CAC expenditures; the board pivots the model.
                  </p>
                </GlowCard>

                <GlowCard className="space-y-3" accent="amber">
                  <span className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 font-mono font-bold text-xs shadow-xs">03</span>
                  <h4 className="text-sm font-display font-bold text-slate-800">Real GitLab Issuance</h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-sans">
                    Obtain product specifications maps, 6-month budget ekonomi projection spreadsheets, and a live private GitLab issues backlog.
                  </p>
                </GlowCard>
              </div>
            </div>

            {/* AI Advisor Attributes Map */}
            <div className="border-t border-slate-200 pt-16 grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="bg-white border border-slate-200 card-shadow p-5 rounded-xl font-mono text-center space-y-1">
                <Layers className="w-5 h-5 text-indigo-600 m-auto mb-2" />
                <span className="text-xs font-bold text-slate-800 block">CEO Agent</span>
                <span className="text-[10px] text-slate-500">Market Potential</span>
              </div>
              <div className="bg-white border border-slate-200 card-shadow p-5 rounded-xl font-mono text-center space-y-1">
                <DollarSign className="w-5 h-5 text-rose-600 m-auto mb-2" />
                <span className="text-xs font-bold text-slate-800 block">CFO Agent</span>
                <span className="text-[10px] text-slate-500">Runway Limits</span>
              </div>
              <div className="bg-white border border-slate-200 card-shadow p-5 rounded-xl font-mono text-center space-y-1">
                <Cpu className="w-5 h-5 text-blue-600 m-auto mb-2" />
                <span className="text-xs font-bold text-slate-800 block">CTO Agent</span>
                <span className="text-[10px] text-slate-500">Build Speed</span>
              </div>
              <div className="bg-white border border-slate-200 card-shadow p-5 rounded-xl font-mono text-center space-y-1">
                <MessageSquare className="w-5 h-5 text-amber-600 m-auto mb-2" />
                <span className="text-xs font-bold text-slate-800 block">CMO Agent</span>
                <span className="text-[10px] text-slate-500">Distribution Channels</span>
              </div>
              <div className="bg-white border border-slate-200 card-shadow p-5 rounded-xl font-mono text-center space-y-1">
                <Compass className="w-5 h-5 text-emerald-600 m-auto mb-2" />
                <span className="text-xs font-bold text-slate-800 block">CPO Agent</span>
                <span className="text-[10px] text-slate-500">MVP Scope</span>
              </div>
            </div>

            {/* Aesthetic Footer */}
            <footer className="border-t border-slate-200 pt-8 flex flex-col sm:flex-row justify-between items-center text-xs font-mono text-slate-500 gap-4">
              <span>DARWIN // SURVIVAL OF THE FITTEST STARTUP.</span>
              <div className="flex space-x-4 font-bold text-slate-600">
                <span className="cursor-pointer hover:text-blue-600">GITHUB</span>
                <span className="cursor-pointer hover:text-blue-600">DEVPOST</span>
                <span className="cursor-pointer hover:text-blue-600">LINKEDIN</span>
              </div>
            </footer>

          </div>
        )}

        {/* VIEW 2: ONBOARDING FOR DIGITAL TWIN */}
        {view === "onboarding" && (
          <div className="py-8">
            <div className="max-w-2xl mx-auto text-center space-y-2 mb-8">
              <h1 className="text-3xl font-display font-black text-slate-900 uppercase tracking-tight">CRAFT YOUR DIGITAL TWIN</h1>
              <p className="text-xs font-mono text-slate-500">THE INTAKE METRICS WILL CONFIGURE YOUR COGNITIVE BOARD ALIGNMENT</p>
            </div>
            
            <OnboardingForm
              onComplete={(twin) => {
                setActiveTwin(twin);
                setView("board");
              }}
              apiBaseUrl={API_BASE_URL}
            />
          </div>
        )}

        {/* VIEW 3: LIVE BOARDROOM CHAMBER */}
        {view === "board" && activeTwin && (
          <div className="py-8 space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-5">
              <div className="space-y-1">
                <h1 className="text-3xl font-display font-black tracking-tight uppercase text-slate-900">AI DIRECTORS CONCLAVE</h1>
                <p className="text-xs font-mono text-slate-500">
                  CONVENE COMPLIANT DEBATES FOR: <span className="text-blue-600 font-bold uppercase">{activeTwin.startup_idea}</span>
                </p>
              </div>
              <button
                onClick={() => setView("onboarding")}
                className="text-xs font-mono font-bold text-slate-650 hover:text-slate-800 border border-slate-200 hover:bg-slate-100 px-4 py-2 rounded-xl cursor-pointer transition-all"
              >
                RE-CRAFT COGNITIVE TWIN
              </button>
            </div>

            <BoardRoom
              twin={activeTwin}
              onDecisionReached={(session) => {
                setActiveSession(session);
                setView("results");
              }}
              apiBaseUrl={API_BASE_URL}
            />
          </div>
        )}

        {/* VIEW 4: DELIVERABLE OUTPUTS SUITE */}
        {view === "results" && activeSession && (
          <div className="py-8 space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-5">
              <div className="space-y-1">
                <h1 className="text-3xl font-display font-black tracking-tight uppercase text-slate-900">LAUNCH COMPLIANCE BLUEPRINTS</h1>
                <p className="text-xs font-mono text-slate-500 uppercase">
                  MAPPED AND SYNCHRONIZED FOR: <span className="text-blue-600 font-bold">{activeSession.twin_id}</span>
                </p>
              </div>

              <div className="flex space-x-3 text-xs font-mono font-bold">
                <button
                  onClick={() => setView("board")}
                  className="px-4 py-2 border border-slate-200 hover:bg-white text-slate-600 hover:text-slate-800 rounded-xl cursor-pointer shadow-xs transition-all"
                >
                  RE-ENTER DEBATE
                </button>
                <button
                  onClick={() => {
                    setActiveTwin(null);
                    setActiveSession(null);
                    setView("landing");
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs hover:shadow-md cursor-pointer transition-all"
                >
                  LANDING PLATFORM
                </button>
              </div>
            </div>

            <ResultsDashboard
              session={activeSession}
              apiBaseUrl={API_BASE_URL}
            />
          </div>
        )}

      </main>
    </div>
  );
}
