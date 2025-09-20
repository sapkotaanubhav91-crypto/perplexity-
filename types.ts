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

export interface TTSControls {
  speak: (text: string) => void;
  cancel: () => void;
  isSpeaking: boolean;
  voices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | undefined;
  setSelectedVoice: (voiceName: string) => void;
}

export type RequestType = 'search' | 'generate' | 'edit';

export interface ProcessedRequest {
  requestType: RequestType;
  prompt: string;
}
