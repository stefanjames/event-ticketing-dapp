import { EventCategory } from '../types';
import type { DemoEvent } from '../types';

export const CATEGORY_CONFIG: Record<string, { label: string; icon: string }> = {
  [EventCategory.All]: { label: 'All Events', icon: '🌐' },
  [EventCategory.Music]: { label: 'Music', icon: '🎵' },
  [EventCategory.Sports]: { label: 'Sports', icon: '🏀' },
  [EventCategory.Tech]: { label: 'Tech & Web3', icon: '💻' },
  [EventCategory.Arts]: { label: 'Arts', icon: '🎨' },
  [EventCategory.Comedy]: { label: 'Comedy', icon: '😂' },
  [EventCategory.Conference]: { label: 'Conferences', icon: '🎤' },
};

export const demoEvents: DemoEvent[] = [
  {
    name: 'ETHDenver 2026 — Main Stage',
    description: 'The world\'s largest Ethereum hackathon and conference. Three days of talks, workshops, and building with the brightest minds in Web3.',
    venue: 'Denver Convention Center, CO',
    date: '2026-03-15T09:00:00Z',
    ticketPrice: '0.15',
    maxTickets: 2000,
    ticketsSold: 1847,
    category: EventCategory.Tech,
    imageGradient: ['#3b82f6', '#8b5cf6'],
    imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&h=400&fit=crop',
  },
  {
    name: 'Blockchain Music Festival',
    description: 'Live performances with all tickets and royalties managed on-chain. Artists get paid instantly. No intermediaries.',
    venue: 'Red Rocks Amphitheatre, Morrison, CO',
    date: '2026-06-20T18:00:00Z',
    ticketPrice: '0.08',
    maxTickets: 9000,
    ticketsSold: 6420,
    category: EventCategory.Music,
    imageGradient: ['#f43f5e', '#f59e0b'],
    imageUrl: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=600&h=400&fit=crop',
  },
  {
    name: 'NBA Finals Watch Party',
    description: 'Giant screen, food trucks, and on-chain proof of attendance for every attendee. Celebrate the finals with the community.',
    venue: 'Crypto.com Arena, Los Angeles, CA',
    date: '2026-06-15T19:30:00Z',
    ticketPrice: '0.025',
    maxTickets: 500,
    ticketsSold: 312,
    category: EventCategory.Sports,
    imageGradient: ['#f59e0b', '#ef4444'],
    imageUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600&h=400&fit=crop',
  },
  {
    name: 'DeFi Summit 2026',
    description: 'Two days of deep dives into lending protocols, DEX architecture, yield strategies, and the future of decentralized finance.',
    venue: 'Javits Center, New York, NY',
    date: '2026-09-10T08:00:00Z',
    ticketPrice: '0.5',
    maxTickets: 800,
    ticketsSold: 234,
    category: EventCategory.Conference,
    imageGradient: ['#06b6d4', '#3b82f6'],
    imageUrl: 'https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=600&h=400&fit=crop',
  },
  {
    name: 'Stand-Up Comedy Night: Web3 Roast',
    description: 'Comedians roast crypto culture, NFT bros, and rug pulls. All proceeds to charity. Laughs guaranteed, returns not.',
    venue: 'The Comedy Store, Hollywood, CA',
    date: '2026-04-22T20:00:00Z',
    ticketPrice: '0.02',
    maxTickets: 200,
    ticketsSold: 178,
    category: EventCategory.Comedy,
    imageGradient: ['#8b5cf6', '#ec4899'],
    imageUrl: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=600&h=400&fit=crop',
  },
  {
    name: 'Immersive Art Exhibition: On-Chain Canvas',
    description: 'Interactive digital art installations where visitors can mint moments as on-chain artifacts. Art meets blockchain.',
    venue: 'MOMA PS1, Queens, NY',
    date: '2026-05-01T10:00:00Z',
    ticketPrice: '0.04',
    maxTickets: 300,
    ticketsSold: 156,
    category: EventCategory.Arts,
    imageGradient: ['#10b981', '#06b6d4'],
    imageUrl: 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=600&h=400&fit=crop',
  },
  {
    name: 'Solidity Security Workshop',
    description: 'Hands-on smart contract auditing workshop. Learn to find reentrancy, overflow, and access control bugs in real contracts.',
    venue: 'Online — Zoom + Discord',
    date: '2026-04-05T14:00:00Z',
    ticketPrice: '0.03',
    maxTickets: 100,
    ticketsSold: 89,
    category: EventCategory.Tech,
    imageGradient: ['#22c55e', '#3b82f6'],
    imageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&h=400&fit=crop',
  },
  {
    name: 'Indie Rock Showcase',
    description: 'Five up-and-coming bands. Small venue. Intimate show. Your ticket is your on-chain proof of attendance.',
    venue: 'Bowery Ballroom, New York, NY',
    date: '2026-07-12T19:00:00Z',
    ticketPrice: '0.015',
    maxTickets: 400,
    ticketsSold: 267,
    category: EventCategory.Music,
    imageGradient: ['#ef4444', '#f59e0b'],
    imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=400&fit=crop',
  },
  {
    name: 'ZK Proofs Masterclass',
    description: 'From theory to implementation. Build your first zero-knowledge circuit. Prerequisite: basic cryptography knowledge.',
    venue: 'MIT Media Lab, Cambridge, MA',
    date: '2026-08-18T09:00:00Z',
    ticketPrice: '0.12',
    maxTickets: 150,
    ticketsSold: 67,
    category: EventCategory.Conference,
    imageGradient: ['#6366f1', '#a855f7'],
    imageUrl: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&h=400&fit=crop',
  },
  {
    name: 'Crypto Comedy Hour',
    description: 'Monthly comedy show about the absurdity of markets, memes, and the metaverse. Free popcorn, paid alpha.',
    venue: 'The Laugh Factory, Chicago, IL',
    date: '2026-05-14T21:00:00Z',
    ticketPrice: '0.01',
    maxTickets: 250,
    ticketsSold: 198,
    category: EventCategory.Comedy,
    imageGradient: ['#f97316', '#ec4899'],
    imageUrl: 'https://images.unsplash.com/photo-1527224857830-43a7acc85260?w=600&h=400&fit=crop',
  },
];

/** Get demo events filtered by category */
export function getDemoEventsByCategory(category: string): DemoEvent[] {
  if (category === EventCategory.All) return demoEvents;
  return demoEvents.filter(e => e.category === category);
}

/** Get a single featured event (highest sold percentage) */
export function getFeaturedEvent(): DemoEvent {
  return [...demoEvents].sort(
    (a, b) => (b.ticketsSold / b.maxTickets) - (a.ticketsSold / a.maxTickets)
  )[0];
}
