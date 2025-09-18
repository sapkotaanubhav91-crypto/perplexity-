
import React, { useState, useCallback } from 'react';
import Header from './components/Header';
import SearchBar from './components/SearchBar';
import LoadingSpinner from './components/LoadingSpinner';
import AnswerCard from './components/AnswerCard';
import { getAiAnswer } from './services/geminiService';
import { GroundingChunk } from './types';

const App: React.FC = () => {
  const [query, setQuery] = useState<string>('');
  const [answer, setAnswer] = useState<string>('');
  const [sources, setSources] = useState<GroundingChunk[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async () => {
    if (!query.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setAnswer('');
    setSources([]);

    try {
      const result = await getAiAnswer(query);
      setAnswer(result.answer);
      setSources(result.sources);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [query, isLoading]);

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans flex flex-col items-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-3xl flex flex-col items-center pt-16">
        <Header />
        <p className="text-center text-slate-400 mb-8 max-w-xl">
          Your AI-powered answer engine. Ask anything and get a direct answer with cited sources from the web.
        </p>
        <SearchBar 
          query={query}
          setQuery={setQuery}
          onSearch={handleSearch}
          isLoading={isLoading}
        />

        <div className="mt-10 w-full flex flex-col items-center">
          {isLoading && <LoadingSpinner />}
          {error && (
            <div className="mt-6 p-4 bg-red-900/50 border border-red-700 text-red-300 rounded-lg w-full max-w-2xl">
              <p className="font-semibold">Error:</p>
              <p>{error}</p>
            </div>
          )}
          {!isLoading && answer && (
            <AnswerCard answer={answer} sources={sources} />
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
