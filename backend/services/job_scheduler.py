"""
Module: job_scheduler.py
Description: APScheduler background job — crawls public profiles every 3 days
             and enriches the Digital Twin with newly discovered insights.

Author:  Balaraj
Created: 2026-06-10
"""

from __future__ import annotations

import asyncio
import json
from datetime import datetime, timedelta, timezone

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

from services.mongodb_service import MongoDBService
from services.crawler_service import crawl_social_links, build_crawl_summary_prompt
from services.gemini_service import GeminiService
from utils.logger import get_logger

logger = get_logger(__name__)

_db = MongoDBService()
_gemini = GeminiService()

CRAWL_INTERVAL_DAYS = 3


async def _enrich_twin_for_user(user_id: str) -> None:
    """
    For a single user:
      1. Fetch their UserInDB to get social_links.
      2. Fetch their DigitalTwin.
      3. Crawl public links.
      4. Ask Gemini to extract new insights.
      5. Append insights + update last_crawled_at, then persist.
    """
    user = await _db.get_user_by_id(user_id)
    if not user:
        return

    social_links = user.profile.social_links.model_dump()
    # Skip users with no social links at all
    if not any(social_links.values()):
        return

    twin = await _db.get_twin_by_user(user_id)
    if not twin:
        return

    logger.info("Starting crawl job for user", extra={"user_id": user_id})

    try:
        crawl_data = await crawl_social_links(social_links)
        if not crawl_data:
            logger.info("No crawl data returned, skipping twin update", extra={"user_id": user_id})
            return

        prompt = build_crawl_summary_prompt(
            crawl_data=crawl_data,
            existing_profile_json=twin.profile.model_dump_json(indent=2),
        )
        new_insights: list[str] = await _gemini.generate_json(prompt)

        if not isinstance(new_insights, list):
            logger.warning("Gemini returned unexpected type from crawl prompt", extra={"user_id": user_id})
            return

        # Deduplicate and prepend with timestamp
        timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        stamped = [f"[{timestamp}] {insight}" for insight in new_insights if isinstance(insight, str)]

        twin.crawl_insights = (stamped + twin.crawl_insights)[:50]  # cap at 50 insights
        twin.last_crawled_at = datetime.now(timezone.utc)

        if new_insights:
            twin.evolution_log.insert(
                0,
                f"[{timestamp}] Profile enriched via crawler: {len(new_insights)} new insights added.",
            )

        await _db.save_twin(twin)

        # Also update the user's last_crawled_at
        user.profile.last_crawled_at = datetime.now(timezone.utc)
        await _db.save_user(user)

        logger.info(
            "Twin enriched from crawler",
            extra={"user_id": user_id, "twin_id": twin.twin_id, "insights": len(new_insights)},
        )

    except Exception as exc:
        logger.error("Crawl job failed for user", extra={"user_id": user_id, "error": str(exc)})


async def run_crawl_job() -> None:
    """Top-level scheduled task — iterates all users and enriches their twins."""
    logger.info("=== Darwin Crawl Job Starting ===")
    try:
        users = await _db.get_all_users()
        logger.info("Crawl job: found users", extra={"count": len(users)})

        for user in users:
            try:
                await _enrich_twin_for_user(user.id)
            except Exception as exc:
                logger.error("Error enriching user", extra={"user_id": user.id, "error": str(exc)})

    except Exception as exc:
        logger.error("Crawl job failed globally", extra={"error": str(exc)})

    logger.info("=== Darwin Crawl Job Complete ===")


# ──────────────────────────────────────────────────────────────────────────────
# Scheduler lifecycle
# ──────────────────────────────────────────────────────────────────────────────

_scheduler: AsyncIOScheduler | None = None


def get_scheduler() -> AsyncIOScheduler:
    global _scheduler
    if _scheduler is None:
        _scheduler = AsyncIOScheduler(timezone="UTC")
        _scheduler.add_job(
            run_crawl_job,
            trigger=IntervalTrigger(days=CRAWL_INTERVAL_DAYS),
            id="profile_crawler",
            name="Profile Crawler (3-day)",
            replace_existing=True,
            # Fire once on startup only in dev — comment out in production
            # next_run_time=datetime.now(timezone.utc),
        )
    return _scheduler


def start_scheduler() -> None:
    scheduler = get_scheduler()
    if not scheduler.running:
        scheduler.start()
        logger.info(
            "APScheduler started",
            extra={"interval_days": CRAWL_INTERVAL_DAYS},
        )


def stop_scheduler() -> None:
    global _scheduler
    if _scheduler and _scheduler.running:
        _scheduler.shutdown(wait=False)
        logger.info("APScheduler stopped")
