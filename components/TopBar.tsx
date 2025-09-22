import React from 'react';
import Logo from './Logo';

const TopBar: React.FC = () => {
  return (
    <header className="fixed top-0 left-0 right-0 p-4 bg-white z-10">
      <div className="container mx-auto flex items-center max-w-7xl px-4">
        <div className="flex items-center">
            <Logo />
        </div>
      </div>
    </header>
  );
};

export default TopBar;