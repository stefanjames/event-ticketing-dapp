import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  ArrowRight, Wallet, Search, Ticket,
  ChevronDown, ChevronRight, Lock, FileText, Zap,
  BarChart3, CheckCircle2, Calendar, MapPin,
} from 'lucide-react';
import { useWalletContext } from '../components/wallet/WalletContext';
import { demoEvents, getDemoEventsByCategory, getFeaturedEvent, CATEGORY_CONFIG } from '../lib/seedData';
import { EventCategory } from '../types';

// ─── Animation Variants ──────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const cardItem = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 1, 0.5, 1] as const } },
};

// ─── CountUp ─────────────────────────────────────────────────────────────────

function CountUp({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const duration = 1500;
    const steps = 40;
    const increment = target / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [inView, target]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

// ─── FAQ Item ────────────────────────────────────────────────────────────────

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-200 dark:border-white/[0.07]">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-5 text-left"
      >
        <span className="text-base font-medium text-gray-800 dark:text-zinc-200">{q}</span>
        <ChevronDown className={`ml-4 h-4 w-4 shrink-0 text-gray-400 dark:text-zinc-500 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      <div
        className="grid transition-all duration-300 ease-in-out"
        style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <p className="pb-5 text-sm leading-relaxed text-gray-600 dark:text-zinc-400">{a}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Demo Event Card ─────────────────────────────────────────────────────────

function DemoEventCard({ event }: { event: typeof demoEvents[0] }) {
  const soldPercent = (event.ticketsSold / event.maxTickets) * 100;
  const available = event.maxTickets - event.ticketsSold;
  const dateStr = new Date(event.date).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  return (
    <motion.div variants={cardItem}>
      <div className="group overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-2 hover:border-gray-300 hover:shadow-md dark:border-white/[0.06] dark:bg-[#111113] dark:shadow-none dark:hover:border-white/[0.12] dark:hover:shadow-black/30">
        {/* Image header with gradient fallback */}
        <div
          className="relative flex aspect-[5/3] flex-col justify-end overflow-hidden p-5"
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
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/50 to-transparent dark:from-[#111113] dark:via-[#111113]/40 dark:to-transparent" />
          <div className="relative z-10">
            <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-black/40 px-2.5 py-1 text-[11px] font-medium text-white/90 backdrop-blur-sm">
              {CATEGORY_CONFIG[event.category]?.icon} {CATEGORY_CONFIG[event.category]?.label}
            </span>
            <h3 className="text-lg font-bold leading-snug text-gray-900 group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-300 transition-colors line-clamp-2">
              {event.name}
            </h3>
          </div>
        </div>

        <div className="p-5 space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-zinc-400">
              <Calendar className="h-3.5 w-3.5 shrink-0 text-gray-400 dark:text-zinc-500" />
              {dateStr}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-zinc-400">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400 dark:text-zinc-500" />
              <span className="truncate">{event.venue}</span>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-gray-100 pt-3 dark:border-white/[0.06]">
            <span
              className="rounded-full px-3 py-1 text-xs font-semibold"
              style={{ backgroundColor: `${event.imageGradient[0]}20`, color: event.imageGradient[0] }}
            >
              {event.ticketPrice} ETH
            </span>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-200 dark:bg-white/10">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${soldPercent}%`, backgroundColor: soldPercent > 80 ? '#ef4444' : event.imageGradient[0] }}
                />
              </div>
              <span className="text-xs text-gray-500 dark:text-zinc-500">{available} left</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// LANDING PAGE
// ═════════════════════════════════════════════════════════════════════════════

export function HomePage() {
  const { state, connect } = useWalletContext();
  const [activeCategory, setActiveCategory] = useState<string>(EventCategory.All);

  const filteredEvents = getDemoEventsByCategory(activeCategory);
  const featured = getFeaturedEvent();
  const featuredSoldPercent = (featured.ticketsSold / featured.maxTickets) * 100;

  const categories = Object.entries(CATEGORY_CONFIG);

  return (
    <div className="relative z-0 bg-[#f0f0f3] dark:bg-[#09090b]">

      {/* ═══════════════════════════════════════════════════════════════════
          1. HERO
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-[#f0f0f3] to-white dark:from-transparent dark:to-transparent">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
          <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-blue-500/5 blur-[128px]" />
          <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-violet-500/5 blur-[128px]" />
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-[800px] flex-col items-center px-6 py-32 text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as const }}
            className="flex flex-col items-center"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-medium text-blue-600 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px] shadow-emerald-400/50" />
              Powered by Ethereum Smart Contracts
            </div>

            <h1 className="text-5xl font-bold leading-[1.05] tracking-tight text-gray-900 dark:text-white sm:text-6xl lg:text-7xl" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Your Ticket. Your Wallet.{' '}
              <span className="bg-gradient-to-r from-blue-500 to-violet-500 bg-clip-text text-transparent">
                Your Proof.
              </span>
            </h1>

            <p className="mx-auto mt-4 text-lg text-gray-600 dark:text-zinc-400">
              Tickets, verified on-chain.
            </p>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-gray-500 dark:text-zinc-500">
              Create, sell, and transfer event tickets on the blockchain.<br />
              No middlemen. No hidden fees. Full transparency.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              {state === 'connected' ? (
                <>
                  <Link
                    to="/events"
                    className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 px-8 py-3.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/25 active:scale-[0.98]"
                  >
                    Explore Events
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  <Link
                    to="/create"
                    className="rounded-xl border border-gray-300 px-8 py-3.5 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 dark:border-white/15 dark:text-white dark:hover:bg-white/5"
                  >
                    Create an Event
                  </Link>
                </>
              ) : (
                <>
                  <button
                    onClick={connect}
                    className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 px-8 py-3.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/25 active:scale-[0.98]"
                  >
                    <Wallet className="h-4 w-4" />
                    Connect Wallet to Start
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </button>
                  <a href="#trending" className="rounded-xl border border-gray-300 px-8 py-3.5 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 dark:border-white/15 dark:text-white dark:hover:bg-white/5">
                    Browse Events
                  </a>
                </>
              )}
            </div>
          </motion.div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="h-5 w-5 text-gray-400 dark:text-zinc-600" />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          2. CATEGORY TABS
          ═══════════════════════════════════════════════════════════════════ */}
      <section id="trending" className="relative z-10 border-y border-gray-200 bg-[#e8e8ec] py-5 dark:border-white/[0.08] dark:bg-[#0c0c0f]">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex justify-center gap-3 overflow-x-auto scrollbar-hide sm:gap-4" style={{ scrollbarWidth: 'none' }}>
            {categories.map(([key, { label, icon }]) => (
              <button
                key={key}
                onClick={() => setActiveCategory(key)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-200 ${
                  activeCategory === key
                    ? 'bg-gray-900 text-white ring-1 ring-gray-900 dark:bg-white/10 dark:text-white dark:ring-white/20'
                    : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700 dark:hover:bg-white/5 dark:hover:text-zinc-300'
                }`}
              >
                <span>{icon}</span> {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          3. TRENDING EVENTS
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 bg-[#f0f0f3] py-28 border-b border-gray-200 dark:bg-[#09090b] dark:border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-12 flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Trending Events
            </h2>
            <Link to="/events" className="flex items-center gap-1 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white">
              View All <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            {filteredEvents.slice(0, 6).map((event) => (
              <DemoEventCard key={event.name} event={event} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          4. ON-CHAIN GUARANTEE
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 bg-[#e8e8ec] py-28 border-b border-gray-200 dark:bg-[#0c0c0f] dark:border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {[
                {
                  icon: Lock,
                  title: 'On-Chain Guarantee',
                  desc: 'Every ticket is a verifiable smart contract record. No counterfeits. No disputes. The blockchain is your receipt.',
                },
                {
                  icon: FileText,
                  title: 'Total Price Transparency',
                  desc: 'Ticket price + gas. That\'s it. No 15-25% service fees. No surprise charges at checkout. What you see is what you pay.',
                },
                {
                  icon: Zap,
                  title: 'Instant Refunds',
                  desc: 'Request refunds before the deadline — ETH goes straight back to your wallet. No support tickets. No waiting.',
                },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="group/card rounded-xl p-8 text-center transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-md dark:hover:bg-white/[0.02] dark:hover:shadow-none">
                  <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/15 transition-transform duration-300 group-hover/card:scale-110">
                    <Icon className="h-6 w-6 text-blue-400" />
                  </div>
                  <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
                  <p className="text-sm leading-relaxed text-gray-600 dark:text-zinc-400">{desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          5. HOW IT WORKS
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 bg-[#f0f0f3] py-28 border-b border-gray-200 dark:bg-[#09090b] dark:border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
          >
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                How It Works
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-gray-600 dark:text-zinc-400">
                Three steps to your first on-chain ticket.
              </p>
            </div>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 gap-8 md:grid-cols-3"
          >
            {[
              { icon: Wallet, num: '01', title: 'Connect Wallet', desc: 'Link your MetaMask wallet. Your address is your identity — no accounts, no passwords.' },
              { icon: Search, num: '02', title: 'Browse & Purchase', desc: 'Find events by category. Pay with ETH. Tickets are minted instantly to your wallet.' },
              { icon: Ticket, num: '03', title: 'Attend or Transfer', desc: 'Show your ticket for on-chain validation, or transfer it to anyone with an address.' },
            ].map(({ icon: Icon, num, title, desc }) => (
              <motion.div
                key={num}
                variants={cardItem}
                className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-gray-300 hover:shadow-md dark:border-white/[0.06] dark:bg-[#111113] dark:shadow-none dark:hover:border-blue-500/[0.15] dark:hover:bg-[#131315] dark:hover:shadow-black/20"
              >
                <span className="mb-6 block text-5xl font-black bg-gradient-to-r from-blue-400/40 to-violet-400/25 dark:from-blue-400/35 dark:to-violet-400/20 bg-clip-text text-transparent">
                  {num}
                </span>
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/15 border border-blue-500/20 dark:bg-blue-500/10 dark:border-blue-500/15">
                  <Icon className="h-5 w-5 text-blue-400" />
                </div>
                <h3 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
                <p className="text-sm leading-relaxed text-gray-600 dark:text-zinc-400">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          6. FEATURED EVENT SPOTLIGHT
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 bg-[#e8e8ec] py-28 border-b border-gray-200 dark:bg-[#0c0c0f] dark:border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <h2 className="mb-12 text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Featured Event
            </h2>

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow duration-300 hover:shadow-xl dark:border-white/[0.06] dark:bg-[#111113] dark:shadow-none dark:hover:shadow-black/40">
              <div className="grid grid-cols-1 lg:grid-cols-2">
                {/* Left: Event details */}
                <div className="relative flex flex-col justify-center p-10">
                  {featured.imageUrl && (
                    <>
                      <img
                        src={featured.imageUrl}
                        alt={featured.name}
                        className="absolute inset-0 h-full w-full object-cover opacity-5 dark:opacity-10"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 to-white/80 dark:from-[#111113] dark:via-[#111113]/95 dark:to-[#111113]/80" />
                    </>
                  )}
                  <div className="relative z-10">
                    <span className="mb-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-medium text-blue-600 dark:bg-white/5 dark:border-white/[0.06] dark:text-zinc-400">
                      {CATEGORY_CONFIG[featured.category]?.icon} {CATEGORY_CONFIG[featured.category]?.label}
                    </span>

                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">{featured.name}</h3>

                    <p className="mt-4 text-sm leading-relaxed text-gray-600 dark:text-zinc-400">{featured.description}</p>

                    <div className="mt-6 space-y-3 text-sm text-gray-500 dark:text-zinc-500">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400 dark:text-zinc-600" />
                        {new Date(featured.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400 dark:text-zinc-600" />
                        {featured.venue}
                      </div>
                    </div>

                    <div className="mt-6 flex items-center gap-4">
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">{featured.ticketPrice} ETH</span>
                      <span className="text-sm text-gray-500 dark:text-zinc-500">per ticket</span>
                    </div>

                    <Link
                      to="/events"
                      className="mt-6 inline-flex w-fit items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 px-6 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/25 active:scale-[0.98]"
                    >
                      Get Tickets <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>

                {/* Right: Ticket preview */}
                <div className="flex items-center justify-center bg-[#f0f0f3] p-10 dark:bg-[#0c0c0f]">
                  <div
                    className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-white/[0.06] dark:bg-[#111113] dark:shadow-none"
                    style={{ borderLeft: `3px solid ${featured.imageGradient[0]}` }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-zinc-600">Event Ticket</p>
                        <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white truncate">{featured.name}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-emerald-500/15 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-medium text-emerald-400">Valid</span>
                    </div>

                    <div className="mt-5 space-y-2 text-sm text-gray-500 dark:text-zinc-400">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400 dark:text-zinc-600" />
                        <span className="truncate">{featured.venue}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 shrink-0 text-gray-400 dark:text-zinc-600" />
                        {new Date(featured.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>

                    <div className="mt-5 border-t border-dashed border-gray-200 pt-4 dark:border-white/[0.08]">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs text-gray-400 dark:text-zinc-600">#00001</span>
                        <span className="font-mono text-xs text-gray-400 dark:text-zinc-600">0x7a3b...9f2e</span>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 dark:text-zinc-500">Availability</span>
                        <span className="text-gray-900 dark:text-white">{featured.ticketsSold.toLocaleString()} / {featured.maxTickets.toLocaleString()}</span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-white/10">
                        <div className="h-full rounded-full" style={{ width: `${featuredSoldPercent}%`, backgroundColor: featured.imageGradient[0] }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          7. STATS BAR
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 border-y border-gray-200 bg-[#f0f0f3] py-20 dark:border-white/[0.08] dark:bg-[#09090b]">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {[
              { label: 'Events Created', value: 240, suffix: '+' },
              { label: 'Tickets Sold', value: 15400, suffix: '+' },
              { label: 'ETH Volume', value: 847, suffix: '' },
              { label: 'Active Users', value: 3200, suffix: '+' },
            ].map(({ label, value, suffix }) => (
              <div key={label} className="text-center">
                <div className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                  <CountUp target={value} suffix={suffix} />
                </div>
                <p className="mt-2 text-sm text-gray-500 dark:text-zinc-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          8. FOR ORGANIZERS
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 bg-[#e8e8ec] py-28 border-b border-gray-200 dark:bg-[#0c0c0f] dark:border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid items-center gap-16 grid-cols-1 lg:grid-cols-2"
          >
            {/* Left: Dashboard mockup */}
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-white/[0.06] dark:bg-[#111113] dark:shadow-none">
              {/* Title bar */}
              <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-3 dark:border-white/[0.06]">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-500/60" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
                  <div className="h-3 w-3 rounded-full bg-green-500/60" />
                </div>
                <span className="text-xs font-medium text-gray-500 dark:text-zinc-500">Organizer Dashboard</span>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Stats row */}
                <div className="mb-6 grid grid-cols-3 gap-4">
                  <div className="rounded-xl border border-gray-200 bg-[#f0f0f3] p-3.5 dark:border-white/[0.06] dark:bg-[#0c0c0f]">
                    <div className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-zinc-600">Events</div>
                    <div className="mt-1 text-xl font-bold text-gray-900 dark:text-white">4</div>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-[#f0f0f3] p-3.5 dark:border-white/[0.06] dark:bg-[#0c0c0f]">
                    <div className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-zinc-600">Sold</div>
                    <div className="mt-1 text-xl font-bold text-gray-900 dark:text-white">1,847</div>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-[#f0f0f3] p-3.5 dark:border-white/[0.06] dark:bg-[#0c0c0f]">
                    <div className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-zinc-600">Revenue</div>
                    <div className="mt-1 text-xl font-bold text-emerald-400">12.47 ETH</div>
                  </div>
                </div>

                {/* Event list */}
                <div className="divide-y divide-gray-100 dark:divide-white/[0.04]">
                  {[
                    { name: 'ETHDenver 2026', status: 'Active', sold: '1,847/2,000', pct: 92 },
                    { name: 'Blockchain Music Fest', status: 'Active', sold: '6,420/9,000', pct: 71 },
                    { name: 'DeFi Summit', status: 'Completed', sold: '234/800', pct: 29 },
                  ].map(evt => (
                    <div key={evt.name} className="flex items-center justify-between py-3.5">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          evt.status === 'Active'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                            : 'bg-zinc-500/15 text-zinc-400 border border-zinc-500/20'
                        }`}>{evt.status}</span>
                        <span className="truncate text-sm text-gray-900 dark:text-white">{evt.name}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-3">
                        <span className="text-xs text-gray-500 dark:text-zinc-500">{evt.sold}</span>
                        <div className="h-1.5 w-14 overflow-hidden rounded-full bg-gray-200 dark:bg-white/10">
                          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${evt.pct}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Withdraw CTA */}
                <div className="mt-5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-center">
                  <BarChart3 className="mx-auto h-5 w-5 text-emerald-400" />
                  <div className="mt-1.5 text-xs text-emerald-400">Available to Withdraw: <span className="font-semibold">8.21 ETH</span></div>
                </div>
              </div>
            </div>

            {/* Right: Copy */}
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Your events. Your revenue.{' '}
                <span className="bg-gradient-to-r from-blue-500 to-violet-500 bg-clip-text text-transparent">Your rules.</span>
              </h2>
              <p className="mt-4 mb-8 text-base leading-relaxed text-gray-600 dark:text-zinc-400">
                No platform approval. No revenue share. Create events, sell tickets, and withdraw funds directly to your wallet.
              </p>
              <ul className="space-y-4">
                {[
                  'Set your own prices and capacity',
                  'Validate tickets on-chain at the door',
                  'Withdraw revenue after your event',
                  'Cancel events with automatic refund eligibility',
                ].map(text => (
                  <li key={text} className="flex items-center gap-3 text-sm text-gray-600 dark:text-zinc-400">
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
                    {text}
                  </li>
                ))}
              </ul>
              <Link
                to="/create"
                className="mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 px-6 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/25 active:scale-[0.98]"
              >
                Create Your First Event <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          9. WHY CHAINTIX — COMPARISON TABLE
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 bg-[#f0f0f3] py-28 border-b border-gray-200 dark:bg-[#09090b] dark:border-white/[0.06]">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Why ChainTix?
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-gray-600 dark:text-zinc-400">
                See how blockchain ticketing compares to traditional platforms.
              </p>
            </div>

            <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-white/[0.06] dark:bg-[#111113] dark:shadow-none">
              {/* Header */}
              <div className="grid grid-cols-3 bg-[#f0f0f3] px-6 py-4 dark:bg-[#1a1a1f]">
                <span className="text-sm font-medium text-gray-500 dark:text-zinc-400">Feature</span>
                <span className="text-sm font-semibold text-blue-400">ChainTix</span>
                <span className="text-sm font-medium text-gray-400 dark:text-zinc-500">Traditional</span>
              </div>
              {/* Rows */}
              {[
                ['Service Fees', 'Gas only (~$0.50)', '15-25% of ticket price'],
                ['Ownership', 'You (on-chain)', 'Platform controls'],
                ['Refunds', 'Smart contract — instant', 'Support ticket + weeks'],
                ['Counterfeits', 'Impossible', 'Common problem'],
                ['Transfers', 'Instant, peer-to-peer', 'Platform restrictions'],
                ['Organizer Revenue', '100% — no cuts', 'After platform cut'],
              ].map(([feature, chain, trad]) => (
                <div key={feature} className="grid grid-cols-3 border-t border-gray-100 px-6 py-4 transition-colors duration-200 hover:bg-[#f0f0f3] dark:border-white/[0.04] dark:hover:bg-white/[0.02]">
                  <span className="text-sm font-medium text-gray-700 dark:text-zinc-300">{feature}</span>
                  <span className="text-sm font-medium text-emerald-600 dark:text-green-400">{chain}</span>
                  <span className="text-sm text-gray-400 dark:text-zinc-500">{trad}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          10. FAQ
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 bg-[#e8e8ec] py-28 border-b border-gray-200 dark:bg-[#0c0c0f] dark:border-white/[0.06]">
        <div className="mx-auto max-w-2xl px-6">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <h2 className="mb-12 text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Frequently Asked Questions
            </h2>

            <div>
              <FAQItem
                q="How do I purchase a ticket?"
                a="Connect your MetaMask wallet, browse events, select quantity, and confirm the transaction. Tickets are minted directly to your wallet — no account needed."
              />
              <FAQItem
                q="How do refunds work?"
                a="If the event is canceled, you can request a refund at any time. For active events, refunds are available before the organizer's refund deadline. ETH is sent directly to your wallet via the smart contract."
              />
              <FAQItem
                q="Can I transfer my ticket to someone else?"
                a="Yes. You can transfer any valid ticket to any Ethereum address instantly. The new owner has full rights to use, refund, or transfer the ticket again."
              />
              <FAQItem
                q="What happens if an event is canceled?"
                a="The organizer marks the event as canceled on-chain. All ticket holders can then request refunds at any time — there's no deadline for canceled events."
              />
              <FAQItem
                q="What networks are supported?"
                a="ChainTix is designed for EVM-compatible chains including Ethereum, Polygon, Base, and Arbitrum. During development, we use a local Hardhat/Anvil node."
              />
              <FAQItem
                q="Is the smart contract audited?"
                a="The contract is built with OpenZeppelin's battle-tested libraries (ReentrancyGuard, Pausable, Ownable) and hardened against the SWC Registry of known vulnerabilities. The test suite covers 77 scenarios."
              />
              <FAQItem
                q="What are the fees?"
                a="ChainTix charges zero platform fees. You only pay the ticket price plus network gas fees (typically under $1 on L2 networks). 100% of ticket revenue goes to the event organizer."
              />
              <FAQItem
                q="Do I need a crypto wallet?"
                a="Yes, you need MetaMask or a compatible Ethereum wallet. MetaMask is free and takes about 2 minutes to set up."
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          11. FINAL CTA
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="relative z-10 overflow-hidden bg-[#f0f0f3] py-32 dark:bg-[#09090b]">
        {/* Radial glow */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/[0.06] blur-[100px]" />
          <div className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-500/[0.06] blur-[80px]" />
        </div>

        <div className="mx-auto max-w-7xl px-6">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="relative z-10 text-center"
          >
            <h2 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-5xl" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Ready to go on-chain?
            </h2>
            <p className="mx-auto mt-4 mb-10 max-w-lg text-gray-600 dark:text-zinc-400">
              Join the future of event ticketing. No gatekeepers. No hidden fees. Just events, owned by you.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              {state === 'connected' ? (
                <>
                  <Link
                    to="/events"
                    className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 px-8 py-3.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/25 active:scale-[0.98]"
                  >
                    Explore Events <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  <Link
                    to="/create"
                    className="rounded-xl border border-gray-300 px-8 py-3.5 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 dark:border-white/15 dark:text-white dark:hover:bg-white/5"
                  >
                    Create an Event
                  </Link>
                </>
              ) : (
                <>
                  <button
                    onClick={connect}
                    className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 px-8 py-3.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/25 active:scale-[0.98]"
                  >
                    <Wallet className="h-4 w-4" />
                    Connect Wallet
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </button>
                  <a href="#trending" className="rounded-xl border border-gray-300 px-8 py-3.5 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 dark:border-white/15 dark:text-white dark:hover:bg-white/5">
                    Browse Events
                  </a>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
