import React from 'react';
import { ChatMessage, TTSControls, Part } from '../types';
import AnswerCard from './AnswerCard';

// Extracted sub-component for a single part (text or image)
const MessagePart: React.FC<{ part: Part }> = ({ part }) => {
  if ('inlineData' in part) {
    return (
      <img
        src={`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`}
        alt="User content"
        className="rounded-lg max-w-full md:max-w-xs shadow-md"
      />
    );
  }
  // This ensures that even if text is empty, it renders a p tag,
  // preventing layout shifts for messages with only images.
  if ('text' in part && part.text) {
    return <p>{part.text}</p>;
  }
  return null;
};

interface ChatLogProps {
  messages: ChatMessage[];
  ttsControls: TTSControls;
}

const ChatLog: React.FC<ChatLogProps> = ({ messages, ttsControls }) => {
  return (
    <div className="flex flex-col gap-8">
      {messages.map((message) => {
        if (message.role === 'user') {
          return (
            <div key={message.id} className="flex justify-end items-start">
              <div className="bg-blue-100 text-gray-800 rounded-2xl px-5 py-3 max-w-xl">
                <div className="flex flex-col gap-3">
                  {message.parts.map((part, index) => (
                    <MessagePart key={index} part={part} />
                  ))}
                </div>
              </div>
            </div>
          );
        }

        if (message.role === 'model') {
          return (
            <div key={message.id} className="flex justify-start items-start">
                <div className="max-w-2xl">
                    <AnswerCard message={message} ttsControls={ttsControls} />
                </div>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
};

export default ChatLog;