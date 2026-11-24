'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';

const AGENT_ID = 'agent_6201m84xpezvfsctcgkasw8cx0hm';
const WIDGET_SRC = 'https://unpkg.com/@elevenlabs/convai-widget-embed';

// Hide the idle launcher. Keep the open .sheet, and let that sheet fill
// the host so messages scroll inside it.
const WIDGET_CSS = `
.overlay > *:not(.sheet):not(:has(.sheet)):not(:has(.terms)):not(:has([role="alertdialog"])) { display: none !important; }
.overlay { overflow: hidden !important; height: 100% !important; }
.sheet { max-height: 100% !important; height: 100% !important; }
input, textarea, [contenteditable="true"] { font-size: 16px !important; }
.overlay:has(.terms) {
  inset: 0 !important;
  width: 100% !important;
  height: 100% !important;
  align-items: stretch !important;
  justify-content: stretch !important;
}
.overlay:has(.terms) > * {
  display: flex !important;
  flex-direction: column !important;
  width: 100% !important;
  max-width: none !important;
  height: 100% !important;
  max-height: 100% !important;
  margin: 0 !important;
  box-sizing: border-box !important;
  padding-top: 3.25rem !important;
}
.terms { font-size: 16px !important; overflow: auto !important; }
`;

let pendingMessage = '';
let pendingSend = false;

let stopViewport = () => {};

function fitOpenPanel() {
  const el = widgetEl();
  if (!el?.classList.contains('flora-chat-open')) return;
  if (window.innerWidth >= 1024) return;
  const vv = window.visualViewport;
  const viewH = vv ? vv.height : window.innerHeight;
  const offsetTop = vv ? vv.offsetTop : 0;
  const header = document.querySelector('header');
  const headerBottom = header ? Math.max(0, header.getBoundingClientRect().bottom) : 0;
  const bar = document.querySelector('.flora-mobile-bar');
  const barTop = bar ? bar.getBoundingClientRect().top : viewH;
  const bottomGap = Math.max(0, viewH - barTop);
  const height = Math.max(160, viewH - headerBottom - bottomGap);
  const top = offsetTop + headerBottom;
  document.documentElement.style.setProperty('--flora-chat-top', `${top}px`);
  document.documentElement.style.setProperty('--flora-chat-height', `${height}px`);
}

function bindViewport() {
  stopViewport();
  const vv = window.visualViewport;
  const onChange = () => fitOpenPanel();
  window.addEventListener('resize', onChange);
  vv?.addEventListener('resize', onChange);
  vv?.addEventListener('scroll', onChange);
  onChange();
  stopViewport = () => {
    window.removeEventListener('resize', onChange);
    vv?.removeEventListener('resize', onChange);
    vv?.removeEventListener('scroll', onChange);
  };
}

function widgetEl() {
  return document.querySelector('elevenlabs-convai');
}

function hideLauncher(el) {
  const root = el?.shadowRoot;
  if (!root) return;
  let style = root.getElementById('flora-hide-launcher');
  if (!style) {
    style = document.createElement('style');
    style.id = 'flora-hide-launcher';
    root.appendChild(style);
  }
  if (style.textContent !== WIDGET_CSS) style.textContent = WIDGET_CSS;
  bindWidgetActions(el);
}

function bindWidgetActions(el) {
  const root = el?.shadowRoot;
  if (!root || root.__floraActions) return;
  root.__floraActions = true;
  root.addEventListener('input', (event) => {
    const value = event.target?.value;
    if (typeof value === 'string' && value.trim()) pendingMessage = value;
  }, true);
  root.addEventListener('click', (event) => {
    const button = event.target?.closest?.('button');
    if (!button) return;
    const label = button.getAttribute('aria-label') || '';
    if (label === 'Send') {
      const field = messageField(el);
      if (field?.value?.trim()) pendingMessage = field.value;
      pendingSend = true;
    }
    if (/^\s*accept\s*$/i.test(button.textContent || '')) {
      setTimeout(finishPendingSend, 400);
      setTimeout(finishPendingSend, 1000);
    }
  }, true);
}

function finishPendingSend() {
  const el = widgetEl();
  if (!el?.classList.contains('flora-chat-open') || !pendingSend || !pendingMessage) return;
  const field = messageField(el);
  if (!field) return;
  if (!(field.value || '').trim()) {
    const proto = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')
      || Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value');
    proto?.set?.call(field, pendingMessage);
    field.dispatchEvent(new Event('input', { bubbles: true }));
  }
  const send = [...el.shadowRoot.querySelectorAll('button')]
    .find((button) => button.getAttribute('aria-label') === 'Send' && button.getClientRects().length);
  if (!send) return;
  pendingSend = false;
  pendingMessage = '';
  send.click();
}

function setChatOpen(open) {
  document.documentElement.classList.toggle('flora-chat-open', open);
  if (open) bindViewport();
  else stopViewport();
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

function messageField(el) {
  return el?.shadowRoot?.querySelector('textarea, input, [contenteditable="true"]') || null;
}

function focusMessageField() {
  const field = messageField(widgetEl());
  if (!field) return;
  field.focus();
}

// The sheet node is replaced when the widget re-renders (focus, typing, send).
// Watching for it to disappear treated those updates as a close. The panel
// stays up until Close or Escape.
function expandWidget() {
  const el = widgetEl();
  if (!el) return;
  const alreadyOpen = el.classList.contains('flora-chat-open');
  if (alreadyOpen) {
    focusMessageField();
    fitOpenPanel();
    return;
  }
  el.classList.add('flora-chat-open');
  hideLauncher(el);
  setChatOpen(true);
  fitOpenPanel();
  let tries = 0;
  const fire = () => {
    const current = widgetEl();
    hideLauncher(current);
    if (current?.shadowRoot?.querySelector('.sheet')) {
      fitOpenPanel();
      return;
    }
    document.dispatchEvent(new CustomEvent('elevenlabs-agent:expand', {
      detail: { action: 'expand' },
    }));
    tries += 1;
    if (tries < 6) setTimeout(fire, 150);
  };
  fire();
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
    const onKey = (event) => {
      if (event.key === 'Escape' && document.documentElement.classList.contains('flora-chat-open')) {
        event.preventDefault();
        collapseWidget();
        setOpen(false);
      }
    };
    window.addEventListener('flora-open-convai', onOpen);
    window.addEventListener('flora-convai-visibility', onVisibility);
    window.addEventListener('keydown', onKey);
    const arm = () => hideLauncher(widgetEl());
    const timers = [0, 400, 1200].map((delay) => setTimeout(arm, delay));
    return () => {
      window.removeEventListener('flora-open-convai', onOpen);
      window.removeEventListener('flora-convai-visibility', onVisibility);
      window.removeEventListener('keydown', onKey);
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
