import React, { useRef, useEffect } from 'react';
import { ChatMessage, TTSControls } from '../types';
import Sources from './Sources';
import { marked } from 'marked';

interface AnswerCardProps {
  message: ChatMessage;
  ttsControls: TTSControls;
  onElaborationRequest: (modelMessageId: string, originalUserMessageId: string) => void;
}

const IconButton: React.FC<{ icon: React.ReactNode; ariaLabel: string, onClick?: () => void }> = ({ icon, ariaLabel, onClick }) => (
    <button onClick={onClick} aria-label={ariaLabel} className="text-gray-500 hover:text-gray-900 p-1 rounded-md transition-colors">
        {icon}
    </button>
);

const RelatedQueries: React.FC<{ queries: string[] }> = ({ queries }) => (
  <div className="mt-6 pt-4 border-t border-gray-200">
    <h3 className="text-base font-semibold text-gray-600 mb-3">Related</h3>
    <div className="flex flex-col gap-2">
      {queries.map((query, index) => (
        <a href="#" key={index} className="flex items-center gap-2 text-blue-600 hover:underline">
           <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 flex-shrink-0"><path d="m9 18 6-6-6-6"></path></svg>
           <span>{query}</span>
        </a>
      ))}
    </div>
  </div>
);

const SearchResultHeader: React.FC<{ query?: string; resultCount?: number; isLoading: boolean }> = ({ query, resultCount = 0, isLoading }) => (
    <div className="w-full p-4 bg-white border border-gray-200 rounded-xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-gray-500"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
            <span className="text-gray-800">{query}</span>
            {isLoading && <span className="text-gray-500">Searching...</span>}
        </div>
        <div className="flex items-center gap-2">
            {!isLoading && <span className="text-sm text-gray-500">{resultCount} results</span>}
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-gray-500"><path d="m18 15-6-6-6 6"></path></svg>
        </div>
    </div>
);


