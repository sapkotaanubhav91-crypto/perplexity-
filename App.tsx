import React, { useState, useCallback, useRef, useEffect } from 'react';
import Header from './components/Header';
import PromptInputBar from './components/SearchBar';
import SuggestionChips from './components/SuggestionChips';
import ChatLog from './components/ChatLog';
import TopBar from './components/TopBar';
import Footer from './components/Footer';
import { ChatMessage, Part, GroundingChunk } from './types';
import { sendMessageStream, processUserRequest, generateImage, editImage } from './services/geminiService';
import useTextToSpeech from './hooks/useTextToSpeech';

const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const appBodyRef = useRef<HTMLDivElement>(null);
  const ttsControls = useTextToSpeech();

  useEffect(() => {
    if (appBodyRef.current) {
      appBodyRef.current.scrollTop = appBodyRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSearch = useCallback(async (parts: Part[], isDeepSearch: boolean) => {
    if (isLoading) return;

    ttsControls.cancel();
    setIsLoading(true);
    setError(null);

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      parts: parts,
      isDeepSearch: isDeepSearch,
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);

    // Add an empty model message to show a thinking indicator
    const modelMessageId = (Date.now() + 1).toString();
    const modelMessage: ChatMessage = {
      id: modelMessageId,
      role: 'model',
      parts: [{ text: '' }],
    };
    setMessages(prev => [...prev, modelMessage]);

    try {
        const { requestType, prompt } = await processUserRequest(parts);
        
        if (requestType === 'generate') {
             const base64Image = await generateImage(prompt);
             const newPart: Part = { inlineData: { mimeType: 'image/jpeg', data: base64Image } };
             const finalModelMessage: ChatMessage = {
                id: modelMessageId,
                role: 'model',
                parts: [
                    { text: `Here's the image I generated for: "${prompt}"` },
                    newPart
                ]
             };
             setMessages(prev => prev.map(msg => msg.id === modelMessageId ? finalModelMessage : msg));

        } else if (requestType === 'edit') {
            const editedParts = await editImage(parts);
            const finalModelMessage: ChatMessage = {
                id: modelMessageId,
                role: 'model',
                parts: editedParts,
            };
            setMessages(prev => prev.map(msg => msg.id === modelMessageId ? finalModelMessage : msg));

        } else { // 'search'
            const stream = sendMessageStream(updatedMessages, isDeepSearch);
            let streamedText = '';
            const sources: GroundingChunk[] = [];
            const uniqueSourceUris = new Set<string>();

            for await (const chunk of stream) {
                streamedText += chunk.text;
                if (chunk.sources) {
                  chunk.sources.forEach(source => {
                    if (source.web?.uri && !uniqueSourceUris.has(source.web.uri)) {
                      sources.push(source);
                      uniqueSourceUris.add(source.web.uri);
                    }
                  });
                }
                
                setMessages(prev =>
                    prev.map(msg =>
                        msg.id === modelMessageId
                            ? { ...msg, parts: [{ text: streamedText }], sources: [...sources] }
                            : msg
                    )
                );
            }
        }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(errorMessage);
      setMessages(prev =>
        prev.map(msg =>
          msg.id === modelMessageId
            ? { ...msg, parts: [{ text: `Sorry, I ran into an error: ${errorMessage}` }] }
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
  
  return (
    <div className="flex flex-col h-screen bg-white text-gray-800 font-sans">
      <TopBar />
      <div ref={appBodyRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 pt-24 pb-48">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-start text-center h-full">
              <Header />
               <div className="w-full mt-12">
                 <PromptInputBar onSearch={handleSearch} isLoading={isLoading} />
              </div>
              <SuggestionChips onSuggestionClick={handleSuggestionClick} />
            </div>
          ) : (
            <ChatLog messages={messages} ttsControls={ttsControls} />
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white/95 to-transparent pointer-events-none">
        <div className="container mx-auto max-w-3xl px-4 pt-4 pb-6 pointer-events-auto">
           {messages.length > 0 && (
            <PromptInputBar
              onSearch={handleSearch}
              isLoading={isLoading}
            />
           )}
        </div>
      </div>
      
      {messages.length === 0 && <Footer />}
    </div>
  );
};

export default App;