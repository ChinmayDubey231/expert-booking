import { useEffect, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import { SOCKET_URL } from "../services/api";

/**
 * useSocket - Manages a Socket.io connection for real-time slot updates.
 *
 * @param {string|null} expertId - Join a room for this expert (or null to not join)
 * @param {function} onSlotBooked - Called when a slot is booked: { expertId, date, timeSlot }
 * @param {function} onSlotFreed  - Called when a slot is freed (booking cancelled)
 */
const useSocket = (expertId, onSlotBooked, onSlotFreed) => {
  const socketRef = useRef(null);

  useEffect(() => {
    // Connect once
    socketRef.current = io(SOCKET_URL, {
      transports: ["websocket"],
      reconnectionAttempts: 5,
    });

    const socket = socketRef.current;

    socket.on("connect", () => {
      console.log("✅ Socket connected:", socket.id);
      if (expertId) {
        socket.emit("join_expert_room", expertId);
      }
    });

    socket.on("slot_booked", (data) => {
      if (onSlotBooked) onSlotBooked(data);
    });

    socket.on("slot_freed", (data) => {
      if (onSlotFreed) onSlotFreed(data);
    });

    socket.on("connect_error", (err) => {
      console.warn("⚠️ Socket connection error:", err.message);
    });

    return () => {
      if (expertId) {
        socket.emit("leave_expert_room", expertId);
      }
      socket.disconnect();
    };
  }, [expertId]);

  const emit = useCallback((event, data) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  }, []);

  return { emit };
};

export default useSocket;
