import React from 'react';

const Watermark: React.FC = () => {
  return (
    <div 
      className="fixed inset-0 flex items-center justify-center pointer-events-none z-0"
      aria-hidden="true"
    >
      <img 
        src="/watermark-logo.png" 
        alt="" 
        className="w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 object-contain opacity-[0.08] select-none"
        draggable={false}
      />
    </div>
  );
};

export default Watermark;
