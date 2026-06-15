"""
Module: gemini_service.py
Description: AI model orchestrator with a priority fallback chain.

  Priority chain (highest → lowest):
  1. Aerolink  — Anthropic Claude via capi.aerolink.lat proxy (primary)
  2. Vertex AI — Google Gemini (gemini-3.1-pro → gemini-2.5-flash)
  3. OpenRouter — free-tier community models (fast or advanced)
  4. NVIDIA NIM — NVIDIA-hosted LLaMA / Mistral models

Author:  Balaraj
Created: 2026-06-10
Updated: 2026-06-15 — Aerolink (Claude) added as primary provider
"""

import asyncio
import re
import random
from typing import Optional

import vertexai
from vertexai.generative_models import GenerativeModel, GenerationConfig
from config.env import settings
from config.constants import (
    GEMINI_MAX_OUTPUT_TOKENS,
    GEMINI_TEMPERATURE,
)
from utils.logger import get_logger
from utils.errors import GeminiError

logger = get_logger(__name__)

# ─── Aerolink primary models (Anthropic Claude) ────────────────────────────────
AEROLINK_MODELS = [
    "claude-sonnet-4-5",         # Best quality — primary
    "claude-3-7-sonnet-20250219",  # Strong fallback
    "claude-3-5-sonnet-20241022",  # Stable fallback
]

# ─── Vertex AI Gemini models ───────────────────────────────────────────────────
MODELS = {
    "REPORTS":  "gemini-3.1-pro-preview",
    "TRIAGE":   "gemini-3-flash-preview",
    "LITE":     "gemini-3.1-flash-lite-preview",
    "FALLBACK": "gemini-2.5-flash",
}

