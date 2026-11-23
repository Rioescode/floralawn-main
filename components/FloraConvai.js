'use client';

import Script from 'next/script';
import { useEffect } from 'react';

const AGENT_ID = 'agent_6201m84xpezvfsctcgkasw8cx0hm';
const WIDGET_SRC = 'https://unpkg.com/@elevenlabs/convai-widget-embed';

// The collapsed "Need help?" card is a sibling of the open sheet inside .overlay.
// Hiding every overlay child that is not the sheet removes the floating launcher
// without unmounting the widget, so it cannot pop open on its own.
const HIDE_LAUNCHER_CSS = `
.overlay > *:not(.sheet):not(:has(.sheet)) { display: none !important; }
`;

function widgetEl() {
  return document.querySelector('elevenlabs-convai');
}

function hideLauncher(el) {
  const root = el?.shadowRoot;
  if (!root || root.getElementById('flora-hide-launcher')) return;
  const style = document.createElement('style');
  style.id = 'flora-hide-launcher';
  style.textContent = HIDE_LAUNCHER_CSS;
  root.appendChild(style);
}

function expandWidget() {
  const el = widgetEl();
  if (el) el.classList.add('flora-chat-open');
  hideLauncher(el);
  const fire = () => {
    document.dispatchEvent(new CustomEvent('elevenlabs-agent:expand', {
      detail: { action: 'expand' },
    }));
    hideLauncher(widgetEl());
  };
  fire();
  setTimeout(fire, 200);
  setTimeout(fire, 700);
}

function ensureWidget(done) {
  const ready = () => {
    const start = () => setTimeout(done, 50);
    if (customElements.get('elevenlabs-convai')) start();
    else customElements.whenDefined('elevenlabs-convai').then(start);
  };
  if (document.querySelector('script[src*="convai-widget-embed"]')) {
    ready();
    return;
  }
  const script = document.createElement('script');
  script.src = WIDGET_SRC;
  script.async = true;
  script.onload = ready;
  document.body.appendChild(script);
}

export default function FloraConvai() {
  useEffect(() => {
    const open = () => ensureWidget(expandWidget);
    window.addEventListener('flora-open-convai', open);
    const arm = () => hideLauncher(widgetEl());
    const timers = [0, 400, 1200].map((delay) => setTimeout(arm, delay));
    return () => {
      window.removeEventListener('flora-open-convai', open);
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <>
      <elevenlabs-convai agent-id={AGENT_ID}></elevenlabs-convai>
      <Script src={WIDGET_SRC} strategy="lazyOnload" onLoad={() => hideLauncher(widgetEl())} />
    </>
  );
}