const AnswerCard: React.FC<AnswerCardProps> = ({ message, ttsControls, onElaborationRequest }) => {
  const { parts, sources, isDeepSearch, requestMode, userQuery, relatedQueries } = message;
  const textPart = parts.find(p => 'text' in p);
  const imagePart = parts.find(p => 'inlineData' in p);

  const contentRef = useRef<HTMLDivElement>(null);
  const text = textPart && 'text' in textPart ? textPart.text : '';
  const { speak, cancel, isSpeaking } = ttsControls;

  useEffect(() => {
    if (contentRef.current) {
        const codeBlocks = contentRef.current.querySelectorAll('pre');
        codeBlocks.forEach(pre => {
            if (pre.parentElement?.classList.contains('code-block-container')) return; // Already processed
            const code = pre.querySelector('code');
            if (!code) return;
            const container = document.createElement('div');
            container.className = 'code-block-container bg-gray-900 text-white rounded-lg my-4 overflow-hidden';
            const language = code.className.replace(/language-/, '').trim();
            const header = document.createElement('div');
            header.className = 'flex justify-between items-center px-4 py-2 bg-gray-800';
            const langDisplay = document.createElement('span');
            langDisplay.className = 'text-xs text-gray-400 font-sans capitalize';
            langDisplay.innerText = language || 'code';
            const button = document.createElement('button');
            button.className = 'flex items-center gap-1.5 px-2 py-1 bg-gray-700 text-gray-300 rounded-md text-xs hover:bg-gray-600 transition-colors';
            const buttonText = document.createElement('span');
            buttonText.innerText = 'Copy';
            const buttonIcon = document.createElement('span');
            buttonIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>`;
            button.appendChild(buttonIcon);
            button.appendChild(buttonText);
            header.appendChild(langDisplay);
            header.appendChild(button);
            button.addEventListener('click', () => {
                navigator.clipboard.writeText(code.innerText).then(() => {
                    buttonText.innerText = 'Copied!';
                    buttonIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>`;
                    setTimeout(() => {
                        buttonText.innerText = 'Copy';
                        buttonIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>`;
                    }, 2000);
                });
            });
            pre.parentNode?.insertBefore(container, pre);
            container.appendChild(header);
            container.appendChild(pre);
            pre.className += ' p-4 overflow-x-auto text-sm';
        });
    }
  }, [text]);

  if (requestMode === 'search') {
      const isLoading = text === '';
      return (
          <div className="w-full flex flex-col gap-4">
              <SearchResultHeader query={userQuery} resultCount={sources?.length} isLoading={isLoading} />

              {/* Image & Source Placeholders */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className={`aspect-video bg-gray-200 rounded-lg ${isLoading ? 'animate-pulse' : ''}`}></div>
                  ))}
              </div>

              {isLoading ? (
                  <div className="space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                  </div>
              ) : (
                <>
                  {sources && sources.length > 0 && <Sources sources={sources} />}
                  <div 
                    ref={contentRef}
                    className="prose prose-lg max-w-none text-gray-800 leading-relaxed 
                               prose-headings:font-bold prose-headings:text-gray-900
                               prose-h1:text-3xl prose-h1:mb-6
                               prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-2
                               prose-p:text-gray-700
                               prose-strong:font-bold prose-strong:text-gray-900
                               prose-del:text-gray-500 prose-del:font-normal prose-del:no-underline"
                    dangerouslySetInnerHTML={{ __html: marked.parse(text) }}
                  />
                  {relatedQueries && relatedQueries.length > 0 && <RelatedQueries queries={relatedQueries} />}
                </>
              )}
          </div>
      );
  }

  // Fallback for non-search modes or other loading states
  if (text === '' && !imagePart) {
    if (isDeepSearch) {
      return (
        <div className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl">
            <div className="flex items-center space-x-4">
                <div className="w-6 h-6 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                <div>
                    <p className="text-gray-800 font-semibold">Performing in-depth research...</p>
                    <p className="text-gray-600 text-sm mt-0.5">This takes a little longer but provides more accurate and detailed answers.</p>
                </div>
            </div>
        </div>
      );
    }
    return (
       <div className="w-full py-6 flex items-center space-x-3">
         <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse"></div>
         <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
         <div className="w-2 h-2 bg-gray-500 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
       </div>
    );
  }
  
  const parsedHtml = text ? marked.parse(text) : '';
  const plainText = text.replace(/(\*\*|__|\*|_|`|#+\s)/g, '');
  
  return (
    <div className="w-full">
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
          ref={contentRef}
          className="prose prose-lg max-w-none text-gray-800 leading-relaxed 
                     prose-headings:font-bold prose-headings:text-gray-900
                     prose-h1:text-3xl prose-h1:mb-6
                     prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-2
                     prose-p:text-gray-700
                     prose-strong:font-bold prose-strong:text-gray-900
                     prose-del:text-gray-500 prose-del:font-normal prose-del:no-underline"
          dangerouslySetInnerHTML={{ __html: parsedHtml }}
        />
      )}
      {message.isFollowUpPrompt && message.originalUserMessageId && (
        <div className="mt-4 pt-4 border-t border-gray-200/80">
          <button 
            onClick={() => onElaborationRequest(message.id, message.originalUserMessageId!)}
            className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
          >
            Tell me more
          </button>
        </div>
      )}
      <div className="flex items-center gap-2 mt-4">
          <IconButton icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.898 0V3a1 1 0 112 0v2.101a7.002 7.002 0 01-11.898 0V3a1 1 0 01-1-1zM10 18a7.002 7.002 0 006.323-3.99.5.5 0 00-.866-.5A6.002 6.002 0 014.543 13.51a.5.5 0 00-.866.5A7.002 7.002 0 0010 18z" clipRule="evenodd" /></svg>} ariaLabel="Regenerate response" />
          <IconButton icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>} ariaLabel="Copy response" />
          <IconButton icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>} ariaLabel="Download response" />
          <IconButton icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.085a2 2 0 00-1.736.97l-2.714 5.428a2 2 0 001.736 2.97h4.618a2 2 0 002-2z" /></svg>} ariaLabel="Good response" />
          <IconButton icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.738 3h4.017c.163 0 .326.02.485.06L17 4m-7 10v5a2 2 0 002 2h.085a2 2 0 001.736-.97l2.714-5.428a2 2 0 00-1.736-2.97h-4.618a2 2 0 00-2 2z" /></svg>} ariaLabel="Bad response" />
          {text && (
            <IconButton icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414z" clipRule="evenodd" /></svg>}
              ariaLabel={isSpeaking ? "Stop speaking" : "Read aloud"}
              onClick={() => isSpeaking ? cancel() : speak(plainText)}
            />
          )}
      </div>
      {sources && sources.length > 0 && requestMode !== 'search' && <Sources sources={sources} />}
    </div>
  );
};

export default AnswerCard;