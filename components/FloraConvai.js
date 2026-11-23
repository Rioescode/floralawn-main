'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';

const AGENT_ID = 'agent_6201m84xpezvfsctcgkasw8cx0hm';
const WIDGET_SRC = 'https://unpkg.com/@elevenlabs/convai-widget-embed';

// Hide the idle launcher. Keep the open .sheet, and let that sheet fill
// the host so messages scroll inside it.
const WIDGET_CSS = `
.overlay > *:not(.sheet):not(:has(.sheet)) { display: none !important; }
.overlay { overflow: hidden !important; height: 100% !important; }
.sheet { max-height: 100% !important; height: 100% !important; }
`;

function widgetEl() {
  return document.querySelector('elevenlabs-convai');
}

function hideLauncher(el) {
  const root = el?.shadowRoot;
  if (!root || root.getElementById('flora-hide-launcher')) return;
  const style = document.createElement('style');
  style.id = 'flora-hide-launcher';
  style.textContent = WIDGET_CSS;
  root.appendChild(style);
}

function setChatOpen(open) {
  document.documentElement.classList.toggle('flora-chat-open', open);
  window.dispatchEvent(new CustomEvent('flora-convai-visibility', { detail: { open } }));
}

function collapseWidget() {
  document.dispatchEvent(new CustomEvent('elevenlabs-agent:expand', {
    detail: { action: 'collapse' },
  }));
  const el = widgetEl();
  if (el) el.classList.remove('flora-chat-open');
  setChatOpen(false);
}

let stopWatch = () => {};

function watchDismiss(el) {
  stopWatch();
  const root = el?.shadowRoot;
  if (!root) return;
  let seenSheet = false;
  const observer = new MutationObserver(() => {
    const open = !!root.querySelector('.sheet');
    if (open) seenSheet = true;
    else if (seenSheet) {
      observer.disconnect();
      el.classList.remove('flora-chat-open');
      setChatOpen(false);
    }
  });
  observer.observe(root, { childList: true, subtree: true });
  stopWatch = () => observer.disconnect();
}

function expandWidget() {
  const el = widgetEl();
  if (!el) return;
  el.classList.add('flora-chat-open');
  hideLauncher(el);
  setChatOpen(true);
  const fire = () => {
    document.dispatchEvent(new CustomEvent('elevenlabs-agent:expand', {
      detail: { action: 'expand' },
    }));
    hideLauncher(widgetEl());
  };
  fire();
  setTimeout(fire, 200);
  setTimeout(fire, 700);
  setTimeout(() => watchDismiss(widgetEl()), 800);
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
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onOpen = () => {
      setOpen(true);
      ensureWidget(expandWidget);
    };
    const onVisibility = (event) => setOpen(!!event.detail?.open);
    window.addEventListener('flora-open-convai', onOpen);
    window.addEventListener('flora-convai-visibility', onVisibility);
    const arm = () => hideLauncher(widgetEl());
    const timers = [0, 400, 1200].map((delay) => setTimeout(arm, delay));
    return () => {
      window.removeEventListener('flora-open-convai', onOpen);
      window.removeEventListener('flora-convai-visibility', onVisibility);
      timers.forEach(clearTimeout);
      document.documentElement.classList.remove('flora-chat-open');
    };
  }, []);

  function closeChat() {
    collapseWidget();
    setOpen(false);
  }

  return (
    <>
      <elevenlabs-convai agent-id={AGENT_ID}></elevenlabs-convai>
      <Script src={WIDGET_SRC} strategy="lazyOnload" onLoad={() => hideLauncher(widgetEl())} />
      {open && (
        <button type="button" className="flora-chat-close" onClick={closeChat}>
          Close
        </button>
      )}
    </>
  );
}
