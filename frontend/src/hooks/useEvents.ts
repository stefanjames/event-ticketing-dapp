import { useState, useEffect, useCallback } from 'react';
import type { Contract } from 'ethers';
import type { EventData } from '../types';

export function useEvents(contract: Contract | null) {
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchEvents = useCallback(async () => {
    if (!contract) return;
    setLoading(true);
    try {
      const count = await contract.eventCount();
      const total = Number(count);
      const evts: EventData[] = [];

      for (let i = 1; i <= total; i++) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const evt: any = await contract.getFunction('getEvent')(i);
        evts.push({
          eventId: evt.eventId,
          organizer: evt.organizer,
          name: evt.name,
          description: evt.description,
          venue: evt.venue,
          date: evt.date,
          ticketPrice: evt.ticketPrice,
          maxTickets: evt.maxTickets,
          ticketsSold: evt.ticketsSold,
          refundDeadline: evt.refundDeadline,
          status: Number(evt.status) as EventData['status'],
        });
      }

      setEvents(evts.reverse());
    } catch (err) {
      console.error('Failed to fetch events:', err);
    } finally {
      setLoading(false);
    }
  }, [contract]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return { events, loading, refetch: fetchEvents };
}

export function useEvent(contract: Contract | null, eventId: number | null) {
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchEvent = useCallback(async () => {
    if (!contract || !eventId) return;
    setLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const evt: any = await contract.getFunction('getEvent')(eventId);
      setEvent({
        eventId: evt.eventId,
        organizer: evt.organizer,
        name: evt.name,
        description: evt.description,
        venue: evt.venue,
        date: evt.date,
        ticketPrice: evt.ticketPrice,
        maxTickets: evt.maxTickets,
        ticketsSold: evt.ticketsSold,
        refundDeadline: evt.refundDeadline,
        status: Number(evt.status) as EventData['status'],
      });
    } catch {
      setEvent(null);
    } finally {
      setLoading(false);
    }
  }, [contract, eventId]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  return { event, loading, refetch: fetchEvent };
}
