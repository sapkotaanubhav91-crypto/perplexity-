
import React from 'react';
import { GroundingChunk } from '../types';

interface SourcesProps {
  sources: GroundingChunk[];
}

const Sources: React.FC<SourcesProps> = ({ sources }) => {
  if (sources.length === 0) {
    return null;
  }

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold text-slate-300 mb-3">Sources:</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {sources.map((source, index) => (
          <a
            key={index}
            href={source.web.uri}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-3 bg-slate-800 rounded-lg border border-slate-700 hover:bg-slate-700/50 hover:border-blue-500 transition-all duration-200"
          >
            <p className="text-blue-400 font-medium truncate">{source.web.title}</p>
            <p className="text-slate-500 text-sm truncate">{source.web.uri}</p>
          </a>
        ))}
      </div>
    </div>
  );
};

export default Sources;
