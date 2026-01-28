import { Server } from "socket.io";
import Message from "./src/models/Message.js";
import User from "./src/models/User.js";
import Notification from "./src/models/Notification.js";
import Chat from "./src/models/Chat.js";

let io;

// userId => Set(socketIds)
const onlineUsers = new Map();
const activeChats = new Map();

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("🔌 Connected:", socket.id);

    socket.isOfflineHandled = false;

    /* ================= PRESENCE ================= */

    socket.on("online", async (userId) => {
      if (!userId) return;

      const uid = String(userId);
      socket.userId = uid;

      if (!onlineUsers.has(uid)) {
        onlineUsers.set(uid, new Set());
      }

      onlineUsers.get(uid).add(socket.id);

      io.emit("presence", {
        onlineUsers: Array.from(onlineUsers.keys()),
      });
    });

    socket.on("online-check", () => {
      socket.emit("presence", {
        onlineUsers: Array.from(onlineUsers.keys()),
      });
    });

    socket.on("offline", async () => {
      if (socket.isOfflineHandled) return;
      socket.isOfflineHandled = true;

      const uid = socket.userId;
      if (!uid) return;

      const sockets = onlineUsers.get(uid);
      if (!sockets) return;

      sockets.delete(socket.id);

      if (sockets.size === 0) {
        onlineUsers.delete(uid);

        await User.findByIdAndUpdate(uid, {
          lastSeen: new Date(),
        });

        io.emit("presence", {
          onlineUsers: Array.from(onlineUsers.keys()),
        });
      }
    });

    socket.on("disconnect", async () => {
      if (socket.isOfflineHandled) return;
      socket.isOfflineHandled = true;

      const uid = socket.userId;
      if (!uid) return;

      const sockets = onlineUsers.get(uid);
      if (!sockets) return;

      sockets.delete(socket.id);

      if (sockets.size === 0) {
        onlineUsers.delete(uid);

        await User.findByIdAndUpdate(uid, {
          lastSeen: new Date(),
        });

        io.emit("presence", {
          onlineUsers: Array.from(onlineUsers.keys()),
        });
      }

      console.log("❌ Disconnected:", socket.id);
    });

    /* ================= CHAT ================= */

    socket.on("joinChat", async ({ chatId, userId }) => {
      if (!chatId || !userId) return;

      socket.join(chatId);

      if (!activeChats.has(chatId)) {
        activeChats.set(chatId, new Set());
      }
      activeChats.get(chatId).add(String(userId));

      await Message.updateMany(
        {
          chatId,
          delivered: false,
          sender: { $ne: userId },
        },
        { delivered: true }
      );

      io.to(chatId).emit("deliveredUpdate", { chatId });
    });

    socket.on("leaveChat", (chatId) => {
      if (!chatId) return;

      socket.leave(chatId);

      const uid = socket.userId;
      const set = activeChats.get(chatId);
      if (!set) return;

      set.delete(uid);
      if (set.size === 0) {
        activeChats.delete(chatId);
      }
    });

    socket.on(
      "sendMessage",
      async ({
        chatId,
        text,
        sender,
        tempId,
        appointmentId,
        replyTo,
        replyText,
        replySender,
      }) => {
        if (!chatId || !text || !sender) return;

        const msg = await Message.create({
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
          });
        } else {
          chat.lastMessage = msg._id;
          await chat.save();
        }

        const [id1, id2] = chatId.split("_");
        const receiverId = String(sender) === id1 ? id2 : id1;

        if (receiverId === sender) return;

        if (onlineUsers.has(receiverId)) {
          onlineUsers.get(receiverId).forEach((sid) => {
            io.to(sid).emit("new-message", {
              chatId,
              from: sender,
            });
          });
        }

        const receiverInChat = activeChats
          .get(chatId)
          ?.has(String(receiverId));

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

        if (onlineUsers.has(receiverId)) {
          onlineUsers.get(receiverId).forEach((sid) => {
            io.to(sid).emit("new-notification", notification);
          });
        }
      }
    );

    socket.on("typing", ({ chatId }) => {
      if (!chatId) return;
      socket.to(chatId).emit("typing", { chatId });
    });

    /* ================= MARK SEEN (FIXED WITHOUT REMOVING ANYTHING) ================= */

    socket.on("markSeen", async ({ chatId, userId }) => {
      if (!chatId || !userId) return;

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

      // 🔥 FIX: send seen update DIRECTLY to sender sockets
      const chat = await Chat.findOne({ chatId });
      if (!chat) return;

      const senderId = chat.members.find(
        (id) => String(id) !== String(userId)
      );

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
