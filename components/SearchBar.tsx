// Add type declarations for the non-standard SpeechRecognition API to resolve TypeScript errors.
interface SpeechRecognitionAlternative {
  readonly transcript: string;
}

interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  onend: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  start(): void;
  stop(): void;
}

declare var SpeechRecognition: {
  prototype: SpeechRecognition;
  new (): SpeechRecognition;
};

declare global {
  interface Window {
    SpeechRecognition?: typeof SpeechRecognition;
    webkitSpeechRecognition?: typeof SpeechRecognition;
  }
}

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Part } from '../types';

interface PromptInputBarProps {
  onSearch: (parts: Part[], isDeepSearch: boolean) => void;
  isLoading: boolean;
  isFollowUp?: boolean;
}

const PromptInputBar: React.FC<PromptInputBarProps> = ({ onSearch, isLoading, isFollowUp = false }) => {
  const [query, setQuery] = useState('');
  const [isDeepSearch, setIsDeepSearch] = useState(false);
  const [image, setImage] = useState<{ data: string; mimeType: string; } | null>(null);
  const [isListening, setIsListening] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  
  useEffect(() => {
    if (!isFollowUp) {
      inputRef.current?.focus();
    }
  }, [isFollowUp]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');
        setQuery(transcript);
      };
      
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

    }
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const handleSearch = () => {
    if ((query.trim() || image) && !isLoading) {
      const parts: Part[] = [];
      if (image) {
        parts.push({ inlineData: { mimeType: image.mimeType, data: image.data.split(',')[1] } });
      }
      if (query.trim()) {
        parts.push({ text: query.trim() });
      }

      onSearch(parts, isDeepSearch);
      setQuery('');
      setIsDeepSearch(false);
      setImage(null);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };
  
  const handleImageUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage({
          data: reader.result as string,
          mimeType: file.type,
        });
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleVoiceClick = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
    }
    setIsListening(!isListening);
  };

  const commonProps = (
    <>
     <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={isFollowUp ? "Ask a follow-up..." : "Ask anything..."}
        disabled={isLoading}
        className={`flex-grow bg-transparent focus:outline-none text-gray-800 ${!isFollowUp && 'text-lg placeholder-gray-400'}`}
      />
      {image && (
        <div className="ml-2 relative">
          <img src={image.data} alt="Upload preview" className="h-10 w-10 rounded-md object-cover" />
          <button onClick={() => setImage(null)} className="absolute -top-1 -right-1 bg-gray-700 text-white rounded-full h-4 w-4 flex items-center justify-center text-xs">&times;</button>
        </div>
      )}
    </>
  );

  const commonButtons = (
     <>
       <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
       <button onClick={handleImageUploadClick} className="p-1.5 text-gray-600 hover:bg-gray-200 rounded-md transition-colors" aria-label="Attach file">
         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
      </button>
       <button onClick={handleVoiceClick} className={`p-1.5 text-gray-600 hover:bg-gray-200 rounded-md transition-colors ${isListening ? 'animate-pulse' : ''}`} aria-label="Voice search">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
      </button>
    </>
  );

  if (isFollowUp) {
    return (
      <div className="relative w-full bg-white border border-gray-200 rounded-2xl shadow-lg p-2 flex items-center gap-2">
        <div className="flex items-center space-x-1 p-1 bg-gray-100 rounded-lg">
          <button className="p-1.5 text-gray-600 hover:bg-gray-200 rounded-md transition-colors" aria-label="Search">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>
          </button>
          <button onClick={() => setIsDeepSearch(!isDeepSearch)} className={`p-1.5 rounded-md transition-colors ${isDeepSearch ? 'bg-primary/20 text-primary' : 'text-gray-600 hover:bg-gray-200'}`} aria-label="Deep Research">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>
          </button>
        </div>
        {commonProps}
        <div className="flex items-center space-x-2">
           {commonButtons}
        </div>
        <button
          onClick={handleSearch}
          disabled={isLoading || (!query.trim() && !image)}
          className="bg-gray-200 text-gray-700 p-2 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
          aria-label="Submit"
        >
          {isLoading ? <div className="h-5 w-5 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div> : <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>}
        </button>
      </div>
    );
  }

  // Initial Search Bar
  return (
    <div className="relative w-full p-3 bg-white border border-gray-200 rounded-3xl shadow-lg flex items-center gap-2">
      <div className="flex items-center space-x-1 p-1 bg-gray-100 rounded-xl">
         <button className="p-2 text-gray-600 bg-white rounded-lg shadow-sm" aria-label="Search"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg></button>
         <button onClick={() => setIsDeepSearch(!isDeepSearch)} className={`p-2 rounded-lg transition-colors ${isDeepSearch ? 'text-primary' : 'text-gray-600 hover:bg-gray-200'}`} aria-label="Deep Research"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg></button>
      </div>
      {commonProps}
      <div className="flex items-center space-x-3 pr-2">
        {commonButtons}
      </div>
      <button
        onClick={handleSearch}
        disabled={isLoading || (!query.trim() && !image)}
        className="bg-primary text-white p-3 rounded-2xl hover:bg-primary-dark disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        aria-label="Submit"
      >
        {isLoading ? <div className="h-6 w-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>}
      </button>
    </div>
  );
};

export default PromptInputBar;