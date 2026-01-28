import Appointment from "../models/Appointment.js";
import User from "../models/User.js";
import Job from "../models/Job.js";

import {
  notifyAppointmentRequested,
  notifyAppointmentAccepted,
  notifyAppointmentRejected,
  notifyAppointmentCancelled,
  notifyJobCompleted,
} from "../services/notificationService.js";

/*  HELPERS ---------- */

const toMinutes = (time) => {
  if (time.includes("AM") || time.includes("PM")) {
    const [t, m] = time.split(" ");
    let [h, min] = t.split(":").map(Number);
    if (m === "PM" && h !== 12) h += 12;
    if (m === "AM" && h === 12) h = 0;
    return h * 60 + min;
  }

  const [h, min] = time.split(":").map(Number);
  return h * 60 + min;
};

/*  CREATE  */

export const createAppointment = async (req, res) => {
  try {
    const {
      workerId,
      jobId,
      workTitle,
      description,
      date,
      time,
      requestedWage,
    } = req.body;

    if (!workerId || !jobId || !workTitle || !date) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (requestedWage === undefined || requestedWage === null) {
      return res.status(400).json({ message: "Requested wage is required" });
    }

    if (String(workerId) === String(req.user.id)) {
      return res
        .status(400)
        .json({ message: "You cannot create appointment for yourself" });
    }

    const normalizedDate = new Date(date).toISOString().split("T")[0];

    /* ⛔ Block same user same slot */
    if (time) {
      const duplicateByUser = await Appointment.findOne({
        user: req.user.id,
        worker: workerId,
        date: normalizedDate,
        time,
        status: { $in: ["pending", "accepted"] },
      });

      if (duplicateByUser) {
        return res.status(400).json({
          message: "You already requested this time slot",
        });
      }

      /* ⛔ Block worker slot conflict */
      const existing = await Appointment.findOne({
        worker: workerId,
        date: normalizedDate,
        time,
        status: { $in: ["pending", "accepted"] },
      });

      if (existing) {
        return res.status(400).json({
          message: "This time slot is already booked",
        });
      }

      const selectedMinutes = toMinutes(time);
      if (selectedMinutes < 420 || selectedMinutes > 1200) {
        return res.status(400).json({
          message: "Appointments allowed only between 7:00 AM and 8:00 PM",
        });
      }
    }

    const appointment = await Appointment.create({
      user: req.user.id,
      worker: workerId,
      job: jobId,
      workTitle,
      description,
      date: normalizedDate,
      time: time || null,
      requestedWage: Number(requestedWage),
      status: "pending",
    });




    // 🔔 ADDED — EMAIL NOTIFICATION (NO LOGIC CHANGE)
    const employer = await User.findById(req.user.id);
    const worker = await User.findById(workerId);
    const job = await Job.findById(jobId);

    console.log({
  acceptedBy: req.user.email,
  employer: job.user.email,
  worker: appointment.user.email,
});


    notifyAppointmentRequested({ employer, worker, job });

    res.status(201).json({
      message: "Appointment request sent",
      appointment,
    });
  } catch (err) {
    console.error("CREATE APPOINTMENT ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getSentAppointments = async (req, res) => {
  const appointments = await Appointment.find({ user: req.user.id })
    .populate("worker", "name phone profileImage")
    .populate("job", "wage")
    .sort({ createdAt: -1 });

  res.json(appointments);
};

export const getReceivedAppointments = async (req, res) => {
  const appointments = await Appointment.find({ worker: req.user.id })
    .populate("user", "name phone profileImage")
    .populate("job", "wage")
    .sort({ createdAt: -1 });

  res.json(appointments);
};

export const updateAppointmentStatus = async (req, res) => {
  try {
    const { status, reason } = req.body;
    const allowed = ["accepted", "rejected", "completed"];

    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    // 1️⃣ Fetch appointment + customer + worker
    const appointment = await Appointment.findById(req.params.id)
      .populate("user", "name email")     // customer / requester
      .populate("worker", "name email");  // service provider

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // 2️⃣ Fetch job + employer
    const job = await Job.findById(appointment.job)
      .populate("user", "name email"); // employer / job owner

    if (!job || !job.user) {
      return res.status(500).json({ message: "Job owner not found" });
    }

    // 🔍 DEBUG (THIS WILL NOW BE CORRECT)
    console.log({
      acceptedBy: req.user.email,
      employer: job.user.email,
      worker: appointment.worker.email,
      customer: appointment.user.email,
    });

    // 3️⃣ AUTHORIZATION
    // Only worker (service provider) can accept / reject / complete
    if (String(appointment.worker._id) !== String(req.user.id)) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // 4️⃣ Rejection rule
    if (status === "rejected") {
      if (!reason) {
        return res.status(400).json({ message: "Reject reason required" });
      }
      appointment.rejectReason = reason;
    }

    // 5️⃣ Completion rule
    if (status === "completed" && appointment.status !== "accepted") {
      return res.status(400).json({
        message: "Only accepted appointments can be completed",
      });
    }

    // 6️⃣ Update status
    appointment.status = status;
    await appointment.save();

    // 7️⃣ Notifications
    if (status === "accepted") {
      notifyAppointmentAccepted({
        employer: job.user,          // job owner
        worker: appointment.user,    // customer
        job,
      });
    }

    if (status === "rejected") {
      notifyAppointmentRejected({
        employer: job.user,
        worker: appointment.user,
        job,
      });
    }

    if (status === "completed") {
      notifyJobCompleted({
        employer: job.user,
        worker: appointment.user,
        job,
      });
    }

    res.json(appointment);

  } catch (err) {
    console.error("UPDATE APPOINTMENT STATUS ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};



export const cancelAppointment = async (req, res) => {
  try {
    const { reason } = req.body;

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Only creator or worker can cancel
    if (
      String(appointment.user) !== String(req.user.id) &&
      String(appointment.worker) !== String(req.user.id)
    ) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (!["pending", "accepted"].includes(appointment.status)) {
      return res
        .status(400)
        .json({ message: "Cannot cancel this appointment" });
    }

    if (!reason) {
      return res.status(400).json({ message: "Cancel reason required" });
    }

    appointment.status = "cancelled";
    appointment.cancelReason = reason;
    appointment.cancelledAt = new Date();

    await appointment.save();

    // 🔔 ADDED — EMAIL NOTIFICATION (AFTER SAVE)
    const employer = await User.findById(appointment.user);
    const worker = await User.findById(appointment.worker);
    const job = await Job.findById(appointment.job);

    notifyAppointmentCancelled({ employer, worker, job });

    res.json({ message: "Appointment cancelled successfully" });
  } catch (err) {
    console.error("Cancel error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteAppointment = async (req, res) => {
  const appointment = await Appointment.findById(req.params.id);

  if (!appointment) {
    return res.status(404).json({ message: "Appointment not found" });
  }

  if (appointment.status !== "rejected") {
    return res
      .status(400)
      .json({ message: "Only rejected appointments can be deleted" });
  }

  await appointment.deleteOne();
  res.json({ message: "Appointment deleted successfully" });
};

export const getWorkerAcceptedSlots = async (req, res) => {
  try {
    const { workerId } = req.params;

    const slots = await Appointment.find({
      worker: workerId,
      status: "accepted",
      time: { $ne: null },
    }).select("date time -_id");

    res.json(slots);
  } catch (err) {
    console.error("GET ACCEPTED SLOTS ERROR:", err);
    res.status(500).json({ message: "Failed to fetch blocked slots" });
  }
};

export const getUserAppointmentsByWorker = async (req, res) => {
  try {
    const { workerId } = req.params;

    const appointments = await Appointment.find({
      userId: req.user.id,
      workerId,
    }).select("date time");

    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch user appointments" });
  }
};


export const chatPermission = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const myId = req.user.id;

    const appointment = await Appointment.findById(appointmentId)
      .populate("user", "name profileImage lastSeen")
      .populate("worker", "name profileImage lastSeen");

    if (!appointment) {
      return res.status(404).json({
        allowed: false,
        message: "Appointment not found",
      });
    }

    const isUser =
      String(appointment.user._id) === String(myId);
    const isWorker =
      String(appointment.worker._id) === String(myId);

    if (!isUser && !isWorker) {
      return res.status(403).json({
        allowed: false,
        message: "You are not part of this appointment",
      });
    }

    if (appointment.status !== "accepted") {
      return res.status(403).json({
        allowed: false,
        message: "Chat enabled only after appointment is accepted",
      });
    }

    // 👇 THIS IS THE KEY FIX
    const otherUser = isUser
      ? appointment.worker
      : appointment.user;

    res.status(200).json({
      allowed: true,
      userId: appointment.user._id,
      workerId: appointment.worker._id,
      otherUser, // ✅ NOW SENT
    });
  } catch (error) {
    console.error("CHAT PERMISSION ERROR:", error);
    res.status(500).json({
      allowed: false,
      message: "Server error",
    });
  }
};
