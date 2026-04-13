import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { generateQueryEmbedding } from "@/lib/embeddings";
import { searchChunks, logQuery } from "@/lib/supabase";
import { SYSTEM_PROMPT, buildUserPrompt } from "@/lib/prompts";
import type { ChatMessage, ChatRequest, ChunkResult } from "@/types";

export const maxDuration = 30;

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function formatContextFromChunks(chunks: ChunkResult[]): string {
  return chunks
    .map((chunk, i) => {
      const meta = chunk.metadata;
      let header = `--- Source ${i + 1}`;
      if (meta.statute_section) header += ` | Sec. ${meta.statute_section}`;
      if (meta.rule_id) header += ` | ${meta.rule_id}`;
      if (meta.form_id) header += ` | Form ${meta.form_id}`;
      header += ` | ${meta.section}`;
      if (meta.source_url) header += ` | ${meta.source_url}`;
      header += " ---";

      return `${header}\n${chunk.raw_content}`;
    })
    .join("\n\n");
}

function formatConversationHistory(history: ChatMessage[]): string {
  const recent = history.slice(-6);
  if (recent.length === 0) return "";

  return recent
    .map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
    .join("\n\n");
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { message, history, session_id } = body;

    if (!message?.trim()) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    const queryEmbedding = await generateQueryEmbedding(message);

    const chunks = await searchChunks(queryEmbedding, 8, 0.4);

    const context = formatContextFromChunks(chunks);
    const conversationHistory = formatConversationHistory(history);
    const userPrompt = buildUserPrompt(message, context, conversationHistory);

    let response: Anthropic.Message | undefined;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        response = await anthropic.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1500,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: userPrompt }],
        });
        break;
      } catch (e) {
        if (attempt === 2) throw e;
        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
      }
    }

    if (!response) throw new Error("Failed to get response from Claude");

    const assistantMessage =
      response.content[0].type === "text" ? response.content[0].text : "";

    const isFollowup = history.length > 0;
    logQuery(
      message,
      chunks.map((c) => c.id),
      chunks.map((c) => c.similarity),
      session_id,
      isFollowup
    ).catch(console.error);

    return NextResponse.json({
      message: assistantMessage,
      sources: chunks.map((c) => ({
        id: c.id,
        content: c.content,
        raw_content: c.raw_content,
        metadata: c.metadata,
        similarity: c.similarity,
      })),
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error("Chat API error:", errMsg, error);
    return NextResponse.json(
      { error: "An error occurred processing your request", details: errMsg },
      { status: 500 }
    );
  }
}
