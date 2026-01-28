import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    reportedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true, // ✅ important
    },

    reason: {
      type: String,
      enum: [
        "fraud",
        "payment_issue",
        "fake_job",
        "abusive_behavior",
        "harassment",
        "spam",
        "other",
      ],
      required: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },

    status: {
      type: String,
      enum: ["open", "under_review", "resolved"],
      default: "open",
    },

    adminNote: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Report", reportSchema);
