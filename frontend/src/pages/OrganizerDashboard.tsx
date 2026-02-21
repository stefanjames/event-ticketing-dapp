import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Ticket, Search, CheckCircle2, XCircle, Loader2,
  DollarSign, CalendarPlus, TrendingUp, Users, BarChart3,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatEther } from 'ethers';
import { useWalletContext } from '../components/wallet/WalletContext';
import { useEvents } from '../hooks/useEvents';
import { EventStatus, TicketStatus } from '../types';
import { formatETH, formatDate, getTicketAccentColor } from '../lib/formatters';
import { EventStatusBadge } from '../components/ui/StatusBadge';
import { parseContractError } from '../lib/contract';

type DashboardView = 'overview' | 'validate';

export function OrganizerDashboard() {
  const { contract, address } = useWalletContext();
  const { events, loading, refetch } = useEvents(contract);
  const [view, setView] = useState<DashboardView>('overview');
  const [validateInput, setValidateInput] = useState('');
  const [validateResult, setValidateResult] = useState<'valid' | 'invalid' | 'used' | null>(null);
  const [validating, setValidating] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const myEvents = useMemo(
    () => events.filter(e => e.organizer.toLowerCase() === address.toLowerCase()),
    [events, address]
  );

  const totalRevenue = useMemo(
    () => myEvents.reduce((sum, e) => sum + e.ticketPrice * e.ticketsSold, 0n),
    [myEvents]
  );

  const totalSold = useMemo(
    () => myEvents.reduce((sum, e) => sum + Number(e.ticketsSold), 0),
    [myEvents]
  );

  const totalCapacity = useMemo(
    () => myEvents.reduce((sum, e) => sum + Number(e.maxTickets), 0),
    [myEvents]
  );

  const activeEvents = useMemo(
    () => myEvents.filter(e => e.status === EventStatus.Active).length,
    [myEvents]
  );

  const handleValidate = async () => {
    if (!contract || !validateInput) return;
    setValidating(true);
    setValidateResult(null);
    try {
      const ticketId = parseInt(validateInput);
      const isValid = await contract.isTicketValid(ticketId);

      if (isValid) {
        const tx = await contract.validateTicket(ticketId);
        await tx.wait();
        setValidateResult('valid');
        toast.success('Ticket validated!');
      } else {
        const ticket = await contract.getTicket(ticketId);
        setValidateResult(Number(ticket.status) === TicketStatus.Used ? 'used' : 'invalid');
      }
    } catch (err) {
      setValidateResult('invalid');
      toast.error(parseContractError(err));
    } finally {
      setValidating(false);
    }
  };

  const handleAction = async (eventId: bigint, action: 'cancel' | 'complete' | 'withdraw') => {
    if (!contract) return;
    const key = `${action}-${eventId}`;
    setActionLoading(key);
    try {
      let tx;
      if (action === 'cancel') tx = await contract.cancelEvent(eventId);
      else if (action === 'complete') tx = await contract.completeEvent(eventId);
      else tx = await contract.withdrawEventFunds(eventId);

      await tx.wait();
      toast.success(`Event ${action === 'withdraw' ? 'funds withdrawn' : action === 'complete' ? 'completed' : 'cancelled'} successfully!`);
      refetch();
    } catch (err) {
      toast.error(parseContractError(err));
    } finally {
      setActionLoading(null);
    }
  };

  const navItems: { key: DashboardView; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'Overview', icon: <BarChart3 className="h-4 w-4" /> },
    { key: 'validate', label: 'Validate Tickets', icon: <Ticket className="h-4 w-4" /> },
  ];

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-violet-500">
              <LayoutDashboard className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Organizer Dashboard
              </h1>
              <p className="text-sm text-gray-500 dark:text-zinc-500">Manage your events and validate tickets</p>
            </div>
          </div>
          <Link
            to="/create"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-blue-500/25"
          >
            <CalendarPlus className="h-4 w-4" />
            Create Event
          </Link>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-8 flex gap-1 rounded-lg border border-gray-200 dark:border-white/8 bg-gray-50 dark:bg-white/[0.02] p-1 sm:w-fit">
          {navItems.map(item => (
            <button
              key={item.key}
              onClick={() => setView(item.key)}
              className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                view === item.key
                  ? 'bg-gray-200 dark:bg-white/10 text-gray-900 dark:text-white'
                  : 'text-gray-500 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>

        {/* Stats Cards */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<LayoutDashboard className="h-5 w-5" />}
            label="Total Events"
            value={myEvents.length.toString()}
            sub={`${activeEvents} active`}
            color="blue"
          />
          <StatCard
            icon={<Users className="h-5 w-5" />}
            label="Tickets Sold"
            value={totalSold.toString()}
            sub={totalCapacity > 0 ? `${Math.round(totalSold / totalCapacity * 100)}% of capacity` : '—'}
            color="violet"
          />
          <StatCard
            icon={<TrendingUp className="h-5 w-5" />}
            label="Total Revenue"
            value={`${parseFloat(formatEther(totalRevenue)).toFixed(4)} ETH`}
            sub="Across all events"
            color="emerald"
          />
          <StatCard
            icon={<DollarSign className="h-5 w-5" />}
            label="Avg Ticket Price"
            value={myEvents.length > 0
              ? `${parseFloat(formatEther(totalRevenue / BigInt(Math.max(totalSold, 1)))).toFixed(4)} ETH`
              : '—'}
            sub="Per ticket"
            color="amber"
          />
        </div>

        {/* View Content */}
        {view === 'overview' ? (
          <div className="mt-8">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">My Events</h2>

            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-100 dark:bg-white/5" />
                ))}
              </div>
            ) : myEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 dark:border-white/10 px-8 py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 dark:bg-white/5">
                  <CalendarPlus className="h-6 w-6 text-gray-500 dark:text-zinc-500" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">No events yet</h3>
                <p className="mt-2 max-w-sm text-sm text-gray-500 dark:text-zinc-500">
                  Create your first event and start selling tickets on the blockchain.
                </p>
                <Link
                  to="/create"
                  className="mt-4 rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 px-6 py-2.5 text-sm font-semibold text-white"
                >
                  Create Event
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {myEvents.map(evt => {
                  const accentColor = getTicketAccentColor(evt.eventId);
                  const soldPercent = Number(evt.ticketsSold) / Number(evt.maxTickets) * 100;

                  return (
                    <div
                      key={Number(evt.eventId)}
                      className="group flex flex-col gap-4 rounded-xl border border-gray-200 dark:border-white/8 bg-white dark:bg-white/[0.03] p-5 transition-all hover:border-gray-200 dark:hover:border-white/15 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: accentColor }} />
                          <Link
                            to={`/events/${evt.eventId}`}
                            className="text-base font-semibold text-gray-900 dark:text-white hover:text-blue-400 transition-colors"
                          >
                            {evt.name}
                          </Link>
                          <EventStatusBadge status={evt.status} />
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-4 pl-5 text-sm text-gray-500 dark:text-zinc-500">
                          <span>{formatDate(evt.date)}</span>
                          <span className="flex items-center gap-1.5">
                            <span>{Number(evt.ticketsSold)}/{Number(evt.maxTickets)} sold</span>
                            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-gray-200 dark:bg-white/10">
                              <div className="h-full rounded-full" style={{ width: `${soldPercent}%`, backgroundColor: accentColor }} />
                            </div>
                          </span>
                          <span className="font-mono">{formatETH(evt.ticketPrice * evt.ticketsSold)}</span>
                        </div>
                      </div>

                      <div className="flex gap-2 pl-5 sm:pl-0">
                        {evt.status === EventStatus.Active && (
                          <>
                            <button
                              onClick={() => handleAction(evt.eventId, 'complete')}
                              disabled={actionLoading === `complete-${evt.eventId}`}
                              className="rounded-lg border border-gray-200 dark:border-white/10 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-zinc-400 transition-colors hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white disabled:opacity-50"
                            >
                              {actionLoading === `complete-${evt.eventId}` ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Complete'}
                            </button>
                            <button
                              onClick={() => handleAction(evt.eventId, 'cancel')}
                              disabled={actionLoading === `cancel-${evt.eventId}`}
                              className="rounded-lg border border-red-500/20 px-3 py-1.5 text-xs font-medium text-red-400/70 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                            >
                              {actionLoading === `cancel-${evt.eventId}` ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Cancel'}
                            </button>
                          </>
                        )}
                        {evt.status === EventStatus.Completed && (
                          <button
                            onClick={() => handleAction(evt.eventId, 'withdraw')}
                            disabled={actionLoading === `withdraw-${evt.eventId}`}
                            className="flex items-center gap-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/20 px-3 py-1.5 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-500/25 disabled:opacity-50"
                          >
                            {actionLoading === `withdraw-${evt.eventId}` ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <><DollarSign className="h-3 w-3" />Withdraw</>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Validate Tickets View */
          <div className="mt-8 max-w-2xl">
            <div className="rounded-xl border border-gray-200 dark:border-white/8 bg-white dark:bg-white/[0.03] p-6">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                <Ticket className="h-5 w-5 text-gray-600 dark:text-zinc-400" />
                Validate Ticket
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-zinc-500">
                Enter a ticket ID to validate it at the door. Valid tickets will be marked as used.
              </p>

              <div className="mt-6 flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-zinc-500" />
                  <input
                    value={validateInput}
                    onChange={e => setValidateInput(e.target.value)}
                    placeholder="Enter ticket ID (e.g. 1)"
                    className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 py-3 pl-10 pr-4 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/25"
                    onKeyDown={e => e.key === 'Enter' && handleValidate()}
                  />
                </div>
                <button
                  onClick={handleValidate}
                  disabled={validating || !validateInput}
                  className="rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 px-6 py-3 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50"
                >
                  {validating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Validate'}
                </button>
              </div>

              {validateResult && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mt-4 flex items-center gap-3 rounded-xl p-4 ${
                    validateResult === 'valid' ? 'bg-emerald-500/10 border border-emerald-500/20' :
                    validateResult === 'used' ? 'bg-amber-500/10 border border-amber-500/20' :
                    'bg-red-500/10 border border-red-500/20'
                  }`}
                >
                  {validateResult === 'valid' ? (
                    <>
                      <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                      <div>
                        <p className="font-semibold text-emerald-300">Ticket Valid</p>
                        <p className="text-sm text-emerald-400/70">Ticket #{validateInput} has been validated and marked as used.</p>
                      </div>
                    </>
                  ) : validateResult === 'used' ? (
                    <>
                      <XCircle className="h-6 w-6 text-amber-400" />
                      <div>
                        <p className="font-semibold text-amber-300">Already Used</p>
                        <p className="text-sm text-amber-400/70">Ticket #{validateInput} has already been used for entry.</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-6 w-6 text-red-400" />
                      <div>
                        <p className="font-semibold text-red-300">Invalid Ticket</p>
                        <p className="text-sm text-red-400/70">Ticket #{validateInput} is not valid. It may be refunded or does not exist.</p>
                      </div>
                    </>
                  )}
                </motion.div>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  color: 'blue' | 'violet' | 'emerald' | 'amber';
}) {
  const colorMap = {
    blue: 'from-blue-500/10 to-blue-500/5 border-blue-500/15 text-blue-400',
    violet: 'from-violet-500/10 to-violet-500/5 border-violet-500/15 text-violet-400',
    emerald: 'from-emerald-500/10 to-emerald-500/5 border-emerald-500/15 text-emerald-400',
    amber: 'from-amber-500/10 to-amber-500/5 border-amber-500/15 text-amber-400',
  };

  return (
    <div className={`rounded-xl border bg-gradient-to-br p-5 ${colorMap[color]}`}>
      <div className="flex items-center gap-2 text-sm opacity-70">
        {icon}
        {label}
      </div>
      <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
      <div className="mt-1 text-xs opacity-60">{sub}</div>
    </div>
  );
}
