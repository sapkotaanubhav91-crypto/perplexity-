import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="fixed bottom-4 right-4 flex items-center space-x-2">
      <button 
        className="w-8 h-8 flex items-center justify-center bg-gray-100/80 hover:bg-gray-200/80 backdrop-blur-sm text-gray-700 font-semibold rounded-full transition-colors"
        aria-label="Change language"
      >
        <span className="text-sm tracking-tighter">
          Z<sub className="text-xs -ml-0.5">A</sub>
        </span>
      </button>
      <button 
        className="w-8 h-8 flex items-center justify-center bg-gray-100/80 hover:bg-gray-200/80 backdrop-blur-sm text-gray-700 font-semibold rounded-full transition-colors"
        aria-label="Help"
      >
        ?
      </button>
    </footer>
  );
};

export default Footer;
