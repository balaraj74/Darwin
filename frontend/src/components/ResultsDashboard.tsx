"use client";

import React, { useState, useEffect } from "react";
import { BoardSession, ExecutionPackage, GitLabIssue } from "../types";
import { 
  Award, TrendingUp, Cpu, Flame, Target, DollarSign, ListTodo, FileSpreadsheet, 
  Presentation, GitBranch, ArrowRight, Check, AlertTriangle, ExternalLink, Link2
} from "lucide-react";
import GlowCard from "./GlowCard";

interface ResultsDashboardProps {
  session: BoardSession;
  apiBaseUrl: string;
}

export default function ResultsDashboard({ session, apiBaseUrl }: ResultsDashboardProps) {
  const [activeTab, setActiveTab] = useState<"decision" | "prd" | "financials" | "pitch" | "gitlab">("decision");
  const [pkg, setPkg] = useState<ExecutionPackage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [gitlabToken, setGitlabToken] = useState("");
  const [errorText, setErrorText] = useState<string | null>(null);

  const loadExecutionPackage = async () => {
    setIsLoading(true);
    setErrorText(null);
    try {
      const response = await fetch(`${apiBaseUrl}/execution/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          session_id: session.session_id,
          gitlab_token: gitlabToken || undefined,
          gitlab_namespace: "darwinagent"
        })
      });
      if (!response.ok) throw new Error("Could not compute deliverables pack.");
      const data: ExecutionPackage = await response.json();
      setPkg(data);
    } catch (err: any) {
      console.error(err);
      setErrorText("Failed to compile outputs. Trigger fallback.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadExecutionPackage();
  }, [session]);

  const decision = session.decision;

  if (!decision) {
    return (
      <div className="text-center font-mono py-12 text-slate-500">
        No decision synthesized for this meeting.
      </div>
    );
  }

  const decColors = {
    PROCEED: "from-emerald-50/70 to-teal-50/40 border-emerald-200 text-emerald-800 shadow-2xs",
    PIVOT: "from-amber-50/70 to-orange-50/40 border-amber-200 text-amber-800 shadow-2xs",
    REJECT: "from-rose-50/70 to-pink-50/40 border-rose-200 text-rose-800 shadow-2xs"
  };

  return (
    <div className="w-full space-y-6">
      
      {/* Top Synthesizer Banner */}
      <div className={`p-6 rounded-2xl border bg-gradient-to-r ${decColors[decision.decision]} space-y-2`}>
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-mono tracking-widest uppercase opacity-85">EXECUTIVE BOARD VERDICT RESOLVED:</span>
          <span className="text-xs font-mono font-bold bg-white px-3 py-1 rounded-full border border-slate-200 text-slate-800 shadow-2xs">
            FIT: {decision.overall_score}%
          </span>
        </div>
        <h1 className="text-4xl font-display font-black tracking-tight uppercase">
          {decision.decision}
        </h1>
        <p className="text-sm font-sans text-slate-700 leading-relaxed font-semibold">
          {decision.decision === "PIVOT" ? decision.recommended_idea : decision.original_idea}
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap border-b border-slate-200 font-display text-sm tracking-wide overflow-x-auto gap-1">
        <button
          onClick={() => setActiveTab("decision")}
          className={`flex items-center space-x-2 px-5 py-3.5 border-b-2 transition-all cursor-pointer ${
            activeTab === "decision" ? "border-blue-600 text-blue-600 font-bold bg-blue-50/20" : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50/50"
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Startup Decision</span>
        </button>
        <button
          onClick={() => setActiveTab("prd")}
          className={`flex items-center space-x-2 px-5 py-3.5 border-b-2 transition-all cursor-pointer ${
            activeTab === "prd" ? "border-blue-600 text-blue-600 font-bold bg-blue-50/20" : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50/50"
          }`}
        >
          <ListTodo className="w-4 h-4" />
          <span>PRD Scope</span>
        </button>
        <button
          onClick={() => setActiveTab("financials")}
          className={`flex items-center space-x-2 px-5 py-3.5 border-b-2 transition-all cursor-pointer ${
            activeTab === "financials" ? "border-blue-600 text-blue-600 font-bold bg-blue-50/20" : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50/50"
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Financial Runway</span>
        </button>
        <button
          onClick={() => setActiveTab("pitch")}
          className={`flex items-center space-x-2 px-5 py-3.5 border-b-2 transition-all cursor-pointer ${
            activeTab === "pitch" ? "border-blue-600 text-blue-600 font-bold bg-blue-50/20" : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50/50"
          }`}
        >
          <Presentation className="w-4 h-4" />
          <span>7-Slide Outline</span>
        </button>
        <button
          onClick={() => setActiveTab("gitlab")}
          className={`flex items-center space-x-2 px-5 py-3.5 border-b-2 transition-all cursor-pointer ${
            activeTab === "gitlab" ? "border-blue-600 text-blue-600 font-bold bg-blue-50/20" : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50/50"
          }`}
        >
          <GitBranch className="w-4 h-4" />
          <span>GitLab Projects</span>
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-3 font-mono">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-blue-600 animate-spin" />
          </div>
          <span className="text-xs text-slate-500">Compiling deliverable packages...</span>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* TAB 1: Startup Decision Overview */}
          {activeTab === "decision" && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Main Info Stats */}
              <div className="md:col-span-8 space-y-6">
                <GlowCard accent="cyan" className="space-y-4">
                  <h3 className="text-lg font-display text-slate-800 flex items-center space-x-2">
                    <Target className="w-5 h-5 text-blue-600" />
                    <span>Prudent Strategic Alignment Analysis</span>
                  </h3>
                  <p className="text-slate-650 text-sm leading-relaxed font-sans">
                    {decision.pivot_reasoning || "The original agri-logistics startup meets all hard runway capital and timeline limits. Initial deployment will focus strictly on agile SMS tracking gateways and client web controls directly bypassing DevOps drag."}
                  </p>
                  
                  <div className="border-t border-slate-150 pt-4">
                    <span className="text-[10px] font-mono text-slate-400 uppercase block tracking-wider">BOARD CONGENIAL KEY INSIGHT:</span>
                    <blockquote className="text-blue-700 font-display italic font-semibold mt-1 text-sm bg-blue-50/45 p-3 rounded-xl border border-blue-105">
                      &quot;{decision.key_insight}&quot;
                    </blockquote>
                  </div>
                </GlowCard>

                {/* Score meters */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white border border-slate-200 rounded-xl p-5 text-center space-y-1 card-shadow">
                    <span className="text-[9px] font-mono text-slate-400 uppercase block font-semibold">FIT INDEX</span>
                    <span className="text-2xl font-mono font-black text-emerald-600">{decision.founder_fit_score}%</span>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-5 text-center space-y-1 card-shadow">
                    <span className="text-[9px] font-mono text-slate-400 uppercase block font-semibold">CAPITAL VIABILITY</span>
                    <span className="text-2xl font-mono font-black text-blue-600">{decision.viability_score}%</span>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-xl p-5 text-center space-y-1 card-shadow">
                    <span className="text-[9px] font-mono text-slate-400 uppercase block font-semibold">DECISION CONFIDENCE</span>
                    <span className="text-2xl font-mono font-black text-amber-600">{decision.confidence}%</span>
                  </div>
                </div>
              </div>

              {/* Side: Detailed Board votes table */}
              <div className="md:col-span-4 space-y-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 font-mono card-shadow">
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">Board Voting Ledger</span>
                  <div className="divide-y divide-slate-100">
                    {decision.votes.map((v, idx) => (
                      <div key={idx} className="py-3 flex flex-col space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-700">{v.agent} AGENT</span>
                          <span className={`text-[9px] px-2 py-0.5 rounded-lg font-extrabold ${
                            v.vote === "PROCEED" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}>
                            {v.vote}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 leading-relaxed italic">{v.vote_reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: PRD Scope Table */}
          {activeTab === "prd" && pkg && (
            <div className="space-y-6">
              <GlowCard accent="purple" className="space-y-4">
                <div className="flex justify-between items-start border-b border-slate-200 pb-3">
                  <div>
                    <h3 className="text-lg font-display text-slate-800">Core Product Requirements (PRD)</h3>
                    <p className="text-xs text-slate-400 mt-1 uppercase font-semibold">PRODUCT WORKTITLE: <span className="text-blue-600 font-bold uppercase">{pkg.prd.product_name}</span></p>
                  </div>
                  <span className="text-xs font-mono bg-slate-50 border border-slate-200 px-3 py-1 rounded-lg text-amber-600 font-bold shadow-2xs">
                    BUILD TIMELINE: {pkg.prd.build_weeks} WEEKS
                  </span>
                </div>

                <div className="space-y-3 text-sm text-slate-650 font-medium">
                  <p><strong>PROBLEM STATEMENT:</strong> {pkg.prd.problem_statement}</p>
                  <p><strong>TARGET DEMOGRAPHIC:</strong> {pkg.prd.target_customer}</p>
                </div>
              </GlowCard>

              {/* Feature Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 font-mono card-shadow">
                  <span className="text-xs font-bold text-emerald-700 flex items-center space-x-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Included MVP Features (Solo Builder Scope)</span>
                  </span>
                  
                  <div className="space-y-3">
                    {pkg.prd.mvp_features.map((f, idx) => (
                      <div key={idx} className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                        <span className="text-xs font-bold text-slate-800 block">{f.name}</span>
                        <p className="text-[10px] text-slate-500 mt-1 leading-normal font-sans font-medium">{f.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 font-mono card-shadow">
                  <span className="text-xs font-bold text-rose-700 flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Vetoed & Excluded Features (CAPEX / Tech Barriers)</span>
                  </span>
                  
                  <div className="space-y-3">
                    {pkg.prd.explicitly_excluded.map((f, idx) => (
                      <div key={idx} className="bg-slate-50 border border-slate-200 p-3 rounded-xl opacity-90">
                        <span className="text-xs font-bold text-slate-800 line-through block">{f.name}</span>
                        <p className="text-[10px] text-slate-500 mt-1 leading-normal font-sans font-medium">{f.description}</p>
                        <span className="text-[9px] text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-md mt-2 inline-block font-bold">
                          REASON: {f.exclusion_reason}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Exclusion Note */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] text-slate-500">
                <p><strong>EXCLUSION SCOPE PHILOSOPHY:</strong> {pkg.prd.exclusion_note}</p>
              </div>

            </div>
          )}

          {/* TAB 3: Financial model and runway projections */}
          {activeTab === "financials" && pkg && (
            <div className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 rounded-xl p-4 text-center font-mono card-shadow">
                  <span className="text-[9px] text-slate-400 uppercase block mb-1 font-bold">MAPPED CAC</span>
                  <span className="text-xl font-bold text-rose-600">₹{pkg.financial_model.cac_inr}</span>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4 text-center font-mono card-shadow">
                  <span className="text-[9px] text-slate-400 uppercase block mb-1 font-bold">PROJECTED CO-OP LTV</span>
                  <span className="text-xl font-bold text-emerald-600">₹{pkg.financial_model.ltv_inr}</span>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4 text-center font-mono card-shadow">
                  <span className="text-[9px] text-slate-400 uppercase block mb-1 font-bold">LTV : CAC RATIO</span>
                  <span className="text-xl font-bold text-blue-600">{pkg.financial_model.ltv_cac_ratio}x</span>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4 text-center font-mono card-shadow">
                  <span className="text-[9px] text-slate-400 uppercase block mb-1 font-bold">RUNWAY STATUS</span>
                  <span className="text-sm font-extrabold text-emerald-700 tracking-wide uppercase bg-emerald-50 border border-emerald-250 px-2.5 py-0.5 rounded-lg inline-block">
                    {pkg.financial_model.verdict}
                  </span>
                </div>
              </div>

              {/* Projections Table */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden font-mono card-shadow">
                <div className="p-4 border-b border-slate-200 bg-slate-50">
                  <span className="text-xs font-bold text-slate-800">6-Month Cash Burn & MRR Forecast</span>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left divide-y divide-slate-100">
                    <thead className="bg-slate-50 text-slate-500 uppercase">
                      <tr>
                        <th className="p-4">MONTH</th>
                        <th className="p-4">MONTHLY BURN</th>
                        <th className="p-4">MONTHLY MRR</th>
                        <th className="p-4">CUMULATIVE OUTLAY</th>
                        <th className="p-4">STRATEGIC MILESTONE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {pkg.financial_model.monthly_projections.map((p, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/55">
                          <td className="p-4 font-bold text-blue-600">Month {p.month}</td>
                          <td className="p-4 text-rose-650 font-semibold">₹{p.burn_inr.toLocaleString()}</td>
                          <td className="p-4 text-emerald-600 font-semibold">₹{p.mrr_inr.toLocaleString()}</td>
                          <td className="p-4 text-slate-500">₹{p.cumulative_spend_inr.toLocaleString()}</td>
                          <td className="p-4 italic text-slate-500 font-sans">{p.milestone}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recover Indicators */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex justify-between items-center card-shadow">
                  <span className="text-slate-500 font-bold">PROJECTED BREAK-EVEN MONTH:</span>
                  <span className="text-blue-600 font-bold">Month {pkg.financial_model.break_even_month}</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex justify-between items-center card-shadow">
                  <span className="text-slate-500 font-bold">FULL CAPITAL RECOVERY COMPLETED:</span>
                  <span className="text-emerald-600 font-bold">Month {pkg.financial_model.capital_recovered_month}</span>
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: 7-Slide outline cards */}
          {activeTab === "pitch" && pkg && (
            <div className="space-y-6">
              
              <div className="border-b border-slate-200 pb-3 flex justify-between items-end">
                <div>
                  <h3 className="text-lg font-display text-slate-800">7-Slide Pitch Deck Framework</h3>
                  <p className="text-xs text-slate-400 mt-1 font-semibold">COOPERATIVE DISTRIBUTION FOCUS</p>
                </div>
                <span className="text-xs font-mono text-indigo-750 bg-indigo-50 border border-indigo-200 p-1.5 rounded-lg">
                  EDGE: {pkg.pitch_deck.key_differentiator}
                </span>
              </div>

              {/* Slides map */}
              <div className="space-y-4 font-mono">
                {pkg.pitch_deck.slides.map((s, idx) => (
                  <div key={idx} className="bg-white border border-slate-200 rounded-xl p-5 grid grid-cols-1 md:grid-cols-12 gap-5 card-shadow">
                    <div className="md:col-span-1 text-center border-r border-slate-100 pb-2 md:pb-0 flex flex-col justify-center">
                      <span className="text-slate-400 font-bold uppercase text-[9px] block">Slide</span>
                      <span className="text-2xl font-bold font-display text-blue-600">{s.slide_number}</span>
                    </div>
                    
                    <div className="md:col-span-7 space-y-1">
                      <span className="text-slate-800 font-bold text-xs">{s.title}</span>
                      <p className="text-[11px] text-slate-650 leading-relaxed font-sans font-medium">{s.content}</p>
                    </div>

                    <div className="md:col-span-4 bg-indigo-50/50 border border-indigo-150 p-4 rounded-lg text-indigo-850 text-[10px] m-auto w-full leading-normal">
                      <strong className="block mb-1 uppercase tracking-wider text-[9px] text-indigo-900 font-bold">Founder Variant Strategy:</strong>
                      <span className="italic font-medium">{s.founder_specific_note}</span>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* TAB 5: GitLab and Tech Architecture */}
          {activeTab === "gitlab" && pkg && (
            <div className="space-y-6">
              
              {/* Tech stack mapping */}
              <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 font-mono card-shadow">
                <span className="text-xs font-bold text-blue-600 block uppercase">CO-LOGIC STACK SELECTION</span>
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center">
                  <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                    <span className="text-[8px] text-slate-400 block mb-1 font-bold">FRONTEND</span>
                    <span className="text-[11px] font-bold text-slate-800 block truncate">{pkg.tech_architecture.frontend}</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                    <span className="text-[8px] text-slate-400 block mb-1 font-bold">BACKEND</span>
                    <span className="text-[11px] font-bold text-slate-800 block truncate">{pkg.tech_architecture.backend}</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                    <span className="text-[8px] text-slate-400 block mb-1 font-bold">AI ENGINE</span>
                    <span className="text-[11px] font-bold text-slate-800 block truncate">{pkg.tech_architecture.ai_layer}</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                    <span className="text-[8px] text-slate-400 block mb-1 font-bold">DATABASE</span>
                    <span className="text-[11px] font-bold text-slate-800 block truncate">{pkg.tech_architecture.database}</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                    <span className="text-[8px] text-slate-400 block mb-1 font-bold">INFRASTRUCTURE</span>
                    <span className="text-[11px] font-bold text-slate-800 block truncate">{pkg.tech_architecture.infra}</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-650 bg-slate-50 border border-slate-200 p-3 rounded-lg leading-relaxed font-sans font-medium">
                  <p><strong>WHY COMPLEX CLOUD OPS WERE AVOIDED:</strong> {pkg.tech_architecture.avoidance_note}</p>
                </div>
              </div>

              {/* GitLab repository and task boards */}
              {pkg.gitlab_output && (
                <div className="space-y-6">
                  
                  {/* Repo status card */}
                  <GlowCard accent="cyan" className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1 font-mono">
                      <span className="inline-flex items-center space-x-1 py-0.5 px-2 bg-emerald-50 text-emerald-700 border border-emerald-250 text-[9px] font-bold rounded-lg uppercase">
                        Active Repository Created in darwinagent Environment
                      </span>
                      <h4 className="text-md font-bold text-slate-800">GitLab Project ID: {pkg.gitlab_output.project_id}</h4>
                      <p className="text-xs text-slate-500">{pkg.gitlab_output.note}</p>
                    </div>

                    <a
                      href={pkg.gitlab_output.project_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1.5 px-4 py-2 bg-white border border-slate-200 text-blue-600 rounded-xl hover:bg-slate-50 hover:border-slate-300 text-xs font-mono font-bold transition-all cursor-pointer shadow-2xs"
                    >
                      <Link2 className="w-4 h-4" />
                      <span>VIEW ON GITLAB</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </GlowCard>

                  {/* Milestones timeline */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 font-mono card-shadow">
                    <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">Created Sprint Milestones Chronology</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {pkg.gitlab_output.milestones_created.map((ms, idx) => (
                        <div key={idx} className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center space-x-3">
                          <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center text-xs font-bold shrink-0">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-slate-700">{ms}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Backlog Sprint tasks list */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 font-mono card-shadow">
                    <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">Synthesized Milestone Issue Backlog</span>
                    
                    <div className="divide-y divide-slate-100">
                      {pkg.gitlab_output.issues_created.map((issue, idx) => {
                        return (
                          <div key={idx} className="py-3 flex flex-col md:flex-row justify-between gap-4">
                            <div className="space-y-1.5">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-xs font-bold text-slate-800">{issue.title}</span>
                                {issue.labels.map((l, lIdx) => (
                                  <span key={lIdx} className="text-[8px] font-bold px-1.5 py-0.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-500">
                                    {l}
                                  </span>
                                ))}
                              </div>
                              <p className="text-[10px] text-slate-500 font-sans leading-normal max-w-xl font-medium">{issue.description}</p>
                            </div>

                            <div className="text-right shrink-0 flex flex-row md:flex-col justify-between items-end gap-1 font-mono text-[9px] text-slate-400 border-t md:border-t-0 border-slate-100 pt-2 md:pt-0">
                              <span className="text-blue-600 font-bold block">{issue.estimated_hours}h sprint target</span>
                              <span className="block truncate max-w-[150px] font-semibold">{issue.epic}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              )}

            </div>
          )}

        </div>
      )}

    </div>
  );
}
