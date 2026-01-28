import express from "express";
import Notification from "../models/Notification.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

/* ================= GET ALL NOTIFICATIONS ================= */
router.get("/", protect, async (req, res) => {
  try {
    const notifications = await Notification.find({
      user: req.user._id,
    }).sort({ createdAt: -1 });

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch notifications" });
  }
});

/* ================= MARK ALL AS READ ================= */
router.patch("/read-all", protect, async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Failed to update notifications" });
  }
});

/* ================= MARK SINGLE AS READ ================= */
router.patch("/:id/read", protect, async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, {
      isRead: true,
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Failed to update notification" });
  }
});

/* ================= CLEAR ALL (DELETE) ================= */
router.delete("/clear", protect, async (req, res) => {
  try {
    await Notification.deleteMany({
      user: req.user._id,
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({
      message: "Failed to clear notifications",
    });
  }
});

export default router;
