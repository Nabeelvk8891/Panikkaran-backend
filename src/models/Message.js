import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    chatId: { type: String, required: true },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    text: { type: String, required: true },

    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },

    replyText: { type: String, default: null },

    replySender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    delivered: { type: Boolean, default: false },
    seen: { type: Boolean, default: false },
  },
  { timestamps: true } 
);

messageSchema.index({
  chatId: 1,
  seen: 1,
  sender: 1,
});


export default mongoose.model("Message", messageSchema);
