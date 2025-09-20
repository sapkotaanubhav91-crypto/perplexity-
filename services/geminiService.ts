// Fix: Use a type alias for the SDK's Part type to disambiguate from the app's internal Part type.
import { GoogleGenAI, Chat, Part as GeminiPart, Type, Modality } from "@google/genai";
// Fix: Explicitly import the app's internal Part type.
import { ChatMessage, GroundingChunk, ProcessedRequest, Part } from '../types';

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

export async function processUserRequest(parts: Part[]): Promise<ProcessedRequest> {
  const textPart = parts.find(p => 'text' in p) as { text: string } | undefined;
  const imagePart = parts.find(p => 'inlineData' in p);
  const userText = textPart?.text.trim() || '';

  if (!userText && imagePart) {
    return { requestType: 'search', prompt: 'Describe this image.' };
  }
  if (!userText && !imagePart) {
    return { requestType: 'search', prompt: '' };
  }

  let contents: string;
  let responseSchema: any;

  if (imagePart) {
    contents = `Analyze the user's request which includes an image and text. Determine if the user wants to EDIT the image based on the text prompt, or if they are just asking a QUESTION about the image.
    User's text: "${userText}"
    
    If it is an edit request, the 'requestType' should be 'edit' and the 'prompt' should be the user's text.
    If it is a question about the image, the 'requestType' should be 'search' and the 'prompt' should be the user's original text.`;
    
    responseSchema = {
      type: Type.OBJECT,
      properties: {
        requestType: { type: Type.STRING, description: "Either 'edit' or 'search'." },
        prompt: { type: Type.STRING, description: "The prompt for the subsequent action." },
      }
    };
  } else {
    contents = `Is the following user request an instruction to create, generate, draw, or make an image? 
    User request: "${userText}". 
    
    If it is an image generation request, the 'requestType' should be 'generate' and the 'prompt' should be a concise, descriptive prompt for an image model.
    If it is not an image generation request, the 'requestType' should be 'search' and the 'prompt' should be the user's original text.`;

    responseSchema = {
      type: Type.OBJECT,
      properties: {
        requestType: { type: Type.STRING, description: "Either 'generate' or 'search'." },
        prompt: { type: Type.STRING, description: "The prompt for the subsequent action." },
      }
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        responseMimeType: "application/json",
        responseSchema,
      }
    });

    const jsonString = response.text.trim();
    const result = JSON.parse(jsonString) as ProcessedRequest;

    if (['search', 'generate', 'edit'].includes(result.requestType) && typeof result.prompt === 'string') {
      return result;
    }
    
    throw new Error("Invalid JSON schema from classification model.");
  } catch (error) {
    console.error("Error processing user request intent:", error);
    return { requestType: 'search', prompt: userText };
  }
}

export async function* sendMessageStream(
  messages: ChatMessage[],
  isDeepSearch: boolean = false
): AsyncGenerator<{ text: string; sources: GroundingChunk[] }> {
  if (!chat) {
    chat = initializeChat();
  }

  const lastUserMessage = messages[messages.length - 1];
  if (!lastUserMessage || lastUserMessage.role !== 'user') {
    return;
  }

  // Fix: Ensure userParts is typed as GeminiPart[] for compatibility with the SDK.
  const userParts: GeminiPart[] = JSON.parse(JSON.stringify(lastUserMessage.parts));

  if (isDeepSearch) {
    const textPartIndex = userParts.findIndex(p => 'text' in p);
    if (textPartIndex !== -1) {
      const textPart = userParts[textPartIndex] as { text: string };
      textPart.text = `${DEEP_SEARCH_PROMPT} "${textPart.text}"`;
    } else {
      userParts.unshift({ text: `${DEEP_SEARCH_PROMPT} "Analyze this image"` });
    }
  }

  try {
    // Fix: Pass the correctly typed userParts to the SDK.
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

export async function editImage(parts: Part[]): Promise<Part[]> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image-preview',
      // Fix: Cast the app's internal Part[] to GeminiPart[] for the SDK call.
      contents: { parts: parts as GeminiPart[] },
      config: {
          responseModalities: [Modality.IMAGE, Modality.TEXT],
      },
    });

    const responseParts = response.candidates?.[0]?.content?.parts;
    if (!responseParts || responseParts.length === 0) {
        throw new Error("The model did not return any content for the image edit.");
    }
    
    // Fix: Map the SDK's GeminiPart response back to the app's internal Part type.
    const newParts: Part[] = responseParts.map((part: GeminiPart): Part => {
      if (part.text) {
        return { text: part.text };
      }
      if (part.inlineData && part.inlineData.data && part.inlineData.mimeType) {
        return { 
          inlineData: { 
            data: part.inlineData.data,
            mimeType: part.inlineData.mimeType,
          } 
        };
      }
      return { text: '' }; 
    }).filter(part => ('text' in part && part.text) || 'inlineData' in part);

    if (newParts.length === 0) {
        throw new Error("Could not parse the edited image from the model's response.");
    }

    return newParts;
  } catch (error) {
    console.error("Error editing image:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to edit image: ${error.message}`);
    }
    throw new Error("An unknown error occurred while editing the image.");
  }
}