# ─── Vertex AI lazy init ───────────────────────────────────────────────────────
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
    Async AI service with an automatic priority fallback chain.

    Call chain:
      Aerolink (Claude) → Vertex AI (Gemini) → OpenRouter → NVIDIA NIM

    On each failure the service logs a warning and tries the next provider.
    """

    # Global semaphore — prevents blasting any single provider
    _semaphore = asyncio.Semaphore(3)

    def __init__(self) -> None:
        _ensure_vertex_init()

    # ──────────────────────────────────────────────────────────────────────────
    # Public API
    # ──────────────────────────────────────────────────────────────────────────

    async def generate(self, prompt: str, use_fast_model: bool = False) -> str:
        """
        Generate a response using the full fallback chain.

        Args:
            prompt: Full prompt string (expected JSON output).
            use_fast_model: Prefer fast/lite models when True.

        Returns:
            Raw string response (expected to be valid JSON).

        Raises:
            GeminiError: If every provider in the chain fails.
        """
        async with self._semaphore:
            # ── 1. Aerolink (Claude) — PRIMARY ─────────────────────────────────
            result = await self._try_aerolink(prompt, fast=use_fast_model)
            if result:
                return result

            # ── 2. Vertex AI (Gemini) ──────────────────────────────────────────
            preferred = MODELS["LITE"] if use_fast_model else MODELS["REPORTS"]
            model_chain = [preferred]
            if preferred != MODELS["FALLBACK"]:
                model_chain.append(MODELS["FALLBACK"])

            last_error = ""
            for model_id in model_chain:
                try:
                    logger.info(f"[VertexAI] Calling {model_id}")
                    model = GenerativeModel(model_id)
                    config = GenerationConfig(
                        temperature=GEMINI_TEMPERATURE,
                        max_output_tokens=GEMINI_MAX_OUTPUT_TOKENS,
                        response_mime_type="application/json",
                    )
                    # Vertex AI SDK is synchronous — run in thread pool
                    response = await asyncio.to_thread(
                        model.generate_content,
                        prompt,
                        generation_config=config,
                    )
                    text = self._strip_markdown_fences(response.text)
                    await asyncio.sleep(1)  # Smooth quota
                    return text

                except Exception as e:
                    last_error = str(e)
                    err_lower = last_error.lower()
                    logger.warning(f"[VertexAI] {model_id} failed", extra={"error": last_error})

                    if any(code in err_lower for code in ["429", "quota", "resource_exhausted", "unavailable", "503"]):
                        await asyncio.sleep(6)

            # ── 3. OpenRouter (fast tier) ──────────────────────────────────────
            logger.warning("[Fallback] Vertex AI exhausted — trying OpenRouter fast")
            if use_fast_model:
                result = await self._try_openrouter(prompt, fast=True)
                if result:
                    return result

            # ── 4. NVIDIA NIM ──────────────────────────────────────────────────
            result = await self._try_nvidia(prompt)
            if result:
                return result

            # ── 5. OpenRouter (advanced tier) ──────────────────────────────────
            result = await self._try_openrouter(prompt, fast=False)
            if result:
                return result

        raise GeminiError(
            "ALL_AI_FAILED",
            f"All AI providers failed (Aerolink + Vertex AI + OpenRouter + NVIDIA). Last error: {last_error}",
        )

    async def generate_json(self, prompt: str, use_fast_model: bool = False, retries: int = 2) -> dict:
        """Generate a response and parse it as JSON with retries."""
        import json_repair
        last_error = None
        for attempt in range(retries + 1):
            raw = await self.generate(prompt, use_fast_model=use_fast_model)
            try:
                parsed = json_repair.loads(raw)
                if not isinstance(parsed, dict):
                    raise ValueError(f"Expected dict, got {type(parsed)}")
                return parsed
            except Exception as e:
                logger.error(
                    f"JSON parse failed (attempt {attempt + 1})",
                    extra={"error": str(e), "raw": raw[:5000]},
                )
                last_error = e

        raise GeminiError(
            "JSON_DECODE_ERROR",
            f"Failed to parse JSON after {retries} retries. Last error: {str(last_error)}",
        )

    # ──────────────────────────────────────────────────────────────────────────
    # Private provider methods
    # ──────────────────────────────────────────────────────────────────────────

    async def _try_aerolink(self, prompt: str, fast: bool = False) -> Optional[str]:
        """
        Call Anthropic Claude via the Aerolink proxy.
        Returns the text response or None on failure.
        """
        api_key = getattr(settings, "aerolink_api_key", None)
        if not api_key:
            logger.debug("[Aerolink] No API key configured — skipping")
            return None

        base_url = getattr(settings, "aerolink_base_url", "https://capi.aerolink.lat/")

        # Use the fastest/cheapest model for lightweight tasks
        if fast:
            model = AEROLINK_MODELS[-1]  # Most stable / fastest
        else:
            model = AEROLINK_MODELS[0]   # Best quality first

        try:
            import anthropic
            client = anthropic.AsyncAnthropic(
                api_key=api_key,
                base_url=base_url,
            )
            message = await client.messages.create(
                model=model,
                max_tokens=GEMINI_MAX_OUTPUT_TOKENS,
                messages=[{"role": "user", "content": prompt}],
            )
            raw = message.content[0].text if message.content else "{}"
            logger.info(f"[Aerolink] Success with {model}")
            return self._strip_markdown_fences(raw.strip())

        except Exception as e:
            err = str(e)
            logger.warning(f"[Aerolink] {model} failed: {err}")

            # Try remaining models in the list before giving up
            for fallback_model in AEROLINK_MODELS[1:]:
                if fallback_model == model:
                    continue
                try:
                    client = anthropic.AsyncAnthropic(api_key=api_key, base_url=base_url)
                    message = await client.messages.create(
                        model=fallback_model,
                        max_tokens=GEMINI_MAX_OUTPUT_TOKENS,
                        messages=[{"role": "user", "content": prompt}],
                    )
                    raw = message.content[0].text if message.content else "{}"
                    logger.info(f"[Aerolink] Success with fallback {fallback_model}")
                    return self._strip_markdown_fences(raw.strip())
                except Exception as fe:
                    logger.warning(f"[Aerolink] {fallback_model} also failed: {fe}")

            return None

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
            client = AsyncOpenAI(
                base_url="https://integrate.api.nvidia.com/v1",
                api_key=key,
            )
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

    # ──────────────────────────────────────────────────────────────────────────
    # Utility
    # ──────────────────────────────────────────────────────────────────────────

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

        if start_obj != -1 and start_arr != -1:
            start = min(start_obj, start_arr)
        else:
            start = max(start_obj, start_arr)

        end = max(end_obj, end_arr)

        if start != -1 and end != -1 and end >= start:
            return text[start : end + 1]

        return text.strip()
