import User from "../models/User.js";
import Appointment from "../models/Appointment.js";
import Job from "../models/Job.js";


export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      "name email phone location bio role profileImage createdAt"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch user profile" });
  }
};

export const canViewPhone = async (req, res) => {
  const viewerId = req.user.id;       // logged-in user
  const profileUserId = req.params.id;

  const hasAcceptedAppointment = await Appointment.exists({
    $or: [
      { sender: viewerId, receiver: profileUserId },
      { sender: profileUserId, receiver: viewerId },
    ],
    status: "accepted",
  });

  const hasCompletedJob = await Job.exists({
    employer: profileUserId,
    worker: viewerId,
    status: "completed",
  });

  return res.json({
    canView: !!(hasAcceptedAppointment || hasCompletedJob),
  });
};

