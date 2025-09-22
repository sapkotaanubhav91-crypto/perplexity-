import React, { useState } from 'react';
import { GroundingChunk } from '../types';

interface SourcesProps {
  sources: GroundingChunk[];
}

const MAX_INITIAL_SOURCES = 3;

const Sources: React.FC<SourcesProps> = ({ sources }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const validSources = sources.filter(source => source.web?.uri && source.web?.title);

  if (validSources.length === 0) {
    return null;
  }

  const displayedSources = isExpanded ? validSources : validSources.slice(0, MAX_INITIAL_SOURCES);
  const remainingSourcesCount = validSources.length - MAX_INITIAL_SOURCES;

  return (
    <div className="mt-6">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-3">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72"></path></svg>
        Sources
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {displayedSources.map((source, index) => {
          const hostname = new URL(source.web.uri).hostname.replace('www.', '');
          return (
            <a
              key={index}
              href={source.web.uri}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-3 bg-gray-100 rounded-lg border border-transparent hover:border-gray-300 transition-all duration-200 group"
            >
              <div className="flex items-center gap-2 mb-1">
                <img 
                  src={`https://www.google.com/s2/favicons?sz=32&domain_url=${hostname}`} 
                  alt={`${hostname} favicon`} 
                  className="w-4 h-4 object-contain"
                />
                <p className="text-sm font-medium text-gray-800 truncate group-hover:underline">{source.web.title}</p>
              </div>
              <p className="text-gray-500 text-xs truncate">{hostname}</p>
            </a>
          );
        })}
        {!isExpanded && remainingSourcesCount > 0 && (
          <button
            onClick={() => setIsExpanded(true)}
            className="flex items-center justify-center p-3 bg-gray-100 rounded-lg border border-transparent hover:border-gray-300 transition-all duration-200 text-sm font-medium text-gray-700"
          >
            View {remainingSourcesCount} more
          </button>
        )}
      </div>
    </div>
  );
};

export default Sources;
