import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import jobRoutes from "./routes/jobRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import messageRoutes from "./routes/MessageRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";

import { protect } from "./middlewares/authMiddleware.js";

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);


app.use(express.json());

app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  next();
});

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/messages", protect, messageRoutes);
app.use("/api/chats", protect, chatRoutes);


app.get("/api", (req, res) => {
  res.send("✅ Panikkaran API is running...");
});

export default app;
