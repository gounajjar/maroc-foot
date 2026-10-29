import type { ReactNode } from "react";

export const accountCard = "rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 dark:bg-white/5 dark:ring-white/10";

// Narrow centred card shared by the account screens.
export function AccountShell({ title, intro, children }: { title: string; intro?: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-md space-y-5">
      <header>
        <h1 className="font-display text-3xl font-extrabold">{title}</h1>
        {intro && <p className="mt-1 opacity-70">{intro}</p>}
      </header>
      <div className={accountCard}>{children}</div>
    </div>
  );
}
