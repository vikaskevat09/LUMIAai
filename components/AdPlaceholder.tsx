
import React from 'react';

interface AdPlaceholderProps {
  label?: string;
  className?: string;
}

const AdPlaceholder: React.FC<AdPlaceholderProps> = ({ label = "Sponsored Advertisement", className = "" }) => {
  return (
    <div className={`w-full bg-[#161616] border border-neutral-800 rounded-lg flex flex-col items-center justify-center p-4 min-h-[100px] overflow-hidden ${className}`}>
      <span className="text-[10px] uppercase tracking-widest text-neutral-500 mb-2">{label}</span>
      <div className="w-full h-full border border-dashed border-neutral-700 rounded flex items-center justify-center text-neutral-600 text-sm">
        AdSense Placement Area
      </div>
    </div>
  );
};

export default AdPlaceholder;
