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
    <div className="mt-2 ml-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 text-[11px] text-[#A8A29E] hover:text-[#78716C] transition-colors duration-150"
      >
        <svg
          className={`w-3 h-3 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 5l7 7-7 7"
          />
        </svg>
        {sources.length} source{sources.length !== 1 ? "s" : ""} referenced
      </button>
      {isOpen && (
        <div className="mt-2 space-y-1.5 animate-[fadeIn_0.15s_ease-out]">
          {sources.map((source) => {
            const url = getSourceUrl(source.metadata);
            const label = getSourceLabel(source.metadata);
            const score = Math.round(source.similarity * 100);

            return (
              <div
                key={source.id}
                className="flex items-start gap-2.5 text-[11px] px-3 py-2 bg-[#FAFAF9] border border-[#F5F5F4] rounded-lg"
              >
                <span className="text-[#D6D3D1] font-mono tabular-nums shrink-0 mt-px">
                  {score}%
                </span>
                <div className="min-w-0">
                  {url ? (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-[#2563EB] hover:text-[#1D4ED8] underline-offset-2 hover:underline transition-colors duration-150"
                    >
                      {label}
                    </a>
                  ) : (
                    <span className="font-medium text-[#44403C]">{label}</span>
                  )}
                  <span className="text-[#D6D3D1] ml-2">
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
