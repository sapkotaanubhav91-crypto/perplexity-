import React from 'react';
import MorphicIcon from './FeatherIcon';

const Logo: React.FC = () => {
  return (
    <div className="flex items-center gap-3">
      <MorphicIcon className="w-6 h-6" />
      <div>
        <span className="text-lg font-semibold text-gray-900 leading-none">
          Morphic
        </span>
        <p className="text-sm text-gray-500 leading-none">morphic.sh</p>
      </div>
    </div>
  );
};

export default Logo;
