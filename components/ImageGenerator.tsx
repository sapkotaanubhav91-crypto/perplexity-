
import React, { useState, useCallback } from 'react';
import ImagePromptBar from './ImagePromptBar';
import LoadingSpinner from './LoadingSpinner';
import { generateImage } from '../services/geminiService';

const ImageGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setImageUrl('');

    try {
      const base64Image = await generateImage(prompt);
      setImageUrl(`data:image/jpeg;base64,${base64Image}`);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred while generating the image.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [prompt, isLoading]);

  return (
    <div className="w-full flex flex-col items-center">
      <ImagePromptBar 
        prompt={prompt}
        setPrompt={setPrompt}
        onGenerate={handleGenerate}
        isLoading={isLoading}
      />

      <div className="mt-10 w-full flex flex-col items-center">
        {isLoading && (
            <LoadingSpinner message="Creating your masterpiece... This can take a moment." />
        )}
        {error && (
          <div className="mt-6 p-4 bg-red-900/50 border border-red-700 text-red-300 rounded-lg w-full max-w-2xl">
            <p className="font-semibold">Error:</p>
            <p>{error}</p>
          </div>
        )}
        {!isLoading && imageUrl && (
          <div className="w-full max-w-xl mt-6 p-4 bg-slate-800/50 border border-slate-700 rounded-xl shadow-lg backdrop-blur-sm relative group">
            <img src={imageUrl} alt={prompt} className="rounded-lg w-full h-auto" />
            <a
              href={imageUrl}
              download={`anthara-generated-image.jpg`}
              className="absolute bottom-4 right-4 bg-slate-900/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              aria-label="Download image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageGenerator;
