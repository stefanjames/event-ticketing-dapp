import { useState } from 'react';
import { parseEther } from 'ethers';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { CalendarPlus, Loader2, Eye, MapPin, Calendar, Clock, Ticket, Info, ImagePlus, X } from 'lucide-react';
import { useWalletContext } from '../components/wallet/WalletContext';
import { parseContractError } from '../lib/contract';
import { TransactionStatus } from '../components/ui/TransactionStatus';
import { EventCategory } from '../types';
import { CATEGORY_CONFIG } from '../lib/seedData';

type TxStep = 'pending' | 'confirming' | 'confirmed' | 'failed';

export function CreateEventPage() {
  const { contract } = useWalletContext();
  const navigate = useNavigate();
  const [txStep, setTxStep] = useState<TxStep | null>(null);
  const [txHash, setTxHash] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    description: '',
    venue: '',
    date: '',
    time: '',
    ticketPrice: '',
    maxTickets: '',
    refundDaysBefore: '7',
    category: EventCategory.Tech as string,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contract) return;

    try {
      const dateTime = new Date(`${form.date}T${form.time || '00:00'}`);
      const dateUnix = Math.floor(dateTime.getTime() / 1000);
      const refundDays = parseInt(form.refundDaysBefore) || 7;
      const refundDeadline = dateUnix - refundDays * 86400;

      setTxStep('pending');

      const tx = await contract.createEvent(
        form.name,
        form.description,
        form.venue,
        dateUnix,
        parseEther(form.ticketPrice),
        parseInt(form.maxTickets),
        refundDeadline
      );

      setTxHash(tx.hash);
      setTxStep('confirming');

      const receipt = await tx.wait();
      setTxStep('confirmed');

      toast.success('Event created successfully!');

      const eventCreatedLog = receipt.logs.find(
        (log: { fragment?: { name: string } }) => log.fragment?.name === 'EventCreated'
      );
      const eventId = eventCreatedLog?.args?.[0];

      if (eventId && imagePreview) {
        localStorage.setItem(`event-image-${eventId}`, imagePreview);
      }

      setTimeout(() => {
        if (eventId) {
          navigate(`/events/${eventId}`);
        } else {
          navigate('/events');
        }
      }, 1500);
    } catch (err) {
      setTxStep('failed');
      toast.error(parseContractError(err));
    }
  };

  const inputClass =
    'w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-blue-500/50 focus:bg-gray-50 focus:ring-1 focus:ring-blue-500/25 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder-zinc-500 dark:focus:bg-white/8';

  // Preview helpers
  const previewDate = form.date
    ? new Date(`${form.date}T${form.time || '00:00'}`).toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
      })
    : 'Date TBD';
  const previewTime = form.time
    ? new Date(`2000-01-01T${form.time}`).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : '';
  const categoryConfig = CATEGORY_CONFIG[form.category];
  const categoryEntries = Object.entries(CATEGORY_CONFIG).filter(([key]) => key !== EventCategory.All);

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          Create Event
        </h1>
        <p className="mt-2 text-gray-600 dark:text-zinc-400">
          Set up your event and start selling tickets on the blockchain.
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-5">
          {/* Form - 3 cols */}
          <div className="lg:col-span-3">
            <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-gray-200 dark:border-white/8 bg-white dark:bg-white/[0.03] p-6 sm:p-8">
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-zinc-400">
                  Event Name
                </label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="ETHGlobal SF 2026"
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-zinc-400">
                  Description
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Describe your event — what makes it unique?"
                  rows={4}
                  required
                  className={inputClass}
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-zinc-400">
                  Event Image
                </label>
                {imagePreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-white/10">
                    <img src={imagePreview} alt="Event preview" className="w-full h-40 object-cover" />
                    <button
                      type="button"
                      onClick={() => setImagePreview(null)}
                      className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-colors hover:bg-black/80"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.02] py-8 transition-colors hover:border-gray-300 dark:hover:border-white/20 hover:bg-gray-100 dark:hover:bg-white/[0.04]">
                    <ImagePlus className="h-8 w-8 text-gray-400 dark:text-zinc-600" />
                    <span className="text-sm text-gray-500 dark:text-zinc-500">Click to upload an image</span>
                    <span className="text-xs text-gray-400 dark:text-zinc-600">PNG, JPG, or WebP</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-zinc-400">
                    Venue
                  </label>
                  <input
                    name="venue"
                    value={form.venue}
                    onChange={handleChange}
                    placeholder="Moscone Center, SF"
                    required
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-zinc-400">
                    Category
                  </label>
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    className={inputClass}
                  >
                    {categoryEntries.map(([key, config]) => (
                      <option key={key} value={key}>
                        {config.icon} {config.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-zinc-400">
                    Date
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={form.date}
                    onChange={handleChange}
                    required
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-zinc-400">
                    Time
                  </label>
                  <input
                    type="time"
                    name="time"
                    value={form.time}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-zinc-400">
                    Ticket Price (ETH)
                  </label>
                  <input
                    type="number"
                    name="ticketPrice"
                    value={form.ticketPrice}
                    onChange={handleChange}
                    placeholder="0.1"
                    step="0.001"
                    min="0.000000000000000001"
                    required
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-zinc-400">
                    Max Tickets
                  </label>
                  <input
                    type="number"
                    name="maxTickets"
                    value={form.maxTickets}
                    onChange={handleChange}
                    placeholder="100"
                    min="1"
                    required
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-gray-600 dark:text-zinc-400">
                  Refund Window (days before event)
                </label>
                <input
                  type="number"
                  name="refundDaysBefore"
                  value={form.refundDaysBefore}
                  onChange={handleChange}
                  placeholder="7"
                  min="1"
                  className={inputClass}
                />
                <p className="mt-1.5 text-xs text-gray-400 dark:text-zinc-600">
                  Attendees can request a full refund up to this many days before the event.
                </p>
              </div>

              {/* Gas estimation */}
              <div className="flex items-start gap-2 rounded-lg border border-gray-100 dark:border-white/6 bg-gray-50 dark:bg-white/[0.02] p-3">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-gray-500 dark:text-zinc-500" />
                <div className="text-xs text-gray-500 dark:text-zinc-500">
                  <p>Creating an event costs approximately <span className="text-gray-700 dark:text-zinc-300">0.003-0.005 ETH</span> in gas fees.</p>
                  <p className="mt-1">The category is stored off-chain. Only name, description, venue, date, price, max tickets, and refund deadline are stored on the smart contract.</p>
                </div>
              </div>

              {txStep && (
                <TransactionStatus step={txStep} hash={txHash} message="Event created successfully!" />
              )}

              <button
                type="submit"
                disabled={txStep === 'pending' || txStep === 'confirming'}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-violet-500 px-6 py-3.5 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-blue-500/25 disabled:opacity-50"
              >
                {txStep === 'pending' || txStep === 'confirming' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CalendarPlus className="h-4 w-4" />
                )}
                {txStep === 'pending' ? 'Submitting...' : txStep === 'confirming' ? 'Confirming...' : 'Create Event'}
              </button>
            </form>
          </div>

          {/* Live Preview - 2 cols */}
          <div className="lg:col-span-2">
            <div className="sticky top-24">
              <div className="mb-3 flex items-center gap-2 text-sm text-gray-500 dark:text-zinc-500">
                <Eye className="h-4 w-4" />
                Live Preview
              </div>

              {/* Preview card */}
              <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.03]">
                {/* Banner — uploaded image or category gradient */}
                <div
                  className="relative flex aspect-[3/1] items-end p-4"
                  style={{
                    background: imagePreview
                      ? undefined
                      : form.category === 'music'
                      ? 'linear-gradient(135deg, #f43f5e, #f59e0b)'
                      : form.category === 'sports'
                      ? 'linear-gradient(135deg, #f59e0b, #ef4444)'
                      : form.category === 'arts'
                      ? 'linear-gradient(135deg, #10b981, #06b6d4)'
                      : form.category === 'comedy'
                      ? 'linear-gradient(135deg, #8b5cf6, #ec4899)'
                      : form.category === 'conference'
                      ? 'linear-gradient(135deg, #06b6d4, #3b82f6)'
                      : 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                  }}
                >
                  {imagePreview && (
                    <img src={imagePreview} alt="" className="absolute inset-0 h-full w-full object-cover" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-[#09090b] via-transparent to-transparent" />
                  {categoryConfig && (
                    <span className="relative z-10 inline-flex items-center gap-1 rounded-full bg-black/40 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-sm">
                      {categoryConfig.icon} {categoryConfig.label}
                    </span>
                  )}
                </div>

                <div className="space-y-3 p-5">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white line-clamp-2">
                    {form.name || 'Your Event Name'}
                  </h3>

                  {form.description && (
                    <p className="text-xs text-gray-500 dark:text-zinc-500 line-clamp-2">{form.description}</p>
                  )}

                  <div className="space-y-1.5">
                    {form.venue && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-zinc-400">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        {form.venue}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-zinc-400">
                      <Calendar className="h-3.5 w-3.5 shrink-0" />
                      {previewDate}
                      {previewTime && (
                        <>
                          <Clock className="ml-2 h-3.5 w-3.5 shrink-0" />
                          {previewTime}
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-gray-100 dark:border-white/6 pt-3">
                    <span className="rounded-full bg-blue-500/15 px-3 py-1 text-xs font-semibold text-blue-400">
                      {form.ticketPrice ? `${form.ticketPrice} ETH` : '— ETH'}
                    </span>
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-zinc-500">
                      <Ticket className="h-3.5 w-3.5" />
                      {form.maxTickets || '—'} tickets
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick summary */}
              <div className="mt-4 space-y-2 rounded-xl border border-gray-100 dark:border-white/6 bg-gray-50 dark:bg-white/[0.02] p-4 text-xs text-gray-500 dark:text-zinc-500">
                <div className="flex justify-between">
                  <span>Refund deadline</span>
                  <span className="text-gray-600 dark:text-zinc-400">
                    {form.date && form.refundDaysBefore
                      ? `${form.refundDaysBefore} day${parseInt(form.refundDaysBefore) !== 1 ? 's' : ''} before event`
                      : '—'}
                  </span>
                </div>
                {form.ticketPrice && form.maxTickets && (
                  <div className="flex justify-between">
                    <span>Max revenue</span>
                    <span className="text-gray-600 dark:text-zinc-400">
                      {(parseFloat(form.ticketPrice) * parseInt(form.maxTickets || '0')).toFixed(4)} ETH
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
