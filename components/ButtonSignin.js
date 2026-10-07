"use client";

import GoogleSignInButton from '@/components/GoogleSignInButton';

export default function ButtonSignin() {
  return <GoogleSignInButton redirectTo="/auth/callback?redirect=/marketplace" />;
}
