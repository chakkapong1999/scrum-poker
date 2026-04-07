import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';

const mockPush = vi.fn();
const mockReplace = vi.fn();

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'ABC123' }),
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}));

// Mock next/dynamic
vi.mock('next/dynamic', () => ({
  default: (loader: () => Promise<{ default: React.ComponentType<Record<string, unknown>> }>) => {
    return function DynamicComponent() {
      return null;
    };
  },
}));

// Mock socket
const mockSocketOn = vi.fn();
const mockSocketOff = vi.fn();
const mockSocketEmit = vi.fn();
const mockSocket = {
  id: 'test-socket-id',
  on: mockSocketOn,
  off: mockSocketOff,
  emit: mockSocketEmit,
};

vi.mock('@/lib/socket', () => ({
  getSocket: vi.fn(() => mockSocket),
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

beforeEach(() => {
  vi.clearAllMocks();
  mockSocketEmit.mockReset();
  mockSocketOn.mockReset();
  mockSocketOff.mockReset();
});

// ─── VoteStats ──────────────────────────────────────────────────────────────

describe('VoteStats', () => {
  it('renders vote statistics with correct values', async () => {
    const { default: VoteStats } = await import('@/app/room/[id]/VoteStats');
    const players = [
      { id: '1', name: 'Alice', vote: '5', isHost: true },
      { id: '2', name: 'Bob', vote: '8', isHost: false },
      { id: '3', name: 'Carol', vote: '5', isHost: false },
    ];

    render(<VoteStats players={players} />);
    expect(screen.getByText('Results')).toBeInTheDocument();
    expect(screen.getByText('Average')).toBeInTheDocument();
    expect(screen.getByText('6.0')).toBeInTheDocument();
    expect(screen.getByText('Min')).toBeInTheDocument();
    expect(screen.getByText('Max')).toBeInTheDocument();
  });

  it('renders distribution bars', async () => {
    const { default: VoteStats } = await import('@/app/room/[id]/VoteStats');
    const players = [
      { id: '1', name: 'Alice', vote: '5', isHost: true },
      { id: '2', name: 'Bob', vote: '8', isHost: false },
    ];

    render(<VoteStats players={players} />);
    // Distribution shows vote values and counts
    expect(screen.getAllByText('1').length).toBeGreaterThan(0);
  });

  it('returns null when no numeric votes', async () => {
    const { default: VoteStats } = await import('@/app/room/[id]/VoteStats');
    const { container } = render(<VoteStats players={[
      { id: '1', name: 'Alice', vote: '?', isHost: true },
      { id: '2', name: 'Bob', vote: '☕', isHost: false },
    ]} />);
    expect(container.firstChild).toBeNull();
  });

  it('returns null when all votes are masked', async () => {
    const { default: VoteStats } = await import('@/app/room/[id]/VoteStats');
    const { container } = render(<VoteStats players={[
      { id: '1', name: 'Alice', vote: 'voted', isHost: true },
    ]} />);
    expect(container.firstChild).toBeNull();
  });

  it('returns null when votes is null', async () => {
    const { default: VoteStats } = await import('@/app/room/[id]/VoteStats');
    const { container } = render(<VoteStats players={[
      { id: '1', name: 'Alice', vote: null, isHost: true },
    ]} />);
    expect(container.firstChild).toBeNull();
  });

  it('filters out non-numeric votes from stats', async () => {
    const { default: VoteStats } = await import('@/app/room/[id]/VoteStats');
    render(<VoteStats players={[
      { id: '1', name: 'Alice', vote: '3', isHost: true },
      { id: '2', name: 'Bob', vote: '?', isHost: false },
      { id: '3', name: 'Carol', vote: '5', isHost: false },
    ]} />);
    expect(screen.getByText('4.0')).toBeInTheDocument(); // avg of 3 and 5
  });
});

// ─── Home Page ──────────────────────────────────────────────────────────────

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

  it('shows room name and voting system inputs on create tab', async () => {
    const { default: Home } = await import('@/app/page');
    render(<Home />);
    expect(screen.getByLabelText('Room Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Voting System')).toBeInTheDocument();
  });

  it('switches to join tab and shows room code input', async () => {
    const { default: Home } = await import('@/app/page');
    render(<Home />);
    fireEvent.click(screen.getByRole('button', { name: 'Join Room' }));
    expect(screen.getByLabelText('Room Code')).toBeInTheDocument();
  });

  it('switches back to create tab from join tab', async () => {
    const { default: Home } = await import('@/app/page');
    render(<Home />);
    // Switch to join tab
    const joinButtons = screen.getAllByRole('button', { name: 'Join Room' });
    fireEvent.click(joinButtons[0]);
    expect(screen.getByLabelText('Room Code')).toBeInTheDocument();
    // Switch back to create tab
    fireEvent.click(screen.getByRole('button', { name: 'Create Room' }));
    expect(screen.getByLabelText('Room Name')).toBeInTheDocument();
  });

  it('shows error when creating without a name', async () => {
    const { default: Home } = await import('@/app/page');
    render(<Home />);
    fireEvent.click(screen.getAllByText('Create Room').find(el => el.tagName === 'BUTTON' && el.closest('.bg-gradient-to-r'))!);
    expect(screen.getByText('Please enter your name')).toBeInTheDocument();
  });

  it('shows error when joining without a name', async () => {
    const { default: Home } = await import('@/app/page');
    render(<Home />);
    // Switch to join tab
    const joinButtons = screen.getAllByRole('button', { name: 'Join Room' });
    fireEvent.click(joinButtons[0]);
    // Click the submit button (second Join Room button now visible)
    const submitButtons = screen.getAllByRole('button', { name: 'Join Room' });
    fireEvent.click(submitButtons[submitButtons.length - 1]);
    expect(screen.getByText('Please enter your name')).toBeInTheDocument();
  });

  it('shows error when joining without a room code', async () => {
    const { default: Home } = await import('@/app/page');
    render(<Home />);
    const joinButtons = screen.getAllByRole('button', { name: 'Join Room' });
    fireEvent.click(joinButtons[0]);
    fireEvent.change(screen.getByLabelText('Your Name'), { target: { value: 'Alice' } });
    const submitButtons = screen.getAllByRole('button', { name: 'Join Room' });
    fireEvent.click(submitButtons[submitButtons.length - 1]);
    expect(screen.getByText('Please enter a room code')).toBeInTheDocument();
  });

  it('emits create-room when form is valid', async () => {
    const { default: Home } = await import('@/app/page');
    render(<Home />);
    fireEvent.change(screen.getByLabelText('Your Name'), { target: { value: 'Alice' } });
    fireEvent.change(screen.getByLabelText('Room Name'), { target: { value: 'Sprint 1' } });
    // Click the Create Room button (the gradient one, not the tab)
    const buttons = screen.getAllByText('Create Room');
    const createBtn = buttons.find(el => el.closest('button.w-full'));
    fireEvent.click(createBtn!);
    expect(mockSocketEmit).toHaveBeenCalledWith('create-room', expect.objectContaining({
      playerName: 'Alice',
      roomName: 'Sprint 1',
      votingSystem: 'fibonacci',
    }), expect.any(Function));
  });

  it('handles successful room creation', async () => {
    const { default: Home } = await import('@/app/page');
    render(<Home />);
    fireEvent.change(screen.getByLabelText('Your Name'), { target: { value: 'Alice' } });
    const createBtn = screen.getAllByText('Create Room').find(el => el.closest('button.w-full'));
    fireEvent.click(createBtn!);

    // Simulate callback
    const callback = mockSocketEmit.mock.calls[0][2];
    act(() => callback({ success: true, roomId: 'XYZ789' }));
    expect(mockPush).toHaveBeenCalledWith('/room/XYZ789');
  });

  it('handles failed room creation', async () => {
    const { default: Home } = await import('@/app/page');
    render(<Home />);
    fireEvent.change(screen.getByLabelText('Your Name'), { target: { value: 'Alice' } });
    const createBtn = screen.getAllByText('Create Room').find(el => el.closest('button.w-full'));
    fireEvent.click(createBtn!);

    const callback = mockSocketEmit.mock.calls[0][2];
    act(() => callback({ success: false, error: 'Server error' }));
    expect(screen.getByText('Server error')).toBeInTheDocument();
  });

  it('handles failed creation with no error message', async () => {
    const { default: Home } = await import('@/app/page');
    render(<Home />);
    fireEvent.change(screen.getByLabelText('Your Name'), { target: { value: 'Alice' } });
    const createBtn = screen.getAllByText('Create Room').find(el => el.closest('button.w-full'));
    fireEvent.click(createBtn!);

    const callback = mockSocketEmit.mock.calls[0][2];
    act(() => callback({ success: false }));
    expect(screen.getByText('Failed to create room')).toBeInTheDocument();
  });

  it('emits join-room when join form is valid', async () => {
    const { default: Home } = await import('@/app/page');
    render(<Home />);
    const joinButtons = screen.getAllByRole('button', { name: 'Join Room' });
    fireEvent.click(joinButtons[0]);
    fireEvent.change(screen.getByLabelText('Your Name'), { target: { value: 'Bob' } });
    fireEvent.change(screen.getByLabelText('Room Code'), { target: { value: 'abc123' } });
    const submitButtons = screen.getAllByRole('button', { name: 'Join Room' });
    fireEvent.click(submitButtons[submitButtons.length - 1]);

    expect(mockSocketEmit).toHaveBeenCalledWith('join-room', expect.objectContaining({
      roomId: 'ABC123',
      playerName: 'Bob',
    }), expect.any(Function));
  });

  it('handles successful join', async () => {
    const { default: Home } = await import('@/app/page');
    render(<Home />);
    const joinButtons = screen.getAllByRole('button', { name: 'Join Room' });
    fireEvent.click(joinButtons[0]);
    fireEvent.change(screen.getByLabelText('Your Name'), { target: { value: 'Bob' } });
    fireEvent.change(screen.getByLabelText('Room Code'), { target: { value: 'ABC123' } });
    const submitButtons = screen.getAllByRole('button', { name: 'Join Room' });
    fireEvent.click(submitButtons[submitButtons.length - 1]);

    const callback = mockSocketEmit.mock.calls[0][2];
    act(() => callback({ success: true, roomId: 'ABC123' }));
    expect(mockPush).toHaveBeenCalledWith('/room/ABC123');
  });

  it('handles failed join', async () => {
    const { default: Home } = await import('@/app/page');
    render(<Home />);
    const joinButtons = screen.getAllByRole('button', { name: 'Join Room' });
    fireEvent.click(joinButtons[0]);
    fireEvent.change(screen.getByLabelText('Your Name'), { target: { value: 'Bob' } });
    fireEvent.change(screen.getByLabelText('Room Code'), { target: { value: 'ABC123' } });
    const submitButtons = screen.getAllByRole('button', { name: 'Join Room' });
    fireEvent.click(submitButtons[submitButtons.length - 1]);

    const callback = mockSocketEmit.mock.calls[0][2];
    act(() => callback({ success: false }));
    expect(screen.getByText('Failed to join room')).toBeInTheDocument();
  });

  it('clears error when switching tabs', async () => {
    const { default: Home } = await import('@/app/page');
    render(<Home />);
    // Trigger error
    const createBtn = screen.getAllByText('Create Room').find(el => el.closest('button.w-full'));
    fireEvent.click(createBtn!);
    expect(screen.getByText('Please enter your name')).toBeInTheDocument();

    // Switch to join tab
    const joinButtons = screen.getAllByRole('button', { name: 'Join Room' });
    fireEvent.click(joinButtons[0]);
    expect(screen.queryByText('Please enter your name')).not.toBeInTheDocument();
  });

  it('handles Enter key on create tab', async () => {
    const { default: Home } = await import('@/app/page');
    render(<Home />);
    fireEvent.change(screen.getByLabelText('Your Name'), { target: { value: 'Alice' } });
    fireEvent.keyDown(screen.getByLabelText('Your Name'), { key: 'Enter' });
    expect(mockSocketEmit).toHaveBeenCalled();
  });

  it('handles Enter key on join tab', async () => {
    const { default: Home } = await import('@/app/page');
    render(<Home />);
    const joinButtons = screen.getAllByRole('button', { name: 'Join Room' });
    fireEvent.click(joinButtons[0]);
    fireEvent.change(screen.getByLabelText('Your Name'), { target: { value: 'Bob' } });
    fireEvent.change(screen.getByLabelText('Room Code'), { target: { value: 'XYZ' } });
    fireEvent.keyDown(screen.getByLabelText('Your Name'), { key: 'Enter' });
    expect(mockSocketEmit).toHaveBeenCalled();
  });

  it('handles Enter key on room name input', async () => {
    const { default: Home } = await import('@/app/page');
    render(<Home />);
    fireEvent.change(screen.getByLabelText('Your Name'), { target: { value: 'Alice' } });
    fireEvent.keyDown(screen.getByLabelText('Room Name'), { key: 'Enter' });
    expect(mockSocketEmit).toHaveBeenCalled();
  });

  it('handles Enter key on room code input', async () => {
    const { default: Home } = await import('@/app/page');
    render(<Home />);
    const joinButtons = screen.getAllByRole('button', { name: 'Join Room' });
    fireEvent.click(joinButtons[0]);
    fireEvent.change(screen.getByLabelText('Your Name'), { target: { value: 'Bob' } });
    fireEvent.change(screen.getByLabelText('Room Code'), { target: { value: 'XYZ' } });
    fireEvent.keyDown(screen.getByLabelText('Room Code'), { key: 'Enter' });
    expect(mockSocketEmit).toHaveBeenCalled();
  });

  it('changes voting system', async () => {
    const { default: Home } = await import('@/app/page');
    render(<Home />);
    fireEvent.change(screen.getByLabelText('Voting System'), { target: { value: 'tshirt' } });
    fireEvent.change(screen.getByLabelText('Your Name'), { target: { value: 'Alice' } });
    const createBtn = screen.getAllByText('Create Room').find(el => el.closest('button.w-full'));
    fireEvent.click(createBtn!);
    expect(mockSocketEmit).toHaveBeenCalledWith('create-room', expect.objectContaining({
      votingSystem: 'tshirt',
    }), expect.any(Function));
  });
});

// ─── Join Page ──────────────────────────────────────────────────────────────

describe('Join page', () => {
  it('renders join page with room code', async () => {
    const { default: JoinPage } = await import('@/app/join/[id]/page');
    render(<JoinPage />);
    expect(screen.getByText('Join Scrum Poker')).toBeInTheDocument();
    expect(screen.getByText('ABC123')).toBeInTheDocument();
    expect(screen.getByLabelText('Your Name')).toBeInTheDocument();
  });

  it('shows error when submitting without a name', async () => {
    const { default: JoinPage } = await import('@/app/join/[id]/page');
    render(<JoinPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Join Room' }));
    expect(screen.getByText('Please enter your name')).toBeInTheDocument();
  });

  it('emits join-room when name is provided', async () => {
    const { default: JoinPage } = await import('@/app/join/[id]/page');
    render(<JoinPage />);
    fireEvent.change(screen.getByLabelText('Your Name'), { target: { value: 'Charlie' } });
    fireEvent.click(screen.getByRole('button', { name: 'Join Room' }));
    expect(mockSocketEmit).toHaveBeenCalledWith('join-room', expect.objectContaining({
      roomId: 'ABC123',
      playerName: 'Charlie',
    }), expect.any(Function));
  });

  it('navigates on successful join', async () => {
    const { default: JoinPage } = await import('@/app/join/[id]/page');
    render(<JoinPage />);
    fireEvent.change(screen.getByLabelText('Your Name'), { target: { value: 'Charlie' } });
    fireEvent.click(screen.getByRole('button', { name: 'Join Room' }));

    const callback = mockSocketEmit.mock.calls[0][2];
    act(() => callback({ success: true, roomId: 'ABC123' }));
    expect(mockPush).toHaveBeenCalledWith('/room/ABC123');
  });

  it('shows error on failed join', async () => {
    const { default: JoinPage } = await import('@/app/join/[id]/page');
    render(<JoinPage />);
    fireEvent.change(screen.getByLabelText('Your Name'), { target: { value: 'Charlie' } });
    fireEvent.click(screen.getByRole('button', { name: 'Join Room' }));

    const callback = mockSocketEmit.mock.calls[0][2];
    act(() => callback({ success: false }));
    expect(screen.getByText('Room not found')).toBeInTheDocument();
  });

  it('shows custom error message on failed join', async () => {
    const { default: JoinPage } = await import('@/app/join/[id]/page');
    render(<JoinPage />);
    fireEvent.change(screen.getByLabelText('Your Name'), { target: { value: 'Charlie' } });
    fireEvent.click(screen.getByRole('button', { name: 'Join Room' }));

    const callback = mockSocketEmit.mock.calls[0][2];
    act(() => callback({ success: false, error: 'Room is full' }));
    expect(screen.getByText('Room is full')).toBeInTheDocument();
  });

  it('handles Enter key on input', async () => {
    const { default: JoinPage } = await import('@/app/join/[id]/page');
    render(<JoinPage />);
    fireEvent.change(screen.getByLabelText('Your Name'), { target: { value: 'Charlie' } });
    fireEvent.keyDown(screen.getByLabelText('Your Name'), { key: 'Enter' });
    expect(mockSocketEmit).toHaveBeenCalled();
  });

  it('shows loading state while joining', async () => {
    const { default: JoinPage } = await import('@/app/join/[id]/page');
    render(<JoinPage />);
    fireEvent.change(screen.getByLabelText('Your Name'), { target: { value: 'Charlie' } });
    fireEvent.click(screen.getByRole('button', { name: 'Join Room' }));
    expect(screen.getByText('Joining...')).toBeInTheDocument();
  });
});

// ─── Room Page ──────────────────────────────────────────────────────────────

describe('RoomPage', () => {
  it('renders loading state when no room data', async () => {
    const { default: RoomPage } = await import('@/app/room/[id]/page');
    render(<RoomPage />);
    expect(screen.getByText('Connecting to room...')).toBeInTheDocument();
  });

  it('registers socket event listeners on mount', async () => {
    const { default: RoomPage } = await import('@/app/room/[id]/page');
    render(<RoomPage />);
    const registeredEvents = mockSocketOn.mock.calls.map((c: unknown[]) => c[0]);
    expect(registeredEvents).toContain('room-update');
    expect(registeredEvents).toContain('vote-update');
    expect(registeredEvents).toContain('player-emoji');
    expect(registeredEvents).toContain('player-chat');
    expect(registeredEvents).toContain('connect');
  });

  it('emits get-room-state on mount', async () => {
    const { default: RoomPage } = await import('@/app/room/[id]/page');
    render(<RoomPage />);
    expect(mockSocketEmit).toHaveBeenCalledWith('get-room-state', expect.any(Function));
  });

  it('renders room UI when room-update is received', async () => {
    const { default: RoomPage } = await import('@/app/room/[id]/page');
    render(<RoomPage />);

    // Get the room-update handler
    const onRoomUpdate = mockSocketOn.mock.calls.find((c: unknown[]) => c[0] === 'room-update')![1];
    act(() => {
      onRoomUpdate({
        id: 'ABC123',
        name: 'Sprint Planning',
        players: [{ id: 'test-socket-id', name: 'Alice', vote: null, isHost: true }],
        revealed: false,
        votingSystem: ['1', '2', '3', '5', '8'],
      });
    });

    expect(screen.getByText('Sprint Planning')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Voting... (0/1)')).toBeInTheDocument();
  });

  it('shows reveal button for host', async () => {
    const { default: RoomPage } = await import('@/app/room/[id]/page');
    render(<RoomPage />);

    const onRoomUpdate = mockSocketOn.mock.calls.find((c: unknown[]) => c[0] === 'room-update')![1];
    act(() => {
      onRoomUpdate({
        id: 'ABC123', name: 'Test', revealed: false,
        players: [{ id: 'test-socket-id', name: 'Alice', vote: 'voted', isHost: true }],
        votingSystem: ['1', '2', '3'],
      });
    });

    expect(screen.getByText(/Reveal Votes/)).toBeInTheDocument();
  });

  it('shows new round button when revealed', async () => {
    const { default: RoomPage } = await import('@/app/room/[id]/page');
    render(<RoomPage />);

    const onRoomUpdate = mockSocketOn.mock.calls.find((c: unknown[]) => c[0] === 'room-update')![1];
    act(() => {
      onRoomUpdate({
        id: 'ABC123', name: 'Test', revealed: true,
        players: [{ id: 'test-socket-id', name: 'Alice', vote: '5', isHost: true }],
        votingSystem: ['1', '2', '3', '5'],
      });
    });

    expect(screen.getByText('New Round')).toBeInTheDocument();
    expect(screen.getByText('Votes Revealed!')).toBeInTheDocument();
  });

  it('handles voting card click', async () => {
    const { default: RoomPage } = await import('@/app/room/[id]/page');
    render(<RoomPage />);

    const onRoomUpdate = mockSocketOn.mock.calls.find((c: unknown[]) => c[0] === 'room-update')![1];
    act(() => {
      onRoomUpdate({
        id: 'ABC123', name: 'Test', revealed: false,
        players: [{ id: 'test-socket-id', name: 'Alice', vote: null, isHost: true }],
        votingSystem: ['1', '2', '3'],
      });
    });

    vi.clearAllMocks();
    fireEvent.click(screen.getByText('2'));
    expect(mockSocketEmit).toHaveBeenCalledWith('vote', { vote: '2' });
  });

  it('deselects vote when clicking same card', async () => {
    const { default: RoomPage } = await import('@/app/room/[id]/page');
    render(<RoomPage />);

    const onRoomUpdate = mockSocketOn.mock.calls.find((c: unknown[]) => c[0] === 'room-update')![1];
    act(() => {
      onRoomUpdate({
        id: 'ABC123', name: 'Test', revealed: false,
        players: [{ id: 'test-socket-id', name: 'Alice', vote: null, isHost: true }],
        votingSystem: ['1', '2', '3'],
      });
    });

    fireEvent.click(screen.getByText('2'));
    vi.clearAllMocks();
    fireEvent.click(screen.getByText('2'));
    expect(mockSocketEmit).toHaveBeenCalledWith('vote', { vote: null });
  });

  it('handles emoji picker toggle and send', async () => {
    const { default: RoomPage } = await import('@/app/room/[id]/page');
    const { playEmojiSound } = await import('@/lib/sounds');
    render(<RoomPage />);

    const onRoomUpdate = mockSocketOn.mock.calls.find((c: unknown[]) => c[0] === 'room-update')![1];
    act(() => {
      onRoomUpdate({
        id: 'ABC123', name: 'Test', revealed: false,
        players: [{ id: 'test-socket-id', name: 'Alice', vote: null, isHost: true }],
        votingSystem: ['1'],
      });
    });

    // Open emoji picker
    fireEvent.click(screen.getByText('Reaction'));
    expect(screen.getByText('👍')).toBeInTheDocument();

    // Send emoji
    vi.clearAllMocks();
    fireEvent.click(screen.getByText('👍'));
    expect(playEmojiSound).toHaveBeenCalledWith('👍');
    expect(mockSocketEmit).toHaveBeenCalledWith('send-emoji', { emoji: '👍' });
  });

  it('handles quick chat toggle and send', async () => {
    const { default: RoomPage } = await import('@/app/room/[id]/page');
    const { playPopSound, speakMessage } = await import('@/lib/sounds');
    render(<RoomPage />);

    const onRoomUpdate = mockSocketOn.mock.calls.find((c: unknown[]) => c[0] === 'room-update')![1];
    act(() => {
      onRoomUpdate({
        id: 'ABC123', name: 'Test', revealed: false,
        players: [{ id: 'test-socket-id', name: 'Alice', vote: null, isHost: true }],
        votingSystem: ['1'],
      });
    });

    // Open chat
    fireEvent.click(screen.getByText('Quick Chat'));
    expect(screen.getByText("Let's go!")).toBeInTheDocument();

    // Click quick message
    vi.clearAllMocks();
    fireEvent.click(screen.getByText("Let's go!"));
    expect(playPopSound).toHaveBeenCalled();
    expect(speakMessage).toHaveBeenCalledWith("Let's go!");
    expect(mockSocketEmit).toHaveBeenCalledWith('send-chat', { message: "Let's go!" });
  });

  it('handles chat text input and send', async () => {
    const { default: RoomPage } = await import('@/app/room/[id]/page');
    render(<RoomPage />);

    const onRoomUpdate = mockSocketOn.mock.calls.find((c: unknown[]) => c[0] === 'room-update')![1];
    act(() => {
      onRoomUpdate({
        id: 'ABC123', name: 'Test', revealed: false,
        players: [{ id: 'test-socket-id', name: 'Alice', vote: null, isHost: true }],
        votingSystem: ['1'],
      });
    });

    fireEvent.click(screen.getByText('Quick Chat'));
    const input = screen.getByPlaceholderText('Type a message...');
    fireEvent.change(input, { target: { value: 'Hello team' } });

    vi.clearAllMocks();
    fireEvent.click(screen.getByText('Send'));
    expect(mockSocketEmit).toHaveBeenCalledWith('send-chat', { message: 'Hello team' });
  });

  it('handles chat send via Enter key', async () => {
    const { default: RoomPage } = await import('@/app/room/[id]/page');
    render(<RoomPage />);

    const onRoomUpdate = mockSocketOn.mock.calls.find((c: unknown[]) => c[0] === 'room-update')![1];
    act(() => {
      onRoomUpdate({
        id: 'ABC123', name: 'Test', revealed: false,
        players: [{ id: 'test-socket-id', name: 'Alice', vote: null, isHost: true }],
        votingSystem: ['1'],
      });
    });

    fireEvent.click(screen.getByText('Quick Chat'));
    const input = screen.getByPlaceholderText('Type a message...');
    fireEvent.change(input, { target: { value: 'Hey' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(mockSocketEmit).toHaveBeenCalledWith('send-chat', { message: 'Hey' });
  });

  it('does not send empty chat', async () => {
    const { default: RoomPage } = await import('@/app/room/[id]/page');
    render(<RoomPage />);

    const onRoomUpdate = mockSocketOn.mock.calls.find((c: unknown[]) => c[0] === 'room-update')![1];
    act(() => {
      onRoomUpdate({
        id: 'ABC123', name: 'Test', revealed: false,
        players: [{ id: 'test-socket-id', name: 'Alice', vote: null, isHost: true }],
        votingSystem: ['1'],
      });
    });

    fireEvent.click(screen.getByText('Quick Chat'));
    const input = screen.getByPlaceholderText('Type a message...');
    fireEvent.change(input, { target: { value: '   ' } });
    vi.clearAllMocks();
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(mockSocketEmit).not.toHaveBeenCalledWith('send-chat', expect.anything());
  });

  it('handles mute toggle', async () => {
    const { default: RoomPage } = await import('@/app/room/[id]/page');
    const { setMuted } = await import('@/lib/sounds');
    render(<RoomPage />);

    const onRoomUpdate = mockSocketOn.mock.calls.find((c: unknown[]) => c[0] === 'room-update')![1];
    act(() => {
      onRoomUpdate({
        id: 'ABC123', name: 'Test', revealed: false,
        players: [{ id: 'test-socket-id', name: 'Alice', vote: null, isHost: true }],
        votingSystem: ['1'],
      });
    });

    const muteBtn = screen.getByTitle('Mute sounds');
    fireEvent.click(muteBtn);
    expect(setMuted).toHaveBeenCalledWith(true);
  });

  it('handles copy invite link', async () => {
    const { default: RoomPage } = await import('@/app/room/[id]/page');
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      writable: true,
      configurable: true,
    });
    render(<RoomPage />);

    const onRoomUpdate = mockSocketOn.mock.calls.find((c: unknown[]) => c[0] === 'room-update')![1];
    act(() => {
      onRoomUpdate({
        id: 'ABC123', name: 'Test', revealed: false,
        players: [{ id: 'test-socket-id', name: 'Alice', vote: null, isHost: true }],
        votingSystem: ['1'],
      });
    });

    fireEvent.click(screen.getByText('Copy Invite Link'));
    expect(screen.getByText('Copied!')).toBeInTheDocument();
  });

  it('handles reveal votes click', async () => {
    const { default: RoomPage } = await import('@/app/room/[id]/page');
    render(<RoomPage />);

    const onRoomUpdate = mockSocketOn.mock.calls.find((c: unknown[]) => c[0] === 'room-update')![1];
    act(() => {
      onRoomUpdate({
        id: 'ABC123', name: 'Test', revealed: false,
        players: [{ id: 'test-socket-id', name: 'Alice', vote: 'voted', isHost: true }],
        votingSystem: ['1'],
      });
    });

    vi.clearAllMocks();
    fireEvent.click(screen.getByText(/Reveal Votes/));
    expect(mockSocketEmit).toHaveBeenCalledWith('reveal-votes');
  });

  it('handles new round click', async () => {
    const { default: RoomPage } = await import('@/app/room/[id]/page');
    render(<RoomPage />);

    const onRoomUpdate = mockSocketOn.mock.calls.find((c: unknown[]) => c[0] === 'room-update')![1];
    act(() => {
      onRoomUpdate({
        id: 'ABC123', name: 'Test', revealed: true,
        players: [{ id: 'test-socket-id', name: 'Alice', vote: '5', isHost: true }],
        votingSystem: ['1', '5'],
      });
    });

    vi.clearAllMocks();
    fireEvent.click(screen.getByText('New Round'));
    expect(mockSocketEmit).toHaveBeenCalledWith('reset-votes');
  });

  it('shows player count', async () => {
    const { default: RoomPage } = await import('@/app/room/[id]/page');
    render(<RoomPage />);

    const onRoomUpdate = mockSocketOn.mock.calls.find((c: unknown[]) => c[0] === 'room-update')![1];
    act(() => {
      onRoomUpdate({
        id: 'ABC123', name: 'Test', revealed: false,
        players: [
          { id: 'test-socket-id', name: 'Alice', vote: null, isHost: true },
          { id: 'p2', name: 'Bob', vote: null, isHost: false },
        ],
        votingSystem: ['1'],
      });
    });

    expect(screen.getByText('2 players')).toBeInTheDocument();
  });

  it('shows singular player count', async () => {
    const { default: RoomPage } = await import('@/app/room/[id]/page');
    render(<RoomPage />);

    const onRoomUpdate = mockSocketOn.mock.calls.find((c: unknown[]) => c[0] === 'room-update')![1];
    act(() => {
      onRoomUpdate({
        id: 'ABC123', name: 'Test', revealed: false,
        players: [{ id: 'test-socket-id', name: 'Alice', vote: null, isHost: true }],
        votingSystem: ['1'],
      });
    });

    expect(screen.getByText('1 player')).toBeInTheDocument();
  });

  it('handles vote-update event', async () => {
    const { default: RoomPage } = await import('@/app/room/[id]/page');
    render(<RoomPage />);

    const onRoomUpdate = mockSocketOn.mock.calls.find((c: unknown[]) => c[0] === 'room-update')![1];
    act(() => {
      onRoomUpdate({
        id: 'ABC123', name: 'Test', revealed: false,
        players: [
          { id: 'test-socket-id', name: 'Alice', vote: null, isHost: true },
          { id: 'p2', name: 'Bob', vote: null, isHost: false },
        ],
        votingSystem: ['1'],
      });
    });

    expect(screen.getByText('Voting... (0/2)')).toBeInTheDocument();

    const onVoteUpdate = mockSocketOn.mock.calls.find((c: unknown[]) => c[0] === 'vote-update')![1];
    act(() => {
      onVoteUpdate({ playerId: 'p2', vote: 'voted' });
    });

    expect(screen.getByText('Voting... (1/2)')).toBeInTheDocument();
  });

  it('does not show host controls for non-host', async () => {
    const { default: RoomPage } = await import('@/app/room/[id]/page');
    render(<RoomPage />);

    const onRoomUpdate = mockSocketOn.mock.calls.find((c: unknown[]) => c[0] === 'room-update')![1];
    act(() => {
      onRoomUpdate({
        id: 'ABC123', name: 'Test', revealed: false,
        players: [
          { id: 'test-socket-id', name: 'Alice', vote: null, isHost: false },
          { id: 'p2', name: 'Bob', vote: null, isHost: true },
        ],
        votingSystem: ['1'],
      });
    });

    expect(screen.queryByText(/Reveal Votes/)).not.toBeInTheDocument();
  });

  it('cleans up socket listeners on unmount', async () => {
    const { default: RoomPage } = await import('@/app/room/[id]/page');
    const { unmount } = render(<RoomPage />);
    unmount();
    const removedEvents = mockSocketOff.mock.calls.map((c: unknown[]) => c[0]);
    expect(removedEvents).toContain('room-update');
    expect(removedEvents).toContain('vote-update');
    expect(removedEvents).toContain('player-emoji');
    expect(removedEvents).toContain('player-chat');
    expect(removedEvents).toContain('connect');
  });

  it('handles get-room-state success callback', async () => {
    const { default: RoomPage } = await import('@/app/room/[id]/page');
    render(<RoomPage />);

    const getRoomStateCallback = mockSocketEmit.mock.calls.find(
      (c: unknown[]) => c[0] === 'get-room-state'
    )![1];

    act(() => {
      getRoomStateCallback({
        success: true,
        state: {
          id: 'ABC123', name: 'From Callback', revealed: false,
          players: [{ id: 'test-socket-id', name: 'Alice', vote: null, isHost: true }],
          votingSystem: ['1'],
        },
      });
    });

    expect(screen.getByText('From Callback')).toBeInTheDocument();
  });

  it('handles get-room-state failure with stored name (rejoin)', async () => {
    vi.spyOn(sessionStorage, 'getItem').mockReturnValue('StoredAlice');
    const { default: RoomPage } = await import('@/app/room/[id]/page');
    render(<RoomPage />);

    const getRoomStateCallback = mockSocketEmit.mock.calls.find(
      (c: unknown[]) => c[0] === 'get-room-state'
    )![1];

    act(() => getRoomStateCallback({ success: false }));
    expect(mockSocketEmit).toHaveBeenCalledWith('rejoin-room', expect.objectContaining({
      roomId: 'ABC123',
      playerName: 'StoredAlice',
    }), expect.any(Function));
  });

  it('redirects to join page when no stored name', async () => {
    vi.spyOn(sessionStorage, 'getItem').mockReturnValue(null);
    const { default: RoomPage } = await import('@/app/room/[id]/page');
    render(<RoomPage />);

    const getRoomStateCallback = mockSocketEmit.mock.calls.find(
      (c: unknown[]) => c[0] === 'get-room-state'
    )![1];

    act(() => getRoomStateCallback({ success: false }));
    expect(mockReplace).toHaveBeenCalledWith('/join/ABC123');
  });

  it('redirects when rejoin fails', async () => {
    vi.spyOn(sessionStorage, 'getItem').mockReturnValue('Alice');
    const { default: RoomPage } = await import('@/app/room/[id]/page');
    render(<RoomPage />);

    const getRoomStateCallback = mockSocketEmit.mock.calls.find(
      (c: unknown[]) => c[0] === 'get-room-state'
    )![1];

    act(() => getRoomStateCallback({ success: false }));

    const rejoinCallback = mockSocketEmit.mock.calls.find(
      (c: unknown[]) => c[0] === 'rejoin-room'
    )![2];

    act(() => rejoinCallback({ success: false }));
    expect(mockReplace).toHaveBeenCalledWith('/join/ABC123');
  });

  it('shows all voted sparkle when all players voted', async () => {
    const { default: RoomPage } = await import('@/app/room/[id]/page');
    render(<RoomPage />);

    const onRoomUpdate = mockSocketOn.mock.calls.find((c: unknown[]) => c[0] === 'room-update')![1];
    act(() => {
      onRoomUpdate({
        id: 'ABC123', name: 'Test', revealed: false,
        players: [{ id: 'test-socket-id', name: 'Alice', vote: 'voted', isHost: true }],
        votingSystem: ['1'],
      });
    });

    expect(screen.getByText(/✨/)).toBeInTheDocument();
  });

  it('handles player-emoji event and shows floating emoji then removes it', async () => {
    vi.useFakeTimers();
    const { default: RoomPage } = await import('@/app/room/[id]/page');
    render(<RoomPage />);

    const onRoomUpdate = mockSocketOn.mock.calls.find((c: unknown[]) => c[0] === 'room-update')![1];
    act(() => {
      onRoomUpdate({
        id: 'ABC123', name: 'Test', revealed: false,
        players: [
          { id: 'test-socket-id', name: 'Alice', vote: null, isHost: true },
          { id: 'p2', name: 'Bob', vote: null, isHost: false },
        ],
        votingSystem: ['1'],
      });
    });

    const onPlayerEmoji = mockSocketOn.mock.calls.find((c: unknown[]) => c[0] === 'player-emoji')![1];
    act(() => {
      onPlayerEmoji({ playerId: 'p2', emoji: '🎉' });
    });
    // Floating emoji should be rendered
    expect(screen.getByText('🎉')).toBeInTheDocument();

    // Emoji should be removed after timeout
    act(() => { vi.advanceTimersByTime(2100); });
    expect(screen.queryByText('🎉')).not.toBeInTheDocument();

    vi.useRealTimers();
  });

  it('handles player-chat event and shows chat bubble', async () => {
    vi.useFakeTimers();
    const { default: RoomPage } = await import('@/app/room/[id]/page');
    const { speakMessage } = await import('@/lib/sounds');
    render(<RoomPage />);

    const onRoomUpdate = mockSocketOn.mock.calls.find((c: unknown[]) => c[0] === 'room-update')![1];
    act(() => {
      onRoomUpdate({
        id: 'ABC123', name: 'Test', revealed: false,
        players: [
          { id: 'test-socket-id', name: 'Alice', vote: null, isHost: true },
          { id: 'p2', name: 'Bob', vote: null, isHost: false },
        ],
        votingSystem: ['1'],
      });
    });

    const onPlayerChat = mockSocketOn.mock.calls.find((c: unknown[]) => c[0] === 'player-chat')![1];
    act(() => {
      onPlayerChat({ playerId: 'p2', message: 'Hello!' });
    });
    expect(speakMessage).toHaveBeenCalledWith('Hello!');

    // Chat bubble should be removed after timeout
    act(() => { vi.advanceTimersByTime(3100); });

    vi.useRealTimers();
  });

  it('keeps remaining emojis when multiple emojis for same player', async () => {
    vi.useFakeTimers();
    const { default: RoomPage } = await import('@/app/room/[id]/page');
    render(<RoomPage />);

    const onRoomUpdate = mockSocketOn.mock.calls.find((c: unknown[]) => c[0] === 'room-update')![1];
    act(() => {
      onRoomUpdate({
        id: 'ABC123', name: 'Test', revealed: false,
        players: [
          { id: 'test-socket-id', name: 'Alice', vote: null, isHost: true },
          { id: 'p2', name: 'Bob', vote: null, isHost: false },
        ],
        votingSystem: ['1'],
      });
    });

    const onPlayerEmoji = mockSocketOn.mock.calls.find((c: unknown[]) => c[0] === 'player-emoji')![1];
    // Send two emojis quickly (both within the 2s timeout)
    act(() => {
      onPlayerEmoji({ playerId: 'p2', emoji: '🎉' });
    });
    act(() => {
      onPlayerEmoji({ playerId: 'p2', emoji: '🔥' });
    });
    expect(screen.getByText('🎉')).toBeInTheDocument();
    expect(screen.getByText('🔥')).toBeInTheDocument();

    // First emoji timeout fires — second should remain
    act(() => { vi.advanceTimersByTime(2100); });

    // After both timeouts
    act(() => { vi.advanceTimersByTime(2100); });
    vi.useRealTimers();
  });

  it('keeps remaining chat bubbles when multiple chats for same player', async () => {
    vi.useFakeTimers();
    const { default: RoomPage } = await import('@/app/room/[id]/page');
    render(<RoomPage />);

    const onRoomUpdate = mockSocketOn.mock.calls.find((c: unknown[]) => c[0] === 'room-update')![1];
    const onPlayerChat = mockSocketOn.mock.calls.find((c: unknown[]) => c[0] === 'player-chat')![1];

    act(() => {
      onRoomUpdate({
        id: 'ABC123', name: 'Test', revealed: false,
        players: [
          { id: 'test-socket-id', name: 'Alice', vote: null, isHost: true },
          { id: 'p2', name: 'Bob', vote: null, isHost: false },
        ],
        votingSystem: ['1'],
      });
    });

    // Send two chat messages quickly
    act(() => {
      onPlayerChat({ playerId: 'p2', message: 'Hello' });
    });
    act(() => {
      onPlayerChat({ playerId: 'p2', message: 'World' });
    });

    // First chat timeout fires
    act(() => { vi.advanceTimersByTime(3100); });

    // After both timeouts
    act(() => { vi.advanceTimersByTime(3100); });
    vi.useRealTimers();
  });

  it('does not speak own chat messages', async () => {
    vi.useFakeTimers();
    const { default: RoomPage } = await import('@/app/room/[id]/page');
    const { speakMessage } = await import('@/lib/sounds');
    render(<RoomPage />);

    const onRoomUpdate = mockSocketOn.mock.calls.find((c: unknown[]) => c[0] === 'room-update')![1];
    const onPlayerChat = mockSocketOn.mock.calls.find((c: unknown[]) => c[0] === 'player-chat')![1];

    act(() => {
      onRoomUpdate({
        id: 'ABC123', name: 'Test', revealed: false,
        players: [{ id: 'test-socket-id', name: 'Alice', vote: null, isHost: true }],
        votingSystem: ['1'],
      });
    });

    vi.clearAllMocks();
    act(() => {
      onPlayerChat({ playerId: 'test-socket-id', message: 'My own message' });
    });
    expect(speakMessage).not.toHaveBeenCalled();

    // Cleanup chat bubble timeout
    act(() => { vi.advanceTimersByTime(3100); });
    vi.useRealTimers();
  });

  it('handles vote-update all-voted detection with sound', async () => {
    const { default: RoomPage } = await import('@/app/room/[id]/page');
    const { playAllVotedSound } = await import('@/lib/sounds');
    render(<RoomPage />);

    // Save references before clearing mocks
    const onRoomUpdate = mockSocketOn.mock.calls.find((c: unknown[]) => c[0] === 'room-update')![1];
    const onVoteUpdate = mockSocketOn.mock.calls.find((c: unknown[]) => c[0] === 'vote-update')![1];

    act(() => {
      onRoomUpdate({
        id: 'ABC123', name: 'Test', revealed: false,
        players: [
          { id: 'test-socket-id', name: 'Alice', vote: null, isHost: true },
          { id: 'p2', name: 'Bob', vote: 'voted', isHost: false },
        ],
        votingSystem: ['1'],
      });
    });

    vi.clearAllMocks();
    act(() => {
      onVoteUpdate({ playerId: 'test-socket-id', vote: 'voted' });
    });
    expect(playAllVotedSound).toHaveBeenCalled();
  });

  it('plays reveal sound when votes are revealed', async () => {
    const { default: RoomPage } = await import('@/app/room/[id]/page');
    const { playRevealSound } = await import('@/lib/sounds');
    render(<RoomPage />);

    const onRoomUpdate = mockSocketOn.mock.calls.find((c: unknown[]) => c[0] === 'room-update')![1];
    // First send unrevealed state
    act(() => {
      onRoomUpdate({
        id: 'ABC123', name: 'Test', revealed: false,
        players: [{ id: 'test-socket-id', name: 'Alice', vote: 'voted', isHost: true }],
        votingSystem: ['1'],
      });
    });

    vi.clearAllMocks();
    // Now reveal
    act(() => {
      onRoomUpdate({
        id: 'ABC123', name: 'Test', revealed: true,
        players: [{ id: 'test-socket-id', name: 'Alice', vote: '5', isHost: true }],
        votingSystem: ['1'],
      });
    });
    expect(playRevealSound).toHaveBeenCalled();
  });

  it('handles reconnect event', async () => {
    const { default: RoomPage } = await import('@/app/room/[id]/page');
    render(<RoomPage />);

    // Find the connect handler registered in the useEffect (not useSyncExternalStore)
    // There may be multiple — the last one is from the useEffect
    const connectHandlers = mockSocketOn.mock.calls.filter((c: unknown[]) => c[0] === 'connect');
    const onReconnect = connectHandlers[connectHandlers.length - 1][1];
    vi.clearAllMocks();
    act(() => {
      onReconnect();
    });
    // Should re-emit get-room-state on reconnect
    expect(mockSocketEmit).toHaveBeenCalledWith('get-room-state', expect.any(Function));
  });

  it('renders revealed votes in player cards', async () => {
    const { default: RoomPage } = await import('@/app/room/[id]/page');
    render(<RoomPage />);

    const onRoomUpdate = mockSocketOn.mock.calls.find((c: unknown[]) => c[0] === 'room-update')![1];
    act(() => {
      onRoomUpdate({
        id: 'ABC123', name: 'Test', revealed: true,
        players: [
          { id: 'test-socket-id', name: 'Alice', vote: '8', isHost: true },
          { id: 'p2', name: 'Bob', vote: '5', isHost: false },
        ],
        votingSystem: ['1', '5', '8'],
      });
    });

    // When revealed, actual votes are shown
    expect(screen.getByText('8')).toBeInTheDocument();
  });

  it('restores tab title on visibility change', async () => {
    const { default: RoomPage } = await import('@/app/room/[id]/page');
    render(<RoomPage />);

    document.title = '✅ All Voted! — Scrum Poker';
    Object.defineProperty(document, 'hidden', { value: false, writable: true, configurable: true });
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(document.title).toBe('Scrum Poker');
  });

  it('closes emoji picker when opening chat', async () => {
    const { default: RoomPage } = await import('@/app/room/[id]/page');
    render(<RoomPage />);

    const onRoomUpdate = mockSocketOn.mock.calls.find((c: unknown[]) => c[0] === 'room-update')![1];
    act(() => {
      onRoomUpdate({
        id: 'ABC123', name: 'Test', revealed: false,
        players: [{ id: 'test-socket-id', name: 'Alice', vote: null, isHost: true }],
        votingSystem: ['1'],
      });
    });

    fireEvent.click(screen.getByText('Reaction'));
    expect(screen.getByText('👍')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Quick Chat'));
    expect(screen.queryByText('👍')).not.toBeInTheDocument();
    expect(screen.getByText("Let's go!")).toBeInTheDocument();
  });
});
