import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Send, RotateCcw, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { TicketData, EventData } from '../../types';
import { TicketStatus } from '../../types';
import { formatETH, formatDate, getTicketAccentColor } from '../../lib/formatters';
import { TicketStatusBadge } from '../ui/StatusBadge';
import { useWalletContext } from '../wallet/WalletContext';
import { parseContractError } from '../../lib/contract';

interface TicketCardProps {
  ticket: TicketData;
  event: EventData | null;
  index?: number;
  onUpdate?: () => void;
}

export function TicketCard({ ticket, event, index = 0, onUpdate }: TicketCardProps) {
  const { contract } = useWalletContext();
  const [showTransfer, setShowTransfer] = useState(false);
  const [transferTo, setTransferTo] = useState('');
  const [loading, setLoading] = useState(false);
  const accentColor = getTicketAccentColor(ticket.eventId);

  const handleRefund = async () => {
    if (!contract) return;
    setLoading(true);
    try {
      const tx = await contract.requestRefund(ticket.ticketId);
      await tx.wait();
      toast.success('Ticket refunded!');
      onUpdate?.();
    } catch (err) {
      toast.error(parseContractError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async () => {
    if (!contract || !transferTo) return;
    setLoading(true);
    try {
      const tx = await contract.transferTicket(ticket.ticketId, transferTo);
      await tx.wait();
      toast.success('Ticket transferred!');
      setShowTransfer(false);
      setTransferTo('');
      onUpdate?.();
    } catch (err) {
      toast.error(parseContractError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1], delay: index * 0.06 }}
      className="group relative overflow-hidden rounded-xl border border-gray-200 dark:border-white/8 bg-white dark:bg-white/[0.03] shadow-sm dark:shadow-none transition-all duration-300 hover:-translate-y-1 hover:border-gray-300 hover:shadow-md dark:hover:border-white/15 dark:hover:shadow-black/20"
    >
      {/* Accent strip */}
      <div className="absolute left-0 top-0 h-full w-1" style={{ backgroundColor: accentColor }} />

      <div className="flex">
        {/* Main content */}
        <div className="flex-1 p-5 pl-5">
          <div className="flex items-start justify-between">
            <div>
              <Link
                to={`/events/${ticket.eventId}`}
                className="text-base font-semibold text-gray-900 dark:text-white hover:text-blue-400 transition-colors"
              >
                {event?.name || `Event #${ticket.eventId}`}
              </Link>
              {event && (
                <div className="mt-1.5 space-y-1">
                  <p className="text-sm text-gray-600 dark:text-zinc-400">{event.venue}</p>
                  <p className="text-sm text-gray-500 dark:text-zinc-500">{formatDate(event.date)}</p>
                </div>
              )}
            </div>
            <TicketStatusBadge status={ticket.status} />
          </div>

          <div className="mt-3 flex items-center gap-4 text-sm text-gray-500 dark:text-zinc-500">
            <span className="font-mono">#{Number(ticket.ticketId)}</span>
            <span>{formatETH(ticket.purchasePrice)}</span>
          </div>

          {/* Actions */}
          {ticket.status === TicketStatus.Valid && (
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setShowTransfer(!showTransfer)}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-white/10 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-zinc-400 transition-colors hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"
              >
                <Send className="h-3 w-3" />
                Transfer
              </button>
              <button
                onClick={handleRefund}
                disabled={loading}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-white/10 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-zinc-400 transition-colors hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
                Refund
              </button>
            </div>
          )}

          {showTransfer && (
            <div className="mt-3 flex gap-2">
              <input
                value={transferTo}
                onChange={e => setTransferTo(e.target.value)}
                placeholder="0x..."
                className="flex-1 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5 px-3 py-2 font-mono text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-600 outline-none focus:border-blue-500/50"
              />
              <button
                onClick={handleTransfer}
                disabled={loading || !transferTo}
                className="rounded-lg bg-blue-500 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-600 disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Send'}
              </button>
            </div>
          )}
        </div>

        {/* Perforated edge + ticket number */}
        <div className="relative flex w-28 flex-col items-center justify-center border-l border-dashed border-gray-200 dark:border-white/10 p-4">
          {/* Perforation circles */}
          <div className="absolute -left-[5px] -top-[5px] h-2.5 w-2.5 rounded-full bg-[#f0f0f3] dark:bg-[#09090b]" />
          <div className="absolute -bottom-[5px] -left-[5px] h-2.5 w-2.5 rounded-full bg-[#f0f0f3] dark:bg-[#09090b]" />

          <span className="text-3xl font-bold" style={{ color: accentColor }}>
            #{Number(ticket.ticketId)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
