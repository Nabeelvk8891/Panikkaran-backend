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
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());

app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  next();
});

app.use("/auth", authRoutes);
app.use("/profile", profileRoutes);
app.use("/jobs", jobRoutes);
app.use("/upload", uploadRoutes);
app.use("/admin", adminRoutes);
app.use("/appointments", appointmentRoutes);
app.use("/users", userRoutes);
app.use("/reports", reportRoutes);
app.use("/notifications", notificationRoutes);
app.use("/messages", protect, messageRoutes);
app.use("/chats", protect, chatRoutes);


app.get("/", (req, res) => {
  res.send("✅ Panikkaran API is running...");
});

export default app;
