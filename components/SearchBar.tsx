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

import React, { useState, useRef, useEffect } from 'react';
import { Part } from '../types';

interface PromptInputBarProps {
  onSearch: (parts: Part[], isDeepSearch: boolean) => void;
  isLoading: boolean;
}

const SearchBarButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  isActive?: boolean;
  hasDropdown?: boolean;
  ariaLabel: string;
}> = ({ children, onClick, isActive, hasDropdown, ariaLabel }) => {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
        isActive ? 'bg-gray-200 text-gray-800' : 'text-gray-600 hover:bg-gray-100'
      }`}
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
  const [isDeepSearch, setIsDeepSearch] = useState(false);
  const [image, setImage] = useState<{ data: string; mimeType: string; } | null>(null);
  const [isListening, setIsListening] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');
        setQuery(transcript);
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      recognitionRef.current = recognition;
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
    // Reset file input value to allow re-uploading the same file
    if (event.target) {
      event.target.value = '';
    }
  };
  
  const handleVoiceClick = () => {
    if (recognitionRef.current) {
      if (isListening) {
        recognitionRef.current.stop();
      } else {
        recognitionRef.current.start();
      }
      setIsListening(!isListening);
    } else {
      alert("Speech recognition is not supported in your browser.");
    }
  };

  const canSearch = query.trim() !== '' || image !== null;

  return (
    <div className="relative w-full max-w-3xl">
        {/* Gradient Glow Effect */}
        <div className="absolute -inset-2.5 bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 rounded-3xl blur-xl opacity-50 animate-pulse" style={{ animationDuration: '5s' }}></div>
        
        <div className="relative w-full p-2 bg-white/80 backdrop-blur-sm border border-gray-200/80 rounded-2xl shadow-xl flex flex-col gap-2">
            <div className="flex items-center gap-2">
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask anything"
                    disabled={isLoading}
                    className="flex-grow bg-transparent focus:outline-none text-gray-800 text-lg placeholder-gray-500 pl-3 py-2"
                />
                 {image && (
                    <div className="ml-2 relative">
                        <img src={image.data} alt="Upload preview" className="h-10 w-10 rounded-md object-cover" />
                        <button onClick={() => setImage(null)} className="absolute -top-1.5 -right-1.5 bg-gray-700 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs">&times;</button>
                    </div>
                )}
                <button onClick={handleVoiceClick} className="p-2 text-gray-500 hover:bg-gray-200 rounded-full transition-colors" aria-label="Voice search">
                     <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${isListening ? 'text-blue-500' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0a5 5 0 01-5 5V8a1 1 0 10-2 0v5a5 5 0 01-5-5a1 1 0 10-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" /></svg>
                </button>
                <button
                    onClick={handleSearch}
                    disabled={isLoading || !canSearch}
                    className="p-2.5 bg-gray-800 text-white rounded-xl hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    aria-label="Submit"
                >
                    {isLoading ? <div className="h-6 w-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>}
                </button>
            </div>
            <div className="flex items-center gap-2 px-2">
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                <SearchBarButton onClick={handleImageUploadClick} ariaLabel="Attach file">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                </SearchBarButton>
                <SearchBarButton onClick={() => setIsDeepSearch(!isDeepSearch)} isActive={isDeepSearch} ariaLabel="Toggle Deep Research">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>
                    <span>Deep Research</span>
                </SearchBarButton>
                <SearchBarButton hasDropdown={true} ariaLabel="Select agent">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" /></svg>
                    <span>Agents</span>
                </SearchBarButton>
            </div>
        </div>
    </div>
  );
};

export default PromptInputBar;