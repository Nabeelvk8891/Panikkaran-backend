import express from "express";
import Chat from "../models/Chat.js";
import Message from "../models/Message.js";

const router = express.Router();

/* ================= GET MY CHATS ================= */
router.get("/", async (req, res) => {
  try {
    const userId = String(req.user.id);

    const chats = await Chat.find({
      members: userId,
    })
      .populate({
        path: "members",
        select: "name profileImage lastSeen",
      })
      .populate({
        path: "lastMessage",
        select: "text createdAt sender",
      })
      .sort({ updatedAt: -1 })
      .lean();

    const filteredChats = chats.map((chat) => {
      const clearedAt = chat.clearedAt?.[userId];

      if (
        clearedAt &&
        chat.lastMessage &&
        new Date(chat.lastMessage.createdAt) <= new Date(clearedAt)
      ) {
        chat.lastMessage = null;
      }

      return chat;
    });

    res.json(filteredChats);
  } catch (err) {
    console.error("Fetch chats error:", err);
    res.status(500).json({ message: "Failed to load chats" });
  }
});

/* ================= CLEAR CHAT (ONLY ME) ================= */
router.post("/clear/:chatId", async (req, res) => {
  try {
    const userId = String(req.user.id);
    const { chatId } = req.params;

    const chat = await Chat.findOne({ chatId });
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    const isMember = chat.members.some(
      (m) => String(m) === userId
    );
    if (!isMember) {
      return res.status(403).json({ message: "Not authorized" });
    }

    chat.clearedAt.set(userId, new Date());
    await chat.save();

    res.json({ success: true });
  } catch (err) {
    console.error("Clear chat error:", err);
    res.status(500).json({ message: "Failed to clear chat" });
  }
});

/* ================= DELETE CHAT (BOTH SIDES) ================= */
router.delete("/:chatId", async (req, res) => {
  try {
    const userId = String(req.user.id);
    const { chatId } = req.params;

    const chat = await Chat.findOne({ chatId });
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    const isMember = chat.members.some(
      (m) => String(m) === userId
    );
    if (!isMember) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await Message.deleteMany({ chatId });
    await Chat.deleteOne({ chatId });

    res.json({ success: true });
  } catch (err) {
    console.error("Delete chat error:", err);
    res.status(500).json({ message: "Failed to delete chat" });
  }
});

export default router;
