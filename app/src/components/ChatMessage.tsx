"use client";

import type { ChatMessage as ChatMessageType } from "@/types";
import { SourcesPanel } from "./SourcesPanel";

function linkifyCitations(text: string): string {
  // Don't linkify inside existing markdown links
  let result = text;

  // Link statute references: Sec. XXXX.XXX or Section XXXX.XXX
  result = result.replace(
    /(?<!\[)(?:Sec\.|Section)\s+(\d{3,4})\.(\d{3,4}\w*)(?!\])/g,
    (match, chapter, section) => {
      const url = `https://statutes.capitol.texas.gov/Docs/IN/htm/IN.${chapter}.htm#${chapter}.${section}`;
      return `[${match}](${url})`;
    }
  );

  // Link form references: Form T-XX (but not if already in a link)
  result = result.replace(
    /(?<!\[)Form\s+(T-\d+(?:\.\d+)?[A-Z]?)(?!\])/g,
    (match, formId) => {
      const slug = formId.toLowerCase().replace(/\./g, "-");
      const url = `https://www.tdi.texas.gov/title/documents/form_${slug}.pdf`;
      return `[${match}](${url})`;
    }
  );

  return result;
}

function renderMarkdown(text: string): string {
  const blocks = text.split("\n\n");
  const rendered: string[] = [];

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    // Process inline formatting first
    let html = trimmed;

    // Bold
    html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

    // Inline code
    html = html.replace(
      /`([^`]+)`/g,
      '<code class="bg-gray-200/70 text-gray-800 px-1.5 py-0.5 rounded text-[13px] font-mono">$1</code>'
    );

    // Links [text](url)
    html = html.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline decoration-blue-300 hover:decoration-blue-600 transition-colors">$1</a>'
    );

    // Check if block is a header
    const h2Match = html.match(/^##\s+(.+)$/m);
    if (h2Match) {
      rendered.push(
        `<h3 class="text-[15px] font-bold text-gray-900 mt-6 mb-2 leading-snug">${h2Match[1]}</h3>`
      );
      continue;
    }
    const h3Match = html.match(/^###\s+(.+)$/m);
    if (h3Match) {
      rendered.push(
        `<h4 class="text-sm font-semibold text-gray-900 mt-5 mb-1.5 leading-snug">${h3Match[1]}</h4>`
      );
      continue;
    }

    // Check if block is a list
    const lines = html.split("\n");
    const isBulletList = lines.every(
      (l) => /^[-•*]\s+/.test(l.trim()) || !l.trim()
    );
    const isNumberedList = lines.every(
      (l) => /^\d+\.\s+/.test(l.trim()) || !l.trim()
    );

    if (isBulletList) {
      const items = lines
        .filter((l) => l.trim())
        .map((l) => {
          const content = l.trim().replace(/^[-•*]\s+/, "");
          return `<li>${content}</li>`;
        })
        .join("");
      rendered.push(
        `<ul class="list-disc pl-5 space-y-1.5 my-3 text-gray-700">${items}</ul>`
      );
      continue;
    }

    if (isNumberedList) {
      const items = lines
        .filter((l) => l.trim())
        .map((l) => {
          const content = l.trim().replace(/^\d+\.\s+/, "");
          return `<li>${content}</li>`;
        })
        .join("");
      rendered.push(
        `<ol class="list-decimal pl-5 space-y-1.5 my-3 text-gray-700">${items}</ol>`
      );
      continue;
    }

    // Check if block contains mixed content (paragraph + list items)
    const hasListItems = lines.some((l) => /^[-•*]\s+/.test(l.trim()));
    if (hasListItems) {
      let subRendered = "";
      let currentList: string[] = [];

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (/^[-•*]\s+/.test(trimmedLine)) {
          currentList.push(trimmedLine.replace(/^[-•*]\s+/, ""));
        } else {
          if (currentList.length) {
            const items = currentList
              .map((c) => `<li>${c}</li>`)
              .join("");
            subRendered += `<ul class="list-disc pl-5 space-y-1.5 my-2 text-gray-700">${items}</ul>`;
            currentList = [];
          }
          if (trimmedLine) {
            subRendered += `<p class="mb-2 text-gray-800 leading-relaxed">${trimmedLine}</p>`;
          }
        }
      }
      if (currentList.length) {
        const items = currentList.map((c) => `<li>${c}</li>`).join("");
        subRendered += `<ul class="list-disc pl-5 space-y-1.5 my-2 text-gray-700">${items}</ul>`;
      }
      rendered.push(subRendered);
      continue;
    }

    // Regular paragraph
    const withBreaks = html.replace(/\n/g, "<br>");
    rendered.push(
      `<p class="mb-3 text-gray-800 leading-relaxed">${withBreaks}</p>`
    );
  }

  return rendered.join("");
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
      <div className="max-w-[88%] sm:max-w-[85%]">
        <div
          className="px-5 py-4 rounded-2xl bg-gray-50 border border-gray-100 text-sm leading-relaxed select-text"
          dangerouslySetInnerHTML={{ __html: html }}
        />
        {message.sources && <SourcesPanel sources={message.sources} />}
      </div>
    </div>
  );
}
