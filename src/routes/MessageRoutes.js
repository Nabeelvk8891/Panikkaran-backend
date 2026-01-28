import express from "express";
import Message from "../models/Message.js";
import Chat from "../models/Chat.js";

const router = express.Router();

router.get("/:chatId", async (req, res) => {
  try {
    const userId = String(req.user.id);
    const { chatId } = req.params;

    const chat = await Chat.findOne({ chatId });
    if (!chat) {
      return res.json([]);
    }

    const clearedAt = chat.clearedAt?.get(userId);

    const query = { chatId };

    if (clearedAt) {
      query.createdAt = { $gt: clearedAt };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    console.error("Fetch messages error:", err);
    res.status(500).json([]);
  }
});

export default router;
