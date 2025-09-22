import React from 'react';
import MorphicIcon from './FeatherIcon';

const Logo: React.FC = () => {
  return (
    <div className="flex items-center gap-3">
      <MorphicIcon className="w-6 h-6" />
      <span className="text-lg font-semibold text-gray-900">
        Morphic
      </span>
    </div>
  );
};

export default Logo;