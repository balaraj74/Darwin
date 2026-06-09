<div align="center">

<img src="https://via.placeholder.com/150/000000/FFFFFF?text=Darwin" alt="Darwin Logo" width="120" height="120" style="border-radius: 20px; margin-bottom: 20px;" />

# 🧬 Darwin

**The Digital Twin Platform for Founders.** <br>
*Simulate, stress-test, and execute your startup ideas with a ruthless AI board of directors modeled entirely after you and your constraints.*

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
[![Gemini](https://img.shields.io/badge/Google_Gemini-Pro-4285F4?style=for-the-badge&logo=google)](https://deepmind.google/technologies/gemini/)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python)](https://www.python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)

</div>

---

## 📖 Executive Summary

**Darwin** is an advanced AI engineering platform designed to prevent founders from spending 12 to 24 months building a product that violates their own core constraints. 

Startups often fail not because the idea is inherently bad, but because the idea is a bad fit for the specific founder attempting to execute it. Darwin solves this by mapping the founder's psychology, hard constraints, capital limits, and skill sets into a **Digital Twin**. 

By conducting a dynamic, conversational intake, Darwin constructs a comprehensive, Pydantic-validated representation of you. You can then pitch new startup ideas to your Twin and a simulated Board of Directors, receiving ruthless, constraint-aware feedback before writing a single line of code or spending a single dollar.

---

## 🛑 The Problem Darwin Solves

1. **Founder-Market Fit Delusion:** Founders often pursue markets they do not understand, or business models requiring skills they do not possess.
2. **Capital Misalignment:** Attempting to build an enterprise SaaS product requiring an 18-month sales cycle when the founder only has 6 months of runway.
3. **Echo Chambers:** Surrounding oneself with 'yes men' rather than critical thinkers who will aggressively stress-test the operational viability of an idea.
4. **Execution Paralysis:** Spending months planning instead of executing due to a lack of immediate, high-fidelity feedback.

**Darwin shatters these illusions by reflecting your exact constraints back at you through ruthless AI agents.**

---

## ✨ Core Tenets & Philosophy

> *"Build for the reality of the founder, not the fantasy of the idea."*

| Tenet | Description |
| :--- | :--- |
| **Ruthless Honesty** | The AI board does not exist to make you feel good. It exists to find the fatal flaws in your logic. |
| **Constraint-Driven** | Ideas are evaluated strictly against your runway, technical depth, and domain expertise. |
| **Data Over Delusion** | The intake process forces founders to admit their blind spots, which are permanently mapped to their Digital Twin. |
| **Action-Oriented** | Output is never just advice; it is a tactical execution plan broken down by days and weeks. |

---

## 🛠️ Comprehensive Feature Deep-Dive

### 1. The Conversational Intake Engine
Instead of filling out a sterile, 50-field form, founders are taken through an immersive, cinematic onboarding flow. The system asks 7 strategic questions:
* What can you build yourself?
* What is your realistic capital runway?
* What makes you quit?
* Who is your first customer?
* What is the hardest thing you've ever shipped?
* What work drains you?
* Why will this fail in 12 months?

### 2. Digital Twin Synthesis
The raw text answers from the intake are streamed to Google's Gemini 2.5 Flash model. Darwin utilizes strict JSON schema validation via Pydantic to ensure the LLM returns structured data. The output is a **Digital Twin** containing:
* `technical_depth` (Low / Medium / High)
* `execution_velocity` (Slow / Medium / Fast)
* `risk_tolerance`
* `hard_constraints` (e.g., Budget, Months to Revenue)
* `blind_spots` & `quit_triggers`

### 3. The Board Room Simulation
Once the Digital Twin is created, the founder enters the Dashboard to pitch an idea. The pitch is evaluated by a simulated Executive Board:
* **The Twin:** Represents the founder's exact constraints. Will reject ideas the founder cannot realistically build or fund.
* **The Pragmatist:** Focuses purely on go-to-market, distribution, and unit economics.
* **The Visionary:** Pushes the founder to think bigger, scale faster, and find the 10x differentiator.
* **The Operator:** Breaks down the high-level vision into brutal, day-to-day operational realities.

### 4. Dynamic Dashboard & Analytics
The dashboard provides a heads-up display (HUD) of the founder's profile, a history of past pitches, the execution packages assigned by the Board, and visual metrics charting the Twin's evolution over time.

---

## 🏛️ System Architecture

Darwin follows a strict decoupling between the client UI and the AI orchestration layer, communicating entirely via RESTful JSON APIs and stateless JWT authentication.

### High-Level Architecture Diagram

```mermaid
graph TD
    subgraph Client [Next.js Client Application]
        A[Next.js App Router] -->|State Management| B(Zustand Auth Store)
        A -->|UI Animation| C(Framer Motion)
        A -->|Styling| D(Tailwind & Vanilla CSS Variables)
    end

    subgraph API [FastAPI Backend Service]
        E[FastAPI Router Layer] -->|Auth Middleware| F(JWT / Bcrypt)
        E -->|Business Logic| G(Service Layer)
        G -->|Validation| H(Pydantic V2 Models)
    end

    subgraph External [External Services]
        I[(MongoDB Atlas)] 
        J[Google Cloud / Gemini AI]
    end

    Client <==>|HTTP / REST| API
    G <==>|Motor / PyMongo| I
    G <==>|gRPC / REST| J
```

### Data Flow Example: Onboarding

1. **Client:** User submits 7 conversational answers.
2. **Client:** Sends `POST /onboarding/analyze` with `OnboardingIntake` JSON.
3. **API (Router):** Validates incoming JSON payload.
4. **API (Service):** Formats a highly specific prompt instructing the AI to act as a psychological profiler.
5. **External (Gemini):** Gemini analyzes the text, maps traits, and returns structured JSON conforming to the `FounderProfile` schema.
6. **API (Service):** Merges the `FounderProfile` with the User ID, generates a `twin_id`, and saves to MongoDB.
7. **Client:** Receives `twin_id` and redirects to `/dashboard?twin_id=...`.

---

## ⚙️ Tech Stack Specifications

### Frontend
* **Framework:** Next.js 14+ (App Router paradigm)
* **Language:** TypeScript (`strict: true`)
* **State Management:** Zustand (with persist middleware for localStorage Auth sync)
* **Animation:** Framer Motion (Declarative animations, AnimatePresence for route transitions)
* **Styling:** Custom CSS Custom Properties (`var(--bg)`, `var(--accent)`) allowing for instant, highly-performant theming without heavy CSS-in-JS runtimes.

### Backend
* **Framework:** FastAPI (Asynchronous Python web framework)
* **Language:** Python 3.11+
* **Validation:** Pydantic V2 (Rust-backed strict type coercion)
* **Authentication:** Native `bcrypt` + `python-jose` (JSON Web Tokens)
* **Database Driver:** `motor` / `pymongo` (MongoDB async drivers)
* **AI Engine:** Google GenAI SDK (`@google/genai` equivalent in Python) targeting `gemini-2.5-flash` for high-speed reasoning.

---

## 🚀 Local Development & Setup (Deep Dive)

Follow these instructions meticulously to get the complete stack running on your local machine.

### 1. System Prerequisites
Before you begin, ensure you have the following installed on your host machine:
- **Node.js:** v18.17.0 or higher
- **npm:** v9+ or yarn/pnpm equivalent
- **Python:** v3.10.0 or higher
- **Git:** For cloning the repository

### 2. External Services Setup

#### A. MongoDB Atlas
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register).
2. Create a new `M0 Free` cluster.
3. Under **Database Access**, create a new user (e.g., `darwin_admin`) and save the password.
4. Under **Network Access**, allow access from anywhere (`0.0.0.0/0`) for local development, or whitelist your specific IP.
5. Click **Connect**, select **Drivers**, choose **Python**, and copy the connection string.

#### B. Google Gemini API
1. Go to [Google AI Studio](https://aistudio.google.com/).
2. Create a new project or select an existing one.
3. Generate a new API Key. Keep this strictly confidential.

### 3. Repository Cloning
```bash
git clone https://github.com/your-username/darwin.git
cd darwin
```

### 4. Backend Initialization

The backend is an asynchronous FastAPI server. It handles auth, database writes, and AI orchestration.

```bash
# Navigate to the backend directory
cd backend

# Create an isolated virtual environment
python -m venv venv

# Activate the virtual environment
# On macOS/Linux:
source venv/bin/activate  
# On Windows:
# venv\Scripts\activate

# Install the required Python dependencies
pip install -r requirements.txt
```

#### Configuring Backend Environment Variables
Create a file named `.env` in the `backend/` directory:

```env
# Google Gemini Settings
GEMINI_API_KEY=your_google_gemini_api_key_here

# Database Settings
MONGODB_URI=mongodb+srv://darwin_admin:your_password@your_cluster.mongodb.net/?appName=darwin
DB_NAME=darwin_db

# Authentication Settings
# Generate a secure key via: openssl rand -hex 32
SECRET_KEY=9a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080 # 7 days

# Server Settings
PORT=8000
```

#### Running the Backend Server
```bash
# Run the application with uvicorn in reload mode for development
uvicorn main:app --reload --port 8000
```
*The API will be available at `http://localhost:8000`.*<br>
*The interactive Swagger documentation will be at `http://localhost:8000/docs`.*

### 5. Frontend Initialization

The frontend is a React-based Next.js application.

```bash
# Open a new terminal window
# Navigate to the frontend directory
cd frontend

# Install Node modules
npm install
```

#### Configuring Frontend Environment Variables
Create a file named `.env.local` in the `frontend/` directory:

```env
# Point the frontend to your local FastAPI backend
NEXT_PUBLIC_API_URL=http://localhost:8000
```

#### Running the Frontend Server
```bash
# Start the Next.js development server
npm run dev
```
*The UI will be available at `http://localhost:3000`.*

---

## 🧠 AI Engineering & Prompt Design

Darwin's real magic lies in how it orchestrates Large Language Models. We use strict prompting and Pydantic models to guarantee the LLM returns exactly what the system expects.

### The Chain of Thought Pipeline

When a user submits their onboarding answers, Darwin does not just ask Gemini for a summary. It provides a multi-shot, heavily context-laden prompt.

```python
# snippet from backend/services/gemini_service.py
prompt = f"""
You are an elite, ruthless startup psychologist and venture capital evaluator.
Your goal is to parse the raw answers of a founder and extract their DIGITAL TWIN profile.
You must be brutally honest. If they have no technical skills, mark their technical depth as 'low'.
If they have a small budget, calculate their months to first revenue strictly.

Raw Intake Data:
{intake_json}

Return ONLY valid JSON matching the provided schema.
"""
```

### Pydantic Enforced Schemas

By passing `response_schema=DigitalTwin.model_json_schema()` to the Gemini API, we force the LLM to adhere to our data structures. This prevents hallucinated keys and missing data.

```python
class HardConstraints(BaseModel):
    budget_inr: int = Field(..., description="Total available capital in INR")
    months_to_first_revenue: Optional[int] = Field(default=None)
    team_size: int = Field(default=1)
    technical_skills: list[str] = Field(default_factory=list)
    no_go_domains: list[str] = Field(default_factory=list)

class FounderProfile(BaseModel):
    technical_depth: str = Field(..., description="low | medium | high")
    execution_velocity: str = Field(..., description="slow | medium | fast")
    risk_tolerance: str = Field(..., description="low | medium | high")
    hard_constraints: HardConstraints
    blind_spots: list[str] = Field(default_factory=list)
```

---

## 🗄️ Database Schema & Collections

Darwin uses MongoDB as its primary datastore. Below are the primary collections and their relationships.

### `users` Collection
Stores authentication credentials and account metadata.
- `_id`: ObjectId
- `email`: String (Unique)
- `hashed_password`: String (Bcrypt)
- `created_at`: ISODate

### `twins` Collection
Stores the synthesized Digital Twin profiles. Linked 1-to-1 with a User.
- `_id`: ObjectId
- `twin_id`: String (UUID)
- `user_id`: String (Reference to `users._id`)
- `raw_intake`: Object (The 7 raw answers)
- `profile`: Object (The Gemini-synthesized `FounderProfile`)
- `created_at`: ISODate

### `boards` Collection
Stores the history of Board Room pitches, discussions, and AI personas' feedback. Linked 1-to-Many with a Twin.
- `_id`: ObjectId
- `session_id`: String (UUID)
- `twin_id`: String (Reference to `twins.twin_id`)
- `idea`: String (The startup idea pitched)
- `board_feedback`: Array of Objects (Feedback from Pragmatist, Visionary, Operator)
- `twin_dissent`: String (The specific objections raised by the Digital Twin)
- `timestamp`: ISODate

---

## 📡 API Documentation (Core Endpoints)

FastAPI automatically generates an OpenAPI specification available at `/docs`. Below is a summary of the critical routes.

### Authentication Layer
- **`POST /auth/register`** 
  - **Body:** `{ "email": "founder@startup.com", "password": "supersecret" }`
  - **Action:** Hashes password, creates user, returns user object.
- **`POST /auth/login`**
  - **Body:** `{ "email": "founder@startup.com", "password": "supersecret" }`
  - **Action:** Verifies password, returns `{ "access_token": "eyJ...", "token_type": "bearer", "user_id": "..." }`.

### Onboarding & Twin Layer
- **`POST /onboarding/analyze`** (Requires Bearer Token)
  - **Body:** `OnboardingIntake` JSON object.
  - **Action:** Calls Gemini to synthesize the twin, saves to DB, returns the `DigitalTwin` object.
- **`GET /onboarding/twin`** (Requires Bearer Token)
  - **Action:** Retrieves the authenticated user's current Digital Twin.

### Board Room Layer
- **`POST /board/pitch`** (Requires Bearer Token)
  - **Body:** `{ "idea": "An AI tool for writing READMEs" }`
  - **Action:** Orchestrates the multi-agent simulation. Generates responses from the Twin and the Board personas. Saves the `BoardSession`. Returns the session data.

---

## 🔐 Security & Compliance Architecture

Darwin is built with production-grade security defaults.

1. **Stateless Authentication:** JSON Web Tokens (JWT) are used. The server maintains zero session state.
2. **Cryptographic Hashing:** Passwords are never stored in plaintext. We utilize the industry-standard `bcrypt` algorithm with automatically generated salts.
3. **Route Protection (Backend):** FastAPI `Depends()` injection is used to enforce token validation on all sensitive routes. `get_current_user` extracts and verifies the JWT signature before any handler logic executes.
4. **Route Protection (Frontend):** The Next.js client uses a `useEffect` hook combined with the Zustand `isAuthenticated` state to eagerly redirect unauthenticated users to the `/auth` page.
5. **CORS:** Cross-Origin Resource Sharing is strictly configured in FastAPI to only allow requests from whitelisted frontend origins (e.g., `http://localhost:3000`).

---

## 🎨 Design System & Aesthetics

Darwin shuns heavy, bloated component libraries (like Material UI or Bootstrap) in favor of a bespoke, premium aesthetic powered by **Vanilla CSS Variables** and **Framer Motion**.

### Theming System
The entire color palette is controlled via CSS variables in `globals.css`. This allows for ultra-fast theme swapping and ensures absolute consistency.

```css
:root {
  --bg: #0A0A0A;
  --bg-card: #111111;
  --border: rgba(255, 255, 255, 0.08);
  --text-primary: #FAFAFA;
  --text-secondary: #A1A1AA;
  --accent: #3b82f6;
  --accent-2: #8b5cf6;
  --radius-md: 12px;
}
```

### Motion & Micro-interactions
We use `Framer Motion` to ensure the interface feels alive and responsive.
- **Route Transitions:** `<AnimatePresence>` handles smooth fade-ins and slide-outs when navigating between Onboarding questions.
- **Pulsing Orbs:** Used during AI processing states to communicate that the system is "thinking" without relying on generic loading spinners.
- **Hover States:** Buttons and inputs utilize scale and color transitions to provide immediate tactile feedback.

---

## 🚢 Deployment Guide

Darwin is designed to be easily deployed to modern cloud infrastructure.

### Frontend Deployment (Vercel)
1. Push your code to GitHub.
2. Log in to [Vercel](https://vercel.com/) and click "Add New Project".
3. Import the Darwin repository.
4. Set the Root Directory to `frontend`.
5. Add the Environment Variable `NEXT_PUBLIC_API_URL` pointing to your production backend URL.
6. Click **Deploy**.

### Backend Deployment (Render / Railway)
1. Log in to [Render](https://render.com/) or [Railway](https://railway.app/).
2. Create a new Web Service and link your repository.
3. Set the Root Directory to `backend`.
4. Build Command: `pip install -r requirements.txt`
5. Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Add all Environment Variables (`GEMINI_API_KEY`, `MONGODB_URI`, `SECRET_KEY`, etc.).
7. Deploy.

---

## 🗺️ Future Roadmap

* **V2 (Q3 2026):** **The Execution Engine.** Move beyond advice. Darwin will generate exact Jira tickets, marketing copy, and architecture diagrams based on board approval.
* **V3 (Q4 2026):** **Multi-player Boards.** Invite human mentors to join the AI board simulation. Differentiate AI vs Human feedback in the dashboard.
* **V4 (Q1 2027):** **Continuous Calibration.** Sync Darwin with your GitHub and Stripe accounts. The Digital Twin updates its assessment of your "Execution Velocity" based on actual commit frequency and revenue growth.

---

## 🤝 Contributing Guidelines

We welcome contributions from AI engineers, full-stack developers, and product strategists who resonate with our philosophy of constraint-driven development.

### How to Contribute
1. **Fork the repository** to your own GitHub account.
2. **Create a feature branch:** `git checkout -b feature/AddStripeIntegration`
3. **Commit your changes:** Ensure commit messages are descriptive. `git commit -m 'feat: Add Stripe API endpoints for monetization'`
4. **Push to the branch:** `git push origin feature/AddStripeIntegration`
5. **Open a Pull Request:** Target the `main` branch. Provide a clear description of the problem solved or feature added.

### Code Quality Standards
- Ensure all Python code is formatted with `black`.
- Ensure all TypeScript code passes `eslint` and `prettier` checks.
- Do not introduce breaking changes to the Pydantic schemas without corresponding migration scripts for the MongoDB data.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

<br>

<div align="center">
  <p>Built with ⚡ and ruthless efficiency by the <strong>Darwin Team</strong></p>
</div>
