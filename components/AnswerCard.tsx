import React from 'react';
import { ChatMessage, TTSControls } from '../types';
import Sources from './Sources';
import { marked } from 'marked';

interface AnswerCardProps {
  message: ChatMessage;
  ttsControls: TTSControls;
}

const ActionButton: React.FC<{ icon: React.ReactNode; text: string }> = ({ icon, text }) => (
    <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
        {icon}
        <span className="text-sm font-medium">{text}</span>
    </button>
);

const IconButton: React.FC<{ icon: React.ReactNode; ariaLabel: string, onClick?: () => void }> = ({ icon, ariaLabel, onClick }) => (
    <button onClick={onClick} aria-label={ariaLabel} className="text-gray-500 hover:text-gray-900 p-1 rounded-md transition-colors">
        {icon}
    </button>
);

const AnswerCard: React.FC<AnswerCardProps> = ({ message, ttsControls }) => {
  const { parts, sources } = message;
  const textPart = parts.find(p => 'text' in p);
  const imagePart = parts.find(p => 'inlineData' in p);

  const text = textPart && 'text' in textPart ? textPart.text : '';
  const { speak, cancel, isSpeaking, voices, selectedVoice, setSelectedVoice } = ttsControls;

  if (text === '' && !imagePart) { // Render thinking indicator only if text and image are missing
    return (
       <div className="w-full py-6 flex items-center space-x-3">
         <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
         <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
         <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
       </div>
    );
  }
  
  const parsedHtml = text ? marked.parse(text) : '';
  const plainText = text.replace(/(\*\*|__|\*|_|`|#+\s)/g, ''); // Basic markdown removal for cleaner speech

  const handleVoiceSelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedVoice(event.target.value);
  };

  return (
    <div className="w-full pt-4">
      {imagePart && 'inlineData' in imagePart && (
        <div className="mb-4">
          <img
            src={`data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`}
            alt="Generated content"
            className="rounded-lg max-w-full md:max-w-md shadow-md"
          />
        </div>
      )}

      {text && (
        <div 
          className="text-gray-800 text-base leading-relaxed"
          dangerouslySetInnerHTML={{ __html: parsedHtml }}
        />
      )}
      
      <div className="flex items-center justify-between mt-6">
          <div className="flex items-center gap-4">
              {text && (
                <>
                  <div className="flex items-center gap-2 p-1 bg-gray-100 rounded-md">
                    <IconButton 
                      icon={isSpeaking 
                        ? <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                        : <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217z" clipRule="evenodd" /></svg>
                      }
                      ariaLabel={isSpeaking ? "Stop speaking" : "Read aloud"}
                      onClick={() => isSpeaking ? cancel() : speak(plainText)}
                    />
                    {voices.length > 0 && (
                      <div className="relative">
                        <select 
                          value={selectedVoice?.name || ''}
                          onChange={handleVoiceSelect}
                          className="text-sm bg-transparent border-none rounded-md pl-2 pr-7 py-0.5 appearance-none focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
                          aria-label="Select voice"
                        >
                          {voices.map(voice => (
                            <option key={voice.name} value={voice.name}>{voice.name.split('(')[0]}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                  <div className="h-5 w-px bg-gray-200"></div>
                </>
              )}
              <ActionButton 
                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12s-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.368a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" /></svg>} 
                text="Share" 
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