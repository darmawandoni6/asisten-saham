"use client";

import React from "react";

interface MarkdownTextProps {
  content: string;
  className?: string;
}

function parseInlineFormatting(text: string): React.ReactNode[] {
  // Regex pattern for bold (**text** or __text__), italic (*text* or _text_), and inline code (`code`)
  const regex = /(\*\*.*?\*\*|__.*?__|\*.*?\*|_.*?_|`.*?`)/g;
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if ((part.startsWith("**") && part.endsWith("**")) || (part.startsWith("__") && part.endsWith("__"))) {
      return (
        <strong key={index} className="font-semibold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if ((part.startsWith("*") && part.endsWith("*")) || (part.startsWith("_") && part.endsWith("_"))) {
      return (
        <em key={index} className="italic text-slate-800">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={index}
          className="px-1.5 py-0.5 rounded-md bg-slate-100 font-mono text-purple-700 text-[11px] font-medium border border-slate-200"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

export function MarkdownText({ content, className = "" }: MarkdownTextProps) {
  if (!content) return null;

  // Split by double line breaks or single line breaks with list items
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let currentList: { type: "ordered" | "unordered"; items: string[] } | null = null;

  const flushList = () => {
    if (!currentList) return;
    if (currentList.type === "ordered") {
      elements.push(
        <ol key={`ol-${elements.length}`} className="space-y-1.5 my-2 pl-1">
          {currentList.items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-slate-700 leading-relaxed">
              <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-bold flex items-center justify-center shrink-0 text-[10px] mt-0.5 font-mono">
                {i + 1}
              </span>
              <span className="flex-1">{parseInlineFormatting(item)}</span>
            </li>
          ))}
        </ol>
      );
    } else {
      elements.push(
        <ul key={`ul-${elements.length}`} className="space-y-1.5 my-2 pl-1">
          {currentList.items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-slate-700 leading-relaxed">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0 mt-2" />
              <span className="flex-1">{parseInlineFormatting(item)}</span>
            </li>
          ))}
        </ul>
      );
    }
    currentList = null;
  };

  lines.forEach((rawLine, idx) => {
    const line = rawLine.trim();

    if (!line) {
      flushList();
      return;
    }

    // Numbered list item: e.g. "1. Item" or "1) Item"
    const orderedMatch = line.match(/^(\d+)[\.\)]\s+(.*)/);
    if (orderedMatch) {
      if (!currentList || currentList.type !== "ordered") {
        flushList();
        currentList = { type: "ordered", items: [] };
      }
      currentList.items.push(orderedMatch[2]);
      return;
    }

    // Bullet list item: e.g. "- Item" or "* Item" or "• Item"
    const unorderedMatch = line.match(/^[-*•]\s+(.*)/);
    if (unorderedMatch) {
      if (!currentList || currentList.type !== "unordered") {
        flushList();
        currentList = { type: "unordered", items: [] };
      }
      currentList.items.push(unorderedMatch[1]);
      return;
    }

    // Headers
    if (line.startsWith("### ")) {
      flushList();
      elements.push(
        <h4 key={`h4-${idx}`} className="text-sm font-bold text-slate-900 mt-3 mb-1">
          {parseInlineFormatting(line.slice(4))}
        </h4>
      );
      return;
    }

    if (line.startsWith("## ")) {
      flushList();
      elements.push(
        <h3 key={`h3-${idx}`} className="text-base font-bold text-slate-900 mt-4 mb-1.5">
          {parseInlineFormatting(line.slice(3))}
        </h3>
      );
      return;
    }

    flushList();
    elements.push(
      <p key={`p-${idx}`} className="leading-relaxed mb-2 last:mb-0 text-slate-700">
        {parseInlineFormatting(line)}
      </p>
    );
  });

  flushList();

  return <div className={`text-sm ${className}`}>{elements}</div>;
}
