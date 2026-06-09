"use client";

import React, { useState } from "react";
import { OnboardingIntake, DigitalTwin } from "../types";
import { ArrowRight, ArrowLeft, ShieldAlert, Sparkles, Database, Check } from "lucide-react";
import GlowCard from "./GlowCard";

interface OnboardingFormProps {
  onComplete: (twin: DigitalTwin) => void;
  apiBaseUrl: string;
}

const QUESTIONS = [
  {
    id: "what_can_you_build",
    question: "What can you build right now, today, without learning anything new?",
    hint: "Be specific — list actual technologies, frameworks, backend designs, or databases.",
    placeholder: "e.g. Next.js frontends, FastAPI backends, Gemini AI wrappers...",
    defaultValue: "React/Next.js, Tailwind CSS, Node.js/FastAPI backends, Gemini AI API integration"
  },
  {
    id: "capital_available",
    question: "How much capital can you deploy in the next 6 months?",
    hint: "Be honest. Include everything — savings, side income, family backing.",
    placeholder: "e.g. ₹50,000 total",
    defaultValue: "₹1,500,000"
  },
  {
    id: "what_makes_you_quit",
    question: "What would make you quit — be honest.",
    hint: "No revenue after X months? Running out of funds? Loneliness?",
    placeholder: "e.g. If I'm still at zero users after 5 months, I'd walk away",
    defaultValue: "No pilot customers or feedback within 4 months, running out of execution budget."
  },
  {
    id: "first_potential_customer",
    question: "Name one person you could call tomorrow who might pay for something you built.",
    hint: "This tests your distribution pathway. A real person or network, not a vague demographic.",
    placeholder: "e.g. My uncle who runs a coaching institute in Mysore",
    defaultValue: "A network of 12 regional agricultural and supply chain coordinators in South India."
  },
  {
    id: "hardest_thing_shipped",
    question: "What's the hardest thing you've ever shipped? How long did it take?",
    hint: "This indicates your execution velocity to the CTO agent.",
    placeholder: "e.g. Built a full healthcare platform in 3 weeks for Imagine Cup",
    defaultValue: "Shipped a real-time IoT cargo tracker with React dashboard in 3 weeks for an agri-conglomerate."
  },
  {
    id: "draining_work",
    question: "What kind of work drains you even when you're good at it?",
    hint: "Reveals your strategic blind spots — things you'll avoid under stress.",
    placeholder: "e.g. Cold calling, writing long-form content, managing spreadsheets",
    defaultValue: "Manual phone sales, chasing cold emails, managing complex hosting/K8s DevOps setups."
  },
  {
    id: "most_likely_failure",
    question: "If this fails in 12 months, what's the most likely reason?",
    hint: "Honest self-awareness is your most powerful tool.",
    placeholder: "e.g. I'll over-engineer the product and never talk to customers",
    defaultValue: "Over-scoping the digital sensor platform instead of creating highly usable mobile SMS/Web alerts."
  },
  {
    id: "startup_idea",
    question: "Finally, what is the startup idea you want to pursue?",
    hint: "Describe your concept clearly. The board will evaluate, refine, or pivot it.",
    placeholder: "e.g. I want to build an AI platform for farmers in Karnataka",
    defaultValue: "Darwin: An intelligent real-time supply chain monitoring platform for agricultural cooperatives in India."
  }
];

