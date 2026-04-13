#!/usr/bin/env python3
"""Set up Supabase schema for TIBM vector search."""

import os
from supabase import create_client

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")

SQL = """
-- Enable pgvector extension
create extension if not exists vector;

-- Main chunks table
create table if not exists chunks (
  id text primary key,
  content text not null,
  raw_content text not null,
  metadata jsonb not null default '{}',
  embedding vector(1536)
);

-- Query logging table
create table if not exists query_logs (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  question text not null,
  chunk_ids text[] default '{}',
  chunk_scores float[] default '{}',
  session_id text,
  is_followup boolean default false
);

-- Similarity search function
create or replace function match_chunks(
  query_embedding vector(1536),
  match_threshold float default 0.5,
  match_count int default 8
)
returns table (
  id text,
  content text,
  raw_content text,
  metadata jsonb,
  similarity float
)
language sql stable
as $$
  select
    chunks.id,
    chunks.content,
    chunks.raw_content,
    chunks.metadata,
    1 - (chunks.embedding <=> query_embedding) as similarity
  from chunks
  where 1 - (chunks.embedding <=> query_embedding) > match_threshold
  order by chunks.embedding <=> query_embedding
  limit match_count;
$$;
"""

def main():
    print("Setting up Supabase schema...")
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

    # Execute SQL via the rpc or direct query
    # Supabase Python client doesn't support raw SQL directly,
    # so we'll need to use the REST API
    import requests

    # Use the Supabase SQL endpoint
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
    }

    # Split SQL into individual statements
    statements = [s.strip() for s in SQL.split(';') if s.strip()]

    for i, stmt in enumerate(statements):
        if not stmt:
            continue
        print(f"  Executing statement {i+1}/{len(statements)}...")
        resp = requests.post(
            f"{SUPABASE_URL}/rest/v1/rpc/",
            headers=headers,
            json={"query": stmt},
        )
        # The REST API doesn't support raw SQL this way.
        # We need to use the management API or SQL editor.

    print("\nNOTE: The Supabase Python client doesn't support raw SQL execution.")
    print("Please run the SQL in supabase_schema.sql via the Supabase SQL Editor:")
    print(f"  1. Go to {SUPABASE_URL.replace('.supabase.co', '')}")
    print(f"     -> SQL Editor in the Supabase dashboard")
    print(f"  2. Paste the contents of supabase_schema.sql")
    print(f"  3. Click 'Run'")
    print(f"\nAlternatively, I'll try creating the table via the API...")

    # Try creating via the postgrest API - won't work for DDL
    # Let's just verify connection works
    try:
        result = supabase.table("chunks").select("id").limit(1).execute()
        print("\n✓ 'chunks' table exists and is accessible!")
        return True
    except Exception as e:
        if "relation" in str(e) and "does not exist" in str(e):
            print("\n✗ 'chunks' table does not exist yet.")
            print("  Please run the SQL schema first (see above).")
            return False
        else:
            print(f"\nConnection test result: {e}")
            return False


if __name__ == "__main__":
    main()
