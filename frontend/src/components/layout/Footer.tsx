import { Ticket } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-[#f0f0f3] py-10 px-6 dark:border-white/[0.06] dark:bg-[#09090b]">
      <div className="mx-auto max-w-7xl flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-500">
            <Ticket className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-sm font-bold text-gray-900 dark:text-white">ChainTix</span>
        </div>
        <p className="text-sm text-gray-500 dark:text-zinc-500">
          Built on Ethereum. Owned by you.
        </p>
      </div>
    </footer>
  );
}
