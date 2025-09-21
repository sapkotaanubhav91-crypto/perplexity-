// Fix: Use a type alias for the SDK's Part type to disambiguate from the app's internal Part type.
import { GoogleGenAI, Part as GeminiPart, Type } from "@google/genai";
// Fix: Explicitly import the app's internal Part type.
import { ChatMessage, GroundingChunk, ProcessedRequest, Part, RequestMode } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_PROMPTS: Record<RequestMode, string> = {
  search: `You are Anthara AI, a helpful and knowledgeable research assistant. Your goal is to provide accurate, comprehensive, and well-structured answers to user queries. 
- You must respond in the same language as the user's prompt.
- Always format your responses for readability using markdown (paragraphs, bullet points, bold text).
- For any query that can be enhanced with real-time information, you MUST use your search tool.
- You MUST cite your sources by listing them at the end of your response.
- When asked who created you, state: 'I was created and trained by Anubhav, Daksh, and Johaan.' in the language of the response.
- When asked about the programming languages or technologies used to create this application, state that it was built with TypeScript, React, and Tailwind CSS.`,
  generate: `You are a code and content generation specialist. Generate clean, efficient, and well-documented code or structured, coherent text based on the user's request. For code, include explanations and usage examples. You must respond in the same language as the user's prompt.`,
  explain: `You are an expert educator. Explain the provided code or concept clearly and concisely. Break down complex topics into simple, understandable parts. Use analogies and examples. Offer different levels of detail if appropriate (brief, standard, tutorial). You must respond in the same language as the user's prompt.`,
  refactor: `You are a senior software engineer specializing in code quality. Analyze the given code and refactor it for readability, efficiency, and maintainability. Explain the changes you made and why they are improvements. Provide the refactored code in a clean block. You must respond in the same language as the user's prompt.`,
  debug: `You are a debugging expert. Analyze the user's code and error description. Identify the root cause of the bug, explain it, and provide a corrected code snippet. Suggest debugging steps like adding log statements if the issue is not obvious. You must respond in the same language as the user's prompt.`,
  test: `You are a Quality Assurance engineer. Generate comprehensive unit tests for the provided code. Use common testing frameworks for the detected language. Include setup instructions and explain what the tests cover. You must respond in the same language as the user's prompt.`,
  lint_fix: `You are a code formatter. Apply standard style guides (like PEP8 for Python, Prettier for JS) to the user's code. Return only the formatted code.`,
  compare: `You are a systems architect. When the user asks to compare two or more things, provide a detailed comparison table or list. Include pros, cons, use cases, and a concluding recommendation. You must respond in the same language as the user's prompt.`,
  document: `You are a technical writer. Generate clear and complete documentation for the provided code, such as docstrings, README files, or API documentation. You must respond in the same language as the user's prompt.`,
  coach: `You are a programming mentor. Provide constructive feedback and guidance. If you notice a recurring mistake, gently point it out and suggest a micro-lesson or better practice. You must respond in the same language as the user's prompt.`,
  redact: `You are a privacy and security specialist. Identify and redact any Personally Identifiable Information (PII) or secrets (API keys, passwords) from the provided text. Replace them with placeholders like [REDACTED_EMAIL] or [REDACTED_SECRET].`
};


