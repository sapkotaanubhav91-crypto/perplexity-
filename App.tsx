import React, { useState, useCallback, useRef, useEffect } from 'react';
import Header from './components/Header';
import PromptInputBar from './components/SearchBar';
import SuggestionChips from './components/SuggestionChips';
import ChatLog from './components/ChatLog';
import Footer from './components/Footer';
import { ChatMessage, Part } from './types';
import { sendMessageStream } from './services/geminiService';

const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const chatLogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to the bottom of the chat log when new messages are added
    if (chatLogRef.current) {
      chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSearch = useCallback(async (parts: Part[], isDeepSearch: boolean) => {
    if (isLoading) return;

    setIsLoading(true);
    setError(null);

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      parts: parts,
      isDeepSearch: isDeepSearch,
    };
    
    const currentMessages = [...messages, userMessage];
    setMessages(currentMessages);
    
    // Add a placeholder for the streaming response
    const modelMessageId = (Date.now() + 1).toString();
    const modelMessagePlaceholder: ChatMessage = {
        id: modelMessageId,
        role: 'model',
        parts: [{text: ''}], // Start with empty text part
        sources: [],
    };
    setMessages(prev => [...prev, modelMessagePlaceholder]);

    try {
      let fullText = '';
      const stream = sendMessageStream(currentMessages, isDeepSearch);

      for await (const chunk of stream) {
        fullText += chunk.text;
        setMessages(prev =>
          prev.map(msg =>
            msg.id === modelMessageId
              ? { ...msg, parts: [{text: fullText}], sources: chunk.sources }
              : msg
          )
        );
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(errorMessage);
      // Remove placeholder on error
      setMessages(prev => prev.filter(msg => msg.id !== modelMessageId));
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, messages]);

  const handleSuggestionClick = (suggestion: string) => {
    handleSearch([{ text: suggestion }], false);
  };

  const isChatting = messages.length > 0;

  return (
    <div className={`min-h-screen font-sans transition-colors duration-300 ${isChatting ? 'bg-white' : 'bg-[#F6F8F7]'}`}>
      {isChatting ? (
        <div className="flex flex-col h-screen">
          <div ref={chatLogRef} className="flex-grow overflow-y-auto p-4 md:p-6">
            <div className="container mx-auto max-w-3xl">
              <ChatLog messages={messages} />
            </div>
          </div>
          <footer className="w-full p-4 bg-white/80 backdrop-blur-sm border-t border-gray-200">
             <div className="container mx-auto max-w-3xl">
              <PromptInputBar onSearch={handleSearch} isLoading={isLoading} isFollowUp={true} />
              {error && (
                <p className="text-red-600 text-sm mt-2 text-center">{error}</p>
              )}
            </div>
          </footer>
        </div>
      ) : (
        <main className="container mx-auto px-4 py-8 md:py-16 flex flex-col items-center justify-center min-h-screen">
          <div className="flex flex-col items-center text-center w-full max-w-2xl">
            <Header />
            <PromptInputBar onSearch={handleSearch} isLoading={isLoading} />
            <SuggestionChips onSuggestionClick={handleSuggestionClick} />
             {error && (
              <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg w-full">
                <p className="font-semibold">Error:</p>
                <p>{error}</p>
              </div>
            )}
          </div>
          <Footer />
        </main>
      )}
    </div>
  );
};

export default App;
