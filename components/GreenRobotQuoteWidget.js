'use client';

import { useState, useEffect } from 'react';

export default function GreenRobotQuoteWidget({ 
  className = '', 
  slug = 'flora-lawn-and-landscaping-inc',
  color = '#16a34a',
  baseRate = '35',
  brandName = 'Flora Lawn & Landscaping Inc',
  proEmail = 'floralawncareri@gmail.com'
}) {
  const [iframeHeight, setIframeHeight] = useState('520px');
  const [isLoading, setIsLoading] = useState(true);

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
    baseRate,
    brandName,
    proEmail
  });

  const widgetUrl = `https://mygreenrobot.com/widget/${encodeURIComponent(slug)}?${params.toString()}`;

  return (
    <div className={`w-full relative ${className}`}>
      {isLoading && (
        <div className="w-full h-80 flex flex-col items-center justify-center bg-slate-50 rounded-3xl border border-slate-100 text-slate-400 gap-3">
          <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Loading Satellite Yard Quoter...
          </span>
        </div>
      )}
      <iframe
        src={widgetUrl}
        onLoad={() => setIsLoading(false)}
        title={`${brandName} Instant Satellite Lawn Quote`}
        className={`w-full transition-all duration-300 ${isLoading ? 'hidden' : 'block'}`}
        style={{
          width: '100%',
          maxWidth: '100%',
          height: iframeHeight,
          border: 'none',
          background: 'transparent',
          borderRadius: '24px',
          display: isLoading ? 'none' : 'block',
          overflow: 'hidden'
        }}
        allow="geolocation; microphone"
        loading="lazy"
        allowTransparency="true"
      />
    </div>
  );
}
