import { motion } from 'framer-motion';
import type { EventData } from '../../types';
import { EventCard } from './EventCard';
import { EventCardSkeleton } from '../ui/Skeleton';
import { Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

interface EventGridProps {
  events: EventData[];
  loading: boolean;
}

export function EventGrid({ events, loading }: EventGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <EventCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 dark:border-white/10 px-8 py-20 text-center"
      >
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 dark:bg-white/5">
          <Calendar className="h-7 w-7 text-gray-500 dark:text-zinc-500" />
        </div>
        <h3 className="mt-5 text-lg font-semibold text-gray-900 dark:text-white">No events yet</h3>
        <p className="mt-2 max-w-sm text-sm text-gray-500 dark:text-zinc-500">
          Be the first to create an event on the blockchain.
        </p>
        <Link
          to="/create"
          className="mt-6 rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-blue-500/25"
        >
          Create Event
        </Link>
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {events.map((event, i) => (
        <EventCard key={Number(event.eventId)} event={event} index={i} />
      ))}
    </div>
  );
}
