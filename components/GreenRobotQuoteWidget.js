'use client';

import { useState, useEffect } from 'react';

export default function GreenRobotQuoteWidget({ 
  className = '', 
  slug = 'flora-lawn-and-landscaping-inc',
  color = '#16a34a',
  baseRate = '35',
  brandName = 'Flora Lawn & Landscaping Inc'
}) {
  const [iframeHeight, setIframeHeight] = useState('460px');

  useEffect(() => {
    const handleMessage = (ev) => {
      if (!ev || !ev.data || ev.data.type !== 'mgr-widget-resize') return;
      if (ev.data.slug && ev.data.slug !== slug) return;
      const h = parseInt(ev.data.height, 10);
      if (h && h >= 300 && h <= 2600) {
        setIframeHeight(`${h}px`);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [slug]);

  const params = new URLSearchParams({
    color,
    baseRate
  });
  if (brandName) params.set('brandName', brandName);

  const widgetUrl = `https://mygreenrobot.com/widget/${encodeURIComponent(slug)}?${params.toString()}`;

  return (
    <div className={`w-full max-w-3xl mx-auto relative ${className}`}>
      <iframe
        src={widgetUrl}
        title={`${brandName} Instant Satellite Lawn Quote`}
        className="w-full transition-all duration-300 rounded-3xl"
        style={{
          width: '100%',
          maxWidth: '720px',
          height: iframeHeight,
          minHeight: '420px',
          border: 'none',
          background: 'transparent',
          borderRadius: '24px',
          display: 'block',
          margin: '0 auto',
          overflow: 'hidden',
          transition: 'height 0.25s ease'
        }}
        allow="geolocation; microphone"
        loading="lazy"
        allowTransparency="true"
      />
    </div>
  );
}
