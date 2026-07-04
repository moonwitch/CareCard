"use client";

import { useEffect, useState } from "react";

const KEY_STORAGE = "carecard.anthropicKey";

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
  const [apiKey, setApiKey] = useState("");
  const [keySaved, setKeySaved] = useState(false);

  // Load the user's saved key from the browser on mount. It lives only here —
  // the key is never sent to our server except transiently on generate.
  useEffect(() => {
    const stored = localStorage.getItem(KEY_STORAGE);
    if (stored) {
      setApiKey(stored);
      setKeySaved(true);
    }
  }, []);

  function saveKey() {
    if (!apiKey.trim()) return;
    localStorage.setItem(KEY_STORAGE, apiKey.trim());
    setKeySaved(true);
  }

  function clearKey() {
    localStorage.removeItem(KEY_STORAGE);
    setApiKey("");
    setKeySaved(false);
  }

  async function generate() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-anthropic-key": apiKey.trim(),
        },
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
        {/* Bring your own key: stored only in this browser, never on our server. */}
        <div className="mb-4 rounded-lg bg-current/5 p-3">
          <label className="flex flex-col gap-1 text-sm">
            Your Anthropic API key
            <div className="flex gap-2">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setKeySaved(false);
                }}
                placeholder="sk-ant-..."
                autoComplete="off"
                className="flex-1 rounded-lg border border-current/20 bg-transparent px-3 py-2 text-sm"
              />
              {keySaved ? (
                <button
                  onClick={clearKey}
                  className="rounded-lg border border-current/20 px-3 py-2 text-sm hover:bg-current/5"
                >
                  Clear
                </button>
              ) : (
                <button
                  onClick={saveKey}
                  className="rounded-lg border border-current/20 px-3 py-2 text-sm hover:bg-current/5"
                >
                  Save
                </button>
              )}
            </div>
          </label>
          <p className="mt-1.5 text-xs opacity-60">
            {keySaved ? "Saved in this browser only. " : ""}
            Your key stays in your browser and is used only to call Claude — it
            is never stored on our server. Get one at console.anthropic.com.
          </p>
        </div>

        <textarea
          value={appointment}
          onChange={(e) => setAppointment(e.target.value)}
          rows={2}
          placeholder="e.g. Seeing my GP about ongoing headaches and trouble sleeping"
          className="mb-3 w-full rounded-lg border border-current/20 bg-transparent px-3 py-2 text-sm"
        />
        <button
          onClick={generate}
          disabled={pending || !hasProfile || !apiKey.trim()}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
        >
          {pending ? "Preparing…" : "Generate document"}
        </button>
        {!hasProfile && (
          <p className="mt-2 text-sm text-amber-600">
            Save your profile above first.
          </p>
        )}
        {hasProfile && !apiKey.trim() && (
          <p className="mt-2 text-sm text-amber-600">
            Add your Anthropic API key above to generate.
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
