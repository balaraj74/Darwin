# ─── Stage 1: Builder ─────────────────────────────────────────────────────────
FROM python:3.12-slim AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies into a separate layer for caching
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install --no-cache-dir --prefix=/install -r requirements.txt

# ─── Stage 2: Runtime ─────────────────────────────────────────────────────────
FROM python:3.12-slim AS runtime

WORKDIR /app

# Non-root user for security
RUN adduser --disabled-password --gecos "" appuser

# Copy installed packages from builder
COPY --from=builder /install /usr/local

# Copy application code
COPY . .

# Don't copy local secrets — they come from Cloud Run env vars / Secret Manager
RUN rm -f .env

# Switch to non-root user
USER appuser

# Cloud Run injects PORT env var; fall back to 8000 for local Docker
ENV PORT=8000

EXPOSE 8000

# Use exec form for proper signal handling
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT} --workers 1 --log-level info"]
