"use client";

import type { ChatMessage as ChatMessageType } from "@/types";
import { SourcesPanel } from "./SourcesPanel";

function linkifyCitations(text: string): string {
  let result = text;

  result = result.replace(
    /(?<!\[)(?:Sec\.|Section)\s+(\d{3,4})\.(\d{3,4}\w*)(?!\])/g,
    (match, chapter, section) => {
      const url = `https://statutes.capitol.texas.gov/Docs/IN/htm/IN.${chapter}.htm#${chapter}.${section}`;
      return `[${match}](${url})`;
    }
  );

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

    let html = trimmed;

    // Bold
    html = html.replace(/\*\*(.+?)\*\*/g, "<strong class=\"text-[#1C1917] font-semibold\">$1</strong>");

    // Inline code
    html = html.replace(
      /`([^`]+)`/g,
      '<code class="bg-[#F5F5F4] text-[#44403C] px-1.5 py-0.5 rounded text-[12px] font-mono">$1</code>'
    );

    // Links [text](url)
    html = html.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-[#2563EB] hover:text-[#1D4ED8] underline decoration-[#93C5FD] underline-offset-2 hover:decoration-[#2563EB] transition-colors duration-150">$1</a>'
    );

    // Headers
    const h2Match = html.match(/^##\s+(.+)$/m);
    if (h2Match) {
      rendered.push(
        `<h3 class="text-[14px] font-bold text-[#1C1917] mt-5 mb-2 tracking-tight">${h2Match[1]}</h3>`
      );
      continue;
    }
    const h3Match = html.match(/^###\s+(.+)$/m);
    if (h3Match) {
      rendered.push(
        `<h4 class="text-[13px] font-semibold text-[#292524] mt-4 mb-1.5">${h3Match[1]}</h4>`
      );
      continue;
    }

    // Lists
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
          return `<li class="text-[#44403C] pl-1">${content}</li>`;
        })
        .join("");
      rendered.push(
        `<ul class="list-disc pl-5 space-y-2 my-3 text-[13px] leading-relaxed marker:text-[#D6D3D1]">${items}</ul>`
      );
      continue;
    }

    if (isNumberedList) {
      const items = lines
        .filter((l) => l.trim())
        .map((l) => {
          const content = l.trim().replace(/^\d+\.\s+/, "");
          return `<li class="text-[#44403C] pl-1">${content}</li>`;
        })
        .join("");
      rendered.push(
        `<ol class="list-decimal pl-5 space-y-2 my-3 text-[13px] leading-relaxed marker:text-[#A8A29E]">${items}</ol>`
      );
      continue;
    }

    // Mixed paragraph + list
    const hasListItems = lines.some((l) => /^[-•*]\s+/.test(l.trim()));
    if (hasListItems) {
      let sub = "";
      let currentList: string[] = [];

      for (const line of lines) {
        const tl = line.trim();
        if (/^[-•*]\s+/.test(tl)) {
          currentList.push(tl.replace(/^[-•*]\s+/, ""));
        } else {
          if (currentList.length) {
            const items = currentList
              .map((c) => `<li class="text-[#44403C] pl-1">${c}</li>`)
              .join("");
            sub += `<ul class="list-disc pl-5 space-y-2 my-2 text-[13px] leading-relaxed marker:text-[#D6D3D1]">${items}</ul>`;
            currentList = [];
          }
          if (tl) {
            sub += `<p class="mb-2 text-[#44403C] text-[13px] leading-relaxed">${tl}</p>`;
          }
        }
      }
      if (currentList.length) {
        const items = currentList
          .map((c) => `<li class="text-[#44403C] pl-1">${c}</li>`)
          .join("");
        sub += `<ul class="list-disc pl-5 space-y-2 my-2 text-[13px] leading-relaxed marker:text-[#D6D3D1]">${items}</ul>`;
      }
      rendered.push(sub);
      continue;
    }

    // Regular paragraph
    const withBreaks = html.replace(/\n/g, "<br>");
    rendered.push(
      `<p class="mb-3 text-[#44403C] text-[13px] leading-[1.7]">${withBreaks}</p>`
    );
  }

  return rendered.join("");
}

export function ChatMessage({ message }: { message: ChatMessageType }) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] px-4 py-3 rounded-xl bg-[#2563EB] text-white text-[13px] leading-relaxed shadow-[0_1px_2px_0_rgb(0_0_0/0.05)]">
          {message.content}
        </div>
      </div>
    );
  }

  const linkedContent = linkifyCitations(message.content);
  const html = renderMarkdown(linkedContent);

  return (
    <div className="flex justify-start">
      <div className="max-w-[90%] sm:max-w-[85%]">
        <div
          className="px-5 py-4 rounded-xl bg-white border border-[#E7E5E4] shadow-[0_1px_3px_0_rgb(0_0_0/0.04),0_1px_2px_-1px_rgb(0_0_0/0.04)] select-text"
          dangerouslySetInnerHTML={{ __html: html }}
        />
        {message.sources && <SourcesPanel sources={message.sources} />}
      </div>
    </div>
  );
}
