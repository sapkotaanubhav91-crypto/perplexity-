import React from 'react';
import { ChatMessage, TTSControls } from '../types';
import AnswerCard from './AnswerCard';

// A new sub-component for the "Answer" / "Search" tabs
const AnswerToolbar: React.FC = () => {
    return (
        <div className="flex items-center space-x-6 border-b border-gray-200 mt-6">
            <button className="flex items-center gap-2 py-3 text-primary border-b-2 border-primary font-semibold">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                <span>Answer</span>
            </button>
            <button className="flex items-center gap-2 py-3 text-gray-500 hover:text-gray-800 font-medium">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
                <span>Search</span>
            </button>
        </div>
    );
};

// A new sub-component to display the user's message in the chat view
const UserMessageDisplay: React.FC<{ message: ChatMessage }> = ({ message }) => {
  const textPart = message.parts.find(p => 'text' in p);
  const imagePart = message.parts.find(p => 'inlineData' in p);

  return (
    <div className="w-full">
       <div className="flex flex-col gap-4">
        {imagePart && 'inlineData' in imagePart && (
            <img 
                src={`data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`} 
                alt="User upload" 
                className="max-w-xs rounded-lg"
            />
        )}
        {textPart && 'text' in textPart && (
            <h1 className="text-4xl font-bold text-gray-900">{textPart.text}</h1>
        )}
       </div>
       {message.isDeepSearch && (
         <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>
            <span>Deep Research</span>
         </div>
       )}
    </div>
  );
};


interface ChatLogProps {
  messages: ChatMessage[];
  ttsControls: TTSControls;
}

const ChatLog: React.FC<ChatLogProps> = ({ messages, ttsControls }) => {
  if (messages.length === 0) {
    return null;
  }

  const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
  const lastModelMessage = messages[messages.length - 1];

  return (
    <div className="w-full">
      {lastUserMessage && <UserMessageDisplay message={lastUserMessage} />}
      <AnswerToolbar />
      {lastModelMessage && lastModelMessage.role === 'model' && (
        <AnswerCard message={lastModelMessage} ttsControls={ttsControls} />
      )}
    </div>
  );
};

export default ChatLog;
