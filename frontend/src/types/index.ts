export const EventStatus = {
  Active: 0,
  Canceled: 1,
  Completed: 2,
} as const;
export type EventStatus = (typeof EventStatus)[keyof typeof EventStatus];

export const TicketStatus = {
  Valid: 0,
  Used: 1,
  Refunded: 2,
} as const;
export type TicketStatus = (typeof TicketStatus)[keyof typeof TicketStatus];

export const EventCategory = {
  All: 'all',
  Music: 'music',
  Sports: 'sports',
  Tech: 'tech',
  Arts: 'arts',
  Comedy: 'comedy',
  Conference: 'conference',
} as const;
export type EventCategory = (typeof EventCategory)[keyof typeof EventCategory];

export interface EventData {
  eventId: bigint;
  organizer: string;
  name: string;
  description: string;
  venue: string;
  date: bigint;
  ticketPrice: bigint;
  maxTickets: bigint;
  ticketsSold: bigint;
  refundDeadline: bigint;
  status: EventStatus;
}

export interface DemoEvent {
  name: string;
  description: string;
  venue: string;
  date: string;
  ticketPrice: string;
  maxTickets: number;
  ticketsSold: number;
  category: EventCategory;
  imageGradient: [string, string];
  imageUrl: string;
}

export interface TicketData {
  ticketId: bigint;
  eventId: bigint;
  owner: string;
  purchasePrice: bigint;
  status: TicketStatus;
  purchasedAt: bigint;
}

export type WalletState = 'disconnected' | 'connecting' | 'connected' | 'wrong_network';
