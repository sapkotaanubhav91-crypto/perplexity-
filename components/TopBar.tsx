import React from 'react';

const TopBar: React.FC = () => {
  return (
    <header className="fixed top-0 left-0 right-0 p-4 bg-white z-10 border-b border-gray-200/80">
      <div className="container mx-auto flex justify-start items-center">
        <span className="font-semibold text-gray-800">Anthara AI</span>
      </div>
    </header>
  );
};

export default TopBar;