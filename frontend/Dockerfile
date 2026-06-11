# ─── Stage 1: Install ALL dependencies (including devDeps for build) ──────────
FROM node:20-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./
# Install ALL deps — devDeps like @tailwindcss/postcss are needed for next build
RUN npm ci

# ─── Stage 2: Build ───────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* vars must be present at build time to be inlined into the bundle
ARG NEXT_PUBLIC_API_URL=https://darwin-backend-43894313888.asia-south1.run.app
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Build standalone Next.js output
ENV NODE_ENV=production
RUN npm run build

# ─── Stage 3: Minimal runtime image ──────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy only what Next.js standalone needs to run
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
