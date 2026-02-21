import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Ticket as TicketIcon, Shield, QrCode } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useWalletContext } from '../components/wallet/WalletContext';
import { useUserTickets } from '../hooks/useTickets';
import { TicketCard } from '../components/tickets/TicketCard';
import { TicketCardSkeleton } from '../components/ui/Skeleton';
import { TicketStatus } from '../types';
import type { EventData } from '../types';

type TabFilter = 'all' | 'upcoming' | 'past' | 'refunded';

export function MyTicketsPage() {
  const { contract, address } = useWalletContext();
  const { tickets, loading, refetch } = useUserTickets(contract, address);
  const [eventCache, setEventCache] = useState<Record<string, EventData>>({});
  const [tab, setTab] = useState<TabFilter>('all');

  const fetchEventData = useCallback(async () => {
    if (!contract || tickets.length === 0) return;

    const uniqueIds = [...new Set(tickets.map(t => t.eventId.toString()))];
    const cache: Record<string, EventData> = {};

    for (const id of uniqueIds) {
      if (eventCache[id]) {
        cache[id] = eventCache[id];
        continue;
      }
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const evt: any = await contract.getFunction('getEvent')(Number(id));
        cache[id] = {
          eventId: evt.eventId,
          organizer: evt.organizer,
          name: evt.name,
          description: evt.description,
          venue: evt.venue,
          date: evt.date,
          ticketPrice: evt.ticketPrice,
          maxTickets: evt.maxTickets,
          ticketsSold: evt.ticketsSold,
          refundDeadline: evt.refundDeadline,
          status: Number(evt.status) as EventData['status'],
        };
      } catch { /* ignore */ }
    }
    setEventCache(cache);
  }, [contract, tickets, eventCache]);

  useEffect(() => {
    fetchEventData();
  }, [tickets.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    const now = Date.now() / 1000;
    return tickets.filter(t => {
      if (tab === 'refunded') return t.status === TicketStatus.Refunded;
      if (tab === 'upcoming') {
        const evt = eventCache[t.eventId.toString()];
        return t.status === TicketStatus.Valid && evt && Number(evt.date) > now;
      }
      if (tab === 'past') {
        const evt = eventCache[t.eventId.toString()];
        return t.status === TicketStatus.Used || (evt && Number(evt.date) < now);
      }
      return true;
    });
  }, [tickets, tab, eventCache]);

  const tabs: { key: TabFilter; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: tickets.length },
    { key: 'upcoming', label: 'Upcoming', count: tickets.filter(t => {
      const evt = eventCache[t.eventId.toString()];
      return t.status === TicketStatus.Valid && evt && Number(evt.date) > Date.now() / 1000;
    }).length },
    { key: 'past', label: 'Past', count: tickets.filter(t => {
      const evt = eventCache[t.eventId.toString()];
      return t.status === TicketStatus.Used || (evt && Number(evt.date) < Date.now() / 1000);
    }).length },
    { key: 'refunded', label: 'Refunded', count: tickets.filter(t => t.status === TicketStatus.Refunded).length },
  ];

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              My Tickets
            </h1>
            <p className="mt-2 text-gray-600 dark:text-zinc-400">
              {tickets.length > 0
                ? `${tickets.length} ticket${tickets.length !== 1 ? 's' : ''} in your collection`
                : 'Your blockchain ticket collection'}
            </p>
          </div>
          {tickets.length > 0 && (
            <div className="hidden sm:flex items-center gap-2 rounded-lg border border-gray-200 dark:border-white/8 bg-white dark:bg-white/[0.03] px-3 py-2">
              <Shield className="h-4 w-4 text-emerald-400" />
              <span className="text-xs text-gray-600 dark:text-zinc-400">All tickets verified on-chain</span>
            </div>
          )}
        </div>

        {/* Tab Filters */}
        <div className="mt-8 flex gap-1 rounded-lg border border-gray-200 dark:border-white/8 bg-gray-50 dark:bg-white/[0.02] p-1">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                tab === t.key
                  ? 'bg-gray-200 dark:bg-white/10 text-gray-900 dark:text-white'
                  : 'text-gray-500 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300'
              }`}
            >
              {t.label}
              {t.count > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-xs ${
                  tab === t.key ? 'bg-gray-200 dark:bg-white/15 text-gray-900 dark:text-white' : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-zinc-500'
                }`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Ticket List */}
        <div className="mt-8 space-y-4">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <TicketCardSkeleton key={i} />)
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 dark:border-white/10 px-8 py-20 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 dark:bg-white/5">
                <TicketIcon className="h-7 w-7 text-gray-500 dark:text-zinc-500" />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-gray-900 dark:text-white">
                {tab === 'all' ? 'No tickets yet' : `No ${tab} tickets`}
              </h3>
              <p className="mt-2 max-w-sm text-sm text-gray-500 dark:text-zinc-500">
                {tab === 'all'
                  ? 'Purchase your first ticket and it will appear here as a blockchain-verified collectible.'
                  : 'No tickets match this filter.'}
              </p>
              {tab === 'all' && (
                <Link
                  to="/events"
                  className="mt-6 rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-blue-500/25"
                >
                  Browse Events
                </Link>
              )}
            </div>
          ) : (
            <>
              {filtered.map((ticket, i) => (
                <TicketCard
                  key={Number(ticket.ticketId)}
                  ticket={ticket}
                  event={eventCache[ticket.eventId.toString()] || null}
                  index={i}
                  onUpdate={refetch}
                />
              ))}

              {/* Collection footer */}
              <div className="mt-4 flex items-center justify-center gap-4 rounded-xl border border-gray-100 dark:border-white/6 bg-gray-50 dark:bg-white/[0.02] p-4">
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-zinc-500">
                  <QrCode className="h-3.5 w-3.5" />
                  Each ticket has a unique on-chain ID
                </div>
                <div className="h-3 w-px bg-gray-200 dark:bg-white/10" />
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-zinc-500">
                  <Shield className="h-3.5 w-3.5" />
                  Ownership verified by smart contract
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
