
import { GoogleGenAI } from "@google/genai";
import { SearchResult } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getAiAnswer = async (prompt: string): Promise<SearchResult> => {
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
