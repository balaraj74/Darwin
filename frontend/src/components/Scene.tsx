/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Sparkles, Shield, Cpu, MessageSquare, TrendingUp } from "lucide-react";

export default function Scene() {
  return (
    <div className="relative w-full h-[350px] md:h-[450px] flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#0f172a] to-[#1e293b] rounded-2xl border border-slate-800 shadow-2xl">
      {/* Grid Pattern Background */}
      <div 
        className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem]" 
        style={{ maskImage: "radial-gradient(ellipse 60% 50% at 50% 50%, #000 70%, transparent 100%)" }}
      />
      
      {/* Ambient Pulsing Glow Circle */}
      <div className="absolute w-[200px] h-[200px] bg-blue-500/10 rounded-full blur-[80px] pulse-ambient" />
      <div className="absolute w-[250px] h-[250px] bg-indigo-500/5 rounded-full blur-[100px] pulse-ambient" style={{ animationDelay: "2s" }} />

      {/* Orbit 1: Large Counter-Clockwise Ring */}
      <div className="absolute w-[300px] h-[300px] rounded-full border border-slate-700/30 orbit-container-2 flex items-center justify-center">
        {/* Core Outer Node */}
        <div className="absolute -top-3 left-1/2 -ml-3 w-6 h-6 rounded-full bg-[#0f172a] border border-indigo-500/60 flex items-center justify-center shadow-lg">
          <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
        </div>
        <div className="absolute -bottom-3 left-1/2 -ml-3 w-6 h-6 rounded-full bg-[#0f172a] border border-blue-500/60 flex items-center justify-center shadow-lg">
          <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
        </div>
      </div>

      {/* Orbit 2: Medium Clockwise Ring */}
      <div className="absolute w-[220px] h-[220px] rounded-full border border-slate-700/20 orbit-container-1 flex items-center justify-center">
        {/* CTO and CPO nodes */}
        <div className="absolute top-1/2 -left-3 -mt-3 w-6 h-6 rounded-full bg-[#0f172a] border border-sky-450 flex items-center justify-center shadow-lg">
          <Cpu className="w-3.5 h-3.5 text-sky-400" />
        </div>
        <div className="absolute top-1/2 -right-3 -mt-3 w-6 h-6 rounded-full bg-[#0f172a] border border-amber-450 flex items-center justify-center shadow-lg">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        </div>
      </div>

      {/* Central Darwin Digital Twin Orb */}
      <div className="relative w-36 h-36 rounded-full bg-[#0b0f19] border-2 border-blue-500/80 cosmic-orb flex flex-col items-center justify-center p-4">
        {/* INNER METALLIC SHIELD GLOW */}
        <div className="absolute inset-2 rounded-full border border-indigo-500/20 bg-linear-to-b from-[#0f172a] to-[#1e293b]" />
        
        {/* Core Indicator Icon */}
        <div className="relative z-10 flex flex-col items-center">
          <Shield className="w-8 h-8 text-blue-450" />
          <span className="text-[11px] font-display font-bold tracking-widest text-slate-100 mt-2 uppercase">DARWIN</span>
          <span className="text-[9px] font-mono text-slate-400 mt-0.5 tracking-wider uppercase">twin.active</span>
        </div>

        {/* Orbit Node Rings */}
        <div className="absolute inset-0 rounded-full border border-dashed border-blue-500/20 animate-spin" style={{ animationDuration: "12s" }} />
      </div>

      {/* Margins Indicators */}
      <div className="absolute left-6 bottom-6 flex items-center space-x-2 bg-[#0f172a]/90 border border-slate-800 px-3 py-1.5 rounded-lg backdrop-blur-md">
        <span className="w-2 h-2 rounded-full bg-emerald-500" />
        <span className="text-[10px] font-mono text-slate-350">Environment: darwinagent</span>
      </div>

      <div className="absolute right-6 top-6 flex items-center space-x-1.5 bg-[#0f172a]/90 border border-slate-800 px-2.5 py-1.5 rounded-lg backdrop-blur-md">
        <span className="text-[10px] font-mono text-blue-400 font-bold">5 REVOLUTION AGENTS ONLINE</span>
      </div>
    </div>
  );
}
