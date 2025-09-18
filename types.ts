
export interface GroundingChunk {
  web: {
    uri: string;
    title: string;
  };
}

export interface SearchResult {
  answer: string;
  sources: GroundingChunk[];
}
