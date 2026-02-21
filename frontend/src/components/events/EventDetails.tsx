import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Clock, User, Minus, Plus, Loader2, Ticket, ShieldCheck, Lock, ArrowLeft, Zap } from 'lucide-react';
import { useWalletContext } from '../wallet/WalletContext';
import { useEvent } from '../../hooks/useEvents';
import { EventStatus } from '../../types';
import { formatETH, formatDateTime, formatRelativeTime, truncateAddress, getTicketAccentColor } from '../../lib/formatters';
import { parseContractError } from '../../lib/contract';
import { EventStatusBadge } from '../ui/StatusBadge';
import { TransactionStatus } from '../ui/TransactionStatus';
import { Skeleton } from '../ui/Skeleton';

type TxStep = 'pending' | 'confirming' | 'confirmed' | 'failed';

export function EventDetails() {
  const { id } = useParams<{ id: string }>();
  const { contract, address } = useWalletContext();
  const { event, loading, refetch } = useEvent(contract, id ? parseInt(id) : null);
  const [quantity, setQuantity] = useState(1);
  const [txStep, setTxStep] = useState<TxStep | null>(null);
  const [txHash, setTxHash] = useState('');
  const [availableTickets, setAvailableTickets] = useState<number | null>(null);

  const fetchAvailable = useCallback(async () => {
    if (!contract || !id) return;
    try {
      const avail = await contract.getAvailableTickets(parseInt(id));
      setAvailableTickets(Number(avail));
    } catch { /* ignore */ }
  }, [contract, id]);

  useEffect(() => { fetchAvailable(); }, [fetchAvailable]);

  const handlePurchase = async () => {
    if (!contract || !event) return;
    try {
      const totalCost = event.ticketPrice * BigInt(quantity);
      setTxStep('pending');

      const tx = await contract.purchaseTickets(event.eventId, quantity, { value: totalCost });
      setTxHash(tx.hash);
      setTxStep('confirming');

      await tx.wait();
      setTxStep('confirmed');
      toast.success(`${quantity} ticket${quantity > 1 ? 's' : ''} purchased!`);
      refetch();
      fetchAvailable();

      setTimeout(() => setTxStep(null), 3000);
    } catch (err) {
      setTxStep('failed');
      toast.error(parseContractError(err));
    }
  };

  if (loading || !event) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-12">
        <Skeleton className="mb-6 h-10 w-2/3" />
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-6 w-1/3" />
          </div>
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  const accentColor = getTicketAccentColor(event.eventId);
  const isOrganizer = address.toLowerCase() === event.organizer.toLowerCase();
  const now = Date.now() / 1000;
  const isUpcoming = Number(event.date) > now;
  const soldPercent = Number(event.ticketsSold) / Number(event.maxTickets) * 100;
  const canRefund = Number(event.refundDeadline) > now;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mx-auto max-w-5xl px-6 py-12"
    >
      {/* Back link */}
      <Link
        to="/events"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-zinc-500 transition-colors hover:text-gray-900 dark:hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Events
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <EventStatusBadge status={event.status} />
          {isOrganizer && (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 text-xs font-medium text-blue-400">
              <ShieldCheck className="h-3 w-3" />Your Event
            </span>
          )}
          {soldPercent > 80 && event.status === EventStatus.Active && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 border border-red-500/20 px-2.5 py-0.5 text-xs font-medium text-red-400 animate-pulse">
              Selling Fast
            </span>
          )}
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">{event.name}</h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left column - details */}
        <div className="space-y-8 lg:col-span-2">
          {/* Event info card */}
          <div className="space-y-4 rounded-xl border border-gray-200 dark:border-white/8 bg-white dark:bg-white/[0.03] p-6">
            <div className="flex items-center gap-3 text-gray-700 dark:text-zinc-300">
              <Calendar className="h-4 w-4 text-gray-500 dark:text-zinc-500" />
              {formatDateTime(event.date)}
              <span className="text-xs text-gray-500 dark:text-zinc-500">({formatRelativeTime(event.date)})</span>
            </div>
            <div className="flex items-center gap-3 text-gray-700 dark:text-zinc-300">
              <MapPin className="h-4 w-4 text-gray-500 dark:text-zinc-500" />
              {event.venue}
            </div>
            <div className="flex items-center gap-3 text-gray-700 dark:text-zinc-300">
              <User className="h-4 w-4 text-gray-500 dark:text-zinc-500" />
              <span className="font-mono text-sm">{truncateAddress(event.organizer)}</span>
            </div>
          </div>

          {/* About */}
          <div>
            <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">About</h2>
            <p className="leading-relaxed text-gray-600 dark:text-zinc-400">{event.description}</p>
          </div>

          {/* On-Chain Guarantee */}
          <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/5 p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                <Lock className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold text-emerald-300">On-Chain Guarantee</h3>
                <p className="mt-1 text-sm leading-relaxed text-emerald-400/70">
                  This ticket is secured by a smart contract on the blockchain. Your purchase, ownership,
                  and refund rights are enforced by code — no intermediaries, no hidden terms.
                </p>
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-emerald-400/60">
                  <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Verifiable ownership</span>
                  <span className="flex items-center gap-1"><Zap className="h-3 w-3" /> Instant settlement</span>
                  <span className="flex items-center gap-1"><Lock className="h-3 w-3" /> No counterfeits</span>
                </div>
              </div>
            </div>
          </div>

          {/* About the Organizer */}
          <div className="rounded-xl border border-gray-200 dark:border-white/8 bg-white dark:bg-white/[0.03] p-5">
            <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">About the Organizer</h2>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-violet-500 text-sm font-bold text-white">
                {event.organizer.slice(2, 4).toUpperCase()}
              </div>
              <div>
                <p className="font-mono text-sm text-gray-700 dark:text-zinc-300">{truncateAddress(event.organizer)}</p>
                <p className="text-xs text-gray-500 dark:text-zinc-500">Event Organizer</p>
              </div>
            </div>
          </div>

          {/* Refund Policy */}
          <div>
            <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">Refund Policy</h2>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-zinc-400">
              <Clock className="h-4 w-4" />
              {canRefund ? (
                <span>
                  Refunds available until {formatDateTime(event.refundDeadline)}
                  <span className="ml-1 text-xs text-gray-500 dark:text-zinc-500">({formatRelativeTime(event.refundDeadline)})</span>
                </span>
              ) : (
                <span className="text-gray-500 dark:text-zinc-500">Refund window has closed</span>
              )}
            </div>
          </div>
        </div>

        {/* Right column - purchase widget */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03] p-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 dark:text-white">{formatETH(event.ticketPrice)}</div>
              <div className="mt-1 text-sm text-gray-500 dark:text-zinc-500">per ticket</div>
            </div>

            {/* No hidden fees */}
            <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-400/70">
              <ShieldCheck className="h-3 w-3" />
              No hidden fees — you only pay the ticket price + gas
            </div>

            {/* Availability bar */}
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-zinc-400">Availability</span>
                <span className="text-gray-900 dark:text-white">{availableTickets ?? '...'} / {Number(event.maxTickets)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-white/10">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${soldPercent}%`,
                    backgroundColor: soldPercent > 80 ? '#ef4444' : accentColor,
                  }}
                />
              </div>
              {soldPercent > 90 && (
                <p className="mt-1.5 text-xs text-red-400 animate-pulse">Almost sold out!</p>
              )}
            </div>

            {event.status === EventStatus.Active && isUpcoming && !isOrganizer && (
              <>
                {/* Quantity selector */}
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 dark:border-white/10 text-gray-600 dark:text-zinc-400 transition-colors hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-8 text-center text-lg font-semibold text-gray-900 dark:text-white">{quantity}</span>
                  <button
                    onClick={() => setQuantity(q => Math.min(10, q + 1))}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 dark:border-white/10 text-gray-600 dark:text-zinc-400 transition-colors hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                {/* Price breakdown */}
                <div className="space-y-2 border-t border-gray-100 dark:border-white/6 pt-4 text-sm">
                  <div className="flex justify-between text-gray-600 dark:text-zinc-400">
                    <span>{quantity}x Ticket</span>
                    <span>{formatETH(event.ticketPrice * BigInt(quantity))}</span>
                  </div>
                  <div className="flex justify-between text-gray-500 dark:text-zinc-500 text-xs">
                    <span>Estimated gas</span>
                    <span>~0.001 ETH</span>
                  </div>
                  <div className="flex justify-between font-semibold text-gray-900 dark:text-white border-t border-gray-100 dark:border-white/6 pt-2">
                    <span>Total</span>
                    <span>{formatETH(event.ticketPrice * BigInt(quantity))}</span>
                  </div>
                </div>

                {txStep && (
                  <TransactionStatus step={txStep} hash={txHash} />
                )}

                <button
                  onClick={handlePurchase}
                  disabled={txStep === 'pending' || txStep === 'confirming'}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 py-3.5 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50"
                >
                  {txStep === 'pending' || txStep === 'confirming' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Ticket className="h-4 w-4" />
                  )}
                  {txStep === 'pending' ? 'Submitting...' : txStep === 'confirming' ? 'Confirming...' : 'Purchase Tickets'}
                </button>
              </>
            )}

            {event.status !== EventStatus.Active && (
              <div className="text-center text-sm text-gray-500 dark:text-zinc-500">
                This event is no longer accepting purchases.
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
