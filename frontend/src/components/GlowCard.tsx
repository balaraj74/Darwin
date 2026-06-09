/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

interface GlowCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  accent?: "cyan" | "purple" | "amber" | "rose" | "slate";
}

export default function GlowCard({ children, className = "", onClick, accent = "slate" }: GlowCardProps) {
  const accentColors = {
    cyan: "border-slate-200 border-l-4 border-l-blue-600 text-slate-800",
    purple: "border-slate-200 border-l-4 border-l-indigo-600 text-slate-800",
    amber: "border-slate-200 border-l-4 border-l-amber-500 text-slate-800",
    rose: "border-slate-200 border-l-4 border-l-rose-500 text-slate-800",
    slate: "border-slate-200 text-slate-800"
  };

  return (
    <div
      onClick={onClick}
      className={`group relative overflow-hidden bg-white border rounded-xl p-6 card-shadow transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${onClick ? "cursor-pointer" : ""} ${accentColors[accent]} ${className}`}
    >
      {/* Absolute Soft Interactive Highlight */}
      <div className="absolute inset-0 bg-linear-to-tr from-slate-50/10 to-slate-100/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      
      <div className="relative z-10 text-slate-800">
        {children}
      </div>
    </div>
  );
}
