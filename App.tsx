import React, { useState, useCallback, useRef, useEffect } from 'react';
import Header from './components/Header';
import PromptInputBar from './components/SearchBar';
import SuggestionChips from './components/SuggestionChips';
import ChatLog from './components/ChatLog';
import TopBar from './components/TopBar'; // New import
import { ChatMessage, Part } from './types';
import { sendMessageStream, processUserRequest, generateImage, editImage } from './services/geminiService';
import useTextToSpeech from './hooks/useTextToSpeech';

const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const chatLogRef = useRef<HTMLDivElement>(null);
  const ttsControls = useTextToSpeech();

  useEffect(() => {
    if (chatLogRef.current) {
      chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
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
    
    const currentMessages = [...messages, userMessage];
    setMessages(currentMessages);
    
    const modelMessageId = (Date.now() + 1).toString();
    const modelMessagePlaceholder: ChatMessage = {
        id: modelMessageId,
        role: 'model',
        parts: [{text: ''}],
        sources: [],
    };
    setMessages(prev => [...prev, modelMessagePlaceholder]);

    try {
      const intent = await processUserRequest(parts);

      switch (intent.requestType) {
        case 'generate':
          const genBase64 = await generateImage(intent.prompt);
          const genImagePart: Part = { inlineData: { mimeType: 'image/jpeg', data: genBase64 } };
          const genTextPart: Part = { text: `Here is an image based on your prompt: "${intent.prompt}"` };
          setMessages(prev => prev.map(msg => msg.id === modelMessageId ? { ...msg, parts: [genTextPart, genImagePart] } : msg));
          break;
        
        case 'edit':
          const editedParts = await editImage(parts);
          setMessages(prev => prev.map(msg => msg.id === modelMessageId ? { ...msg, parts: editedParts } : msg));
          break;

        case 'search':
        default:
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
          
          const plainText = fullText.replace(/(\*\*|__|\*|_|`|#+\s)/g, '');
          if (plainText) {
            ttsControls.speak(plainText);
          }
          break;
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(errorMessage);
       setMessages(prev =>
          prev.map(msg =>
            msg.id === modelMessageId
              ? { ...msg, parts: [{text: `Sorry, I encountered an error: ${errorMessage}`}], sources: [] }
              :