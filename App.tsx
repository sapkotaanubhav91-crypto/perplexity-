import React, { useState, useCallback, useRef, useEffect } from 'react';
import Header from './components/Header';
import PromptInputBar from './components/SearchBar';
import SuggestionChips from './components/SuggestionChips';
import ChatLog from './components/ChatLog';
import Footer from './components/Footer';
import { ChatMessage, Part } from './types';
import { sendMessageStream, processUserRequest, generateImage } from './services/geminiService';
import useTextToSpeech from './hooks/useTextToSpeech';

const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const chatLogRef = useRef<HTMLDivElement>(null);
  const ttsControls = useTextToSpeech();

  useEffect(() => {
    // Scroll to the bottom of the chat log when new messages are added
    if (chatLogRef.current) {
      chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSearch = useCallback(async (parts: Part[], isDeepSearch: boolean) => {
    if (isLoading) return;

    ttsControls.cancel(); // Stop any ongoing speech from previous answer
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
    
    const modelMessageId = (Date.now() + 1).toString();
    const modelMessagePlaceholder: ChatMessage = {
        id: modelMessageId,
        role: 'model',
        parts: [{text: ''}], // Start with empty part for thinking indicator
        sources: [],
    };
    setMessages(prev => [...prev, modelMessagePlaceholder]);

    try {
      // Don't classify intent if it's a deep search or just an image upload
      const justImage = parts.length === 1 && 'inlineData' in parts[0];
      const intent = (isDeepSearch || justImage) 
        ? { isImageRequest: false, imagePrompt: '' } 
        : await processUserRequest(parts);

      if (intent.isImageRequest && intent.imagePrompt) {
        // --- Image Generation Path ---
        const base64Image = await generateImage(intent.imagePrompt);
        const imagePart: Part = { inlineData: { mimeType: 'image/jpeg', data: base64Image } };
        // Add a text part to provide context
        const textPart: Part = { text: `Here's an image for "${intent.imagePrompt}":` };

        setMessages(prev =>
          prev.map(msg =>
            msg.id === modelMessageId
              ? { ...msg, parts: [textPart, imagePart], sources: [] }
              : msg
          )
        );

      } else {
        // --- Text Search Path ---
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
        
        // Speak the final response once streaming is complete
        const plainText = fullText.replace(/(\*\*|__|\*|_|`|#+\s)/g, ''); // Remove markdown
        if (plainText) {
          ttsControls.speak(plainText);
        }
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(errorMessage);
      // Replace placeholder with error message
       setMessages(prev =>
          prev.map(msg =>
            msg.id === modelMessageId
              ? { ...msg, parts: [{text: `Sorry, I encountered an error: ${errorMessage}`}], sources: [] }
              : msg
          )
        );
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, messages, ttsControls]);

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
              <ChatLog messages={messages} ttsControls={ttsControls} />
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