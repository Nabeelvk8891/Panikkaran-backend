import { Server } from "socket.io";
import Message from "./src/models/Message.js";
import User from "./src/models/User.js";
import Notification from "./src/models/Notification.js";
import Chat from "./src/models/Chat.js";

let io;

/**
 * userId => Set(socketIds)
 */
const onlineUsers = new Map();

/**
 * chatId => Set(userIds)
 */
const activeChats = new Map();

/**
 * userId => lastSeen Date
 */
const lastSeenMap = new Map();

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: [
        "http://localhost:5173",
        "https://panikkaran.vercel.app",
      ],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("🔌 Connected:", socket.id);

    socket.userId = null;
    socket.isOfflineHandled = false;

    /* ================= PRESENCE ================= */

    socket.on("online", async (userId) => {
      if (!userId) return;

      const uid = String(userId);
      socket.userId = uid;
      socket.join(uid);

      if (!onlineUsers.has(uid)) {
        onlineUsers.set(uid, new Set());
      }

      onlineUsers.get(uid).add(socket.id);

      // Clear stale lastSeen
      lastSeenMap.delete(uid);

      io.emit("presence", {
        onlineUsers: Array.from(onlineUsers.keys()),
        lastSeenMap: Object.fromEntries(lastSeenMap),
      });
    });

    socket.on("get-presence", () => {
  io.emit("presence", {
    onlineUsers: Array.from(onlineUsers.keys()),
    lastSeenMap: Object.fromEntries(lastSeenMap),
  });
});


  socket.on("disconnect", async () => {
  if (socket.isOfflineHandled) return;
  socket.isOfflineHandled = true;

  const uid = socket.userId;
  if (!uid) return;

  const sockets = onlineUsers.get(uid);
  if (!sockets) return;

  sockets.delete(socket.id);

  if (sockets.size > 0) return;

  onlineUsers.delete(uid);

  const lastSeenTime = new Date();

  try {
    await User.findByIdAndUpdate(uid, {
      lastSeen: lastSeenTime,
    });
  } catch (err) {
    console.error("LastSeen DB update failed:", err);
  }

  lastSeenMap.set(uid, lastSeenTime);

  io.emit("presence", {
    onlineUsers: Array.from(onlineUsers.keys()),
    lastSeenMap: Object.fromEntries(lastSeenMap),
  });

  console.log("❌ User fully offline:", uid);
});


    /* ================= CHAT ================= */

    socket.on("joinChat", async ({ chatId, userId }) => {
      if (!chatId || !userId) return;

      const uid = String(userId);
      socket.join(chatId);

      if (!activeChats.has(chatId)) {
        activeChats.set(chatId, new Set());
      }

      activeChats.get(chatId).add(uid);

      io.emit("chat-active", {
        chatId,
        userId: uid,
        active: true,
      });

      try {
        await Message.updateMany(
          {
            chatId,
            delivered: false,
            sender: { $ne: userId },
          },
          { delivered: true }
        );
      } catch (err) {
        console.error("Delivered update failed:", err);
      }

      io.to(chatId).emit("deliveredUpdate", { chatId });
    });

    socket.on("leaveChat", (chatId) => {
      if (!chatId) return;

      socket.leave(chatId);

      const uid = socket.userId;
      if (!uid) return;

      const set = activeChats.get(chatId);
      if (!set) return;

      set.delete(uid);

      if (set.size === 0) {
        activeChats.delete(chatId);
      }

      io.emit("chat-active", {
        chatId,
        userId: uid,
        active: false,
      });
    });

    /* ================= SEND MESSAGE ================= */

    socket.on("sendMessage", async (payload) => {
      const {
        chatId,
        text,
        sender,
        tempId,
        appointmentId,
        replyTo,
        replyText,
        replySender,
      } = payload || {};

      if (!chatId || !text || !sender) return;

      let msg;
      try {
        msg = await Message.create({
          chatId,
          sender,
          text,
          replyTo: replyTo || null,
          replyText: replyText || null,
          replySender: replySender || null,
          delivered: true,
          seen: false,
          createdAt: new Date(),
        });
      } catch (err) {
        console.error("Message create failed:", err);
        return;
      }

      io.to(chatId).emit("receiveMessage", {
        ...msg.toObject(),
        tempId,
      });

      const senderUser = await User.findById(sender).select("name");
      const senderName = senderUser?.name || "Someone";

      let chat = await Chat.findOne({ chatId });

      if (!chat) {
        const [id1, id2] = chatId.split("_");
        chat = await Chat.create({
          chatId,
          members: [id1, id2],
          lastMessage: msg._id,
          updatedAt: new Date(),
        });
      } else {
        chat.lastMessage = msg._id;
        chat.updatedAt = new Date(); // 🔥 IMPORTANT FOR TIME FIX
        await chat.save();
      }

      const [id1, id2] = chatId.split("_");
      const receiverId = String(sender) === id1 ? id2 : id1;

      if (!receiverId || receiverId === sender) return;

      /* ================= NEW MESSAGE EVENT ================= */
      if (onlineUsers.has(receiverId)) {
        onlineUsers.get(receiverId).forEach((sid) => {
          io.to(sid).emit("new-message", {
            chatId,
            sender,
          });
        });
      }

      /* ================= NOTIFICATION (SMART CHECK) ================= */

      let receiverInChat = false;
      const receiverSockets = onlineUsers.get(receiverId);

      if (receiverSockets) {
        receiverSockets.forEach((sid) => {
          const socketInstance = io.sockets.sockets.get(sid);
          if (socketInstance?.rooms?.has(chatId)) {
            receiverInChat = true;
          }
        });
      }

      if (receiverInChat) return;

      let notification = await Notification.findOne({
        user: receiverId,
        type: "message",
        isRead: false,
        "meta.chatId": chatId,
        "meta.sender": sender,
      });

      if (notification) {
        notification.meta.count += 1;
        notification.message = `${notification.meta.count} new messages`;
        await notification.save();
      } else {
        notification = await Notification.create({
          user: receiverId,
          title: `New message from ${senderName}`,
          message: "1 new message",
          type: "message",
          meta: {
            chatId,
            appointmentId,
            sender,
            count: 1,
          },
        });
      }

      if (notification && onlineUsers.has(receiverId)) {
        onlineUsers.get(receiverId).forEach((sid) => {
          io.to(sid).emit("new-notification", notification);
        });
      }
    });

    socket.on("typing", ({ chatId }) => {
      if (!chatId) return;
      socket.to(chatId).emit("typing", { chatId });
    });

    /* ================= MARK SEEN ================= */

    socket.on("markSeen", async ({ chatId, userId }) => {
      if (!chatId || !userId) return;

      try {
        await Message.updateMany(
          {
            chatId,
            seen: false,
            sender: { $ne: userId },
          },
          { seen: true }
        );

        await Notification.updateMany(
          {
            user: userId,
            type: "message",
            "meta.chatId": chatId,
            isRead: false,
          },
          { isRead: true }
        );
      } catch (err) {
        console.error("Seen update failed:", err);
      }

      const chat = await Chat.findOne({ chatId });
      if (!chat) return;

      const senderId = chat.members.find(
        (id) => String(id) !== String(userId)
      );

      if (!senderId) return;

      const senderSockets = onlineUsers.get(String(senderId));
      if (!senderSockets) return;

      senderSockets.forEach((sid) => {
        io.to(sid).emit("seenUpdate", {
          chatId,
          seenBy: userId,
        });
      });
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};
