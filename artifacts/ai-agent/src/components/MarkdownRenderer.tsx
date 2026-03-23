import React from "react";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import type { SyntaxHighlighterProps } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

const components: Components = {
  code({ className, children, ...props }) {
    const match = /language-(\w+)/.exec(className ?? "");
    const isInline = !match;

    if (isInline) {
      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    }

    const syntaxProps: SyntaxHighlighterProps = {
      style: vscDarkPlus,
      language: match[1],
      PreTag: "div",
      customStyle: { margin: 0, borderRadius: 0, background: "#050507" },
      children: String(children).replace(/\n$/, ""),
    };

    return (
      <div className="relative mt-4 mb-6 rounded-xl overflow-hidden border border-white/10 shadow-lg">
        <div className="flex items-center px-4 py-2 bg-[#0d0d12]/80 backdrop-blur-md border-b border-white/5">
          <span className="text-xs font-mono text-white/50">{match[1]}</span>
        </div>
        <SyntaxHighlighter {...syntaxProps} />
      </div>
    );
  },
  table({ children }) {
    return (
      <div className="overflow-x-auto my-6 rounded-xl border border-white/10">
        <table className="w-full text-left border-collapse min-w-[600px]">{children}</table>
      </div>
    );
  },
  th({ children }) {
    return (
      <th className="bg-white/5 p-3 font-semibold border-b border-white/10 text-white/80">
        {children}
      </th>
    );
  },
  td({ children }) {
    return <td className="p-3 border-b border-white/5 text-white/70">{children}</td>;
  },
};

export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="prose prose-invert max-w-none break-words">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
