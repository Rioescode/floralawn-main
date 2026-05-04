# Stage 1: Dependencies
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
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
# Runtime secrets should be passed via environment variables at container startup
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

# First run next build with verbose output
RUN npm run build --verbose || (echo "Next.js build failed, retrying..." && npm run build --verbose)

# Then run sitemap generation if needed (postbuild script handles this)
# Note: next-sitemap runs automatically via postbuild script

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