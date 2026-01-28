import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    // Auth
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    password: String,

    provider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

       isBlocked: {
      type: Boolean,
      default: false,
    },

    /* 🔐 EMAIL OTP */
    emailOtp: {
      type: String,
    },

    emailOtpExpires: {
      type: Date,
    },

    emailOtpLastSent: {
      type: Date,
    },

    profileImage: String,

    // Profile
    profession: {
      type: String,
      trim: true,
    },

    location: {
      type: String,
      trim: true,
    },

    bio: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    skills: [
  {
    type: String,
    trim: true,
    default: "",
  },
],

experience: {
  type: String,
  trim: true,
},

resetPasswordToken: {
  type: String,
},
resetPasswordExpire: {
  type: Date,
},

lastSeen: {
  type: Date,
  default: null
},


rate: {
  type: String,
  trim: true,
},



  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
