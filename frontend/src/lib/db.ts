import { GoogleGenAI } from "@google/genai";
import { 
  OnboardingIntake, 
  DigitalTwin, 
  BoardSession, 
  BoardDecision,
  AgentOpinion,
  VoteResult,
  PRD,
  FinancialModel,
  PitchDeck,
  TechArchitecture,
  GitLabOutput,
  ExecutionPackage
} from "../types.js";

// Lazy-initialized Gemini Client (Server-side)
let aiClient: GoogleGenAI | null = null;
export function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY || "";
    if (!key) {
      console.warn("WARNING: GEMINI_API_KEY is not defined. Using mock responses for fallback stability.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// In-Memory Database structure
interface ISessionDatabase {
  twins: Record<string, DigitalTwin>;
  sessions: Record<string, BoardSession>;
  executions: Record<string, ExecutionPackage>;
}

// Seed data
const SEED_TAKE: OnboardingIntake = {
  what_can_you_build: "React/Next.js, Tailwind CSS, Node.js/FastAPI backends, Gemini AI API integration",
  capital_available: "₹1,500,000",
  what_makes_you_quit: "No pilot customers or feedback within 4 months, running out of execution budget.",
  first_potential_customer: "A network of 12 regional agricultural and supply chain coordinators in South India.",
  hardest_thing_shipped: "Shipped a real-time IoT cargo tracker with React dashboard in 3 weeks for an agri-conglomerate.",
  draining_work: "Manual phone sales, chasing cold emails, managing complex hosting/K8s DevOps setups.",
  most_likely_failure: "Over-scoping the digital sensor platform instead of creating highly usable mobile SMS/Web alerts.",
  startup_idea: "Darwin: An intelligent real-time supply chain monitoring platform for agricultural cooperatives in India."
};

const SEED_TWIN: DigitalTwin = {
  twin_id: "darwinagent",
  founder_name: "Darwin Founder",
  raw_intake: SEED_TAKE,
  profile: {
    technical_depth: "high",
    execution_velocity: "fast",
    risk_tolerance: "medium-high",
    network_strength: "strong",
    marketing_aptitude: "medium",
    competitive_edge: "High technical capability coupled with direct network pathway to 12 agriculture group coordinators.",
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
  startup_idea: SEED_TAKE.startup_idea,
  session_count: 1,
  evolution_log: ["Digital twin initialized with Agri-Tech Supply Chain focus."]
};

const SEED_DECISION: BoardDecision = {
  decision: "PROCEED",
  original_idea: SEED_TAKE.startup_idea,
  recommended_idea: "Darwin: Micro-SaaS Supply Chain Monitoring alerts for agricultural supply leaders.",
  pivot_reasoning: "Adjusted to minimize heavy DevOps/IoT node dependencies. Replaced physical sensor stack with SMS/WhatsApp alerts, deploying Next.js and serverless FastAPI. This fits the solo builder profile perfectly.",
  hard_constraint_violations: [],
  votes: [
    { agent: "CEO", vote: "PROCEED", vote_reason: "High latent demand in ag-supply cooperatives, high speed, strong network leverage." },
    { agent: "CFO", vote: "PROCEED", vote_reason: "Initial budget of ₹1.5M is perfectly buffered, keeping development serverless and marketing organic." },
    { agent: "CTO", vote: "PROCEED", vote_reason: "Stack configured directly to React & FastAPI, avoiding K8s/IaaS orchestration hurdles." },
    { agent: "CMO", vote: "PROCEED", vote_reason: "Can directly leverage existing network of 12 core agri-coordinators for organic growth." },
    { agent: "CPO", vote: "PROCEED", vote_reason: "MVP strictly focused on real-time SMS/WhatsApp delivery status, solving immediate crop cargo decay alert pain." }
  ],
  founder_fit_score: 95,
  viability_score: 92,
  overall_score: 93,
  confidence: 90,
  key_insight: "Scale delivery of value through direct network pathways instead of engineering bloated visual systems."
};

const SEED_SESSION: BoardSession = {
  session_id: "darwinagent-session",
  twin_id: "darwinagent",
  status: "decided",
  rounds: [
    {
      opinions: [
        {
          agent: "CEO",
        round: 1,
        reasoning: "Agri supply-chains lose up to 35% of crop value in transit. A simple supply chain alert platform leverages the founder's direct channel to 12 major supply coordinators.",
        score: 9,
        concerns: ["Relies on initial manual onboarding"],
        opportunities: ["High immediate margins", "Zero direct competitors inside cooperative networks"]
      },
      {
        agent: "CFO",
        round: 1,
        reasoning: "With a ₹1,500,000 budget, we must keep cloud costs minimal. No expensive sensor inventory. Keep software development fully serverless.",
        score: 8.5,
        concerns: ["Do not buy early hardware"],
        opportunities: ["Software-only setup preserves 90% runway"]
      },
      {
        agent: "CTO",
        round: 1,
        reasoning: "The founder has deep React, FastAPI, and GenAI skills. Building a system that takes manually updated logistics Excel sheets or WhatsApp pings and alerts team members is fully feasible in 4 weeks.",
        score: 9,
        concerns: ["Avoid building manual GPS hardware"],
        opportunities: ["Use WhatsApp Business API & twilio to bypass physical IoT tracker production"]
      },
      {
        agent: "CMO",
        round: 1,
        reasoning: "Agri coordinators are notoriously hard to reach via cold outbound. Fortunately, the founder knows 12 directly. The GTM strategy should be high-touch premium beta onboarding of these 12 accounts.",
        score: 8.8,
        concerns: ["No budget for broad digital ads"],
        opportunities: ["100% conversion of warm local relationships"]
      },
      {
        agent: "CPO",
        round: 1,
        reasoning: "The single most important feature is cargo decay alert warning. Agricultural items rot due to heat. Simply letting dispatchers report transit status via WhatsApp pings to an automated dispatcher panel solves this.",
        score: 9.3,
        concerns: ["Scope creep in maps rendering"],
        opportunities: ["SMS alerts have a 98% open rate in South Indian agrarian hubs"]
      }
      ]
    },
    {
      opinions: [
        {
          agent: "CFO",
          round: 2,
        reasoning: "We must enforce a strict alert cap. I veto any proposal from the CEO that includes deploying multi-agent sensor boxes. Keep costs focused strictly on software alert delivery.",
        score: 8.8,
        concerns: ["Ensure no hardware investment"],
        opportunities: ["100% cloud model scales risk down to zero"],
        responding_to: "CEO"
      },
      {
        agent: "CTO",
        round: 2,
        reasoning: "Responding to CMO's distribution scaling: WhatsApp Business API is quick to implement but requires verification. We will configure standard React + Twilio, ensuring the onboarding uses WhatsApp templates the founder has experience building.",
        score: 9.1,
        concerns: ["WhatsApp API validation delays"],
        opportunities: ["Twilio SMS as immediate high-reliability fallback"],
        responding_to: "CMO"
      },
      {
        agent: "CMO",
        round: 2,
        reasoning: "Responding to CPO's feature plan: To optimize distribution, our initial MVP won't contain a public routing app. Onboarding will be handled directly in the admin dashboard so that crop directors can generate dynamic delivery links.",
        score: 9.0,
        concerns: ["Onboarding complexity"],
        opportunities: ["Direct phone calls for pilot users"],
        responding_to: "CPO"
      },
      {
        agent: "CEO",
        round: 2,
        reasoning: "Responding to CFO: I agree entirely. Re-routing capital towards software-focused digital twin alerting is highly defensible. We will pivot away from IoT sensor production.",
        score: 9.4,
        concerns: ["Pivoting from hardware IoT to Software Alerting"],
        opportunities: ["Saves over 800,000 INR of capital"],
        responding_to: "CFO"
      },
      {
        agent: "CPO",
        round: 2,
        reasoning: "Responding to CTO: Since physical cargo trackers are bypassed, the active dashboard interface will feature a simple SMS ping confirmation. Clean and lightweight.",
        score: 9.5,
        concerns: ["Dependency on driver cell reception"],
        opportunities: ["Offline cellular fallback works in deep transit corridors"],
        responding_to: "CTO"
      }
      ]
    },
    {
      opinions: [
        {
          agent: "CEO",
          round: 3,
        reasoning: "My final vote is PROCEED with the pivoted 'Darwin alerts SaaS' model. It targets high-value logistics bottlenecks.",
        score: 9.5,
        concerns: [],
        opportunities: ["High pilot velocity"]
      },
      {
        agent: "CFO",
        round: 3,
        reasoning: "With 800,000 INR saved, runway increases from 4 months to over 12 months. My vote is PROCEED.",
        score: 9.3,
        concerns: [],
        opportunities: ["Highly capital-efficient startup structure"]
      },
      {
        agent: "CTO",
        round: 3,
        reasoning: "Can build in 3 weeks using Next.js and FastAPI. FE hosted on Vercel, BE on Cloud Run. My vote is PROCEED.",
        score: 9.4,
        concerns: [],
        opportunities: ["Clean scalable API architecture"]
      },
      {
        agent: "CMO",
        round: 3,
        reasoning: "Immediate network integration guarantees pilot revenue in month 1. My vote is PROCEED.",
        score: 9.2,
        concerns: [],
        opportunities: ["Direct agricultural cooperative pilot contracts"]
      },
      {
        agent: "CPO",
        round: 3,
        reasoning: "Zero feature fluff. The alert engine solves the 1 problem that cargo coordinators lose sleep over. My vote is PROCEED.",
        score: 9.6,
        concerns: [],
        opportunities: ["Extreme user engagement with simple, high-signal alerts"]
      }
      ]
    }
  ],
  decision: SEED_DECISION
};

const SEED_EXECUTION: ExecutionPackage = {
  session_id: "darwinagent-session",
  prd: {
    product_name: "Darwin Supply Chain Alerts",
    problem_statement: "Crop decay and transit delays during long cargo transport between agricultural farms and cooperative hubs in South India.",
    target_customer: "Agricultural logistics and supply coordinators, cargo logistics managers.",
    build_weeks: 3,
    mvp_features: [
      { name: "Live Shipments Table", description: "View list of active cargo routes, arrival status, decay warning indices.", priority: "must_have" },
      { name: "Logistics Coordinator SMS Alerts", description: "Twilio-powered alerts sent directly to agrarian dispatch directors when delay risks are triggered.", priority: "must_have" },
      { name: "WhatsApp Ping Receiver", description: "Minimal ingestion backend mapping driver WhatsApp report status directly onto status panel.", priority: "must_have" },
      { name: "Dynamic Route Map Visual", description: "Lightweight routing paths to evaluate delays.", priority: "should_have" }
    ],
    explicitly_excluded: [
      { name: "Agri-Sensor GPS Hardware Integration", description: "Requires complex circuit board design, physical production, and IoT logistics overhead.", priority: "wont_have", exclusion_reason: "CFO budget veto and CTO timeline veto of hardware development." },
      { name: "Native iOS/Android App", description: "Requires dual-store publication and complex cross-play compile flows.", priority: "wont_have", exclusion_reason: "Exceeds the 4-week solo-builder velocity timeline." }
    ],
    exclusion_note: "Product is explicitly scoped strictly to software Alerts and Web Dashboards, preserving the founder's capital runway and matching their existing web backend stack credentials."
  },
  financial_model: {
    cac_inr: 4500,
    ltv_inr: 85000,
    ltv_cac_ratio: 18.89,
    monthly_projections: [
      { month: 1, burn_inr: 35000, mrr_inr: 45000, cumulative_spend_inr: 35000, milestone: "Onboard first 3 pilots" },
      { month: 2, burn_inr: 40000, mrr_inr: 90000, cumulative_spend_inr: 75000, milestone: "Complete 6 cooperatives" },
      { month: 3, burn_inr: 45000, mrr_inr: 160000, cumulative_spend_inr: 120000, milestone: "Scale alerts to 12 agencies" },
      { month: 4, burn_inr: 50000, mrr_inr: 240000, cumulative_spend_inr: 170000, milestone: "Cross break-even point" },
      { month: 5, burn_inr: 55000, mrr_inr: 350000, cumulative_spend_inr: 225000, milestone: "Self-sustaining organic growth" },
      { month: 6, burn_inr: 60000, mrr_inr: 480000, cumulative_spend_inr: 285000, milestone: "Expand product catalog options" }
    ],
    break_even_month: 2,
    capital_recovered_month: 3,
    verdict: "Viable"
  },
  pitch_deck: {
    slides: [
      { slide_number: 1, title: "Darwin: Agricultural Resilience", content: "Solving supply transit decay through low-overhead digital alerts.", founder_specific_note: "Designed to directly leverage the founder's existing Next.js and agrarian hub credentials." },
      { slide_number: 2, title: "The rotting cargo problem", content: "35% of Indian crop value is lost before reaching central markets due to zero transit communication.", founder_specific_note: "Focuses on South India agrarians where the founder's family/uncle runs high-level networks." },
      { slide_number: 3, title: "The Solution: Digital Twin Alerts", content: "A zero-hardware webhook alerts system built around cooperative logistics SMS alerts.", founder_specific_note: "Vetoed heavy IoT sensor creation, keeping CAPEX to near zero." },
      { slide_number: 4, title: "Instant Customer Validation", content: "Direct pilot channel with 12 agrarian network coordinators. Ready to deploy tomorrow.", founder_specific_note: "Builds directly on the founder's first potential customer intake answers." },
      { slide_number: 5, title: "Unmatched Unit Economics", content: "CAC of ₹4,500; LTV of ₹85,000. Break-even achieved inside Month 2.", founder_specific_note: "Ensures CFO constraints are fully respected." }
    ],
    key_differentiator: "Highly viral ag-cooperative distribution using warm networks and zero hardware overhead."
  },
  tech_architecture: {
    frontend: "Next.js (React 19) + Tailwind CSS",
    backend: "FastAPI with async routing",
    ai_layer: "Google Gemini 2.5 Flash via @google/genai SDK",
    database: "Firebase Firestore for persistent schemas",
    infra: "Google Cloud Run serverless hosting",
    explicitly_avoided: ["Kubernetes", "AWS EKS", "Physical IoT boards", "C++ Embedded libraries"],
    avoidance_note: "Bypassed heavy Kubernetes orchestration and embedded programming to maximize speed of delivery for a solo founder."
  },
  gitlab_output: {
    project_url: "https://gitlab.com/darwinagent/darwin-alerts-saas",
    project_id: 847291,
    milestones_created: ["Milestone 1: Core Webhook alerts panel", "Milestone 2: Twilio SMS alert integration", "Milestone 3: Beta agricultural onboarding"],
    epics_created: ["Epic 1: Dashboard and alert controls", "Epic 2: WhatsApp status gateway listener"],
    issues_created: [
      { title: "Task 1: Set up Next.js app structure and layout", description: "Prepare components structure with dark atmospheric design.", milestone: "Milestone 1: Core Webhook alerts panel", epic: "Epic 1: Dashboard and alert controls", estimated_hours: 8, labels: ["frontend", "scaffolding"] },
      { title: "Task 2: Configure FastAPI Twilio webhooks layer", description: "Secure response endpoints to ingest inbound SMS from drivers.", milestone: "Milestone 1: Core Webhook alerts panel", epic: "Epic 2: WhatsApp status gateway listener", estimated_hours: 12, labels: ["backend", "alerts"] }
    ],
    note: "The project workspace is modularly split to ensure code is robust, avoiding DevOps hurdles or unnecessary sensor calibrations."
  }
};

// Global DB Singleton for Hot Reloading resilience in dev
let globalDB = (global as any)._sessionDB as ISessionDatabase;
if (!globalDB) {
  globalDB = {
    twins: {},
    sessions: {},
    executions: {}
  };
  globalDB.twins[SEED_TWIN.twin_id] = SEED_TWIN;
  globalDB.sessions[SEED_SESSION.session_id] = SEED_SESSION;
  globalDB.executions[SEED_EXECUTION.session_id] = SEED_EXECUTION;
  (global as any)._sessionDB = globalDB;
}

export { globalDB as DB };
