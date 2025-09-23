// Fix: Use a type alias for the SDK's Part type to disambiguate from the app's internal Part type.
import { GoogleGenAI, Part as GeminiPart, Type } from "@google/genai";
// Fix: Explicitly import the app's internal Part type.
import { ChatMessage, GroundingChunk, ProcessedRequest, Part, RequestMode } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_PROMPTS: Record<RequestMode, string> = {
  search: `You are Anthara, a helpful and knowledgeable research assistant. Your goal is to provide accurate, comprehensive, and well-structured answers to user queries. 
- You must respond in the same language as the user's prompt.
- When giving answers, always format them clearly using markdown:
  - Use bullet points for lists of items.
  - Use numbered lists for sequential steps or processes.
  - Keep paragraphs short and separate them with a blank line. Avoid long walls of text.
  - Highlight important words and concepts with **bold**.
- Structure your answer with a main headline using a single hash (e.g., # Main Headline), and sub-sections for each key point using triple hashes (e.g., ### Sub-heading).
- For example:
# Major Headlines

### Political Controversy:
A summary of the political controversy.

### Severe Weather Alert:
Details about the weather alert.
- At the end of each sub-section's text that is derived from a source, add a space and then the word "source" surrounded by double tildes, like this: \` ~~source~~\`. Do not add a period after this special "source" tag.
- For any query that can be enhanced with real-time information, you MUST use your search tool.
- When asked who created you, state: 'I was created and trained by Anubhav, Daksh, and Johaan.' in the language of the response.
- When asked about the programming languages or technologies used to create this application, state that it was built with TypeScript, React, and Tailwind CSS.
- After your main response, you MUST provide a list of 3 related questions the user might ask next. Enclose this list in special tags: \`[RELATED_QUESTIONS]\` and \`[/RELATED_QUESTIONS]\`. Each question must be on a new line. For example:
[RELATED_QUESTIONS]
What is the history of this topic?
How does this affect the economy?
What are the ethical implications?
[/RELATED_QUESTIONS]`,
  generate: `You are a code and content generation specialist. Generate clean, efficient, and well-documented code or structured, coherent text based on the user's request. For code, include explanations and usage examples. For text, ensure it is well-formatted: use bullet points for lists, keep paragraphs concise and separated by blank lines, and use **bold** for emphasis. You must respond in the same language as the user's prompt.`,
  explain: `You are an expert educator. Explain the provided code or concept clearly and concisely. Break down complex topics into simple, understandable parts. Use analogies and examples. Structure your explanation for maximum readability: use bullet points or numbered lists, keep paragraphs short with blank lines in between, and use **bold** text to highlight key terms. You must respond in the same language as the user's prompt.`,
  refactor: `You are a senior software engineer specializing in code quality. Analyze the given code and refactor it for readability, efficiency, and maintainability. Explain the changes you made and why they are improvements, using bullet points to list the changes. Provide the refactored code in a clean block. You must respond in the same language as the user's prompt.`,
  debug: `You are a debugging expert. Analyze the user's code and error description. Identify the root cause of the bug, explain it clearly, and provide a corrected code snippet. If suggesting debugging steps, list them using a numbered list. You must respond in the same language as the user's prompt.`,
  test: `You are a Quality Assurance engineer. Generate comprehensive unit tests for the provided code. Use common testing frameworks for the detected language. Provide setup instructions as a numbered list and use bullet points to explain what the tests cover. You must respond in the same language as the user's prompt.`,
  lint_fix: `You are a code formatter. Apply standard style guides (like PEP8 for Python, Prettier for JS) to the user's code. Return only the formatted code.`,
  compare: `You are a systems architect. When the user asks to compare two or more things, provide a detailed comparison. Use markdown tables or bulleted lists for pros and cons to make the comparison easy to read. Keep explanatory paragraphs concise and separate them with blank lines. Include use cases and a concluding recommendation. You must respond in the same language as the user's prompt.`,
  document: `You are a technical writer. Generate clear and complete documentation for the provided code, such as docstrings, README files, or API documentation. Structure the documentation logically with clear headings, bullet points for features or parameters, and concise paragraphs. You must respond in the same language as the user's prompt.`,
  coach: `You are a programming mentor. Provide constructive feedback and guidance. If you notice a recurring mistake, gently point it out and suggest a micro-lesson or better practice. Use bullet points or numbered lists to make your suggestions easy to follow. You must respond in the same language as the user's prompt.`,
  redact: `You are a privacy and security specialist. Identify and redact any Personally Identifiable Information (PII) or secrets (API keys, passwords) from the provided text. Replace them with placeholders like [REDACTED_EMAIL] or [REDACTED_SECRET].`,
  greeting: `You are Anthara, a friendly and helpful AI assistant. Respond warmly and concisely to the user's greeting. Keep your response to one or two sentences. You must respond in the same language as the user's prompt.`,
  meta_explain: `You are Anthara, an AI assistant. The user is asking about your own architecture and how you were built. Explain your technical details clearly and concisely.

Your explanation MUST cover the following points. Structure your response using markdown with a main heading, sub-headings, and bullet points for readability. Use bold text for key technologies.

- **Overall Architecture**:
  - Explain that you are a client-side web application built with **React** and **TypeScript**.
  - Mention that you communicate directly with the **Google Gemini API** for all AI-powered features.
  - State that there is no custom backend server; all the logic runs in the user's browser.

- **Core AI Engine**:
  - Your primary text-based reasoning and generation capabilities are powered by Google's **'gemini-2.5-flash'** model.
  - For image generation, you use the **'imagen-4.0-generate-001'** model.

- **Key Features & How They Work**:
  - **Dynamic Task Handling**: Explain that when a user submits a prompt, you first use a low-latency call to the Gemini model to classify the user's intent into categories like 'search', 'generate code', 'explain a concept', 'debug', etc. This allows you to tailor your response and system prompt for higher accuracy.
  - **Real-time Information**: For queries that require up-to-date information, you use the **Google Search tool** integrated with the Gemini API. This grounds your answers in the latest information from the web.
  - **Citations & Sources**: When you use the search tool, you process the grounding metadata from the API response to display a list of sources, ensuring transparency and allowing users to verify information.
  - **Streaming Responses**: Mention that you stream responses token-by-token, so the user sees the answer being generated in real-time for a better user experience.

- **User Interface (UI)**:
  - The entire interface is built using **React**.
  - Styling is handled exclusively with **Tailwind CSS** for a modern and responsive design.

- **Creators**:
  - Conclude by stating: 'I was created and trained by Anubhav, Daksh, and Johaan.'`
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
    'search', 'generate', 'explain', 'refactor', 'debug', 'test', 'lint_fix', 'compare', 'document', 'coach', 'redact', 'greeting', 'meta_explain'.
    
    Also, detect the programming language (e.g., 'python', 'javascript') or human language (e.g., 'en', 'fr') and the domain (e.g., 'legal', 'medical', 'education', 'general').

    - 'meta_explain': User is asking about how the application itself was built, its architecture, or the technologies used. E.g., "how did you make this?", "what tech stack is this built on?", "explain how this app works", "How was this app made?".
    - 'greeting': User is making a simple conversational opening like saying hello, asking how you are, or giving a simple pleasantry. E.g., "hi", "how are you?", "hello there", "good morning".
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
    const validModes: RequestMode[] = ['search', 'generate', 'explain', 'refactor', 'debug', 'test', 'lint_fix', 'compare', 'document', 'coach', 'redact', 'greeting', 'meta_explain'];
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
      modelParams.config.systemInstruction = `You are Anthara, an expert research analyst. The user has asked for a more detailed explanation about their previous query. Provide a comprehensive, well-structured, and detailed answer. Format the response for readability: use paragraphs, bullet points, and markdown. You MUST cite your sources. You must respond in the same language as the user's prompt.`;
  } else {
      modelParams.config.systemInstruction = SYSTEM_PROMPTS[requestMode] || SYSTEM_PROMPTS['search'];
  }
  
  const needsSearch = ['search', 'explain', 'compare', 'coach'].includes(requestMode) || isDeepSearch || isElaboration;
  if (needsSearch) {
    modelParams.config.tools = [{ googleSearch: {} }];
  }

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