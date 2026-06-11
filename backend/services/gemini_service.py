"""
Module: gemini_service.py
Description: Async wrapper around Google Vertex AI Gemini APIs.
             Uses Application Default Credentials (ADC) — no API key.
             Falls back to OpenRouter and NVIDIA on quota exhaustion.

Author:  Balaraj
Created: 2026-06-10
Updated: 2026-06-11 — Migrated to Vertex AI Agent Platform

Dependencies: google-cloud-aiplatform (vertexai), config.env
Exports: GeminiService
"""

import asyncio
import json
import re
import random
from typing import Optional

import vertexai
from vertexai.generative_models import GenerativeModel, GenerationConfig, Part
from config.env import settings
from config.constants import (
    GEMINI_MAX_OUTPUT_TOKENS,
    GEMINI_TEMPERATURE,
)
from utils.logger import get_logger
from utils.errors import GeminiError

logger = get_logger(__name__)

# ─── Vertex AI models — Gemini 2.5 on Agent Platform ──────────────────────────
# These run on Vertex AI with IAM auth (ADC) — not the Google AI Studio API key.
MODELS = {
    "REPORTS": "gemini-3.1-pro-preview",
    "TRIAGE":  "gemini-3-flash-preview",
    "LITE":    "gemini-3.1-flash-lite-preview",
    "FALLBACK": "gemini-2.5-flash",
}

# ─── Vertex AI init ────────────────────────────────────────────────────────────
_vertex_initialized = False


def _ensure_vertex_init() -> None:
    global _vertex_initialized
    if not _vertex_initialized:
        vertexai.init(
            project=settings.gcp_project,
            location=settings.gcp_location,
        )
        _vertex_initialized = True
        logger.info(
            "Vertex AI initialized",
            extra={"project": settings.gcp_project, "location": settings.gcp_location},
        )


