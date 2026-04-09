import React from 'react';

export const AbaPayIcon = ({ className = "" }: { className?: string }) => (
  <div className={`w-10 h-10 rounded-full bg-white flex items-center justify-center overflow-hidden border border-gray-200 shadow-sm ${className}`}>
    <img 
      src="/logo-aba.png" 
      alt="ABA Pay" 
      className="w-8 h-8 object-contain"
      referrerPolicy="no-referrer"
    />
  </div>
);

export const AcledaPayIcon = ({ className = "" }: { className?: string }) => (
  <div className={`w-10 h-10 rounded-full bg-white flex items-center justify-center overflow-hidden border border-gray-200 shadow-sm ${className}`}>
    <img 
      src="/logo-acleda.png" 
      alt="ACLEDA Pay" 
      className="w-8 h-8 object-contain"
      referrerPolicy="no-referrer"
    />
  </div>
);

export const CashIcon = ({ className = "" }: { className?: string }) => (
  <div className={`w-10 h-10 rounded-full bg-[#E8F5F0] flex items-center justify-center border border-gray-200 shadow-sm ${className}`}>
    <span className="text-xl">💵</span>
  </div>
);
