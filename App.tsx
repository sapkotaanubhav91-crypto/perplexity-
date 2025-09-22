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

const parseResponse = (fullText: string) => {
  const separator = '---';
  const relatedMarker = 'Related:';
  const parts = fullText.split(separator);

  let mainContent = fullText;
  let relatedQueries: string[] = [];

  if (parts.length > 1) {
    const lastPart = parts[parts.length - 1];
    const relatedIndex = lastPart.indexOf(relatedMarker);
    if (relatedIndex !== -1) {
      mainContent = parts.slice(0, -1).join(separator).trim();
      const relatedText = lastPart.substring(relatedIndex + relatedMarker.length);
      relatedQueries = relatedText
        .split('\n')
        .map(q => q.replace(/^- \[?/, '').replace(/\]?$/, '').trim())
        .filter(Boolean);
    }
  }
  
  return { mainContent, relatedQueries };
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
  ) => {
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
      
      // After streaming is complete, parse for related questions and format citations.
      const { mainContent, relatedQueries } = parseResponse(streamedText);
      const formattedContent = formatCitations(mainContent, finalSources);
      setMessages(prev => prev.map(msg => 
          msg.id === modelMessageId 
            ? { ...msg, parts: [{ text: formattedContent }], relatedQueries, sources: finalSources }
            : msg
      ));

      return mainContent;
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
        await streamResponse(stream, modelMessageId);
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

    try {
        const { requestMode } = await processUserRequest(parts);
        
        // Add an empty model message to show a thinking indicator
        const modelMessageId = (Date.now() + 1).toString();
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
        await streamResponse(stream, modelMessageId);

        // If it was a standard search (not deep search), mark it for follow-up.
        if (!isDeepSearch && (requestMode === 'search' || requestMode === 'explain')) {
          setMessages(prev => prev.map(msg => 
            msg.id === modelMessageId
              ? { ...msg, isFollowUpPrompt: true, originalUserMessageId: userMessage.id }
              : msg
          ));
        }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(errorMessage);
      setMessages(prev => prev.slice(0, -1)); // Remove the empty model message on error
      // Optionally, add an error message to the chat
      const errorBotMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'model',
        parts: [{ text: `Sorry, I ran into an error: ${errorMessage}` }],
      };
      setMessages(prev => [...prev, errorBotMessage]);

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