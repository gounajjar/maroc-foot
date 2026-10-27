"use client";

import { useId, useState, type ReactNode } from "react";

export type Tab = { id: string; label: string; content: ReactNode };

// Buttons above a panel that switch between views. Every panel is rendered on
// the server; switching only changes which one is visible.
export function Tabs({ tabs }: { tabs: Tab[] }) {
  const [selected, setSelected] = useState(tabs[0]?.id);
  const base = useId();

  return (
    <div>
      <div role="tablist" className="mb-4 flex gap-1 rounded-full bg-black/5 p-1 dark:bg-white/10">
        {tabs.map((tab) => {
          const active = tab.id === selected;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`${base}-${tab.id}-tab`}
              aria-selected={active}
              aria-controls={`${base}-${tab.id}`}
              onClick={() => setSelected(tab.id)}
              className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold transition ${
                active ? "bg-brand-red text-white shadow-sm" : "opacity-70 hover:opacity-100"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      {tabs.map((tab) => (
        <div key={tab.id} role="tabpanel" id={`${base}-${tab.id}`} aria-labelledby={`${base}-${tab.id}-tab`} hidden={tab.id !== selected}>
          {tab.content}
        </div>
      ))}
    </div>
  );
}
