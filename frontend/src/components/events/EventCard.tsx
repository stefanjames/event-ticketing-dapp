import { Link } from 'react-router-dom';
import { MapPin, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import type { EventData } from '../../types';
import { EventStatus } from '../../types';
import { formatETH, formatDate, getTicketAccentColor } from '../../lib/formatters';
import { EventStatusBadge } from '../ui/StatusBadge';

interface EventCardProps {
  event: EventData;
  index?: number;
}

export function EventCard({ event, index = 0 }: EventCardProps) {
  const accentColor = getTicketAccentColor(event.eventId);
  const available = Number(event.maxTickets - event.ticketsSold);
  const soldPercent = Number(event.ticketsSold) / Number(event.maxTickets) * 100;
  const storedImage = localStorage.getItem(`event-image-${event.eventId}`);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1], delay: index * 0.06 }}
    >
      <Link
        to={`/events/${event.eventId}`}
        className="group block overflow-hidden rounded-xl border border-gray-200 dark:border-white/8 bg-white dark:bg-white/[0.03] shadow-sm dark:shadow-none transition-all duration-300 hover:-translate-y-2 hover:border-gray-300 hover:shadow-md dark:hover:border-white/15 dark:hover:shadow-black/30"
      >
        <div
          className="relative flex aspect-[4/3] items-end p-5"
          style={{
            background: storedImage
              ? undefined
              : `linear-gradient(135deg, ${accentColor}15, ${accentColor}05), linear-gradient(to bottom, transparent 50%, #09090b)`,
          }}
        >
          {storedImage ? (
            <img src={storedImage} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 opacity-30" style={{
              backgroundImage: `radial-gradient(circle at 20% 50%, ${accentColor}30, transparent 60%), radial-gradient(circle at 80% 20%, ${accentColor}20, transparent 50%)`,
            }} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>

        <div className="space-y-3 p-5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-base font-semibold leading-snug text-gray-900 dark:text-white group-hover:text-blue-400 transition-colors line-clamp-2">
              {event.name}
            </h3>
            <EventStatusBadge status={event.status} />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-zinc-400">
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              {formatDate(event.date)}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-zinc-400">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{event.venue}</span>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-gray-100 dark:border-white/6 pt-3">
            <span
              className="rounded-full px-3 py-1 text-xs font-semibold"
              style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
            >
              {formatETH(event.ticketPrice)}
            </span>

            {event.status === EventStatus.Active ? (
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-200 dark:bg-white/10">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${soldPercent}%`,
                      backgroundColor: soldPercent > 80 ? '#ef4444' : accentColor,
                    }}
                  />
                </div>
                <span className="text-xs text-gray-500 dark:text-zinc-500">{available} left</span>
              </div>
            ) : (
              <span className="text-xs text-gray-500 dark:text-zinc-500">{Number(event.ticketsSold)} sold</span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
