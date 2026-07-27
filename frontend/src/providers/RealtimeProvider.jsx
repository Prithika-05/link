import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { REALTIME_EVENTS } from "../constants/realtimeEvents";
import {
  ensureIncomingContact,
  setContactPresence,
} from "../state/features/contacts/contactsSlice";
import { decryptRealtimeMessage } from "../state/features/messages/messagesSlice";
import { setSocketStatus } from "../state/features/system/systemSlice";
import { socketService } from "../services/socketService";

export default function RealtimeProvider({ children }) {
  const dispatch = useDispatch();
  const { token, user } = useSelector((state) => state.auth);
  const desktopNotifications = useSelector(
    (state) => state.settings.desktopNotifications,
  );

  useEffect(() => {
    if (!token || !user) {
      socketService.disconnect();
      dispatch(setSocketStatus("disconnected"));
      return undefined;
    }

    const socket = socketService.connect(token);

    const onConnect = () => dispatch(setSocketStatus("connected"));
    const onDisconnect = () => dispatch(setSocketStatus("disconnected"));
    const onConnectError = () => dispatch(setSocketStatus("error"));

    // Handle online/offline presence using publicId
    const onUserOnline = ({ publicId, userId }) => {
      const targetId = publicId || userId;
      dispatch(setContactPresence({ publicId: targetId, online: true }));
    };

    const onUserOffline = ({ publicId, userId }) => {
      const targetId = publicId || userId;
      dispatch(setContactPresence({ publicId: targetId, online: false }));
    };

    // src/providers/RealtimeProvider.jsx

    const onMessage = async (message) => {
      try {
        const senderPublicId = message.senderPublicId;

        if (senderPublicId) {
          await dispatch(ensureIncomingContact(senderPublicId)).unwrap();
        }

        const result = await dispatch(decryptRealtimeMessage(message)).unwrap();

        if (
          desktopNotifications &&
          document.hidden &&
          window.Notification?.permission === "granted"
        ) {
          new window.Notification("LinkChat", {
            body: result.message?.text || "New encrypted message",
          });
        }
      } catch (err) {
        console.error("Failed to process real-time incoming message:", err);
      }
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on(REALTIME_EVENTS.userOnline, onUserOnline);
    socket.on(REALTIME_EVENTS.userOffline, onUserOffline);
    socket.on(REALTIME_EVENTS.messageReceive, onMessage);

    if (socket.connected) onConnect();

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off(REALTIME_EVENTS.userOnline, onUserOnline);
      socket.off(REALTIME_EVENTS.userOffline, onUserOffline);
      socket.off(REALTIME_EVENTS.messageReceive, onMessage);
      socketService.disconnect();
    };
  }, [desktopNotifications, dispatch, token, user]);

  return children;
}
