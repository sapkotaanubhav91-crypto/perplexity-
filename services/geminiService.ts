import { GoogleGenAI, Chat, Part } from "@google/genai";
import { ChatMessage, GroundingChunk } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
let chat: Chat | null = null;

function initializeChat(): Chat {
  return ai.chats.create({
    model: "gemini-2.5-flash",
    config: {
      tools: [{ googleSearch: {} }],
    },
  });
}

const DEEP_SEARCH_PROMPT = `
  You are an expert research analyst. Your task is to conduct a deep and thorough investigation into the user's query.
  Break down the main topic into critical sub-topics.
  For each sub-topic, formulate detailed questions and perform comprehensive searches.
  Synthesize the information you gather from all sources into a cohesive, well-structured, and detailed report.
  The report must cover the following aspects:
  1.  **Background and Introduction:** Provide a general overview of the topic.
  2.  **Current State:** Detail the current situation, including recent developments and key players.
  3.  **Challenges and Criticisms:** Objectively present any challenges, controversies, or criticisms associated with the topic.
  4.  **Future Outlook:** Analyze the future trends and potential developments.
  Ensure that all claims and data points are supported by citing the sources you use.
  The final output should be a comprehensive report, not a simple answer.
  User's query is:
`;

export async function* sendMessageStream(
  messages: ChatMessage[],
  isDeepSearch: boolean = false
): AsyncGenerator<{ text: string; sources: GroundingChunk[] }> {
  if (!chat) {
    chat = initializeChat();
  }

  // Find the last user message to send
  const lastUserMessage = messages[messages.length - 1];
  if (!lastUserMessage || lastUserMessage.role !== 'user') {
    return;
  }

  const userParts: Part[] = JSON.parse(JSON.stringify(lastUserMessage.parts));

  if (isDeepSearch) {
    const textPartIndex = userParts.findIndex(p => 'text' in p);
    if (textPartIndex !== -1) {
      const textPart = userParts[textPartIndex] as { text: string };
      textPart.text = `${DEEP_SEARCH_PROMPT} "${textPart.text}"`;
    } else {
      // If user sent only an image with deep search, prepend a text part
      userParts.unshift({ text: `${DEEP_SEARCH_PROMPT} "Analyze this image"` });
    }
  }

  try {
    const stream = await chat.sendMessageStream({ message: userParts });

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


// Keep generateImage for potential future use or if another component needs it.
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

    const base64ImageBytes = response.generatedImages?.[0]?.image?.imageBytes;
    if (!base64ImageBytes) {
      throw new Error("No image was generated. The response may have been blocked.");
    }
    return base64ImageBytes;
  } catch (error) {
    console.error("Error generating image:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to generate image: ${error.message}`);
    }
    throw new Error("An unknown error occurred while generating the image.");
  }
}
