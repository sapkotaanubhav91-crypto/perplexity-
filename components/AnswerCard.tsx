import React from 'react';
import { ChatMessage } from '../types';
import Sources from './Sources';
import { marked } from 'marked';

interface AnswerCardProps {
  message: ChatMessage;
}

const ActionButton: React.FC<{ icon: React.ReactNode; text: string }> = ({ icon, text }) => (
    <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
        {icon}
        <span className="text-sm font-medium">{text}</span>
    </button>
);

const IconButton: React.FC<{ icon: React.ReactNode; ariaLabel: string }> = ({ icon, ariaLabel }) => (
    <button aria-label={ariaLabel} className="text-gray-500 hover:text-gray-900 p-1 rounded-md transition-colors">
        {icon}
    </button>
);

const AnswerCard: React.FC<AnswerCardProps> = ({ message }) => {
  const { parts, sources } = message;
  const textPart = parts.find(p => 'text' in p);
  const text = textPart && 'text' in textPart ? textPart.text : '';

  if (text === '') { // Render thinking indicator only if text is explicitly empty
    return (
       <div className="w-full py-6 flex items-center space-x-3">
         <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
         <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
         <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
       </div>
    );
  }
  
  const parsedHtml = marked.parse(text);

  return (
    <div className="w-full pt-6">
      <div 
        className="text-gray-800 text-base leading-relaxed"
        dangerouslySetInnerHTML={{ __html: parsedHtml }}
      />
      
      <div className="flex items-center justify-between mt-6">
          <div className="flex items-center space-x-6">
              <ActionButton 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12s-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.368a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" /></svg>} 
                text="Share" 
              />
              <ActionButton 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>} 
                text="Export" 
              />
              <ActionButton 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.667 0l3.181-3.183m-4.991-2.691V5.006h-4.992v.001M7.965 5.006v4.992m0 0H2.975m4.99 0l-3.181-3.183a8.25 8.25 0 0111.667 0l3.181 3.183" /></svg>} 
                text="Rewrite" 
              />
          </div>
          <div className="flex items-center space-x-2">
              <IconButton 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.085a2 2 0 00-1.736.97l-2.714 5.428a2 2 0 001.736 2.97h4.618a2 2 0 002-2z" /></svg>} 
                ariaLabel="Good response" 
              />
              <IconButton 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.738 3h4.017c.163 0 .326.02.485.06L17 4m-7 10v5a2 2 0 002 2h.085a2 2 0 001.736-.97l2.714-5.428a2 2 0 00-1.736-2.97h-4.618a2 2 0 00-2 2z" /></svg>} 
                ariaLabel="Bad response" 
              />
              <IconButton 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>} 
                ariaLabel="Copy response" 
              />
              <IconButton 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg>} 
                ariaLabel="More options" 
              />
          </div>
      </div>

      {sources && sources.length > 0 && <Sources sources={sources} />}
    </div>
  );
};

export default AnswerCard;