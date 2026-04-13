export interface ChunkMetadata {
  section: string;
  section_id: string;
  title: string;
  rule_id: string | null;
  form_id: string | null;
  chapter: string | null;
  statute_section: string | null;
  source_url: string;
  content_type: string;
  chunk_index: number;
  total_chunks: number;
}

export interface ChunkResult {
  id: string;
  content: string;
  raw_content: string;
  metadata: ChunkMetadata;
  similarity: number;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  sources?: ChunkResult[];
}

export interface ChatRequest {
  message: string;
  history: ChatMessage[];
  session_id: string;
}

export interface ChatResponse {
  message: string;
  sources: ChunkResult[];
}
