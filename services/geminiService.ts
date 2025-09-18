
import { GoogleGenAI } from "@google/genai";
import { SearchResult } from '../types';

export const getAiAnswer = async (prompt: string): Promise<SearchResult> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set. Please ensure it is configured to use the AI search.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const answer = response.text;
    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    return { answer, sources };
  } catch (error) {
    console.error("Error fetching AI answer:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to get answer from AI: ${error.message}`);
    }
    throw new Error("An unknown error occurred while fetching the AI answer.");
  }
};
