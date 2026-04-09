import React from 'react';

export default function BooxieLogo({ className = "w-24 h-24" }: { className?: string }) {
  return (
    <img 
      src="/booxie-logo.png" 
      alt="Booxie Logo" 
      className={`object-contain ${className}`}
      referrerPolicy="no-referrer"
    />
  );
}
