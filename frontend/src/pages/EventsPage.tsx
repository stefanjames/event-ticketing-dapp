import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, SlidersHorizontal, Calendar, MapPin, ArrowRight } from 'lucide-react';
import { useWalletContext } from '../components/wallet/WalletContext';
import { useEvents } from '../hooks/useEvents';
import { EventGrid } from '../components/events/EventGrid';
import { EventStatus, EventCategory } from '../types';
import { demoEvents, getDemoEventsByCategory, CATEGORY_CONFIG } from '../lib/seedData';

export function EventsPage() {
  const { contract } = useWalletContext();
  const { events, loading } = useEvents(contract);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'past'>('all');
  const [category, setCategory] = useState<string>(EventCategory.All);

  const filtered = useMemo(() => {
    let result = events;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        e => e.name.toLowerCase().includes(q) || e.venue.toLowerCase().includes(q)
      );
    }

    if (statusFilter === 'active') {
      result = result.filter(e => e.status === EventStatus.Active);
    } else if (statusFilter === 'past') {
      result = result.filter(e => e.status !== EventStatus.Active);
    }

    return result;
  }, [events, search, statusFilter]);

  // Demo events filtered by category + search
  const filteredDemoEvents = useMemo(() => {
    let demos = getDemoEventsByCategory(category);
    if (search) {
      const q = search.toLowerCase();
      demos = demos.filter(
        e => e.name.toLowerCase().includes(q) || e.venue.toLowerCase().includes(q)
      );
    }
    return demos;
  }, [category, search]);

  const hasOnChainEvents = events.length > 0;

  const categories = Object.entries(CATEGORY_CONFIG);

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Discover Events
            </h1>
            <p className="mt-2 text-gray-600 dark:text-zinc-400">
              {hasOnChainEvents
                ? `${events.length} event${events.length !== 1 ? 's' : ''} live on-chain`
                : 'Browse upcoming events powered by blockchain ticketing'}
            </p>
          </div>
          <Link
            to="/create"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-blue-500/25"
          >
            Create Event
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Category Tabs */}
        <div className="mt-8 flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map(([key, config]) => (
            <button
              key={key}
              onClick={() => setCategory(key)}
              className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                category === key
                  ? 'bg-gray-200 dark:bg-white/10 text-gray-900 dark:text-white ring-1 ring-gray-300 dark:ring-white/20'
                  : 'text-gray-500 dark:text-zinc-500 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-700 dark:hover:text-zinc-300'
              }`}
            >
              <span>{config.icon}</span>
              {config.label}
            </button>
          ))}
        </div>

        {/* Search & Filters */}
        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-zinc-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or venue..."
              className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5 py-3 pl-10 pr-4 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 outline-none transition-colors focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/25"
            />
          </div>

          {hasOnChainEvents && (
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-gray-500 dark:text-zinc-500" />
              {(['all', 'active', 'past'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                    statusFilter === f
                      ? 'bg-gray-200 dark:bg-white/10 text-gray-900 dark:text-white'
                      : 'text-gray-500 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* On-Chain Events Section */}
        {hasOnChainEvents && (
          <div className="mt-8">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Live On-Chain Events
            </h2>
            <EventGrid events={filtered} loading={loading} />
          </div>
        )}

        {/* Demo / Browse Events */}
        <div className={hasOnChainEvents ? 'mt-12' : 'mt-8'}>
          {hasOnChainEvents && (
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Upcoming Events
            </h2>
          )}

          {filteredDemoEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 dark:border-white/10 px-8 py-16 text-center">
              <Search className="h-8 w-8 text-gray-400 dark:text-zinc-600" />
              <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">No events match your search</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-zinc-500">Try adjusting your filters or search terms.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredDemoEvents.map((event) => (
                <DemoEventListCard key={event.name} event={event} />
              ))}
            </div>
          )}
        </div>

        {/* Connect prompt for non-connected users */}
        {!contract && !loading && (
          <div className="mt-12 rounded-2xl border border-gray-200 dark:border-white/8 bg-gradient-to-br from-blue-500/5 to-violet-500/5 p-8 text-center">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Connect Your Wallet</h3>
            <p className="mt-2 max-w-md mx-auto text-sm text-gray-600 dark:text-zinc-400">
              Connect MetaMask to see live on-chain events, purchase tickets, and manage your collection.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ─── Demo Event Card for Events Page ──────────────────────────────────────────

function DemoEventListCard({ event }: { event: typeof demoEvents[0] }) {
  const soldPercent = (event.ticketsSold / event.maxTickets) * 100;
  const available = event.maxTickets - event.ticketsSold;
  const categoryConfig = CATEGORY_CONFIG[event.category];
  const dateStr = new Date(event.date).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] as const }}
      className="group overflow-hidden rounded-xl border border-gray-200 dark:border-white/8 bg-white dark:bg-white/[0.03] shadow-sm dark:shadow-none transition-all duration-300 hover:-translate-y-2 hover:border-gray-300 hover:shadow-md dark:hover:border-white/15 dark:hover:shadow-black/30"
    >
      {/* Image banner with gradient fallback */}
      <div
        className="relative flex aspect-[3/1] items-end overflow-hidden p-4"
        style={{
          background: `linear-gradient(135deg, ${event.imageGradient[0]}, ${event.imageGradient[1]})`,
        }}
      >
        {event.imageUrl && (
          <img
            src={event.imageUrl}
            alt={event.name}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/30 to-transparent dark:from-[#09090b] dark:via-transparent" />
        <span className="relative z-10 inline-flex items-center gap-1 rounded-full bg-black/40 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
          {categoryConfig?.icon} {categoryConfig?.label}
        </span>
      </div>

      <div className="space-y-3 p-5">
        <h3 className="text-base font-semibold leading-snug text-gray-900 dark:text-white group-hover:text-blue-400 transition-colors line-clamp-2">
          {event.name}
        </h3>

        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-zinc-400">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            {dateStr}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-zinc-400">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{event.venue}</span>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 dark:border-white/6 pt-3">
          <span
            className="rounded-full px-3 py-1 text-xs font-semibold"
            style={{
              backgroundColor: `${event.imageGradient[0]}20`,
              color: event.imageGradient[0],
            }}
          >
            {event.ticketPrice} ETH
          </span>

          <div className="flex items-center gap-2">
            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-200 dark:bg-white/10">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${soldPercent}%`,
                  backgroundColor: soldPercent > 80 ? '#ef4444' : event.imageGradient[0],
                }}
              />
            </div>
            <span className="text-xs text-gray-500 dark:text-zinc-500">{available} left</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
