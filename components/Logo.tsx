import React from 'react';
import FeatherIcon from './FeatherIcon';

const Logo: React.FC = () => {
  return (
    <div className="flex items-center gap-2">
      <FeatherIcon className="w-8 h-8" />
      <div className="flex items-baseline">
        <span className="text-2xl text-gray-800" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 600 }}>
          Anthara
        </span>
        <span className="text-xl text-gray-500 font-medium ml-1">
          AI
        </span>
      </div>
    </div>
  );
};

export default Logo;
