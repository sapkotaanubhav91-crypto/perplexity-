export interface GroundingChunk {
  web?: {
    uri: string;
    title?: string;
  };
}

export type Part = { text: string } | { inlineData: { mimeType: string; data: string } };

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  parts: Part[];
  sources?: GroundingChunk[];
  isDeepSearch?: boolean; // Only for user messages
}
