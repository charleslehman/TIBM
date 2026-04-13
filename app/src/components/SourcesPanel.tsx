"use client";

import { useState } from "react";
import type { ChunkResult } from "@/types";

function getSourceUrl(metadata: ChunkResult["metadata"]): string {
  const url = metadata.source_url;
  if (!url) return "";
  if (url.startsWith("http")) return url;
  if (url.startsWith("/")) return `https://www.tdi.texas.gov${url}`;
  return `https://www.tdi.texas.gov/title/${url}`;
}

function getSourceLabel(metadata: ChunkResult["metadata"]): string {
  if (metadata.statute_section) return `Sec. ${metadata.statute_section}`;
  if (metadata.rule_id) return metadata.rule_id;
  if (metadata.form_id) return `Form ${metadata.form_id}`;
  return metadata.title || metadata.section;
}

export function SourcesPanel({ sources }: { sources: ChunkResult[] }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!sources?.length) return null;

  return (
    <div className="mt-3 border-t border-gray-100 pt-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
      >
        <svg
          className={`w-3.5 h-3.5 transition-transform ${isOpen ? "rotate-90" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
        {sources.length} source{sources.length !== 1 ? "s" : ""} referenced
      </button>
      {isOpen && (
        <div className="mt-2 space-y-2">
          {sources.map((source, i) => {
            const url = getSourceUrl(source.metadata);
            const label = getSourceLabel(source.metadata);
            const score = Math.round(source.similarity * 100);

            return (
              <div
                key={source.id}
                className="flex items-start gap-2 text-xs p-2 bg-gray-50 rounded"
              >
                <span className="text-gray-400 font-mono shrink-0">
                  {score}%
                </span>
                <div className="min-w-0">
                  {url ? (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {label}
                    </a>
                  ) : (
                    <span className="font-medium text-gray-700">{label}</span>
                  )}
                  <span className="text-gray-400 ml-2">
                    {source.metadata.section}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
