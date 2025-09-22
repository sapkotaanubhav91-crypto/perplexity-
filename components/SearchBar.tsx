import React, { useState, useRef, useEffect } from 'react';
import { Part } from '../types';

interface PromptInputBarProps {
  onSearch: (parts: Part[], isDeepSearch: boolean) => void;
  isLoading: boolean;
}

const SearchOptionButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  hasDropdown?: boolean;
}> = ({ children, onClick, hasDropdown }) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors bg-white border border-gray-200 text-gray-700 hover:bg-gray-100`}
    >
      {children}
      {hasDropdown && (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      )}
    </button>
  );
};

const PromptInputBar: React.FC<PromptInputBarProps> = ({ onSearch, isLoading }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  useEffect(() => {
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = 'auto'; // Reset height
      const scrollHeight = textarea.scrollHeight;
      // Set a max-height to prevent infinite growth
      if (scrollHeight < 200) {
        textarea.style.height = `${scrollHeight}px`;
      } else {
        textarea.style.height = '200px';
      }
    }
  }, [query]);

  const handleSearch = () => {
    if (query.trim() && !isLoading) {
      onSearch([{ text: query.trim() }], false); // isDeepSearch is always false now
      setQuery('');
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSearch();
    }
  };

  return (
    <div className="relative w-full max-w-3xl">
        <div className="relative w-full p-3 bg-white/90 backdrop-blur-sm border border-gray-200/80 rounded-2xl shadow-lg flex flex-col gap-3">
            <div className="flex items-start gap-3">
                <textarea
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask a question..."
                    disabled={isLoading}
                    className="flex-grow bg-transparent focus:outline-none text-gray-800 text-base placeholder-gray-500 resize-none overflow-y-auto pt-2 pl-2"
                    rows={1}
                />
                <button
                    onClick={handleSearch}
                    disabled={isLoading || !query.trim()}
                    className="flex-shrink-0 w-9 h-9 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                    aria-label="Submit"
                >
                    {isLoading 
                        ? <div className="h-5 w-5 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div> 
                        : <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                    }
                </button>
            </div>
            <div className="flex items-center gap-2 px-1">
                <SearchOptionButton hasDropdown={true}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-green-600"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                    <span>Speed</span>
                </SearchOptionButton>
                <SearchOptionButton>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9V3" /></svg>
                    <span>Search</span>
                </SearchOptionButton>
            </div>
        </div>
    </div>
  );
};

export default PromptInputBar;
