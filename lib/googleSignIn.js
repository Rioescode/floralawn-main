// Public OAuth client already used by Supabase Auth. A client ID is not a secret.
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  || '1091440323561-lefm1alj6i5lr0h5jrqi58j9f42u5lro.apps.googleusercontent.com'

function loadGis() {
  if (typeof window === 'undefined') return Promise.reject(new Error('Google sign-in needs a browser'))
  if (window.google?.accounts?.id) return Promise.resolve()
  if (!loadGis.promise) {
    loadGis.promise = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.onload = () => resolve()
      script.onerror = () => {
        loadGis.promise = null
        reject(new Error('Google sign-in could not load'))
      }
      document.head.appendChild(script)
    })
  }
  return loadGis.promise
}

async function generateNonce() {
  const nonce = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))))
  const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(nonce))
  const hashedNonce = Array.from(new Uint8Array(hashBuffer)).map((byte) => byte.toString(16).padStart(2, '0')).join('')
  return [nonce, hashedNonce]
}

export async function mountGoogleButton(element, { supabase, redirectToRef, beforeRef, onError, isActive }) {
  await loadGis()
  if (isActive && !isActive()) return
  element.innerHTML = ''
  const [nonce, hashedNonce] = await generateNonce()
  window.google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    nonce: hashedNonce,
    callback: async (response) => {
      try {
        if (beforeRef.current) await beforeRef.current()
        const { error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: response.credential,
          nonce,
        })
        if (error) throw error
        const next = redirectToRef.current || '/customer/dashboard'
        window.location.assign(next.startsWith('http') ? next : `${window.location.origin}${next}`)
      } catch (err) {
        onError(err)
      }
    },
  })
  const width = Math.min(Math.max(element.clientWidth || 320, 240), 400)
  window.google.accounts.id.renderButton(element, {
    type: 'standard',
    theme: 'outline',
    size: 'large',
    text: 'continue_with',
    shape: 'rectangular',
    width,
    logo_alignment: 'left',
  })
}
