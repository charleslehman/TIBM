#!/usr/bin/env python3
"""
Embedding pipeline for TIBM content.

Generates embeddings using OpenAI text-embedding-3-small and
uploads to Supabase pgvector table.

Required env vars:
  OPENAI_API_KEY
  SUPABASE_URL
  SUPABASE_SERVICE_KEY
"""

import json
import os
import sys
import time

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "output")
CHUNKS_FILE = os.path.join(OUTPUT_DIR, "structured", "chunks_for_embedding.json")
EMBEDDINGS_FILE = os.path.join(OUTPUT_DIR, "structured", "chunks_with_embeddings.json")

EMBEDDING_MODEL = "text-embedding-3-small"
EMBEDDING_DIMENSIONS = 1536
BATCH_SIZE = 100  # OpenAI allows up to 2048


def generate_embeddings(chunks):
    """Generate embeddings for all chunks using OpenAI."""
    from openai import OpenAI

    client = OpenAI()
    all_embeddings = []

    for i in range(0, len(chunks), BATCH_SIZE):
        batch = chunks[i:i + BATCH_SIZE]
        texts = [c["content"] for c in batch]

        print(f"  Embedding batch {i // BATCH_SIZE + 1}/{(len(chunks) - 1) // BATCH_SIZE + 1} ({len(texts)} chunks)...")

        response = client.embeddings.create(
            model=EMBEDDING_MODEL,
            input=texts,
            dimensions=EMBEDDING_DIMENSIONS,
        )

        for j, embedding_data in enumerate(response.data):
            chunks[i + j]["embedding"] = embedding_data.embedding

        time.sleep(0.5)  # Rate limiting

    return chunks


def upload_to_supabase(chunks):
    """Upload chunks with embeddings to Supabase."""
    from supabase import create_client

    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_KEY")

    if not url or not key:
        print("SUPABASE_URL and SUPABASE_SERVICE_KEY required for upload.")
        print("Skipping upload. Embeddings saved locally.")
        return False

    supabase = create_client(url, key)

    print(f"\nUploading {len(chunks)} chunks to Supabase...")

    for i in range(0, len(chunks), 50):
        batch = chunks[i:i + 50]
        rows = []

        for chunk in batch:
            rows.append({
                "id": chunk["id"],
                "content": chunk["content"],
                "raw_content": chunk["raw_content"],
                "metadata": chunk["metadata"],
                "embedding": chunk["embedding"],
            })

        try:
            supabase.table("chunks").upsert(rows).execute()
            print(f"  Uploaded batch {i // 50 + 1}/{(len(chunks) - 1) // 50 + 1}")
        except Exception as e:
            print(f"  ERROR uploading batch: {e}")
            return False

        time.sleep(0.3)

    print("Upload complete!")
    return True


def main():
    print("Loading chunks...")
    with open(CHUNKS_FILE) as f:
        chunks = json.load(f)
    print(f"Loaded {len(chunks)} chunks")

    # Check for OpenAI key
    if not os.environ.get("OPENAI_API_KEY"):
        print("\nERROR: OPENAI_API_KEY not set.")
        print("Run: export OPENAI_API_KEY=your-key-here")
        sys.exit(1)

    print("\nGenerating embeddings...")
    chunks = generate_embeddings(chunks)

    # Save locally (without embeddings to keep file size reasonable,
    # and with embeddings for backup)
    print(f"\nSaving embeddings to {EMBEDDINGS_FILE}...")
    with open(EMBEDDINGS_FILE, 'w') as f:
        json.dump(chunks, f)
    print(f"Saved ({os.path.getsize(EMBEDDINGS_FILE) / 1024 / 1024:.1f} MB)")

    # Upload to Supabase
    upload_to_supabase(chunks)


if __name__ == "__main__":
    main()
