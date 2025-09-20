import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="flex flex-col items-center justify-center text-center mb-8">
       <div className="w-12 h-12 mb-4 flex items-center justify-center bg-gray-100 rounded-xl">
            <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 2.66699C16 2.66699 8 7.33366 8 16.0003C8 24.667 16 29.3337 16 29.3337C16 29.3337 24 24.667 24 16.0003C24 7.33366 16 2.66699 16 2.66699Z" stroke="#4A5568" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M19.3333 16.0003C19.3333 14.1273 17.8426 12.667 16 12.667C14.1573 12.667 12.6667 14.1273 12.6667 16.0003C12.6667 17.8733 14.1573 19.3337 16 19.3337L19.3333 16.0003Z" stroke="#4A5568" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
       </div>
      <h1 className="text-4xl font-semibold text-gray-900 tracking-tight">
        Hello there!
      </h1>
      <p className="text-4xl text-gray-700 tracking-tight mt-1">What's on your mind?</p>
    </header>
  );
};

export default Header;