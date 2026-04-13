import { createClient } from "@supabase/supabase-js";
import type { ChunkResult } from "@/types";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function searchChunks(
  queryEmbedding: number[],
  matchCount: number = 8,
  matchThreshold: number = 0.5
): Promise<ChunkResult[]> {
  const { data, error } = await supabase.rpc("match_chunks", {
    query_embedding: queryEmbedding,
    match_threshold: matchThreshold,
    match_count: matchCount,
  });

  if (error) {
    console.error("Vector search error:", error);
    throw new Error(`Vector search failed: ${error.message}`);
  }

  return data as ChunkResult[];
}

export async function logQuery(
  question: string,
  chunkIds: string[],
  chunkScores: number[],
  sessionId: string,
  isFollowup: boolean
): Promise<void> {
  const { error } = await supabase.from("query_logs").insert({
    question,
    chunk_ids: chunkIds,
    chunk_scores: chunkScores,
    session_id: sessionId,
    is_followup: isFollowup,
  });

  if (error) {
    console.error("Query log error:", error);
  }
}