class GeminiService:
    """
    Async wrapper for Vertex AI Gemini models.

    Uses Application Default Credentials (ADC) — Cloud Run service account
    is granted roles/aiplatform.user, so no API key is needed.

    Falls back automatically to OpenRouter (free tier) and NVIDIA NIM
    if Vertex AI quota is exhausted.
    """

    # Global semaphore — prevents blasting Vertex AI quota
    _semaphore = asyncio.Semaphore(3)

    def __init__(self) -> None:
        _ensure_vertex_init()

    async def generate(self, prompt: str, use_fast_model: bool = False) -> str:
        """
        Generate a response using Vertex AI Gemini, with automatic fallback chain.

        Args:
            prompt: Full prompt string including system context.
            use_fast_model: If True, uses the fast/lite model.

        Returns:
            Raw string response (expected to be valid JSON).

        Raises:
            GeminiError: If all AI models in the chain fail.
        """
        preferred_model = MODELS["LITE"] if use_fast_model else MODELS["REPORTS"]
        model_chain = [preferred_model, MODELS["FALLBACK"]]
        if preferred_model == MODELS["FALLBACK"]:
            model_chain = [MODELS["FALLBACK"]]

        last_error = ""

        async with self._semaphore:
            # ── Vertex AI models ───────────────────────────────────────────────
            for model_id in model_chain:
                try:
                    logger.info(f"[VertexAI] Calling {model_id}")
                    model = GenerativeModel(model_id)
                    config = GenerationConfig(
                        temperature=GEMINI_TEMPERATURE,
                        max_output_tokens=GEMINI_MAX_OUTPUT_TOKENS,
                        response_mime_type="application/json",
                    )
                    # Vertex AI SDK is synchronous — run in thread pool to avoid blocking
                    response = await asyncio.to_thread(
                        model.generate_content,
                        prompt,
                        generation_config=config,
                    )
                    text = response.text
                    text = self._strip_markdown_fences(text)
                    await asyncio.sleep(1)  # Smooth quota
                    return text

                except Exception as e:
                    last_error = str(e)
                    err_lower = last_error.lower()
                    logger.warning(
                        f"[VertexAI] {model_id} failed",
                        extra={"error": last_error},
                    )

                    if any(code in err_lower for code in ["429", "quota", "resource_exhausted", "unavailable", "503"]):
                        delay = 6
                        logger.info(f"[VertexAI] Rate limited — waiting {delay}s before fallback")
                        await asyncio.sleep(delay)
                    # Always fall through to next model / fallback

            # ── OpenRouter fast fallback ───────────────────────────────────────
            logger.warning("[Fallback] All Vertex AI models exhausted — trying OpenRouter")

            if use_fast_model:
                result = await self._try_openrouter(prompt, fast=True)
                if result:
                    return result

            # ── NVIDIA NIM fallback ────────────────────────────────────────────
            result = await self._try_nvidia(prompt)
            if result:
                return result

            # ── OpenRouter advanced fallback ───────────────────────────────────
            result = await self._try_openrouter(prompt, fast=False)
            if result:
                return result

        raise GeminiError(
            "ALL_AI_FAILED",
            f"All AI models failed (Vertex AI + OpenRouter + NVIDIA). Last error: {last_error}",
        )

    async def _try_openrouter(self, prompt: str, fast: bool = False) -> Optional[str]:
        """Try OpenRouter as a fallback. Returns text or None on failure."""
        keys = []
        if getattr(settings, "openrouter_api_key", None):
            keys.append(settings.openrouter_api_key)
        if getattr(settings, "openrouter_api_key_secondary", None):
            keys.append(settings.openrouter_api_key_secondary)

        if not keys:
            return None

        fast_models = [
            "google/gemma-2-9b-it:free",
            "meta-llama/llama-3.1-8b-instruct:free",
            "mistralai/mistral-7b-instruct:free",
            "microsoft/phi-3-mini-128k-instruct:free",
            "qwen/qwen-2-7b-instruct:free",
        ]
        advanced_models = [
            "meta-llama/llama-3.1-70b-instruct:free",
            "google/gemma-2-27b-it:free",
            "qwen/qwen-2-72b-instruct:free",
            "nousresearch/hermes-3-llama-3.1-405b",
            "meta-llama/llama-3.1-405b-instruct:free",
        ]
        candidates = fast_models if fast else advanced_models
        model_id = random.choice(candidates)
        key = random.choice(keys)

        try:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(base_url="https://openrouter.ai/api/v1", api_key=key)
            completion = await client.chat.completions.create(
                model=model_id,
                messages=[{"role": "user", "content": prompt}],
                temperature=GEMINI_TEMPERATURE,
                max_tokens=GEMINI_MAX_OUTPUT_TOKENS,
            )
            raw = completion.choices[0].message.content or "{}"
            logger.info(f"[OpenRouter] Success with {model_id}")
            return self._strip_markdown_fences(raw.strip())
        except Exception as e:
            logger.warning(f"[OpenRouter] {model_id} failed: {e}")
            return None

    async def _try_nvidia(self, prompt: str) -> Optional[str]:
        """Try NVIDIA NIM as a fallback. Returns text or None on failure."""
        keys = []
        if getattr(settings, "nvidia_api_key", None):
            keys.append(settings.nvidia_api_key)
        if getattr(settings, "nvidia_api_key_secondary", None):
            keys.append(settings.nvidia_api_key_secondary)

        if not keys:
            return None

        key = random.choice(keys)
        try:
            from config.constants import NVIDIA_MODEL
            from openai import AsyncOpenAI
            client = AsyncOpenAI(base_url="https://integrate.api.nvidia.com/v1", api_key=key)
            completion = await client.chat.completions.create(
                model=NVIDIA_MODEL,
                messages=[{"role": "user", "content": prompt}],
                temperature=GEMINI_TEMPERATURE,
                max_tokens=GEMINI_MAX_OUTPUT_TOKENS,
            )
            raw = completion.choices[0].message.content or "{}"
            logger.info(f"[NVIDIA] Success with {NVIDIA_MODEL}")
            return self._strip_markdown_fences(raw.strip())
        except Exception as e:
            logger.warning(f"[NVIDIA] Failed: {e}")
            return None

    def _strip_markdown_fences(self, text: str) -> str:
        """Remove accidental markdown code fences from model output."""
        if not text:
            return ""
        text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.MULTILINE)
        text = re.sub(r"\s*```$", "", text, flags=re.MULTILINE)

        start_obj = text.find("{")
        start_arr = text.find("[")
        end_obj = text.rfind("}")
        end_arr = text.rfind("]")

        start = -1
        if start_obj != -1 and start_arr != -1:
            start = min(start_obj, start_arr)
        else:
            start = max(start_obj, start_arr)

        end = max(end_obj, end_arr)

        if start != -1 and end != -1 and end >= start:
            return text[start : end + 1]

        return text.strip()

    async def generate_json(self, prompt: str, use_fast_model: bool = False, retries: int = 2) -> dict:
        """Generate a response and parse it as JSON with retries."""
        import json_repair
        last_error = None
        for attempt in range(retries + 1):
            raw = await self.generate(prompt, use_fast_model=use_fast_model)
            try:
                # Add closing bracket if the JSON is unterminated (common issue with some models)
                # json_repair will handle trailing commas, missing quotes, and unclosed brackets
                parsed = json_repair.loads(raw)
                if not isinstance(parsed, dict):
                    # If it parses but it's not a dict, wrap it or raise
                    raise ValueError(f"Expected dict, got {type(parsed)}")
                return parsed
            except Exception as e:
                logger.error(f"JSON parse failed (attempt {attempt+1})", extra={"error": str(e), "raw": raw[:5000]})
                last_error = e
                
        raise GeminiError("JSON_DECODE_ERROR", f"Failed to parse JSON after {retries} retries. Last error: {str(last_error)}")
