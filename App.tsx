import React, { useState, useCallback, useRef, useEffect } from 'react';
import Header from './components/Header';
import PromptInputBar from './components/SearchBar';
import ChatLog from './components/ChatLog';
import TopBar from './components/TopBar';
import { ChatMessage, Part, GroundingChunk } from './types';
import { sendMessageStream, processUserRequest } from './services/geminiService';
import useTextToSpeech from './hooks/useTextToSpeech';

const formatCitations = (text: string, sources: GroundingChunk[]): string => {
    if (!sources || sources.length === 0) {
        return text.replace(/~~\s*source\s*~~/g, '');
    }
    let citationIndex = 0;
    return text.replace(/~~\s*source\s*~~/g, () => {
        if (citationIndex < sources.length) {
            const sourceNumber = citationIndex + 1;
            citationIndex++;
            // Using a superscript for citation looks cleaner and links to the source list
            return `<sup><a href="#source-${sourceNumber}" aria-label="Source ${sourceNumber}" class="text-blue-600 hover:underline font-medium">[${sourceNumber}]</a></sup>`;
        }
        return ''; // Remove if we have more markers than sources
    });
};

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
  
  const streamResponse = useCallback(async (
      stream: AsyncGenerator<{ text: string; sources: GroundingChunk[] }>,
      modelMessageId: string
  ): Promise<{ fullText: string; sources: GroundingChunk[] }> => {
      let streamedText = '';
      let finalSources: GroundingChunk[] = [];
      const uniqueSourceUris = new Set<string>();

      for await (const chunk of stream) {
          streamedText += chunk.text;
          const currentSources = chunk.sources || [];
          
          currentSources.forEach(source => {
              if (source.web?.uri && !uniqueSourceUris.has(source.web.uri)) {
                  finalSources.push(source);
                  uniqueSourceUris.add(source.web.uri);
              }
          });

          setMessages(prev =>
              prev.map(msg =>
                  msg.id === modelMessageId
                      ? { ...msg, parts: [{ text: streamedText }], sources: [...finalSources] }
                      : msg
              )
          );
      }
      
      return { fullText: streamedText, sources: finalSources };
  }, []);
  
  const handleRequestElaboration = useCallback(async (modelMessageIdToUpdate: string, originalUserMessageId: string) => {
    if (isLoading) return;
    
    const originalUserMessage = messages.find(m => m.id === originalUserMessageId);
    if (!originalUserMessage) return;

    setIsLoading(true);
    setError(null);
    ttsControls.cancel();

    // Disable the "Tell me more" button on the previous answer
    const messagesWithButtonDisabled = messages.map(msg =>
      msg.id === modelMessageIdToUpdate ? { ...msg, isFollowUpPrompt: false } : msg
    );
    
    const followUpUserMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        parts: [{ text: 'Yes, tell me more.' }],
    };
    
    const updatedMessages = [...messagesWithButtonDisabled, followUpUserMessage];
    setMessages(updatedMessages);

    // Create a new history for the model containing only up to the original question
    const originalMessageIndex = messages.findIndex(m => m.id === originalUserMessageId);
    const historyForModel = messages.slice(0, originalMessageIndex + 1);

    // Add an empty model message to show a thinking indicator
    const modelMessageId = (Date.now() + 1).toString();
    const modelMessage: ChatMessage = {
      id: modelMessageId,
      role: 'model',
      parts: [{ text: '' }],
    };
    setMessages(prev => [...prev, modelMessage]);
    
    try {
        const stream = sendMessageStream({ history: historyForModel, isElaboration: true });
        const { fullText, sources } = await streamResponse(stream, modelMessageId);
        const formattedContent = formatCitations(fullText, sources);
        setMessages(prev =>
          prev.map(msg =>
            msg.id === modelMessageId
              ? { ...msg, parts: [{ text: formattedContent }], sources, rawTextForTTS: fullText }
              : msg
          )
        );
        if (fullText.trim()) {
            ttsControls.speak(fullText);
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

  }, [isLoading, messages, ttsControls, streamResponse]);

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
    
    const textPart = parts.find(p => 'text' in p) as { text: string } | undefined;
    const userQueryText = textPart?.text || 'Image query';

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    
    const modelMessageId = (Date.now() + 1).toString();

    try {
        const { requestMode } = await processUserRequest(parts);
        
        const modelMessage: ChatMessage = {
          id: modelMessageId,
          role: 'model',
          parts: [{ text: '' }],
          isDeepSearch: isDeepSearch,
          requestMode: requestMode,
          userQuery: userQueryText,
        };
        setMessages(prev => [...prev, modelMessage]);

        const stream = sendMessageStream({
            history: updatedMessages, 
            isDeepSearch,
            requestMode,
        });

        const { fullText, sources } = await streamResponse(stream, modelMessageId);

        let mainContent = fullText;
        let relatedQueries: string[] = [];

        if (requestMode === 'search') {
            const relatedRegex = /\[RELATED_QUESTIONS\]([\s\S]*?)\[\/RELATED_QUESTIONS\]/im;
            const match = fullText.match(relatedRegex);
            if (match && match[1]) {
                mainContent = fullText.replace(relatedRegex, '').trim();
                relatedQueries = match[1].trim().split('\n').filter(q => q.trim() !== '');
            }
        }
        
        const formattedContent = formatCitations(mainContent, sources);

        setMessages(prev => prev.map(msg =>
          msg.id === modelMessageId
            ? {
                ...msg,
                parts: [{ text: formattedContent }],
                sources: sources,
                relatedQueries: requestMode === 'search' ? relatedQueries : undefined,
                isFollowUpPrompt: !isDeepSearch && (requestMode === 'search' || requestMode === 'explain'),
                originalUserMessageId: userMessage.id,
                rawTextForTTS: mainContent,
              }
            : msg
        ));
        
        if (mainContent.trim()) {
            ttsControls.speak(mainContent);
        }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(errorMessage);
      setMessages(prev => prev.map(msg =>
          msg.id === modelMessageId
            ? { ...msg, parts: [{ text: `Sorry, I ran into an error: ${errorMessage}` }] }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, messages, ttsControls, streamResponse]);
  
  return (
    <div className="flex flex-col h-screen bg-white text-gray-800 font-sans">
      <TopBar />
      <main ref={appBodyRef} className="flex-1 overflow-y-auto w-full flex flex-col pt-24 pb-48">
        <div className="w-full mx-auto max-w-3xl px-4 my-auto">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center">
              <Header />
            </div>
          ) : (
            <ChatLog messages={messages} ttsControls={ttsControls} onElaborationRequest={handleRequestElaboration} />
          )}
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white/95 to-transparent pointer-events-none">
        <div className="container mx-auto max-w-3xl px-4 pt-4 pb-6 pointer-events-auto flex justify-center">
           <PromptInputBar
              onSearch={handleSearch}
              isLoading={isLoading}
            />
        </div>
      </div>
    </div>
  );
};

export default App;