export interface Player {
  id: string;
  name: string;
  vote: string | null;
  isHost: boolean;
}

export interface Room {
  id: string;
  name: string;
  players: Map<string, Player>;
  revealed: boolean;
  votingSystem: string[];
}

export interface RoomState {
  id: string;
  name: string;
  players: Player[];
  revealed: boolean;
  votingSystem: string[];
}

export const FIBONACCI: string[] = ['0', '1', '2', '3', '5', '8', '13', '21', '34', '55', '89', '?', '☕'];
export const T_SHIRT: string[] = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '?', '☕'];
