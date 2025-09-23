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
  const { parts, sources, isDeepSearch, requestMode, userQuery, relatedQueries, rawTextForTTS } = message;
  const textPart = parts.find(p => 'text' in p);
  const imagePart = parts.find(p => 'inlineData' in p);

  const contentRef = useRef<HTMLDivElement>(null);
  const text = textPart && 'text' in textPart ? textPart.text : '';

  const hasCitations = /<sup><a href="#source-\d+/.test(text);

  const textToSpeak = rawTextForTTS || (textPart && 'text' in textPart ? textPart.text.replace(/<[^>]*>?/gm, '') : '');
  const thisCardIsSpeaking = ttsControls.isSpeaking && ttsControls.speakingText === textToSpeak;


  useEffect(() => {
    if (contentRef.current) {
        const codeBlocks = contentRef.current.querySelectorAll('pre');
        codeBlocks.forEach(pre => {
            if (pre.parentElement?.classList.contains('code-block-container')) return; // Already processed
            const code = pre.querySelector('code');
            if (!code) return;
            
            const container = document.createElement('div');
            container.className = 'code-block-container bg-gray-900 text-white rounded-lg my-4 overflow-hidden';
            
            const language = code.className.replace(/language-/, '').trim().toLowerCase();
            
            const header = document.createElement('div');
            header.className = 'flex justify-between items-center px-4 py-2 bg-gray-800';
            
            const langDisplay = document.createElement('span');
            langDisplay.className = 'text-xs text-gray-400 font-sans capitalize';
            langDisplay.innerText = language || 'code';
            
            const buttonsWrapper = document.createElement('div');
            buttonsWrapper.className = 'flex items-center gap-2';

            if (['javascript', 'js', 'html'].includes(language)) {
                const runButton = document.createElement('button');
                runButton.className = 'flex items-center gap-1.5 px-2 py-1 bg-green-600/20 text-green-300 rounded-md text-xs hover:bg-green-600/40 transition-colors';
                runButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /></svg><span>Run</span>`;
                buttonsWrapper.appendChild(runButton);

                runButton.addEventListener('click', () => {
                    const existingOutput = container.querySelector('.code-output-container');
                    if (existingOutput) {
                        existingOutput.remove();
                        runButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /></svg><span>Run</span>`;
                        return;
                    }

                    runButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg><span>Close</span>`;

                    const outputContainer = document.createElement('div');
                    outputContainer.className = 'code-output-container border-t border-gray-700';

                    const outputHeader = document.createElement('div');
                    outputHeader.className = 'px-4 py-1.5 bg-gray-800 text-xs text-gray-400 font-sans';
                    outputHeader.innerText = language === 'html' ? 'Preview' : 'Console Output';
                    outputContainer.appendChild(outputHeader);

                    const outputContent = document.createElement('div');
                    outputContainer.appendChild(outputContent);
                    
                    if (language === 'html') {
                        outputContent.className = 'output-content p-4 bg-white';
                        const iframe = document.createElement('iframe');
                        iframe.className = 'w-full h-64 border-0';
                        iframe.sandbox.add('allow-scripts');
                        iframe.srcdoc = code.innerText;
                        outputContent.appendChild(iframe);
                    } else { // javascript or js
                        outputContent.className = 'output-content p-4';
                        const outputPre = document.createElement('pre');
                        outputPre.className = 'text-sm whitespace-pre-wrap font-mono text-gray-300';
                        outputContent.appendChild(outputPre);

                        const logs: string[] = [];
                        const originalConsoleLog = console.log;
                        console.log = (...args) => {
                            logs.push(args.map(a => {
                                try {
                                    return typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a);
                                } catch (e) {
                                    return '[Unserializable Object]';
                                }
                            }).join(' '));
                            originalConsoleLog(...args);
                        };

                        try {
                            const result = new Function(code.innerText)();
                            if (result !== undefined) {
                                logs.push(`// returns: ${JSON.stringify(result, null, 2)}`);
                            }
                        } catch (e) {
                            if (e instanceof Error) {
                                logs.push(`// Error: ${e.message}`);
                            } else {
                                logs.push(`// Error: ${String(e)}`);
                            }
                        } finally {
                            console.log = originalConsoleLog;
                        }

                        if (logs.length > 0) {
                            outputPre.textContent = logs.join('\n');
                        } else {
                            outputPre.innerHTML = `<span class="text-gray-500 italic">No console output.</span>`;
                        }
                    }

                    container.appendChild(outputContainer);
                });
            }

            const copyButton = document.createElement('button');
            copyButton.className = 'flex items-center gap-1.5 px-2 py-1 bg-gray-700 text-gray-300 rounded-md text-xs hover:bg-gray-600 transition-colors';
            const buttonText = document.createElement('span');
            buttonText.innerText = 'Copy';
            const buttonIcon = document.createElement('span');
            buttonIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>`;
            copyButton.appendChild(buttonIcon);
            copyButton.appendChild(buttonText);
            buttonsWrapper.appendChild(copyButton);

            header.appendChild(langDisplay);
            header.appendChild(buttonsWrapper);

            copyButton.addEventListener('click', () => {
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
                  {sources && sources.length > 0 && <Sources sources={sources} isCited={hasCitations} />}
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
          {textToSpeak && (
            <IconButton
              onClick={() => {
                if (thisCardIsSpeaking) {
                  ttsControls.cancel();
                } else {
                  ttsControls.speak(textToSpeak);
                }
              }}
              ariaLabel={thisCardIsSpeaking ? 'Stop reading' : 'Read aloud'}
              icon={
                thisCardIsSpeaking ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon></svg>
                )
              }
            />
          )}
          <IconButton icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>} ariaLabel="Copy response" />
          <IconButton icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.085a2 2 0 00-1.736.97l-2.714 5.428a2 2 0 001.736 2.97h4.618a2 2 0 002-2z" /></svg>} ariaLabel="Good response" />
          <IconButton icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.738 3h4.017c.163 0 .326-.02.485-.06L17 4m-7 10v5a2 2 0 002 2h.085a2 2 0 001.736-.97l2.714-5.428a2 2 0 00-1.736-2.97h-4.618a2 2 0 00-2 2z" /></svg>} ariaLabel="Bad response" />
          <IconButton icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg>} ariaLabel="Share response" />
          <IconButton icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5m11 2v-5h-5" /><path d="M4 9a9 9 0 0115-5.22M20 15a9 9 0 01-15 5.22" /></svg>} ariaLabel="Regenerate response" />
          <IconButton icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h.01M12 12h.01M19 12h.01" /></svg>} ariaLabel="More options" />
      </div>
      {/* Fix: Removed redundant `requestMode !== 'search'` check which caused a TypeScript error. */}
      {sources && sources.length > 0 && <Sources sources={sources} isCited={hasCitations} />}
    </div>
  );
};

export default AnswerCard;
