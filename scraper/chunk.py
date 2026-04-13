#!/usr/bin/env python3
"""
Chunking pipeline for TIBM content.

Takes the raw scraped content and splits into ~500-token chunks
suitable for embedding and vector search. Preserves metadata
and creates overlap between chunks for context continuity.
"""

import json
import os
import re
import hashlib

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "output")
INPUT_FILE = os.path.join(OUTPUT_DIR, "structured", "all_content.json")
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "structured", "chunks_for_embedding.json")

# Rough token estimation: ~4 chars per token for English text
TARGET_CHUNK_TOKENS = 500
MAX_CHUNK_TOKENS = 800
OVERLAP_TOKENS = 50
CHARS_PER_TOKEN = 4

TARGET_CHARS = TARGET_CHUNK_TOKENS * CHARS_PER_TOKEN
MAX_CHARS = MAX_CHUNK_TOKENS * CHARS_PER_TOKEN
OVERLAP_CHARS = OVERLAP_TOKENS * CHARS_PER_TOKEN


def split_text(text, max_chars=MAX_CHARS, overlap_chars=OVERLAP_CHARS):
    """Split text into overlapping chunks at sentence boundaries."""
    if len(text) <= max_chars:
        return [text]

    chunks = []
    start = 0

    while start < len(text):
        end = start + max_chars

        if end >= len(text):
            chunks.append(text[start:].strip())
            break

        # Try to break at a sentence boundary
        search_start = start + TARGET_CHARS
        best_break = end

        # Look for sentence endings (. ! ? followed by space/newline)
        for pattern in [r'\.\s', r'\n\n', r'\n', r';\s', r',\s']:
            matches = list(re.finditer(pattern, text[search_start:end]))
            if matches:
                best_break = search_start + matches[-1].end()
                break

        chunk = text[start:best_break].strip()
        if chunk:
            chunks.append(chunk)

        # Move forward with overlap
        start = best_break - overlap_chars
        if start <= (best_break - max_chars):
            start = best_break

    return chunks


def create_embedding_chunks(raw_chunks):
    """Process raw chunks into embedding-ready chunks."""
    embedding_chunks = []
    chunk_id = 0

    for raw in raw_chunks:
        content = raw["content"].strip()
        if not content or len(content) < 30:
            continue

        text_chunks = split_text(content)
        total_parts = len(text_chunks)

        for i, chunk_text in enumerate(text_chunks):
            chunk_id += 1

            # Build the title prefix for context
            title = raw.get("title", "")
            section = raw.get("section", "")

            # Prepend title/section info so embeddings have context
            context_prefix = ""
            if section:
                context_prefix += f"[{section}] "
            if title and title != section:
                context_prefix += f"{title}\n\n"

            full_text = context_prefix + chunk_text

            embedding_chunks.append({
                "id": f"chunk_{chunk_id:04d}",
                "parent_id": raw.get("id", ""),
                "content": full_text,
                "raw_content": chunk_text,
                "metadata": {
                    "section": section,
                    "section_id": raw.get("section_id", ""),
                    "title": title,
                    "rule_id": raw.get("rule_id"),
                    "form_id": raw.get("form_id"),
                    "chapter": raw.get("chapter"),
                    "statute_section": raw.get("statute_section"),
                    "source_url": raw.get("source_url", ""),
                    "content_type": raw.get("content_type", ""),
                    "chunk_index": i,
                    "total_chunks": total_parts,
                },
                "char_count": len(full_text),
                "estimated_tokens": len(full_text) // CHARS_PER_TOKEN,
            })

    return embedding_chunks


def main():
    print("Loading raw content...")
    with open(INPUT_FILE) as f:
        raw_chunks = json.load(f)
    print(f"Loaded {len(raw_chunks)} raw chunks")

    print("Creating embedding chunks...")
    chunks = create_embedding_chunks(raw_chunks)
    print(f"Created {len(chunks)} embedding chunks")

    # Stats
    total_tokens = sum(c["estimated_tokens"] for c in chunks)
    avg_tokens = total_tokens // len(chunks) if chunks else 0
    max_tokens = max(c["estimated_tokens"] for c in chunks) if chunks else 0
    min_tokens = min(c["estimated_tokens"] for c in chunks) if chunks else 0

    print(f"\nStats:")
    print(f"  Total estimated tokens: {total_tokens:,}")
    print(f"  Avg tokens per chunk: {avg_tokens}")
    print(f"  Min tokens: {min_tokens}")
    print(f"  Max tokens: {max_tokens}")
    print(f"  Chunks > 800 tokens: {sum(1 for c in chunks if c['estimated_tokens'] > 800)}")

    # By content type
    by_type = {}
    for c in chunks:
        ct = c["metadata"]["content_type"]
        by_type[ct] = by_type.get(ct, 0) + 1
    print(f"  By type: {by_type}")

    with open(OUTPUT_FILE, 'w') as f:
        json.dump(chunks, f, indent=2)
    print(f"\nSaved to {OUTPUT_FILE}")

    # Estimated embedding cost (text-embedding-3-small: $0.02/1M tokens)
    cost = (total_tokens / 1_000_000) * 0.02
    print(f"Estimated embedding cost (text-embedding-3-small): ${cost:.4f}")


if __name__ == "__main__":
    main()
