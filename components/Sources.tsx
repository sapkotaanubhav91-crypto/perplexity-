import React from 'react';
import { GroundingChunk } from '../types';

interface SourcesProps {
  sources: GroundingChunk[];
}

const Sources: React.FC<SourcesProps> = ({ sources }) => {
  const validSources = sources.filter(source => source.web?.uri && source.web?.title);

  if (validSources.length === 0) {
    return null;
  }

  return (
    <div className="mt-8 border-t border-gray-200 pt-4">
      <h3 className="text-base font-semibold text-gray-600 mb-3">Sources:</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {validSources.map((source, index) => (
          <a
            key={index}
            href={source.web.uri}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 hover:border-primary/50 transition-all duration-200"
          >
            <p className="text-primary font-medium truncate">{source.web.title}</p>
            <p className="text-gray-500 text-sm truncate">{source.web.uri}</p>
          </a>
        ))}
      </div>
    </div>
  );
};

export default Sources;