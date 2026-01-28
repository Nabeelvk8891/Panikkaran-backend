import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    chatId: {
      type: String,
      required: true,
      unique: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },

    clearedAt: {
    type: Map,
    of: Date,
    default: {},
  },
  },
  { timestamps: true }
);

export default mongoose.model("Chat", chatSchema);
