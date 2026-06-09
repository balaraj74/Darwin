"""
Module: errors.py
Description: Typed error hierarchy for all backend modules.
             Each module raises its own error type — never raw strings.

Author:  KAIRON / Founder Twin
Created: 2025-06-09
"""


class DarwinBaseError(Exception):
    """Base error for all Darwin Agent errors."""

    def __init__(self, code: str, message: str) -> None:
        self.code = code
        self.message = message
        super().__init__(f"[{code}] {message}")

    def __str__(self) -> str:
        return f"[{self.code}] {self.message}"


class TwinBuildError(DarwinBaseError):
    """Raised when digital twin inference fails."""
    pass


class DebateError(DarwinBaseError):
    """Raised when any agent call or debate round fails critically."""
    pass


class SynthesisError(DarwinBaseError):
    """Raised when decision synthesizer fails."""
    pass


class ExecutionError(DarwinBaseError):
    """Raised when execution engine fails to generate outputs."""
    pass


class AgentError(DarwinBaseError):
    """Raised when a specific board agent fails."""
    pass


class GeminiError(DarwinBaseError):
    """Raised when all Gemini retries are exhausted."""
    pass


class GitLabError(DarwinBaseError):
    """Raised when GitLab API call fails."""
    pass


class DatabaseError(DarwinBaseError):
    """Raised when MongoDB operation fails."""
    pass
