import { io } from 'socket.io-client';
import { API_BASE_URL } from './api';

// Strip the trailing /api since Socket.io connects to the server root.
const SOCKET_URL = API_BASE_URL.replace(/\/api\/?$/, '');

let socket = null;

// Lazily create a single shared socket connection. Call this once
// (e.g. in a screen's useEffect) and reuse the same instance elsewhere
// via getSocket() so we don't open duplicate connections.
export function connectSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, { transports: ['websocket'] });
  }
  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