export default function OnboardingForm({ onComplete, apiBaseUrl }: OnboardingFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({
    what_can_you_build: "",
    capital_available: "",
    what_makes_you_quit: "",
    first_potential_customer: "",
    hardest_thing_shipped: "",
    draining_work: "",
    most_likely_failure: "",
    startup_idea: ""
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorString, setErrorString] = useState<string | null>(null);

  const applyPreseededDemo = () => {
    const preseeds: Record<string, string> = {};
    QUESTIONS.forEach(q => {
      preseeds[q.id] = q.defaultValue;
    });
    setAnswers(preseeds);
    setCurrentStep(QUESTIONS.length - 1);
  };

  const handleInputChange = (value: string) => {
    const qId = QUESTIONS[currentStep].id;
    setAnswers(prev => ({ ...prev, [qId]: value }));
  };

  const goNext = () => {
    const minLen = QUESTIONS[currentStep].id === "capital_available" ? 2 : 4;
    const currentAns = answers[QUESTIONS[currentStep].id] || "";
    if (currentAns.trim().length < minLen) {
      setErrorString(`Please elaborate a bit more before continuing.`);
      return;
    }
    setErrorString(null);

    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      submitAnswers();
    }
  };

  const goBack = () => {
    setErrorString(null);
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const submitAnswers = async () => {
    setIsLoading(true);
    setErrorString(null);
    try {
      const response = await fetch(`${apiBaseUrl}/onboarding/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answers)
      });
      if (!response.ok) {
        throw new Error("Failed to process your intake profile.");
      }
      const data: DigitalTwin = await response.json();
      onComplete(data);
    } catch (err: any) {
      console.error(err);
      setErrorString(err.message || "Something went wrong creating your Digital Twin. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const currentQ = QUESTIONS[currentStep];
  const progressPercent = Math.min(100, Math.floor(((currentStep + 1) / QUESTIONS.length) * 100));

  return (
    <div className="max-w-2xl mx-auto w-full">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-6 animate-fade-in">
          {/* Animated Loader Orbs */}
          <div className="relative w-24 h-24">
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-blue-600 animate-spin" style={{ animationDuration: "3s" }} />
            <div className="absolute inset-3 rounded-full border border-slate-200 bg-slate-50 animate-pulse" />
            <div className="absolute inset-0 m-auto w-6 h-6 rounded-full bg-blue-600" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-display font-semibold text-slate-900 tracking-tight">Awakening Digital Twin...</h3>
            <p className="text-sm font-mono text-blue-600">Synthesizing questions via Gemini 3.5 AI</p>
          </div>

          <GlowCard className="bg-white border border-slate-200 p-4 max-w-sm card-shadow" accent="slate">
            <p className="text-xs text-slate-500 leading-relaxed text-left font-mono">
              [SYSTEM] Evaluating limits: budget={answers.capital_available} / speed={answers.hardest_thing_shipped?.substring(0, 30)}... Ingesting risk factors...
            </p>
          </GlowCard>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Floating Pre-seed Button for Hackathon Evaluator Delight */}
          {currentStep === 0 && (
            <button
              onClick={applyPreseededDemo}
              className="w-full flex items-center justify-between p-3.5 bg-blue-50/40 border border-blue-200 rounded-xl text-xs hover:bg-blue-50 transition-all cursor-pointer font-mono shadow-xs"
            >
              <span className="flex items-center space-x-2 text-blue-700 font-semibold">
                <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                <span>Pre-load <b>Darwin Agri-Tech</b> Demo Context (Recommended)</span>
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-blue-650" />
            </button>
          )}

          {/* Progress Bar Header */}
          <div className="mb-4">
            <div className="flex justify-between text-xs font-mono text-slate-500 mb-2 font-medium">
              <span>PROGRESS: {progressPercent}%</span>
              <span>Intake Section {currentStep + 1} of {QUESTIONS.length}</span>
            </div>
            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden border border-slate-100">
              <div 
                className="h-full bg-gradient-to-r from-blue-600 to-indigo-650 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="space-y-4">
            <span className="text-[10px] font-mono font-bold tracking-widest text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full inline-block">
              QUESTION {currentStep + 1}
            </span>
            <h2 className="text-2xl font-display font-medium text-slate-900 tracking-tight leading-snug">
              {currentQ.question}
            </h2>
            <p className="text-sm text-slate-500 italic">
              {currentQ.hint}
            </p>

            <div className="mt-4">
              <textarea
                value={answers[currentQ.id] || ""}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder={currentQ.placeholder}
                rows={4}
                className="w-full bg-white border border-slate-200 focus:border-blue-500 rounded-xl p-4 text-slate-800 text-sm placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500/50 transition-all card-shadow"
              />
            </div>

            {errorString && (
              <div className="flex items-center space-x-2 bg-rose-50 border border-rose-200 p-3 rounded-lg text-xs text-rose-700 font-medium">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{errorString}</span>
              </div>
            )}

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={goBack}
                disabled={currentStep === 0}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-mono tracking-wide border transition-all ${
                  currentStep === 0
                    ? "border-slate-105 bg-slate-100/30 text-slate-400 cursor-not-allowed"
                    : "border-slate-200 bg-white text-slate-650 hover:text-slate-900 hover:bg-slate-50 cursor-pointer shadow-xs"
                }`}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>BACK</span>
              </button>

              <button
                onClick={goNext}
                className="flex items-center space-x-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 transition-all text-white font-display font-bold text-xs tracking-wider rounded-xl cursor-pointer hover:shadow-md"
              >
                <span>{currentStep === QUESTIONS.length - 1 ? "AWAKEN DIGITAL TWIN" : "CONTINUE"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
