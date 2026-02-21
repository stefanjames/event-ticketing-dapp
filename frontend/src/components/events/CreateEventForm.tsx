import { useState } from 'react';
import { parseEther } from 'ethers';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CalendarPlus, Loader2 } from 'lucide-react';
import { useWalletContext } from '../wallet/WalletContext';
import { parseContractError } from '../../lib/contract';
import { TransactionStatus } from '../ui/TransactionStatus';

type TxStep = 'pending' | 'confirming' | 'confirmed' | 'failed';

export function CreateEventForm() {
  const { contract } = useWalletContext();
  const navigate = useNavigate();
  const [txStep, setTxStep] = useState<TxStep | null>(null);
  const [txHash, setTxHash] = useState('');

  const [form, setForm] = useState({
    name: '',
    description: '',
    venue: '',
    date: '',
    time: '',
    ticketPrice: '',
    maxTickets: '',
    refundDaysBefore: '7',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
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

      // Extract eventId from EventCreated event
      const eventCreatedLog = receipt.logs.find(
        (log: { fragment?: { name: string } }) => log.fragment?.name === 'EventCreated'
      );
      const eventId = eventCreatedLog?.args?.[0];

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
    'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition-colors focus:border-blue-500/50 focus:bg-white/8 focus:ring-1 focus:ring-blue-500/25';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-zinc-400">
          Event Name
        </label>
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="ETHGlobal SF 2025"
          required
          className={inputClass}
        />
      </div>

      <div>
        <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-zinc-400">
          Description
        </label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Describe your event..."
          rows={3}
          required
          className={inputClass}
        />
      </div>

      <div>
        <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-zinc-400">
          Venue
        </label>
        <input
          name="venue"
          value={form.venue}
          onChange={handleChange}
          placeholder="Moscone Center, San Francisco"
          required
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-zinc-400">
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
          <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-zinc-400">
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
          <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-zinc-400">
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
          <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-zinc-400">
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
        <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-zinc-400">
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
  );
}
