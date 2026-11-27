'use client';

import { useEffect, useRef } from 'react';

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

export function turnstileSiteKey() {
  return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';
}

// Empty when the widget is off or the visitor already has a token.
export function turnstileClientError(token) {
  if (!turnstileSiteKey()) return '';
  if (typeof token === 'string' && token.trim()) return '';
  return 'Please complete the security check and try again.';
}

export default function TurnstileField({ onToken, resetKey = 0 }) {
  const siteKey = turnstileSiteKey();
  const holderRef = useRef(null);
  const widgetIdRef = useRef(null);
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;

  useEffect(() => {
    if (!siteKey || !holderRef.current) return undefined;
    let cancelled = false;

    const renderWidget = () => {
      if (cancelled || !holderRef.current || !window.turnstile || widgetIdRef.current != null) return;
      widgetIdRef.current = window.turnstile.render(holderRef.current, {
        sitekey: siteKey,
        callback: (token) => onTokenRef.current?.(token || ''),
        'expired-callback': () => onTokenRef.current?.(''),
        'error-callback': () => onTokenRef.current?.(''),
      });
    };

    const script = document.querySelector('script[data-turnstile="1"]');
    const onLoad = () => renderWidget();

    if (window.turnstile) {
      renderWidget();
    } else if (script) {
      script.addEventListener('load', onLoad);
      if (window.turnstile) renderWidget();
    } else {
      const created = document.createElement('script');
      created.src = SCRIPT_SRC;
      created.async = true;
      created.defer = true;
      created.dataset.turnstile = '1';
      created.addEventListener('load', onLoad);
      document.head.appendChild(created);
    }

    return () => {
      cancelled = true;
      document.querySelector('script[data-turnstile="1"]')?.removeEventListener('load', onLoad);
      if (widgetIdRef.current != null && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, resetKey]);

  if (!siteKey) return null;

  return <div ref={holderRef} className="min-h-[65px]" />;
}
