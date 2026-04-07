import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'ABC123' }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

// Mock next/dynamic
vi.mock('next/dynamic', () => ({
  default: (loader: () => Promise<{ default: React.ComponentType }>) => {
    // Return a placeholder component for lazy-loaded modules
    return function DynamicComponent() {
      return null;
    };
  },
}));

// Mock socket
vi.mock('@/lib/socket', () => ({
  getSocket: vi.fn(() => ({
    id: 'test-socket-id',
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  })),
}));

// Mock sounds
vi.mock('@/lib/sounds', () => ({
  playAllVotedSound: vi.fn(),
  playRevealSound: vi.fn(),
  playPopSound: vi.fn(),
  playEmojiSound: vi.fn(),
  speakMessage: vi.fn(),
  isMuted: vi.fn(() => false),
  setMuted: vi.fn(),
}));

describe('VoteStats', () => {
  it('renders vote statistics', async () => {
    const { default: VoteStats } = await import('@/app/room/[id]/VoteStats');
    const players = [
      { id: '1', name: 'Alice', vote: '5', isHost: true },
      { id: '2', name: 'Bob', vote: '8', isHost: false },
      { id: '3', name: 'Carol', vote: '5', isHost: false },
    ];

    render(<VoteStats players={players} />);

    expect(screen.getByText('Results')).toBeInTheDocument();
    expect(screen.getByText('Average')).toBeInTheDocument();
    expect(screen.getByText('Min')).toBeInTheDocument();
    expect(screen.getByText('Max')).toBeInTheDocument();
    expect(screen.getByText('6.0')).toBeInTheDocument(); // average
    expect(screen.getAllByText('5').length).toBeGreaterThan(0); // min & distribution
    expect(screen.getAllByText('8').length).toBeGreaterThan(0); // max & distribution
  });

  it('returns null when no numeric votes', async () => {
    const { default: VoteStats } = await import('@/app/room/[id]/VoteStats');
    const players = [
      { id: '1', name: 'Alice', vote: '?', isHost: true },
      { id: '2', name: 'Bob', vote: '☕', isHost: false },
    ];

    const { container } = render(<VoteStats players={players} />);
    expect(container.firstChild).toBeNull();
  });

  it('returns null when all votes are masked', async () => {
    const { default: VoteStats } = await import('@/app/room/[id]/VoteStats');
    const players = [
      { id: '1', name: 'Alice', vote: 'voted', isHost: true },
    ];

    const { container } = render(<VoteStats players={players} />);
    expect(container.firstChild).toBeNull();
  });
});

describe('RoomPage', () => {
  it('renders loading state when no room data', async () => {
    const { default: RoomPage } = await import('@/app/room/[id]/page');

    render(<RoomPage />);
    expect(screen.getByText('Connecting to room...')).toBeInTheDocument();
  });
});

describe('Home page', () => {
  it('renders create and join tabs', async () => {
    const { default: Home } = await import('@/app/page');

    render(<Home />);
    expect(screen.getByText('Scrum Poker')).toBeInTheDocument();
    expect(screen.getAllByText('Create Room').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Join Room' })).toBeInTheDocument();
  });

  it('renders name input with label', async () => {
    const { default: Home } = await import('@/app/page');

    render(<Home />);
    expect(screen.getByLabelText('Your Name')).toBeInTheDocument();
  });
});

describe('Join page', () => {
  it('renders join page with room code', async () => {
    const { default: JoinPage } = await import('@/app/join/[id]/page');

    render(<JoinPage />);
    expect(screen.getByText('Join Scrum Poker')).toBeInTheDocument();
    expect(screen.getByText('ABC123')).toBeInTheDocument();
    expect(screen.getByLabelText('Your Name')).toBeInTheDocument();
  });
});
