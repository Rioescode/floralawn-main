'use client'

import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { mountGoogleButton } from '@/lib/googleSignIn'

export default function GoogleSignInButton({ redirectTo = '/auth/callback?redirect=/customer/dashboard', onBefore, onError }) {
  const hostRef = useRef(null)
  const redirectToRef = useRef(redirectTo)
  const beforeRef = useRef(onBefore)
  const onErrorRef = useRef(onError)
  redirectToRef.current = redirectTo
  beforeRef.current = onBefore
  onErrorRef.current = onError

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    let active = true
    mountGoogleButton(host, {
      supabase,
      redirectToRef,
      beforeRef,
      isActive: () => active,
      onError: (err) => {
        if (active && onErrorRef.current) onErrorRef.current(err)
      },
    }).catch((err) => {
      if (active && onErrorRef.current) onErrorRef.current(err)
    })
    return () => {
      active = false
      host.innerHTML = ''
    }
  }, [])

  return <div ref={hostRef} className="min-h-11 w-full" />
}
