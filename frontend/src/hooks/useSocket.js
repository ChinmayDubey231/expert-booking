import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { BASE_URL } from "../services/api";

export default function useSocket(expertId, onSlotBooked, onSlotFreed) {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!expertId) return;

    const socket = io(BASE_URL, {
      transports: ["websocket"],
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join_expert_room", expertId);
    });

    socket.on("slot_booked", (data) => {
      if (onSlotBooked) onSlotBooked(data);
    });

    socket.on("slot_freed", (data) => {
      if (onSlotFreed) onSlotFreed(data);
    });

    return () => {
      socket.emit("leave_expert_room", expertId);
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expertId]);

  const getSocketId = () => socketRef.current?.id || null;
  return { getSocketId };
}
