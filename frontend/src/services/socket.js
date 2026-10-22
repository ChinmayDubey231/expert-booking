import { io } from "socket.io-client";
import { BASE_URL } from "./api";

// One connection for the whole app; screens join and leave expert rooms through it.
let socket = null;
const roomRefs = new Map(); // expertId → number of mounted listeners

export function getSocket() {
  if (!socket) {
    socket = io(BASE_URL, { transports: ["websocket"] });
    // The server forgets rooms on disconnect, so rejoin every active room on (re)connect
    socket.on("connect", () => {
      roomRefs.forEach((_, expertId) => socket.emit("join_expert_room", expertId));
    });
  }
  return socket;
}

// Ref-counted so two screens watching the same expert (detail + booking form)
// don't kick each other out of the room.
export function joinExpertRoom(expertId) {
  const s = getSocket();
  const count = roomRefs.get(expertId) ?? 0;
  roomRefs.set(expertId, count + 1);
  if (count === 0 && s.connected) s.emit("join_expert_room", expertId);
}

export function leaveExpertRoom(expertId) {
  const count = roomRefs.get(expertId) ?? 0;
  if (count > 1) {
    roomRefs.set(expertId, count - 1);
    return;
  }
  roomRefs.delete(expertId);
  if (socket?.connected) socket.emit("leave_expert_room", expertId);
}
