
import React from 'react';
import { GroundingChunk } from '../types';
import Sources from './Sources';

interface AnswerCardProps {
  answer: string;
  sources: GroundingChunk[];
}

const AnswerCard: React.FC<AnswerCardProps> = ({ answer, sources }) => {
  if (!answer) {
    return null;
  }
  
  // Basic paragraph splitting
  const paragraphs = answer.split('\n').filter(p => p.trim() !== '');

  return (
    <div className="w-full max-w-3xl mt-10 p-6 bg-slate-800/50 border border-slate-700 rounded-xl shadow-lg backdrop-blur-sm">
      <div className="prose prose-invert max-w-none text-slate-200">
        {paragraphs.map((p, i) => (
          <p key={i} className="mb-4 leading-relaxed">{p}</p>
        ))}
      </div>
      <Sources sources={sources} />
    </div>
  );
};

export default AnswerCard;
