
export interface GroundingChunk {
  web: {
    // FIX: The 'uri' property is optional in the @google/genai GroundingChunk type.
    // Making it optional here to match and resolve the TypeScript error.
    uri?: string;
    title: string;
  };
}

export interface SearchResult {
  answer: string;
  sources: GroundingChunk[];
}
