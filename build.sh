#!/bin/bash

# Load environment variables from .env.local
if [ -f .env.local ]; then
    set -a
    source .env.local
    set +a
fi

# Build the Docker image with build arguments
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="$NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  --build-arg NEXT_PUBLIC_EMAILJS_SERVICE_ID="$NEXT_PUBLIC_EMAILJS_SERVICE_ID" \
  --build-arg NEXT_PUBLIC_EMAILJS_TEMPLATE_ID="$NEXT_PUBLIC_EMAILJS_TEMPLATE_ID" \
  --build-arg NEXT_PUBLIC_EMAILJS_PUBLIC_KEY="$NEXT_PUBLIC_EMAILJS_PUBLIC_KEY" \
  --build-arg NEXT_PUBLIC_APP_NAME="$NEXT_PUBLIC_APP_NAME" \
  --build-arg SITE_URL="$SITE_URL" \
  -t floralawn . 