import Job from "../models/Job.js";
import User from "../models/User.js";
import Appointment from "../models/Appointment.js";
import {
  notifyNewJobPosted,
  notifyJobCompleted,
} from "../services/notificationService.js";

/* create JOB */
export const createJob = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // PROFESSIONAL PROFILE CHECK
    const hasProfession = Boolean(user.profession);
    const hasRate = Boolean(user.rate);
    const hasSkills =
      Array.isArray(user.skills) &&
      user.skills.filter((s) => s.trim()).length > 0;

    if (!hasProfession || !hasRate || !hasSkills) {
      return res.status(403).json({
        requireProfessionalProfile: true,
        message:
          "Please complete your professional profile before posting a job",
      });
    }

    const { lat, lng, ...jobData } = req.body;

    const payload = {
      ...jobData,
      user: user._id,
    };

    // Add GEO location ONLY if coordinates are provided
    if (typeof lat === "number" && typeof lng === "number") {
      payload.locationGeo = {
        type: "Point",
        coordinates: [lng, lat],
      };
    }

    const job = await Job.create(payload);

    // 🔔 ADDED — EMAIL NOTIFICATION (NEW JOB)
    notifyNewJobPosted({
      user,
      job,
    });

    res.status(201).json({
      message: "Job posted successfully",
      job,
    });
  } catch (error) {
    console.error("CREATE JOB ERROR:", error);
    res.status(500).json({
      message: error.message || "Failed to create job",
    });
  }
};

/* my JOBs*/
export const getMyJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ user: req.user._id }).sort({ createdAt: -1 });

    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch jobs" });
  }
};

/*ALL JOBS  */
export const getJobs = async (req, res) => {
  try {
    const { search, location, page = 1, limit = 10 } = req.query;

    const query = {};

    if (search) {
      query.title = { $regex: search, $options: "i" };
    }

    if (location) {
      query.location = { $regex: location, $options: "i" };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [jobs, totalJobs] = await Promise.all([
      Job.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate("user", "name profileImage profession location phone email"),
      Job.countDocuments(query),
    ]);

    res.json({
      jobs,
      currentPage: Number(page),
      totalPages: Math.ceil(totalJobs / limit),
      totalJobs,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch jobs" });
  }
};

/* single JOB */

export const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate(
      "user",
      "name phone profileImage profession experience location rate email"
    );

    if (!job || !job.user) {
      return res.status(404).json({ message: "Job or employer not found" });
    }

    res.json(job);
  } catch (error) {
    res.status(400).json({ message: "Invalid job ID" });
  }
};

/* edit JOB */

export const updateJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (job.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const updatedJob = await Job.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    res.json({
      message: "Job updated successfully",
      job: updatedJob,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* delete JOB */
export const deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (job.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await job.deleteOne();

    res.json({ message: "Job deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* Latest Jobs */
export const getLatestJobs = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    const [jobs, totalJobs] = await Promise.all([
      Job.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate("user", "name profileImage profession location email phone"),

      Job.countDocuments(),
    ]);

    res.json({
      jobs,
      currentPage: Number(page),
      totalPages: Math.ceil(totalJobs / limit),
      totalJobs,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch latest jobs" });
  }
};

/* Jobs by User */

/* Jobs by User */
export const getJobsByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const jobs = await Job.find({ user: userId }).sort({ createdAt: -1 });

    res.json(jobs);
  } catch (error) {
    console.error("GET JOBS BY USER ERROR:", error);
    res.status(500).json({ message: "Failed to fetch user jobs" });
  }
};

/* Job Reviews */
export const addReview = async (req, res) => {
  try {
    const jobId = req.params.id;
    const userId = req.user.id;

    // 1️⃣ Check job
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    // 2️⃣ Check COMPLETED appointment
    const completedAppointment = await Appointment.findOne({
      user: userId,
      worker: job.user, // employer / worker
      workTitle: job.title, // matches appointment
      status: "completed",
    });

    if (!completedAppointment) {
      return res.status(403).json({
        message: "You can add a review only after the service is completed",
      });
    }

    // 3️⃣ Prevent duplicate review
    const alreadyReviewed = job.reviews.find(
      (r) => String(r.user) === String(userId)
    );

    if (alreadyReviewed) {
      return res.status(400).json({
        message: "You have already reviewed this job",
      });
    }

    // 4️⃣ Add review
    job.reviews.push({
      user: userId,
      rating: req.body.rating,
      comment: req.body.comment,
    });

    job.reviewCount = job.reviews.length;
    job.averageRating =
      job.reviews.reduce((a, c) => a + c.rating, 0) / job.reviewCount;

    await job.save();

    // 🔔 ADDED — EMAIL NOTIFICATION (NEW REVIEW)
    const employer = await User.findById(job.user);
    const reviewer = await User.findById(userId);

    if (employer && reviewer) {
      notifyJobCompleted({
        employer,
        worker: reviewer,
        job,
      });
    }

    res.json({
      message: "Review added successfully",
      reviews: job.reviews,
    });
  } catch (error) {
    console.error("ADD REVIEW ERROR:", error);
    res.status(500).json({ message: "Failed to add review" });
  }
};

export const getReviews = async (req, res) => {
  const job = await Job.findById(req.params.id).populate(
    "reviews.user",
    "name profileImage"
  );

  if (!job) {
    return res.status(404).json({ message: "Job not found" });
  }

  res.json(job.reviews);
};

/* NEARBY JOBS */

export const getNearbyJobs = async (req, res) => {
  try {
    const { lat, lng, radius = 10 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        message: "Latitude and longitude required",
      });
    }

    const jobs = await Job.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [Number(lng), Number(lat)],
          },
          distanceField: "distance", // meters
          spherical: true,
          maxDistance: Number(radius) * 1000, // km → meters
          query: { isBlocked: false },
        },
      },
      {
        $sort: {
          distance: 1,
          createdAt: -1,
        },
      },
      {
        $limit: 50,
      },
    ]);

    await Job.populate(jobs, {
      path: "user",
      select: "name profileImage profession location phone email",
    });

    res.json({ jobs });
  } catch (error) {
    console.error("NEARBY JOBS ERROR:", error);
    res.status(500).json({
      message: "Failed to fetch nearby jobs",
    });
  }
};
