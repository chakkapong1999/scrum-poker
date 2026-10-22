import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

/** Per-tab secret that lets the server hand your seat (host + vote) back after a refresh/reconnect */
function seatToken(): string {
  let token = sessionStorage.getItem('seatToken');
  if (!token) {
    // getRandomValues, not randomUUID — the latter is missing on plain-http (LAN) origins
    token = Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2, '0')).join('');
    sessionStorage.setItem('seatToken', token);
  }
  return token;
}

export function getSocket(): Socket {
  socket ??= io({
    auth: { token: seatToken() },
    autoConnect: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    randomizationFactor: 0.5,
  });
  return socket;
}
