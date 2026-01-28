import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String },
    isRead: { type: Boolean, default: false },

    meta: {
      chatId: String,
      sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      count: { type: Number, default: 1 },
    },
  },
  { timestamps: true }
);


export default mongoose.model("Notification", notificationSchema);
