import { cn } from '../../lib/utils';
import { EventStatus, TicketStatus } from '../../types';

const EVENT_STATUS_STYLES: Record<number, string> = {
  [EventStatus.Active]: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  [EventStatus.Canceled]: 'bg-red-500/15 text-red-400 border-red-500/20',
  [EventStatus.Completed]: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20',
};

const EVENT_STATUS_LABELS: Record<number, string> = {
  [EventStatus.Active]: 'Active',
  [EventStatus.Canceled]: 'Canceled',
  [EventStatus.Completed]: 'Completed',
};

const TICKET_STATUS_STYLES: Record<number, string> = {
  [TicketStatus.Valid]: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  [TicketStatus.Used]: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20',
  [TicketStatus.Refunded]: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
};

const TICKET_STATUS_LABELS: Record<number, string> = {
  [TicketStatus.Valid]: 'Valid',
  [TicketStatus.Used]: 'Used',
  [TicketStatus.Refunded]: 'Refunded',
};

export function EventStatusBadge({ status }: { status: EventStatus }) {
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium', EVENT_STATUS_STYLES[status])}>
      {EVENT_STATUS_LABELS[status]}
    </span>
  );
}

export function TicketStatusBadge({ status }: { status: TicketStatus }) {
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium', TICKET_STATUS_STYLES[status])}>
      {TICKET_STATUS_LABELS[status]}
    </span>
  );
}
