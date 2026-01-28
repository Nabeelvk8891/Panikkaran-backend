import User from "../models/User.js";
import Job from "../models/Job.js";
import cloudinary from "../config/cloudinary.js";

/* GET MY PROFILE */
export const getMyProfile = async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");

  res.json({
    user,
    hasProfile: Boolean(
      user.location || user.profession || user.bio || user.skills?.length
    ),
  });
};

/* SAVE PROFILE */
export const saveProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    /*TEXT FIELDS  */
    user.name = req.body.name || user.name;
    user.phone = req.body.phone || user.phone;
    user.location = req.body.location || user.location;
    user.profession = req.body.profession || user.profession;
    user.bio = req.body.bio || user.bio;
    user.experience = req.body.experience || user.experience;
    user.rate = req.body.rate || user.rate;

    /* SKILLS  */
    if (req.body.skills) {
      if (typeof req.body.skills === "string") {
        user.skills = req.body.skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      } else if (Array.isArray(req.body.skills)) {
        user.skills = req.body.skills;
      }
    }

    /*  IMAGE UPLOAD (SAFE) */
    if (req.file) {
      try {
        const result = await new Promise((resolve, reject) => {
          cloudinary.uploader
            .upload_stream(
              {
                folder: "profiles",
                resource_type: "image",
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            )
            .end(req.file.buffer);
        });

        user.profileImage = result.secure_url;;
      } catch (uploadErr) {
        console.error("Cloudinary upload failed:", uploadErr);
        return res
          .status(500)
          .json({ message: "Image upload failed" });
      }
    }

    await user.save();

    res.json({
      message: "Profile saved",
      user,
    });
  } catch (err) {
    console.error("SAVE PROFILE ERROR:", err);
    res.status(500).json({ message: "Profile update failed" });
  }
};

export const deleteMyProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    // 🧹 Delete all jobs posted by this user
    await Job.deleteMany({ user: userId });

    await User.findByIdAndUpdate(userId, {
      profession: "",
      skills: [],
      rate: "",
      bio: "",
      location: "",
      profileImage: "",
    });

    res.json({
      message: "Profile and job posts deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
