"""
Module: constants.py
Description: All application-wide constants. No magic numbers in source.

Author:  KAIRON / Founder Twin
Created: 2025-06-09
"""

# Debate protocol
DEBATE_ROUNDS = 3
AGENTS = ["CEO", "CFO", "CTO", "CMO", "CPO"]

# Cross-examination pairs (responder → target)
# CFO checks CEO's optimism, CTO checks CMO's growth plans,
# CMO checks CPO's features, CEO checks CFO's conservatism,
# CPO checks CTO's complexity
CROSS_EXAMINATION_PAIRS = [
    ("CFO", "CEO"),
    ("CTO", "CMO"),
    ("CMO", "CPO"),
    ("CEO", "CFO"),
    ("CPO", "CTO"),
]

# Decision scoring weights
SCORE_WEIGHTS = {
    "CEO": 0.25,  # Market
    "CFO": 0.30,  # Viability
    "CTO": 0.20,  # Feasibility
    "CMO": 0.15,  # Distribution
    "CPO": 0.10,  # Customer
}

# Gemini
GEMINI_MODEL = "gemini-2.0-flash"
GEMINI_MAX_RETRIES = 1
GEMINI_RETRY_DELAY = 2.0
GEMINI_MAX_OUTPUT_TOKENS = 8192

# NVIDIA Fallbacks
NVIDIA_MODEL_KIMI = "moonshotai/kimi-k2.6"
NVIDIA_MODEL = "meta/llama-3.1-70b-instruct"
OPENROUTER_MODEL = "google/gemma-2-9b-it:free"
GEMINI_TEMPERATURE = 0.7

# MongoDB collections
TWINS_COLLECTION = "twins"
SESSIONS_COLLECTION = "sessions"
EXECUTIONS_COLLECTION = "executions"

# GitLab
GITLAB_API_BASE = "https://gitlab.com/api/v4"
GITLAB_EPIC_LABEL_COLOR = "#6ee7f7"
