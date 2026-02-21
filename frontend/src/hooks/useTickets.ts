import { useState, useEffect, useCallback } from 'react';
import type { Contract } from 'ethers';
import type { TicketData } from '../types';

export function useUserTickets(contract: Contract | null, address: string) {
  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTickets = useCallback(async () => {
    if (!contract || !address) return;
    setLoading(true);
    try {
      const ticketIds: bigint[] = await contract.getUserTickets(address);
      const tix: TicketData[] = [];

      for (const id of ticketIds) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const t: any = await contract.getTicket(id);
        tix.push({
          ticketId: t.ticketId,
          eventId: t.eventId,
          owner: t.owner,
          purchasePrice: t.purchasePrice,
          status: Number(t.status) as TicketData['status'],
          purchasedAt: t.purchasedAt,
        });
      }

      setTickets(tix);
    } catch (err) {
      console.error('Failed to fetch tickets:', err);
    } finally {
      setLoading(false);
    }
  }, [contract, address]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  return { tickets, loading, refetch: fetchTickets };
}
