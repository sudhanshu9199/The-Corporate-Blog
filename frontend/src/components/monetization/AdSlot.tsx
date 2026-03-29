'use client';
import { useEffect, useState } from 'react';

interface AdSlotProps {
  type: 'adsense' | 'direct';
  placeholderText?: string;
}

export default function AdSlot({ type, placeholderText = "Advertisement" }: AdSlotProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Lazy load observer - only load script when ad slot is in viewport
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !isLoaded) {
        if (type === 'adsense') {
          // Dynamically inject AdSense script here to save initial page load performance
          console.log("Lazy loading AdSense script...");
        }
        setIsLoaded(true);
      }
    });

    const element = document.getElementById('ad-slot-container');
    if (element) observer.observe(element);

    return () => observer.disconnect();
  }, [isLoaded, type]);

  // min-h-[250px] ensures NO CLS (Cumulative Layout Shift)
  return (
    <div id="ad-slot-container" className="min-h-[250px] w-full bg-slate-50 border border-slate-200 flex items-center justify-center my-8 rounded-lg overflow-hidden">
        <span className="text-slate-400 text-sm tracking-widest uppercase font-semibold">
          {placeholderText}
        </span>
    </div>
  );
}