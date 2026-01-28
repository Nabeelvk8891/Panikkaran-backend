import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    worker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },

    workTitle: {
      type: String,
      required: true,
    },

    description: String,

    date: {
      type: String,
      required: true,
    },

    time: {
      type: String,
      default: null,
    },

    requestedWage: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "cancelled", "completed"],
      default: "pending",
    },

    cancelledBy: {
      type: String,
      enum: ["user", "worker"],
    },

    cancelReason: {
      type: String,
    },

    rejectReason: {
      type: String,
    },
    cancelledAt: Date,

    rejectedAt: Date,

    completedAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model("Appointment", appointmentSchema);
