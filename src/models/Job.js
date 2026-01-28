import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    location: {
      type: String,
      required: true,
      trim: true,
    },

    locationGeo: {
      type: {
        type: String,
        enum: ["Point"],
      },
      coordinates: {
        type: [Number],
        required: false,
      },
    },

    category: {
      type: String,
      enum: [
        "General Service",
        "Construction",
        "Electrical",
        "Plumbing",
        "Carpentry",
        "Painting",
        "Repair & Maintenance",
        "Cleaning",
        "Sales & Delivery",
        "Healthcare Support",
        "Cooking",
        "Gardening",
        "Other",
      ],
      default: "General Service",
    },

    jobDuration: {
      type: String,
      default: "Depends on worksite",
    },

    skills: {
      type: [String],
      required: true,
    },

    wage: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
      required: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    images: {
      type: [String],
      default: [],
    },

    isBlocked: {
      type: Boolean,
      default: false,
    },

    blockedReason: String,

    reviews: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        rating: { type: Number, min: 1, max: 5 },
        comment: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],

    averageRating: {
      type: Number,
      default: 0,
    },

    reviewCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

jobSchema.index({ locationGeo: "2dsphere" });

export default mongoose.model("Job", jobSchema);
