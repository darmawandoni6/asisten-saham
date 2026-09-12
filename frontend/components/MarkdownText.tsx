import React from 'react';

import { cn } from '@/lib/utils';

interface MarkdownTextProps {
  content: string;
  className?: string;
}

function parseInlineFormatting(text: string): React.ReactNode[] {
  // Regex pattern for bold (**text** or __text__), italic (*text* or _text_), and inline code (`code`)
  const regex = /(\*\*.*?\*\*|__.*?__|\*.*?\*|_.*?_|`.*?`)/g;
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if ((part.startsWith('**') && part.endsWith('**')) || (part.startsWith('__') && part.endsWith('__'))) {
      return (
        <strong key={index} className="font-semibold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if ((part.startsWith('*') && part.endsWith('*')) || (part.startsWith('_') && part.endsWith('_'))) {
      return (
        <em key={index} className="text-slate-800 italic">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={index}
          className="rounded-md border border-slate-200 bg-slate-100 px-1.5 py-0.5 font-mono text-xs font-medium text-purple-700"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

export function MarkdownText({ content, className = '' }: MarkdownTextProps) {
  if (!content) return null;

  // Split by double line breaks or single line breaks with list items
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let currentList: { type: 'ordered' | 'unordered'; items: string[] } | null = null;

  const flushList = () => {
    if (!currentList) return;
    if (currentList.type === 'ordered') {
      elements.push(
        <ol key={`ol-${elements.length}`} className="my-2 space-y-1.5 pl-1">
          {currentList.items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 leading-relaxed text-slate-700">
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-100 font-mono text-[10px] font-bold text-slate-700">
                {i + 1}
              </span>
              <span className="flex-1">{parseInlineFormatting(item)}</span>
            </li>
          ))}
        </ol>,
      );
    } else {
      elements.push(
        <ul key={`ul-${elements.length}`} className="my-2 space-y-1.5 pl-1">
          {currentList.items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 leading-relaxed text-slate-700">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-purple-500" />
              <span className="flex-1">{parseInlineFormatting(item)}</span>
            </li>
          ))}
        </ul>,
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
      if (!currentList || currentList.type !== 'ordered') {
        flushList();
        currentList = { type: 'ordered', items: [] };
      }
      currentList.items.push(orderedMatch[2]);
      return;
    }

    // Bullet list item: e.g. "- Item" or "* Item" or "• Item"
    const unorderedMatch = line.match(/^[-*•]\s+(.*)/);
    if (unorderedMatch) {
      if (!currentList || currentList.type !== 'unordered') {
        flushList();
        currentList = { type: 'unordered', items: [] };
      }
      currentList.items.push(unorderedMatch[1]);
      return;
    }

    // Headers
    if (line.startsWith('### ')) {
      flushList();
      elements.push(
        <h4 key={`h4-${idx}`} className="mt-3 mb-1 text-sm font-bold text-slate-900">
          {parseInlineFormatting(line.slice(4))}
        </h4>,
      );
      return;
    }

    if (line.startsWith('## ')) {
      flushList();
      elements.push(
        <h3 key={`h3-${idx}`} className="mt-4 mb-1.5 text-base font-bold text-slate-900">
          {parseInlineFormatting(line.slice(3))}
        </h3>,
      );
      return;
    }

    flushList();
    elements.push(
      <p key={`p-${idx}`} className="mb-2 leading-relaxed text-slate-700">
        {parseInlineFormatting(line)}
      </p>,
    );
  });

  flushList();

  return <div className={cn('text-sm', className)}>{elements}</div>;
}
