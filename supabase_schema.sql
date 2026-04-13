-- Supabase schema for TIBM vector search
-- Run this in the Supabase SQL editor

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

-- Create index for fast similarity search
create index if not exists chunks_embedding_idx
  on chunks using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- Index on metadata for filtering
create index if not exists chunks_metadata_idx
  on chunks using gin (metadata);

-- Query logging table (business intelligence)
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
