"""
Module: crawler_service.py
Description: Free public profile crawler for the Darwin Digital Twin.

Crawling strategy:
  - GitHub:    Official public REST API — repo stats, bio, languages, pinned topics.
  - Portfolio: BeautifulSoup HTML scrape — extract visible text, headings, links.
  - LinkedIn / Instagram / Twitter: URLs stored but NOT scraped (anti-bot walls).

Author:  Balaraj
Created: 2026-06-10
"""

from __future__ import annotations

import re
from typing import Optional
from urllib.parse import urlparse

import httpx
from bs4 import BeautifulSoup

from utils.logger import get_logger

logger = get_logger(__name__)

_HEADERS = {
    "User-Agent": "Darwin-FounderTwin/1.0 (public profile enrichment; contact balaraj@example.com)"
}
_TIMEOUT = 10  # seconds


# ──────────────────────────────────────────────────────────────────────────────
# GitHub
# ──────────────────────────────────────────────────────────────────────────────

def _extract_github_username(url: str) -> Optional[str]:
    """Extract username from any GitHub URL format."""
    parsed = urlparse(url)
    if "github.com" not in parsed.netloc:
        return None
    parts = [p for p in parsed.path.split("/") if p]
    return parts[0] if parts else None


async def crawl_github(github_url: str) -> dict:
    """
    Fetch public GitHub profile data via the official REST API.

    Returns a dict with keys: bio, repos, stars, top_languages, pinned_topics, highlights.
    """
    username = _extract_github_username(github_url)
    if not username:
        logger.warning("Invalid GitHub URL", extra={"url": github_url})
        return {}

    result: dict = {}

    async with httpx.AsyncClient(headers=_HEADERS, timeout=_TIMEOUT) as client:
        # User profile
        try:
            r = await client.get(f"https://api.github.com/users/{username}")
            r.raise_for_status()
            data = r.json()
            result["github_bio"] = data.get("bio") or ""
            result["github_name"] = data.get("name") or username
            result["github_location"] = data.get("location") or ""
            result["github_followers"] = data.get("followers", 0)
            result["github_public_repos"] = data.get("public_repos", 0)
            result["github_company"] = data.get("company") or ""
            result["github_blog"] = data.get("blog") or ""
        except Exception as e:
            logger.warning("GitHub user fetch failed", extra={"username": username, "error": str(e)})
            return result

        # Repos — sorted by stars
        try:
            r2 = await client.get(
                f"https://api.github.com/users/{username}/repos",
                params={"sort": "stars", "direction": "desc", "per_page": 10},
            )
            r2.raise_for_status()
            repos = r2.json()

            total_stars = sum(repo.get("stargazers_count", 0) for repo in repos)
            result["github_total_stars"] = total_stars

            top_repos = [
                {
                    "name": repo["name"],
                    "description": repo.get("description") or "",
                    "stars": repo.get("stargazers_count", 0),
                    "language": repo.get("language") or "",
                    "topics": repo.get("topics", []),
                }
                for repo in repos[:5]
            ]
            result["github_top_repos"] = top_repos

            # Derive top languages
            lang_counts: dict[str, int] = {}
            for repo in repos:
                lang = repo.get("language")
                if lang:
                    lang_counts[lang] = lang_counts.get(lang, 0) + 1
            result["github_top_languages"] = sorted(lang_counts, key=lang_counts.get, reverse=True)[:5]  # type: ignore[arg-type]

            # All topics across repos
            all_topics: set[str] = set()
            for repo in repos:
                all_topics.update(repo.get("topics", []))
            result["github_topics"] = list(all_topics)[:20]

        except Exception as e:
            logger.warning("GitHub repos fetch failed", extra={"username": username, "error": str(e)})

    logger.info("GitHub crawl complete", extra={"username": username, "stars": result.get("github_total_stars", 0)})
    return result


# ──────────────────────────────────────────────────────────────────────────────
# Portfolio / Personal Website
# ──────────────────────────────────────────────────────────────────────────────

async def crawl_portfolio(portfolio_url: str) -> dict:
    """
    Scrape a personal portfolio / website with BeautifulSoup.

    Extracts: page title, headings, a cleaned body text excerpt, and all external links.
    """
    try:
        async with httpx.AsyncClient(headers=_HEADERS, timeout=_TIMEOUT, follow_redirects=True) as client:
            r = await client.get(portfolio_url)
            r.raise_for_status()
            html = r.text
    except Exception as e:
        logger.warning("Portfolio fetch failed", extra={"url": portfolio_url, "error": str(e)})
        return {}

    soup = BeautifulSoup(html, "html.parser")

    # Remove noise tags
    for tag in soup(["script", "style", "noscript", "nav", "footer", "header"]):
        tag.decompose()

    title = soup.title.string.strip() if soup.title and soup.title.string else ""
    headings = [h.get_text(strip=True) for h in soup.find_all(["h1", "h2", "h3"]) if h.get_text(strip=True)][:10]

    # Clean body text — first 800 chars
    body_text = re.sub(r"\s+", " ", soup.get_text(separator=" ")).strip()[:800]

    # External links (could indicate social platforms, projects, etc.)
    links = []
    for a in soup.find_all("a", href=True):
        href = a["href"]
        if href.startswith("http") and urlparse(href).netloc != urlparse(portfolio_url).netloc:
            links.append(href)
    links = list(dict.fromkeys(links))[:20]  # dedupe, keep first 20

    result = {
        "portfolio_title": title,
        "portfolio_headings": headings,
        "portfolio_excerpt": body_text,
        "portfolio_external_links": links,
    }

    logger.info("Portfolio crawl complete", extra={"url": portfolio_url, "title": title})
    return result


# ──────────────────────────────────────────────────────────────────────────────
# Orchestrator
# ──────────────────────────────────────────────────────────────────────────────

async def crawl_social_links(social_links: dict) -> dict:
    """
    Crawl all available social links and merge the results.

    Args:
        social_links: dict with optional keys: github, linkedin, instagram, portfolio, twitter

    Returns:
        Merged crawl data dict suitable for AI summarisation.
    """
    merged: dict = {}

    if social_links.get("github"):
        github_data = await crawl_github(social_links["github"])
        merged.update(github_data)

    if social_links.get("portfolio"):
        portfolio_data = await crawl_portfolio(social_links["portfolio"])
        merged.update(portfolio_data)

    # Store the uncrawled URLs so the AI summary can still reference them
    for key in ("linkedin", "instagram", "twitter"):
        if social_links.get(key):
            merged[f"{key}_url"] = social_links[key]

    return merged


def build_crawl_summary_prompt(crawl_data: dict, existing_profile_json: str) -> str:
    """
    Build a Gemini prompt that takes raw crawl data + the existing twin profile
    and returns a list of new actionable insights to add to the twin.
    """
    return f"""
You are an expert analyst enriching a founder's Digital Twin profile with data
crawled from their public online presence.

EXISTING FOUNDER PROFILE (JSON):
{existing_profile_json}

NEWLY CRAWLED PUBLIC DATA:
{crawl_data}

TASK:
Analyse the crawled data and identify 3-8 NEW, SPECIFIC insights that would
update or enrich the founder's profile. Focus on:
- Real technical skills demonstrated (not just claimed)
- Actual shipped projects and their scope/quality
- Evidence of audience / community building
- Writing style or communication patterns
- Any gaps or inconsistencies vs their self-reported profile

Return ONLY a JSON array of short insight strings (no markdown, no explanation):
["insight 1", "insight 2", ...]

Each insight must be 1-2 sentences, specific, and actionable.
If crawl data is empty or unhelpful, return an empty array [].
"""
