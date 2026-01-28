import User from "../models/User.js";
import Job from "../models/Job.js";

/* 🔔 ADMIN MAIL NOTIFICATIONS */
import {
  notifyUserBlockedByAdmin,
  notifyUserUnblockedByAdmin,
  notifyJobBlockedByAdmin,
  notifyJobUnblockedByAdmin,
  notifyJobDeletedByAdmin,
} from "../services/adminNotificationService.js";

/* DASHBOARD */
export const adminDashboard = async (req, res) => {
  try {
    /* ================= BASIC COUNTS ================= */

    const totalUsers = await User.countDocuments();
    const totalJobs = await Job.countDocuments();

    const activeJobs = await Job.countDocuments({ isBlocked: false });
    const blockedJobs = await Job.countDocuments({ isBlocked: true });

    const blockedUsers = await User.countDocuments({ isBlocked: true });
    const verifiedUsers = await User.countDocuments({ isVerified: true });
    const unverifiedUsers = await User.countDocuments({ isVerified: false });

    /* ================= TODAY / WEEK ================= */

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const jobsToday = await Job.countDocuments({
      createdAt: { $gte: today },
    });

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 6);
    startDate.setHours(0, 0, 0, 0);

    const jobsThisWeek = await Job.countDocuments({
      createdAt: { $gte: startDate },
    });

    const usersThisWeek = await User.countDocuments({
      createdAt: { $gte: startDate },
    });

    /* ================= DAILY AGGREGATION ================= */

    const jobsAgg = await Job.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
    ]);

    const usersAgg = await User.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
    ]);

    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().slice(0, 10));
    }

    const jobsLast7Days = days.map((day) => ({
      day,
      count: jobsAgg.find((j) => j._id === day)?.count || 0,
    }));

    const usersLast7Days = days.map((day) => ({
      day,
      count: usersAgg.find((u) => u._id === day)?.count || 0,
    }));

    /* ================= COMBINED GROWTH ================= */

    const usersVsJobs = days.map((day) => ({
      day,
      users: usersAgg.find((u) => u._id === day)?.count || 0,
      jobs: jobsAgg.find((j) => j._id === day)?.count || 0,
    }));

    /* ================= JOB STATUS SPLIT ================= */

    const jobStatus = [
      { name: "Active", value: activeJobs },
      { name: "Blocked", value: blockedJobs },
    ];

    /* ================= USER VERIFICATION SPLIT ================= */

    const userVerification = [
      { name: "Verified", value: verifiedUsers },
      { name: "Unverified", value: unverifiedUsers },
    ];

    /* ================= TOP JOB CATEGORIES ================= */
    /* (Safe even if category missing) */

    const topCategories = await Job.aggregate([
      { $match: { category: { $exists: true, $ne: "" } } },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    /* ================= RESPONSE ================= */

    res.json({
      cards: {
        totalUsers,
        totalJobs,
        activeJobs,
        blockedJobs,
        blockedUsers,
        verifiedUsers,
        unverifiedUsers,
        jobsToday,
        jobsThisWeek,
        usersThisWeek,
      },
      charts: {
        jobsLast7Days,
        usersLast7Days,
        usersVsJobs,
        jobStatus,
        userVerification,
        topCategories,
      },
    });
  } catch (err) {
    console.error("Admin dashboard error:", err);
    res.status(500).json({ message: "Admin dashboard failed" });
  }
};


/* USERS */
export const getAllUsers = async (req, res) => {
  const { page = 1, limit = 10, search } = req.query;
  const query = {
    role: { $ne: "admin" }, 
  };

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find(query)
      .select(
  "name email phone profession location bio skills experience rate role provider isVerified isBlocked createdAt profileImage"
)

      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    User.countDocuments(query),
  ]);

  res.json({
    users,
    currentPage: Number(page),
    totalPages: Math.ceil(total / limit),
  });
};

export const blockUser = async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isBlocked: true },
    { new: true }
  );

  if (!user) return res.status(404).json({ message: "User not found" });

  /* 🔔 EMAIL */
  notifyUserBlockedByAdmin(user, req.body.reason);

  res.json({ message: "User blocked", user });
};

export const unblockUser = async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isBlocked: false },
    { new: true }
  );

  if (!user) return res.status(404).json({ message: "User not found" });

  /* 🔔 EMAIL */
  notifyUserUnblockedByAdmin(user);

  res.json({ message: "User unblocked", user });
};

export const deleteUser = async (req, res) => {
  await Job.deleteMany({ user: req.params.id });
  await User.findByIdAndDelete(req.params.id);

  res.json({ message: "User and related jobs deleted" });
};

/* JOBS */
export const getAllJobs = async (req, res) => {
  const { page = 1, limit = 10, search } = req.query;
  const query = {};

  if (search) {
    query.title = { $regex: search, $options: "i" };
  }

  const skip = (page - 1) * limit;

  const [jobs, total] = await Promise.all([
    Job.find(query)
      .populate(
        "user",
        "-password -emailOtp -emailOtpExpires -emailOtpLastSent -resetPasswordToken -resetPasswordExpire"
      )
      .populate("location")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Job.countDocuments(query),
  ]);

  res.json({
    jobs,
    currentPage: Number(page),
    totalPages: Math.ceil(total / limit),
  });
};



export const getJobsByUser = async (req, res) => {
  const jobs = await Job.find({ user: req.params.userId }).populate(
    "user",
    "name profileImage email"
  );
  res.json(jobs);
};

export const blockJob = async (req, res) => {
  const job = await Job.findByIdAndUpdate(
    req.params.id,
    {
      isBlocked: true,
      blockedReason: req.body.reason || "Blocked by admin",
    },
    { new: true }
  ).populate("user");

  if (job?.user) {
    /* 🔔 EMAIL */
    notifyJobBlockedByAdmin(job, job.user, req.body.reason);
  }

  res.json({ message: "Job blocked", job });
};

export const unblockJob = async (req, res) => {
  const job = await Job.findByIdAndUpdate(
    req.params.id,
    { isBlocked: false, blockedReason: null },
    { new: true }
  ).populate("user");

  if (job?.user) {
    /* 🔔 EMAIL */
    notifyJobUnblockedByAdmin(job, job.user);
  }

  res.json({ message: "Job unblocked", job });
};

export const deleteJob = async (req, res) => {
  const job = await Job.findById(req.params.id).populate("user");

  if (job?.user) {
    /* 🔔 EMAIL */
    notifyJobDeletedByAdmin(job, job.user);
  }

  await Job.findByIdAndDelete(req.params.id);

  res.json({ message: "Job deleted permanently" });
};
