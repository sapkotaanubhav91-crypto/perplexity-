import React from 'react';
import AntharaIcon from './FeatherIcon';

const Logo: React.FC = () => {
  return (
    <div className="flex items-center gap-3">
      <AntharaIcon className="w-6 h-6" />
      <span className="text-lg font-semibold text-gray-900">
        Anthara
      </span>
    </div>
  );
};

export default Logo;