import React from 'react';

const suggestions = [
  { text: 'How to prepare for a Himalayan trek', icon: '⛰️' },
  { text: 'Relaxing hobbies to reduce stress and boost focus', icon: '🧘' },
  { text: 'Startups\' role in innovation', icon: '🚀' },
  { text: 'Indian Nobel laureates and their achievements', icon: '🏆' },
];

interface SuggestionChipsProps {
  onSuggestionClick: (suggestion: string) => void;
}

const SuggestionChips: React.FC<SuggestionChipsProps> = ({ onSuggestionClick }) => {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
      {suggestions.map((suggestion) => (
        <button
          key={suggestion.text}
          onClick={() => onSuggestionClick(suggestion.text)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100/80 border border-gray-200/80 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
        >
          <span>{suggestion.icon}</span>
          <span>{suggestion.text}</span>
        </button>
      ))}
    </div>
  );
};

export default SuggestionChips;