export async function processUserRequest(parts: Part[]): Promise<ProcessedRequest> {
  const textPart = parts.find(p => 'text' in p) as { text: string } | undefined;
  const userText = textPart?.text.trim() || '';

  if (!userText) {
    if (parts.some(p => 'inlineData' in p)) {
        return { requestMode: 'explain', prompt: 'Describe this image.', language: 'en', domain: 'general' };
    }
    return { requestMode: 'search', prompt: '', language: 'en', domain: 'general' };
  }

  const classificationPrompt = `
    Analyze the user's request and classify it into one of the following modes:
    'search', 'generate', 'explain', 'refactor', 'debug', 'test', 'lint_fix', 'compare', 'document', 'coach', 'redact'.
    
    Also, detect the programming language (e.g., 'python', 'javascript') or human language (e.g., 'en', 'fr') and the domain (e.g., 'legal', 'medical', 'education', 'general').

    - 'generate': User wants to create something new (code, essay, plan). E.g., "write a python function", "create a lesson plan".
    - 'explain': User wants an explanation. E.g., "what does this code do?", "explain black holes", "describe this image".
    - 'refactor': User wants to improve existing code. E.g., "refactor this", "make this more efficient".
    - 'debug': User has an error. E.g., "why is this not working?", "fix this bug".
    - 'test': User wants tests for code. E.g., "write unit tests for this".
    - 'lint_fix': User wants to format or style code. E.g., "format this code", "apply PEP8".
    - 'compare': User wants to compare options. E.g., "what's better, X or Y?".
    - 'document': User wants documentation. E.g., "add docstrings to this function".
    - 'coach': User is asking for advice on how to improve. E.g., "how can I get better at CSS?".
    - 'redact': User wants to remove sensitive info. E.g., "remove personal info from this text".
    - 'search': For anything else, general questions, or if unsure.

    The user's request is: "${userText}"
  `;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      requestMode: { type: Type.STRING, description: "One of the specified modes." },
      language: { type: Type.STRING, description: "The detected language code (e.g., 'python', 'en')." },
      domain: { type: Type.STRING, description: "The detected domain (e.g., 'legal', 'general')." },
    }
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: classificationPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema,
      }
    });
    const result = JSON.parse(response.text.trim());
    const validModes: RequestMode[] = ['search', 'generate', 'explain', 'refactor', 'debug', 'test', 'lint_fix', 'compare', 'document', 'coach', 'redact'];
    const determinedMode = validModes.includes(result.requestMode) ? result.requestMode as RequestMode : 'search';

    return {
      requestMode: determinedMode,
      prompt: userText,
      language: result.language,
      domain: result.domain,
    };
  } catch (error) {
    console.error("Error processing user request intent:", error);
    return { requestMode: 'search', prompt: userText, language: 'en', domain: 'general' };
  }
}

export async function* sendMessageStream({
  history,
  requestMode = 'search',
  isDeepSearch = false,
  isElaboration = false
}: {
  history: ChatMessage[],
  requestMode?: RequestMode,
  isDeepSearch?: boolean,
  isElaboration?: boolean
}): AsyncGenerator<{ text: string; sources: GroundingChunk[] }> {

  const lastMessage = history[history.length - 1];
  if (!lastMessage || lastMessage.role !== 'user') {
    return;
  }
  
  const contents = history.map(msg => ({
      role: msg.role,
      parts: JSON.parse(JSON.stringify(msg.parts)) as GeminiPart[],
  }));

  const modelParams: any = {
      model: "gemini-2.5-flash",
      contents: contents,
      config: {}
  };
  
  if (isElaboration) {
      modelParams.config.systemInstruction = `You are Anthara AI, an expert research analyst. The user has asked for a more detailed explanation about their previous query. Provide a comprehensive, well-structured, and detailed answer. Format the response for readability: use paragraphs, bullet points, and markdown. You MUST cite your sources. You must respond in the same language as the user's prompt.`;
  } else {
      modelParams.config.systemInstruction = SYSTEM_PROMPTS[requestMode] || SYSTEM_PROMPTS['search'];
  }
  
  modelParams.config.tools = [{ googleSearch: {} }];

  if (isDeepSearch) {
      const lastContent = modelParams.contents[modelParams.contents.length - 1];
      const textPartIndex = lastContent.parts.findIndex(p => 'text' in p);
      if (textPartIndex !== -1) {
          const textPart = lastContent.parts[textPartIndex] as { text: string };
          textPart.text = `Perform a deep and thorough analysis for the following request: "${textPart.text}"`;
      }
  }
  
  try {
    const stream = await ai.models.generateContentStream(modelParams);

    for await (const chunk of stream) {
      const text = chunk.text;
      const groundingChunks: any[] = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      
      const sources: GroundingChunk[] = groundingChunks
        .filter((c): c is { web: { uri: string; title: string } } =>
          c && c.web && typeof c.web.uri === 'string'
        );

      yield { text, sources };
    }
  } catch (error) {
    console.error("Error sending message stream:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to get response stream: ${error.message}`);
    }
    throw new Error("An unknown error occurred while streaming the response.");
  }
}

// Fix: Add generateImage function to handle image generation requests.
export async function generateImage(prompt: string): Promise<string> {
  try {
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '1:1',
      },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
      return response.generatedImages[0].image.imageBytes;
    } else {
      throw new Error('No image was generated.');
    }
  } catch (error) {
    console.error("Error generating image:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to generate image: ${error.message}`);
    }
    throw new Error("An unknown error occurred while generating the image.");
  }
}