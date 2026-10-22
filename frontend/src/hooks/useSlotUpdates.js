import { useEffect, useRef, useState } from "react";
import { getSocket, joinExpertRoom, leaveExpertRoom } from "../services/socket";

/**
 * Real-time slot changes for one expert.
 *
 * handlers: { onSlotBooked, onSlotFreed, onResync }
 *   onResync fires when the connection comes back after a drop (e.g. the app was
 *   backgrounded), because any events sent while offline were missed.
 *
 * Returns whether the live connection is currently up.
 */
export default function useSlotUpdates(expertId, handlers) {
  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  });

  const [connected, setConnected] = useState(() => getSocket().connected);

  useEffect(() => {
    if (!expertId) return;
    const socket = getSocket();
    let missedEvents = !socket.connected;

    const forThisExpert = (name) => (data) => {
      if (String(data?.expertId) === String(expertId)) handlersRef.current[name]?.(data);
    };
    const onBooked = forThisExpert("onSlotBooked");
    const onFreed = forThisExpert("onSlotFreed");
    const onConnect = () => {
      setConnected(true);
      if (missedEvents) {
        missedEvents = false;
        handlersRef.current.onResync?.();
      }
    };
    const onDisconnect = () => {
      setConnected(false);
      missedEvents = true;
    };

    joinExpertRoom(expertId);
    socket.on("slot_booked", onBooked);
    socket.on("slot_freed", onFreed);
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    setConnected(socket.connected);

    return () => {
      socket.off("slot_booked", onBooked);
      socket.off("slot_freed", onFreed);
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      leaveExpertRoom(expertId);
    };
  }, [expertId]);

  return connected;
}
