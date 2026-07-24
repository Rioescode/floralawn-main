'use client';

import { QRCodeSVG } from 'qrcode.react';
import Image from 'next/image';

export default function QRGeneratorPage() {
  const websiteUrl = "https://fallcleanups.com/contact";
  const phoneNumber = "401-389-0913";

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-10">
      <div id="qr-card" className="bg-white p-12 rounded-[2rem] shadow-4xl flex items-center gap-16 max-w-4xl border border-slate-100 relative overflow-hidden">
        
        {/* Logo Side */}
        <div className="flex flex-col items-center">
             <div className="flex flex-col items-center leading-none text-slate-900 italic font-black text-7xl uppercase tracking-tighter">
                <span>FLORA</span>
                <span className="text-green-600">LAWN</span>
             </div>
             <p className="mt-4 text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">
                & Landscaping Inc.
             </p>
        </div>

        {/* Divider */}
        <div className="w-1 h-48 bg-slate-900 rounded-full" />

        {/* QR Side */}
        <div className="flex flex-col items-center gap-6">
          <div className="p-5 bg-white rounded-3xl border-4 border-slate-50 shadow-xl">
            <QRCodeSVG 
                value={websiteUrl} 
                size={220} 
                level="H"
                includeMargin={false}
            />
          </div>
          
          <div className="flex flex-col items-center gap-3">
            <div className="bg-slate-950 text-white px-10 py-3 rounded-2xl text-[14px] font-black uppercase tracking-widest shadow-2xl">
              Scan Me
            </div>
            <p className="text-4xl font-black text-slate-900 tracking-tighter italic">
              {phoneNumber}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
