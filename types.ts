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
  isDeepSearch?: boolean; // For user messages to trigger, and model messages to show status.
  isFollowUpPrompt?: boolean; // For model messages to show the "tell me more" button.
  originalUserMessageId?: string; // For model messages to link back to the original user query.
  // New properties for search results UI
  requestMode?: RequestMode;
  userQuery?: string;
  relatedQueries?: string[];
}

export interface TTSControls {
  speak: (text: string) => void;
  cancel: () => void;
  isSpeaking: boolean;
  voices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | undefined;
  setSelectedVoice: (voiceName: string) => void;
}

export type RequestMode =
  | 'search'
  | 'generate'
  | 'explain'
  | 'refactor'
  | 'debug'
  | 'test'
  | 'lint_fix'
  | 'compare'
  | 'document'
  | 'coach'
  | 'redact'
  | 'greeting'
  | 'meta_explain';

export interface ProcessedRequest {
  requestMode: RequestMode;
  prompt: string;
  language?: string;
  domain?: string;
}
