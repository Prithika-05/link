import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { REALTIME_EVENTS } from "../constants/realtimeEvents";
import {
  ensureIncomingContact,
  handleRealtimeContactAccepted,
  incomingRequestReceived,
  outgoingRequestRejected,
  setContactPresence,
  contactRemovedByPeer,
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

    // Real-Time Contact Request Handlers
    const onContactRequestReceived = (data) => {
      console.log(
        "[RealtimeProvider] Received contact_request:received:",
        data,
      );

      dispatch(incomingRequestReceived(data));

      if (
        desktopNotifications &&
        window.Notification?.permission === "granted"
      ) {
        new window.Notification("LinkChat", {
          body: `New contact request from @${data.sender?.username || "user"}`,
        });
      }
    };

    const onContactRequestAccepted = (data) => {
      dispatch(handleRealtimeContactAccepted(data));

      if (
        desktopNotifications &&
        window.Notification?.permission === "granted"
      ) {
        new window.Notification("LinkChat", {
          body: `@${data.contact?.username || "User"} accepted your contact request!`,
        });
      }
    };

    const onContactRequestRejected = (data) => {
      dispatch(outgoingRequestRejected(data));
    };

    const onContactRequestRemoved = (data) => {
      dispatch(contactRemovedByPeer(data));
    };

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

    // Contact Socket Events
    socket.on(
      REALTIME_EVENTS.contactRequestReceived || "contact_request:received",
      onContactRequestReceived,
    );
    socket.on(
      REALTIME_EVENTS.contactRequestAccepted || "contact_request:accepted",
      onContactRequestAccepted,
    );
    socket.on(
      REALTIME_EVENTS.contactRequestRejected || "contact_request:rejected",
      onContactRequestRejected,
    );
    socket.on(
      REALTIME_EVENTS.contactRequestRemoved || "contact_request:removed",
      onContactRequestRemoved,
    );

    if (socket.connected) onConnect();

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off(REALTIME_EVENTS.userOnline, onUserOnline);
      socket.off(REALTIME_EVENTS.userOffline, onUserOffline);
      socket.off(REALTIME_EVENTS.messageReceive, onMessage);

      socket.off(
        REALTIME_EVENTS.contactRequestReceived || "contact_request:received",
        onContactRequestReceived,
      );
      socket.off(
        REALTIME_EVENTS.contactRequestAccepted || "contact_request:accepted",
        onContactRequestAccepted,
      );
      socket.off(
        REALTIME_EVENTS.contactRequestRejected || "contact_request:rejected",
        onContactRequestRejected,
      );
      socket.off(
        REALTIME_EVENTS.contactRequestRemoved || "contact_request:removed",
        onContactRequestRemoved,
      );

      socketService.disconnect();
    };
  }, [desktopNotifications, dispatch, token, user]);

  return children;
}
