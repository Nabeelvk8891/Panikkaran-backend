import Notification from "../models/Notification.js";
import { getIO } from "../../socket.js"

export const createNotification = async ({
  userId,
  title,
  message,
  type,
}) => {
  if (!userId) return;

  const notification = await Notification.create({
    user: userId,
    title,
    message,
    type,
  });

  //  Emit live notification (socket)
  try {
    const io = getIO();
    io.to(userId.toString()).emit("new-notification", notification);
  } catch (error) {
    // socket not ready or user offline — ignore safely
  }

  return notification;
};
