# Stage 1: Dependencies
FROM node:18-slim AS base

# Install dependencies only when needed
FROM base AS deps
RUN apt-get update && apt-get install -y libc6-dev --no-install-recommends && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build arguments for environment variables (passed at build time)
# These should be provided via --build-arg or from CI/CD secrets
# Note: Sensitive values are passed at build time and not stored in image layers
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG SUPABASE_SERVICE_ROLE_KEY
ARG NEXT_PUBLIC_EMAILJS_SERVICE_ID
ARG NEXT_PUBLIC_EMAILJS_TEMPLATE_ID
ARG NEXT_PUBLIC_EMAILJS_PUBLIC_KEY
ARG NEXT_PUBLIC_APP_NAME="Flora Lawn & Landscaping Inc"
ARG SITE_URL="https://floralawn-and-landscaping.com"
ARG NEXT_PUBLIC_TELEGRAM_TOKEN
ARG NEXT_PUBLIC_TELEGRAM_CHAT_ID
ARG RESEND_API_KEY
ARG TWILIO_ACCOUNT_SID
ARG TWILIO_API_KEY_SID
ARG TWILIO_API_KEY_SECRET
ARG TWILIO_AUTH_TOKEN
ARG TWILIO_PHONE_NUMBER

# Set environment variables from build arguments (only for build process)
ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
ENV SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
ENV NEXT_PUBLIC_EMAILJS_SERVICE_ID=${NEXT_PUBLIC_EMAILJS_SERVICE_ID}
ENV NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=${NEXT_PUBLIC_EMAILJS_TEMPLATE_ID}
ENV NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=${NEXT_PUBLIC_EMAILJS_PUBLIC_KEY}
ENV NEXT_PUBLIC_APP_NAME=${NEXT_PUBLIC_APP_NAME}
ENV SITE_URL=${SITE_URL}
ENV NEXT_PUBLIC_TELEGRAM_TOKEN=${NEXT_PUBLIC_TELEGRAM_TOKEN}
ENV NEXT_PUBLIC_TELEGRAM_CHAT_ID=${NEXT_PUBLIC_TELEGRAM_CHAT_ID}
ENV RESEND_API_KEY=${RESEND_API_KEY}
ENV TWILIO_ACCOUNT_SID=${TWILIO_ACCOUNT_SID}
ENV TWILIO_API_KEY_SID=${TWILIO_API_KEY_SID}
ENV TWILIO_API_KEY_SECRET=${TWILIO_API_KEY_SECRET}
ENV TWILIO_AUTH_TOKEN=${TWILIO_AUTH_TOKEN}
ENV TWILIO_PHONE_NUMBER=${TWILIO_PHONE_NUMBER}

# Set memory and CPU limits for Node.js build
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV NEXT_CPU_COUNT=1
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Run next build
RUN npm run build --verbose

# Remove .env file after build (if it exists)
RUN rm -f .env || true

# Stage 3: Runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV="production"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

ENV PORT="3000"
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"] 