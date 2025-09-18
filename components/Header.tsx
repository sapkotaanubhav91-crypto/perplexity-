
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="flex items-center justify-center space-x-3 text-center mb-8">
      <svg
        className="w-10 h-10 text-blue-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          className="text-teal-400"
        />
      </svg>
      <h1 className="text-4xl font-bold text-slate-100 tracking-tight">
        Perplexity <span className="text-blue-500">AI</span>
      </h1>
    </header>
  );
};

export default Header;
