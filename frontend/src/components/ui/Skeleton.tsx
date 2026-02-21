import { cn } from '../../lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg bg-gray-200 dark:bg-white/5',
        className
      )}
    />
  );
}

export function EventCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-white/8 bg-white dark:bg-white/[0.03]">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="space-y-3 p-5">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-7 w-20 rounded-full" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </div>
  );
}

export function TicketCardSkeleton() {
  return (
    <div className="flex overflow-hidden rounded-xl border border-gray-200 dark:border-white/8 bg-white dark:bg-white/[0.03]">
      <div className="flex-1 space-y-3 p-5">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
      </div>
      <div className="w-32 border-l border-dashed border-gray-200 dark:border-white/10 p-4">
        <Skeleton className="h-full w-full rounded-lg" />
      </div>
    </div>
  );
}
