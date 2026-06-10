"""
Module: gemini_service.py
Description: Async wrapper around Google Gemini APIs.
             Handles retries, fallbacks, and JSON extraction.

Author:  Balaraj
Created: 2026-06-10

Dependencies: google-genai, config.env
Exports: GeminiService
"""

import asyncio
import json
import re
from google import genai
from google.genai import types
from config.env import settings
from config.constants import (
    GEMINI_MAX_OUTPUT_TOKENS,
    GEMINI_TEMPERATURE,
)
from utils.logger import get_logger
from utils.errors import GeminiError

logger = get_logger(__name__)

# Current production models — VERIFIED March 2026
MODELS = {
    "TRIAGE": "gemini-3-flash-preview",        # Fast, Pro-grade reasoning
    "REPORTS": "gemini-3.1-pro-preview",       # Highest reasoning
    "LITE": "gemini-3.1-flash-lite-preview",   # High volume, lowest cost
    "FALLBACK": "gemini-2.5-flash",            # Stable, not deprecated
}

class GeminiService:
    """
    Async wrapper for Google Gemini.

    Configured with JSON mode enforcement and retry logic.
    All prompts should instruct the model to return ONLY valid JSON.
    """
    
    # Global semaphore to prevent blasting the API with concurrent requests
    # which causes 429 quota exhaustion on free tiers.
    _semaphore = asyncio.Semaphore(3)

    def __init__(self) -> None:
        self.client = genai.Client(api_key=settings.gemini_api_key)

    async def generate(self, prompt: str, use_fast_model: bool = False) -> str:
        """
        Generate a response using Gemini, with an automatic fallback.

        Args:
            prompt: Full prompt string including system context.
            use_fast_model: If True, uses the fast model.

        Returns:
            Raw string response (expected to be valid JSON).

        Raises:
            GeminiError: If all API models in the chain fail.
        """
        preferred_model = MODELS["LITE"] if use_fast_model else MODELS["REPORTS"]
        model_chain = [preferred_model, MODELS["FALLBACK"]]
        last_error = ""

        async with self._semaphore:
            for model_id in model_chain:
                # Up to 3 attempts per model
                for attempt in range(3):
                    try:
                        logger.info(f"Generating content with model {model_id} (attempt {attempt+1})")
                        response = await self.client.aio.models.generate_content(
                            model=model_id,
                            contents=prompt,
                            config=types.GenerateContentConfig(
                                temperature=GEMINI_TEMPERATURE,
                                max_output_tokens=GEMINI_MAX_OUTPUT_TOKENS,
                                response_mime_type="application/json"
                            )
                        )
                        text = response.text
                        text = self._strip_markdown_fences(text)
                        
                        # Add a small delay after a successful request to smooth out quota
                        await asyncio.sleep(2)
                        return text
                    except Exception as e:
                        last_error = str(e)
                        logger.warning(f"Gemini {model_id} attempt {attempt+1} failed", extra={"error": str(e)})
                        
                        if "429" in str(e) or "503" in str(e) or "RESOURCE_EXHAUSTED" in str(e) or "UNAVAILABLE" in str(e):
                            # Exponential backoff on rate limits
                            delay = 5 * (2 ** attempt)
                            logger.info(f"Retrying in {delay}s due to rate limit/unavailability...")
                            await asyncio.sleep(delay)
                            continue
                        else:
                            # Break and try next model if it's not a rate limit
                            break

        raise GeminiError(
            "ALL_AI_FAILED",
            f"All AI models failed: {last_error}",
        )

    def _strip_markdown_fences(self, text: str) -> str:
        """Remove accidental markdown code fences from Gemini output."""
        if not text:
            return ""
        # Remove ```json ... ``` or ``` ... ```
        text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.MULTILINE)
        text = re.sub(r"\s*```$", "", text, flags=re.MULTILINE)
        
        # Extract everything from the first { or [ to the last } or ]
        # This handles cases where the model outputs extra trailing characters
        start_obj = text.find('{')
        start_arr = text.find('[')
        end_obj = text.rfind('}')
        end_arr = text.rfind(']')
        
        start = -1
        if start_obj != -1 and start_arr != -1:
            start = min(start_obj, start_arr)
        else:
            start = max(start_obj, start_arr)
            
        end = max(end_obj, end_arr)
        
        if start != -1 and end != -1 and end >= start:
            return text[start:end+1]
            
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
