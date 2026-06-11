"""
Module: gemini_service.py
Description: Async wrapper around Google Gemini 2.0 Flash API.
             Handles retries, rate limiting, and JSON extraction.

Author:  Balaraj
Created: 2025-06-09

Dependencies: google-generativeai, config.env
Exports: GeminiService
"""

import asyncio
import json
import re
import google.generativeai as genai
from config.env import settings
from config.constants import (
    GEMINI_MODEL,
    GEMINI_MAX_RETRIES,
    GEMINI_RETRY_DELAY,
    GEMINI_MAX_OUTPUT_TOKENS,
    GEMINI_TEMPERATURE,
    NVIDIA_MODEL_KIMI,
    NVIDIA_MODEL,
)
from utils.logger import get_logger
from utils.errors import GeminiError

logger = get_logger(__name__)


class GeminiService:
    """
    Async wrapper for Google Gemini 2.0 Flash.

    Configured with JSON mode enforcement and retry logic.
    All prompts should instruct the model to return ONLY valid JSON.
    """

    def __init__(self) -> None:
        genai.configure(api_key=settings.gemini_api_key)
        self._model = genai.GenerativeModel(
            model_name=GEMINI_MODEL,
            generation_config=genai.GenerationConfig(
                temperature=GEMINI_TEMPERATURE,
                max_output_tokens=GEMINI_MAX_OUTPUT_TOKENS,
                response_mime_type="application/json",
            ),
        )

    async def generate(self, prompt: str, use_fast_model: bool = False) -> str:
        """
        Generate a response using GPT-oss-120b (NVIDIA API) or Gemma-4-31b (OpenRouter).

        Args:
            prompt: Full prompt string including system context.
            use_fast_model: If True, uses the fast OpenRouter model.

        Returns:
            Raw string response (expected to be valid JSON).

        Raises:
            GeminiError: If the API fails.
        """
        if use_fast_model:
            import random
            models_and_keys = []
            if getattr(settings, 'openrouter_api_key', None):
                models_and_keys.append(("google/gemma-4-31b-it:free", settings.openrouter_api_key))
            if getattr(settings, 'openrouter_api_key_secondary', None):
                models_and_keys.append(("nvidia/nemotron-3-super-120b-a12b:free", settings.openrouter_api_key_secondary))
                
            if models_and_keys:
                selected_model, selected_key = random.choice(models_and_keys)
                logger.info("Using OpenRouter API (Fast Model)", extra={"model": selected_model})
                try:
                    from openai import AsyncOpenAI
                    client = AsyncOpenAI(
                        base_url="https://openrouter.ai/api/v1",
                        api_key=selected_key
                    )
                    completion = await client.chat.completions.create(
                        model=selected_model,
                        messages=[{"role": "user", "content": prompt}],
                        temperature=GEMINI_TEMPERATURE,
                        max_tokens=GEMINI_MAX_OUTPUT_TOKENS,
                    )
                    text = completion.choices[0].message.content.strip()
                    text = self._strip_markdown_fences(text)
                    logger.info("OpenRouter response received", extra={"length": len(text)})
                    return text
                except Exception as e:
                    logger.error("OpenRouter API failed", extra={"error": str(e)})
                    raise GeminiError("FAST_MODEL_FAILED", f"OpenRouter failed: {str(e)}")

        gpt_error = ""
        import random
        keys = []
        if getattr(settings, 'nvidia_api_key', None):
            keys.append(settings.nvidia_api_key)
        if getattr(settings, 'nvidia_api_key_secondary', None):
            keys.append(settings.nvidia_api_key_secondary)
            
        if not keys:
            raise GeminiError("NO_KEYS", "No NVIDIA API keys configured.")
            
        selected_key = random.choice(keys)
        logger.info("Using GPT API", extra={"model": NVIDIA_MODEL, "key_pool_size": len(keys)})
        
        try:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(
                base_url="https://integrate.api.nvidia.com/v1",
                api_key=selected_key
            )
            completion = await client.chat.completions.create(
                model=NVIDIA_MODEL,
                messages=[{"role": "user", "content": prompt}],
                temperature=GEMINI_TEMPERATURE,
                max_tokens=GEMINI_MAX_OUTPUT_TOKENS,
            )
            text = completion.choices[0].message.content.strip()
            text = self._strip_markdown_fences(text)
            logger.info("GPT response received", extra={"length": len(text)})
            return text
        except Exception as e:
            gpt_error = str(e)
            logger.error("GPT API failed", extra={"error": str(e)})

        raise GeminiError(
            "ALL_AI_FAILED",
            f"GPT failed: {gpt_error}",
        )

    def _strip_markdown_fences(self, text: str) -> str:
        """Remove accidental markdown code fences from Gemini output."""
        # Remove ```json ... ``` or ``` ... ```
        text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.MULTILINE)
        text = re.sub(r"\s*```$", "", text, flags=re.MULTILINE)
        return text.strip()

    async def generate_json(self, prompt: str, use_fast_model: bool = False) -> dict:
        """
        Generate a response and parse it as JSON.
        """
        raw = await self.generate(prompt, use_fast_model=use_fast_model)
        try:
            return json.loads(raw)
        except json.JSONDecodeError as e:
            logger.error("JSON parse failed on output", extra={"error": str(e), "raw": raw})
            raise GeminiError("JSON_DECODE_ERROR", f"Failed to parse JSON: {str(e)}")
