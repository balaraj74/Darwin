<div align="center">

<img src="./frontend/public/darwin-logo.png" alt="Darwin Logo" width="200" />

<br/>

```
██████╗  █████╗ ██████╗ ██╗    ██╗██╗███╗   ██╗
██╔══██╗██╔══██╗██╔══██╗██║    ██║██║████╗  ██║
██║  ██║███████║██████╔╝██║ █╗ ██║██║██╔██╗ ██║
██║  ██║██╔══██║██╔══██╗██║███╗██║██║██║╚██╗██║
██████╔╝██║  ██║██║  ██║╚███╔███╔╝██║██║ ╚████║
╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝ ╚══╝╚══╝ ╚═╝╚═╝  ╚═══╝
```

**The AI Executive Board that builds startups tailored to the founder — not just the idea.**

[![Production](https://img.shields.io/badge/🌐_App-Live_on_Cloud_Run-4285F4?style=for-the-badge)](https://darwin-5dleehg6la-el.a.run.app)
[![API](https://img.shields.io/badge/🔌_API-FastAPI_Docs-009688?style=for-the-badge)](https://darwin-backend-5dleehg6la-el.a.run.app/docs)
[![Video](https://img.shields.io/badge/▶️_Demo-YouTube-FF0000?style=for-the-badge)](https://youtu.be/WiJDv79-Jas)
[![Status](https://img.shields.io/badge/Status-Production-brightgreen?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](./LICENSE)

</div>

---

## What is Darwin?

Darwin is a full-stack AI platform that acts as an **AI-powered executive board** for solo founders and early-stage startups. Instead of giving the same generic advice to every founder, Darwin builds a **Digital Twin** — a living AI model of who you actually are: your skills, capital, network, risk tolerance, quit triggers, and blind spots.

When you bring a startup idea to the Darwin Boardroom, **5 specialized AI agents** (CEO, CFO, CTO, CMO, CPO) hold a structured **3-round debate** about whether that idea is right for *you specifically* — then synthesize a final PROCEED / PIVOT / REJECT verdict, complete with a full execution blueprint.

> **The B2B logistics SaaS idea that sounded brilliant on paper?** Darwin's CFO killed it in seconds because your 20,000 INR budget can't survive a 9-month B2B sales cycle. That's Darwin working correctly.

---

## Table of Contents

- [Live Demo](#-live-demo)
- [Core Capabilities](#-core-capabilities)
- [How It Works](#-how-it-works)
- [The 5 Executive Agents](#-the-5-executive-agents)
- [The Digital Twin](#-the-digital-twin)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [AI Model Chain](#-ai-model-chain)
- [Project Structure](#-project-structure)
- [API Reference](#-api-reference)
- [Local Development](#-local-development)
- [Production Deployment](#-production-deployment)
- [Environment Variables](#-environment-variables)
- [Security & Auth](#-security--auth)
- [Roadmap](#-roadmap)

---

## 🌐 Live Demo

| Service | URL |
|---------|-----|
| **Frontend App** | https://darwin-5dleehg6la-el.a.run.app |
| **Backend API** | https://darwin-backend-5dleehg6la-el.a.run.app |
| **Interactive API Docs** | https://darwin-backend-5dleehg6la-el.a.run.app/docs |
| **Health Check** | https://darwin-backend-5dleehg6la-el.a.run.app/health |
| **Live Demo Video** | https://youtu.be/WiJDv79-Jas |
| **GCP Project** | `darwinagent` — `us-central1` |

---

## 🚀 Core Capabilities

### 1. The Digital Twin Engine
Darwin doesn't treat you as a generic founder. It conducts a **7-question conversational intake** and builds a structured `DigitalTwin` — a living AI model that captures your real constraints:

- **Technical depth**: low / medium / high
- **Execution velocity**: slow / medium / fast  
- **Risk tolerance**: 5-point scale
- **Network strength**: weak / medium / strong
- **Marketing aptitude**: low / medium / high
- **Competitive edge**: one-sentence unfair advantage
- **Blind spots** & **quit triggers**: honest self-assessment
- **Hard constraints**: exact budget (INR), months to first revenue, tech skills, no-go domains

### 2. The Boardroom Debate Engine
A **3-round structured debate** between 5 specialized AI agents:

| Round | Mode | How it runs |
|-------|------|-------------|
| **Round 1 — Initial Positions** | Parallel | All 5 agents give independent opinions simultaneously |
| **Round 2 — Cross-Examination** | Sequential | Each agent responds to a specific counterpart's position |
| **Round 3 — Final Vote** | Parallel | All 5 agents cast final votes after seeing the full debate |

### 3. Hard Constraint Enforcement
The decision synthesizer applies constraints in **strict order** — hard constraints override all soft scores:

1. **CFO Veto**: Capital runway doesn't reach first revenue → **REJECT**
2. **CTO Veto**: Founder lacks required skills with no workaround → **REJECT**
3. **Time Veto**: Time-to-revenue exceeds the founder's hard deadline → **REJECT**
4. **Soft Scores** (only if hard constraints pass): CEO 25% + CFO 30% + CTO 20% + CMO 15% + CPO 10%

### 4. The Execution Blueprint Suite
On PROCEED, Darwin auto-generates a complete startup execution package in parallel:

| Output | Description |
|--------|-------------|
| **PRD** | Product Requirements Document — MVP features, explicitly excluded features, build timeline |
| **Financial Model** | 6-month projections, CAC/LTV/break-even, constrained to actual budget |
| **Pitch Deck** | 7-slide investor narrative with founder-specific unfair advantage |
| **Tech Architecture** | Stack recommendation using only the founder's confirmed skills |
| **GitLab Project** | Real GitLab project created with milestones, epics, and 12–20 actionable issues |

### 5. Profile Enrichment Crawler
A background crawler runs every 6 hours to enrich the Digital Twin with public information:
- GitHub profile (commit activity, top languages, repository quality)
- LinkedIn signals (connection count, endorsements, years of experience)
- Twitter/X (audience size, technical credibility)
- Crawl insights are stored as structured `crawl_insights` on the twin

---

## 🎭 How It Works

```
Founder
  │
  ▼
┌─────────────────────────────────────┐
│  7-Question Conversational Intake   │  ← "What can you build right now?"
│  (Guided by the Onboarding Engine)  │    "What would make you quit?"
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│         Digital Twin Build          │  ← GeminiService extracts structured
│    (core/digital_twin.py)           │    profile from intake answers
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│      Founder submits startup idea   │  ← Free-text idea input
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│     BOARDROOM — 3-Round Debate      │
│                                     │
│  Round 1 ─── Parallel (5 agents)   │
│  Round 2 ─── Sequential (5 pairs)  │
│  Round 3 ─── Parallel (5 agents)   │
│                                     │
│   CEO ─ CFO ─ CTO ─ CMO ─ CPO     │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│     Decision Synthesizer            │  ← Hard constraints → Soft scores
│  (core/decision_synthesizer.py)     │    → PROCEED / PIVOT / REJECT
└──────────────┬──────────────────────┘
               │
         ┌─────┴─────┐
    PROCEED          REJECT / PIVOT
         │                │
         ▼                └─ Explains exactly why, references
┌────────────────┐           founder's specific constraints
│ Execution      │
│ Blueprint      │  ← PRD + Financials + Pitch + Tech Arch
│ (parallel)     │    + Real GitLab project
└────────────────┘
```

---

## 🤖 The 5 Executive Agents

Each agent has a **characteristic bias** and **veto authority** — designed to create genuine tension in the debate:

| Agent | Bias | Veto Triggers | Weight |
|-------|------|---------------|--------|
| **CEO** | Optimistic about markets | No defensible market position; no timing advantage | 25% |
| **CFO** | Conservative on capital | Capital doesn't reach first revenue; burn rate too high | 30% |
| **CTO** | Skeptical of complexity | Founder lacks required skills with no workaround | 20% |
| **CMO** | Bullish on distribution | No realistic GTM within the network/budget | 15% |
| **CPO** | Focused on customer pain | No validated customer pain or validated payment intent | 10% |

### Cross-Examination Pairs (Round 2)
Each agent targets the agent most likely to have the opposite view:

```
CEO   → responds to CFO (optimism vs. financial reality)
CFO   → responds to CEO (financial caution vs. market optimism)
CTO   → responds to CMO (feasibility vs. growth ambition)
CMO   → responds to CTO (distribution vs. technical complexity)
CPO   → responds to CEO (customer empathy vs. market sizing)
```

---

## 🧬 The Digital Twin

The `DigitalTwin` is the central data structure of the entire system. Every agent prompt, every financial projection, and every architecture decision is filtered through it.

```python
class DigitalTwin(BaseModel):
    twin_id: str
    user_id: Optional[str]
    founder_name: Optional[str]
    
    raw_intake: OnboardingIntake      # Raw 7 answers from the founder
    profile: FounderProfile           # Inferred attributes (AI-extracted)
    startup_idea: Optional[str]       # Current idea being evaluated
    
    session_count: int                # Number of board sessions run
    evolution_log: list[str]          # How the twin changed over sessions
    
    # Profile enrichment from public web crawling
    last_crawled_at: Optional[datetime]
    crawl_insights: list[str]
```

**Key insight**: The twin evolves. Every board session updates the twin's `session_count` and `evolution_log`. Over time, Darwin builds an increasingly accurate model of how a founder thinks and executes.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRODUCTION (Google Cloud)                     │
│                                                                  │
│  ┌──────────────────┐        ┌──────────────────────────────┐  │
│  │  Cloud Run       │  HTTP  │  Cloud Run                   │  │
│  │  darwin          │◄──────►│  darwin-backend              │  │
│  │  (Next.js 14)    │        │  (FastAPI / Python 3.12)     │  │
│  │  Port 3000       │        │  Port 8000                   │  │
│  └──────────────────┘        └──────────┬───────────────────┘  │
│                                         │                        │
│                              ┌──────────▼───────────────────┐  │
│                              │      Vertex AI Agent Platform  │  │
│                              │  gemini-3.1-pro-preview        │  │
│                              │  gemini-3-flash-preview        │  │
│                              │  gemini-2.5-flash (fallback)   │  │
│                              └──────────┬───────────────────┘  │
│                                         │                        │
│                         ┌───────────────┼──────────────────┐   │
│                         ▼               ▼                   ▼   │
│                   ┌──────────┐  ┌──────────────┐  ┌──────────┐ │
│                   │Firestore │  │Firebase Auth │  │Cloud     │ │
│                   │(Sessions)│  │(Google OAuth)│  │Storage   │ │
│                   └──────────┘  └──────────────┘  └──────────┘ │
└─────────────────────────────────────────────────────────────────┘

External Fallback Chain:
  Vertex AI → OpenRouter (free tier LLMs) → NVIDIA NIM
```

### Service Account Permissions (darwin-backend-sa)
```
roles/aiplatform.user          → Vertex AI model calls
roles/datastore.user           → Firestore read/write
roles/storage.objectAdmin      → Cloud Storage uploads
roles/firebase.admin           → Firebase Auth token verification
```

---

## ⚡ Tech Stack

### Backend
| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | FastAPI 0.115.5 | Async REST API |
| **Runtime** | Python 3.12 / uvicorn | Production ASGI server |
| **AI Primary** | Vertex AI (google-cloud-aiplatform ≥1.60) | Gemini model calls via ADC |
| **AI Fallback** | OpenRouter + NVIDIA NIM (via openai SDK) | Rate limit fallback chain |
| **JSON Repair** | json-repair 0.30.0 | Fixes truncated/malformed LLM JSON output |
| **Database** | Firestore (firebase-admin ≥6.5) | Session & twin persistence |
| **Auth** | Firebase Admin SDK | Google OAuth token verification |
| **Validation** | Pydantic v2 + pydantic-settings | Type-safe config & request models |
| **Scheduling** | APScheduler 3.10.4 | Background profile crawler |
| **Web Scraping** | httpx + BeautifulSoup4 | Public profile enrichment |
| **Containerization** | Docker (python:3.12-slim) | Cloud Run deployment |

### Frontend
| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | Next.js 14 (App Router) | React SSR / Client Components |
| **Language** | TypeScript 5 | Type-safe frontend |
| **Styling** | Tailwind CSS v3 + custom CSS | Dark glassmorphism design system |
| **Animations** | Framer Motion | Page transitions, card reveals |
| **Auth** | Firebase JS SDK (v10) | Google Sign-In + `onAuthStateChanged` |
| **HTTP Client** | Fetch API | REST calls to backend |
| **Containerization** | Docker (node:20-alpine) | Cloud Run deployment |

---

## 🧠 AI Model Chain

Darwin's `GeminiService` implements a **4-level fallback chain** with automatic rate-limit handling:

```
Level 1 — Vertex AI (Primary)
  ├─ gemini-3.1-pro-preview  ← Deep reasoning (reports, synthesis)
  ├─ gemini-3-flash-preview  ← Fast inference (agent opinions)
  └─ gemini-2.5-flash        ← Stable fallback (always available)

Level 2 — OpenRouter (Fast, if quota exceeded)
  └─ Random from: gemma-2-9b, llama-3.1-8b, mistral-7b,
                  phi-3-mini, qwen-2-7b (all free tier)

Level 3 — NVIDIA NIM
  └─ Random key from NVIDIA_API_KEY / NVIDIA_API_KEY_SECONDARY

Level 4 — OpenRouter (Advanced)
  └─ Random from: llama-3.1-70b, gemma-2-27b, qwen-2-72b,
                  hermes-3-405b, llama-3.1-405b (free tier)
```

**Concurrency control**: `asyncio.Semaphore(3)` — prevents quota exhaustion from parallel agent calls.

**JSON Repair**: All AI responses pass through `json_repair.loads()` — handles truncated strings, trailing commas, and unclosed brackets that raw `json.loads` would reject.

---

## 📁 Project Structure

```
Darwin/
├── backend/                        # FastAPI application
│   ├── agents/                     # 5 executive AI agents
│   │   ├── ceo_agent.py            # Market opportunity (optimistic bias)
│   │   ├── cfo_agent.py            # Financial viability (conservative bias)
│   │   ├── cto_agent.py            # Technical feasibility (skeptical bias)
│   │   ├── cmo_agent.py            # GTM & distribution (bullish bias)
│   │   └── cpo_agent.py            # Customer & product (empathy bias)
│   ├── core/                       # Orchestration engines
│   │   ├── debate_engine.py        # 3-round debate orchestrator
│   │   ├── decision_synthesizer.py # Hard constraints → final verdict
│   │   ├── digital_twin.py         # Twin build from intake answers
│   │   ├── engineering_engine.py   # GitLab engineering breakdown
│   │   └── execution_engine.py     # PRD + Financials + Pitch + Arch
│   ├── config/
│   │   ├── env.py                  # Pydantic settings (all env vars)
│   │   └── constants.py            # Model names, debate pairs, weights
│   ├── models/
│   │   ├── founder.py              # DigitalTwin, FounderProfile, HardConstraints
│   │   ├── board.py                # BoardSession, AgentOpinion, BoardDecision
│   │   └── execution.py            # PRD, FinancialModel, PitchDeck, TechArchitecture
│   ├── routers/
│   │   ├── auth.py                 # POST /auth/verify — Firebase token verification
│   │   ├── onboarding.py           # POST /onboarding/submit — intake answers
│   │   ├── twin.py                 # GET /twin — fetch digital twin
│   │   ├── board.py                # POST /board/session — run debate
│   │   ├── execution.py            # POST /execution/run — generate blueprint
│   │   └── profile.py              # GET/PUT /profile — founder profile CRUD
│   ├── services/
│   │   ├── gemini_service.py       # Vertex AI + OpenRouter + NVIDIA fallback chain
│   │   ├── firestore_service.py    # Firestore CRUD (sessions, twins, profiles)
│   │   ├── crawler_service.py      # Web crawler for profile enrichment
│   │   ├── gitlab_service.py       # Real GitLab project/issue creation
│   │   ├── job_scheduler.py        # APScheduler — background crawls every 6h
│   │   ├── storage_service.py      # Firebase Cloud Storage uploads
│   │   └── mongodb_service.py      # Legacy (kept for reference)
│   ├── utils/
│   │   ├── logger.py               # Structured JSON logging
│   │   └── errors.py               # Typed error hierarchy (AppError → domain errors)
│   ├── main.py                     # FastAPI app — CORS, routers, startup/shutdown
│   ├── requirements.txt            # Pinned dependencies
│   └── Dockerfile                  # python:3.12-slim production image
│
├── frontend/                       # Next.js application
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx            # Landing page (animated, glassmorphism)
│   │   │   ├── auth/page.tsx       # Google Sign-In flow
│   │   │   ├── dashboard/page.tsx  # Main dashboard (Digital Twin display)
│   │   │   ├── onboarding/         # 7-question intake flow
│   │   │   └── results/            # Board session results viewer
│   │   ├── components/             # Reusable UI components
│   │   ├── hooks/                  # Custom React hooks
│   │   ├── lib/                    # Firebase config, API client
│   │   └── types.ts                # Shared TypeScript types
│   ├── public/                     # Static assets
│   ├── next.config.ts              # Next.js config
│   ├── package.json
│   └── Dockerfile                  # node:20-alpine production image
│
├── deploy.sh                       # One-shot Cloud Run deploy script
├── start.sh                        # Local development launcher
├── start-prod.sh                   # Local production simulation
└── firebase.json                   # Firebase project config
```

---

## 📡 API Reference

All endpoints require `Authorization: Bearer <firebase-id-token>` except `/health`.

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/auth/verify` | Verify Firebase ID token, upsert user in Firestore |
| `GET` | `/auth/me` | Get current authenticated user |

### Onboarding
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/onboarding/submit` | Submit 7-question intake → builds DigitalTwin |
| `GET` | `/twin` | Fetch the founder's Digital Twin |

### Boardroom
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/board/session` | Start a new board session (runs full 3-round debate) |
| `GET` | `/board/sessions` | List all past sessions |
| `GET` | `/board/session/{id}` | Get a specific session with all rounds |

### Execution
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/execution/run` | Generate full blueprint from a board decision |
| `GET` | `/execution/{session_id}` | Get execution package for a session |

### Profile
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/profile` | Get founder profile |
| `PUT` | `/profile` | Update profile details |
| `PUT` | `/profile/photo` | Update profile photo URL |

Full interactive documentation: **https://darwin-backend-5dleehg6la-el.a.run.app/docs**

---

## 💻 Local Development

### Prerequisites
- Python 3.12+
- Node.js 20+
- Google Cloud CLI (`gcloud`) authenticated
- Firebase project with Auth enabled

### 1. Clone & Setup

```bash
git clone https://gitlab.com/your-org/darwin.git
cd Darwin
```

### 2. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate   # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy and configure environment
cp .env.example .env
# Edit .env with your values (see Environment Variables section)
```

**Application Default Credentials (for Vertex AI):**
```bash
gcloud auth application-default login
gcloud config set project darwinagent
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy and configure environment
cp .env.example .env.local
# Edit .env.local with your Firebase config
```

### 4. Start Development Servers

```bash
# From project root — starts both backend (port 8000) and frontend (port 3000)
./start.sh
```

Or individually:

```bash
# Backend
cd backend && uvicorn main:app --reload --port 8000

# Frontend (in a new terminal)
cd frontend && npm run dev
```

**Local URLs:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## 🚀 Production Deployment

Darwin deploys to Google Cloud Run via a single script:

```bash
# Ensure gcloud is authenticated
gcloud auth login
gcloud config set project darwinagent

# One-shot deploy (builds Docker images, pushes to Artifact Registry, deploys)
./deploy.sh
```

### What `deploy.sh` does:

1. **Builds** the backend Docker image via Cloud Build (`python:3.12-slim`)
2. **Deploys** `darwin-backend` Cloud Run service with:
   - Service account: `darwin-backend-sa` (Vertex AI + Firestore permissions)
   - Memory: 512Mi, CPU: 1, Max instances: 10
   - Timeout: 300s (allows long-running board debates)
3. **Gets** the backend URL automatically
4. **Builds** the frontend Docker image with the backend URL baked in
5. **Deploys** `darwin` (frontend) Cloud Run service
6. **Updates** CORS allowlist on the backend with the exact frontend URL

### Manual environment variable injection (if needed):

```bash
gcloud run services update darwin-backend \
  --region us-central1 \
  --update-env-vars="GEMINI_API_KEY=...,NVIDIA_API_KEY=...,OPENROUTER_API_KEY=..."
```

---

## 🔐 Environment Variables

### Backend (`.env`)

```bash
# Google Cloud / Vertex AI — uses Application Default Credentials (no API key needed on Cloud Run)
GCP_PROJECT=darwinagent
GCP_LOCATION=us-central1

# Firebase — same GCP project, ADC handles auth on Cloud Run
FIREBASE_PROJECT_ID=darwinagent
FIREBASE_STORAGE_BUCKET=darwinagent.firebasestorage.app

# Legacy Google AI Studio key (optional — Vertex AI takes priority)
GEMINI_API_KEY=AIza...

# OpenRouter fallback API keys (free tier available)
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_API_KEY_SECONDARY=sk-or-v1-...

# NVIDIA NIM fallback API keys
NVIDIA_API_KEY=nvapi-...
NVIDIA_API_KEY_SECONDARY=nvapi-...
NVIDIA_API_KEY_KIMI=nvapi-...   # Kimi-K2 model access

# App config
ENVIRONMENT=development
ALLOWED_ORIGINS_STR=http://localhost:3000,http://localhost:3001
```

### Frontend (`.env.local`)

```bash
# Firebase client config (safe to expose — restricted by Firebase Auth rules)
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=darwinagent.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=darwinagent
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=darwinagent.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=43894313888
NEXT_PUBLIC_FIREBASE_APP_ID=1:438...

# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 🔒 Security & Auth

### Authentication Flow
1. User clicks **Sign in with Google** on the frontend
2. Firebase Auth returns a **Google ID Token**
3. Frontend sends the token as `Authorization: Bearer <token>` on every request
4. Backend calls `firebase_admin.auth().verify_id_token(token)` — verifies with Firebase's public keys
5. User's UID, email, and `photoURL` are extracted from the verified token
6. User is upserted into Firestore — profile photo pulled directly from the Google OAuth claim

### Key Security Properties
- **No password storage** — Google OAuth only
- **No JWT secrets** — Firebase public-key verification only
- **ADC on Cloud Run** — No API keys for Vertex AI in the environment (IAM roles only)
- **CORS allowlist** — Exact frontend URL injected at deploy time, no wildcard
- **Profile photo** — Pulled from Firebase Auth `photoURL` (Google CDN) — no upload/storage needed

---

## 🗺️ Roadmap

| Feature | Status |
|---------|--------|
| 3-round board debate | ✅ Live |
| Digital Twin build from intake | ✅ Live |
| PROCEED / PIVOT / REJECT verdict | ✅ Live |
| Hard constraint enforcement (CFO veto) | ✅ Live |
| Full execution blueprint (PRD, Financials, Pitch, Tech Arch) | ✅ Live |
| GitLab project auto-creation | ✅ Live |
| Google OAuth + profile photo sync | ✅ Live |
| Vertex AI + OpenRouter + NVIDIA fallback chain | ✅ Live |
| JSON repair for truncated LLM outputs | ✅ Live |
| Background profile crawler (GitHub/LinkedIn) | ✅ Live |
| Digital Twin evolution across sessions | 🔄 In Progress |
| Session history viewer | 🔄 In Progress |
| Export report (PDF) | 📋 Planned |
| Idea Marketplace (see what other founders pitched) | 📋 Planned |
| Mobile app (React Native) | 📋 Planned |
| Slack/WhatsApp integration | 📋 Planned |

---

## 🧪 Running Tests

```bash
cd backend

# Single test run
python -m pytest tests/

# Test board debate locally (without Firebase auth)
python test_debate.py

# Test Firestore connectivity
python test_firestore.py

# Test Gemini service directly
python test_genai.py
```

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](./LICENSE) file for details.

The MIT License is an [OSI-approved](https://opensource.org/licenses/MIT) open source license that allows you to freely use, modify, distribute, and sublicense this software, including for commercial purposes, as long as the original copyright notice is included.

---

## 👤 Author

**Balaraj R** — Founder & Builder  
Built with ❤️ and an unhealthy number of Gemini API calls.

---

<div align="center">

*"The best executive board you'll ever have — and it never needs a salary, a flight, or a follow-up email."*

**[Try Darwin Live →](https://darwin-5dleehg6la-el.a.run.app)** | **[Watch the Live Demo →](https://youtu.be/WiJDv79-Jas)**

</div>
