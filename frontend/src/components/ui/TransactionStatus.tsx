import { Check, X, Loader2 } from 'lucide-react';

type TxStep = 'pending' | 'confirming' | 'confirmed' | 'failed';

interface TransactionStatusProps {
  step: TxStep;
  hash?: string;
  message?: string;
}

export function TransactionStatus({ step, hash, message }: TransactionStatusProps) {
  const steps: { key: TxStep; label: string }[] = [
    { key: 'pending', label: 'Submitting transaction...' },
    { key: 'confirming', label: 'Waiting for confirmation...' },
    { key: 'confirmed', label: message || 'Transaction confirmed!' },
  ];

  const currentIndex = step === 'failed' ? -1 : steps.findIndex(s => s.key === step);

  return (
    <div className="space-y-3 rounded-xl border border-gray-200 dark:border-white/8 bg-white dark:bg-white/[0.03] p-4">
      {steps.map((s, i) => {
        const isActive = i === currentIndex;
        const isDone = i < currentIndex || step === 'confirmed';
        const isFailed = step === 'failed' && i === 0;

        return (
          <div key={s.key} className="flex items-center gap-3">
            <div className="flex h-6 w-6 items-center justify-center">
              {isFailed ? (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500/20">
                  <X className="h-3 w-3 text-red-400" />
                </div>
              ) : isDone ? (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20">
                  <Check className="h-3 w-3 text-emerald-400" />
                </div>
              ) : isActive ? (
                <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
              ) : (
                <div className="h-2 w-2 rounded-full bg-gray-300 dark:bg-zinc-700" />
              )}
            </div>
            <span className={`text-sm ${isDone ? 'text-emerald-400' : isActive ? 'text-gray-900 dark:text-white' : isFailed ? 'text-red-400' : 'text-gray-400 dark:text-zinc-600'}`}>
              {isFailed ? 'Transaction failed' : s.label}
            </span>
          </div>
        );
      })}
      {hash && (
        <div className="mt-2 border-t border-gray-100 dark:border-white/6 pt-2">
          <span className="font-mono text-xs text-gray-500 dark:text-zinc-500">
            tx: {hash.slice(0, 10)}...{hash.slice(-8)}
          </span>
        </div>
      )}
    </div>
  );
}
