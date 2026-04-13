"use client";

import type { ChatMessage as ChatMessageType } from "@/types";
import { SourcesPanel } from "./SourcesPanel";

function linkifyCitations(text: string): string {
  // Link statute references: Sec. XXXX.XXX or Section XXXX.XXX
  let result = text.replace(
    /(?:Sec\.|Section)\s+(\d{3,4})\.(\d{3,4}\w*)/g,
    (match, chapter, section) => {
      const url = `https://statutes.capitol.texas.gov/Docs/IN/htm/IN.${chapter}.htm#${chapter}.${section}`;
      return `[${match}](${url})`;
    }
  );

  // Link form references: Form T-XX
  result = result.replace(
    /Form\s+(T-\d+(?:\.\d+)?[A-Z]?)/g,
    (match, formId) => {
      const slug = formId.toLowerCase().replace(/\./g, "-");
      const url = `https://www.tdi.texas.gov/title/documents/form_${slug}.pdf`;
      return `[${match}](${url})`;
    }
  );

  return result;
}

function renderMarkdown(text: string): string {
  let html = text;

  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

  // Links [text](url)
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">$1</a>'
  );

  // Bullet points
  html = html.replace(/^[-•]\s+(.+)$/gm, '<li class="ml-4">$1</li>');
  html = html.replace(
    /(<li[^>]*>.*<\/li>\n?)+/g,
    '<ul class="list-disc space-y-1 my-2">$&</ul>'
  );

  // Paragraphs
  html = html
    .split("\n\n")
    .map((p) => (p.trim() ? `<p class="mb-3 last:mb-0">${p.trim()}</p>` : ""))
    .join("");

  // Line breaks within paragraphs
  html = html.replace(/\n/g, "<br>");

  return html;
}

export function ChatMessage({ message }: { message: ChatMessageType }) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] px-4 py-3 rounded-2xl bg-blue-600 text-white text-sm leading-relaxed">
          {message.content}
        </div>
      </div>
    );
  }

  const linkedContent = linkifyCitations(message.content);
  const html = renderMarkdown(linkedContent);

  return (
    <div className="flex justify-start">
      <div className="max-w-[85%]">
        <div
          className="px-4 py-3 rounded-2xl bg-gray-100 text-gray-900 text-sm leading-relaxed prose prose-sm prose-blue"
          dangerouslySetInnerHTML={{ __html: html }}
        />
        {message.sources && <SourcesPanel sources={message.sources} />}
      </div>
    </div>
  );
}
