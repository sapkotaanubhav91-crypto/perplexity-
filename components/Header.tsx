import React from 'react';
import FeatherIcon from './FeatherIcon';

const Header: React.FC = () => {
  return (
    <header className="flex flex-col items-center justify-center text-center mb-8">
       <div className="mb-4">
            <FeatherIcon className="w-16 h-16" />
       </div>
      <h1 className="text-4xl font-semibold text-gray-900 tracking-tight">
        Hello, I'm Anthara
      </h1>
      <p className="text-xl text-gray-600 tracking-tight mt-2">What can I help you with today?</p>
    </header>
  );
};

export default Header;