import React from 'react';
import Logo from './Logo';

const TopBar: React.FC = () => {
  return (
    <header className="fixed top-0 left-0 right-0 p-4 bg-white z-10">
      <div className="container mx-auto flex justify-between items-center max-w-7xl px-4">
        <div className="flex items-center gap-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-800" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
            <Logo />
        </div>
        <div className="flex items-center gap-2">
          <button className="px-4 py-1.5 text-sm font-medium text-gray-800 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
            Sign In
          </button>
          <button className="px-4 py-1.5 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800 transition-colors">
            Sign Up
          </button>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
