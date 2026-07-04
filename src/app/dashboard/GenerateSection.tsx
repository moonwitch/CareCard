"use client";

import { useState } from "react";

// Minimal, safe markdown rendering for the generated document: supports
// headings, bullet lists, and bold. Avoids pulling in a full markdown library
// for the POC. Text is rendered as React children, so it is never injected as raw HTML.
function renderMarkdown(md: string) {
  const lines = md.split("\n");
  const blocks: React.ReactNode[] = [];
  let list: string[] = [];

  const flushList = (key: number) => {
    if (list.length === 0) return;
    blocks.push(
      <ul key={`ul-${key}`}>
        {list.map((li, i) => (
          <li key={i}>{renderInline(li)}</li>
        ))}
      </ul>
    );
    list = [];
  };

  lines.forEach((raw, i) => {
    const line = raw.trimEnd();
    if (line.startsWith("## ")) {
      flushList(i);
      blocks.push(<h2 key={i}>{renderInline(line.slice(3))}</h2>);
    } else if (line.startsWith("# ")) {
      flushList(i);
      blocks.push(<h1 key={i}>{renderInline(line.slice(2))}</h1>);
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      list.push(line.slice(2));
    } else if (line.trim() === "") {
      flushList(i);
    } else {
      flushList(i);
      blocks.push(<p key={i}>{renderInline(line)}</p>);
    }
  });
  flushList(lines.length);
  return blocks;
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i}>{part.slice(2, -2)}</strong>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

export function GenerateSection({ hasProfile }: { hasProfile: boolean }) {
  const [appointment, setAppointment] = useState("");
  const [doc, setDoc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function generate() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointment: appointment || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setDoc(data.content);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="rounded-xl border border-current/10 p-5 print:border-0">
      <h2 className="mb-1 text-lg font-semibold print:hidden">
        Prepare my appointment document
      </h2>
      <p className="mb-4 text-sm opacity-60 print:hidden">
        Optionally say what this appointment is about, then let CareCard write a
        one-page document you can print or hand over.
      </p>

      <div className="print:hidden">
        <textarea
          value={appointment}
          onChange={(e) => setAppointment(e.target.value)}
          rows={2}
          placeholder="e.g. Seeing my GP about ongoing headaches and trouble sleeping"
          className="mb-3 w-full rounded-lg border border-current/20 bg-transparent px-3 py-2 text-sm"
        />
        <button
          onClick={generate}
          disabled={pending || !hasProfile}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
        >
          {pending ? "Preparing…" : "Generate document"}
        </button>
        {!hasProfile && (
          <p className="mt-2 text-sm text-amber-600">
            Save your profile above first.
          </p>
        )}
        {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      </div>

      {doc && (
        <div className="mt-6">
          <div className="mb-3 flex gap-2 print:hidden">
            <button
              onClick={() => window.print()}
              className="rounded-lg border border-current/20 px-3 py-1.5 text-sm hover:bg-current/5"
            >
              Print / Save as PDF
            </button>
            <button
              onClick={() => navigator.clipboard.writeText(doc)}
              className="rounded-lg border border-current/20 px-3 py-1.5 text-sm hover:bg-current/5"
            >
              Copy text
            </button>
          </div>
          <article className="doc rounded-lg border border-current/10 bg-white p-6 text-black print:border-0">
            {renderMarkdown(doc)}
          </article>
        </div>
      )}
    </section>
  );
}
