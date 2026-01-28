import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import {
  createJob,
  getJobs,
  getJobById,
  getMyJobs,
  getLatestJobs,
  updateJob,
  deleteJob,
  getReviews,
  addReview,
  getJobsByUser,
  getNearbyJobs, 
} from "../controllers/jobController.js";

const router = express.Router();

/* ---------- PUBLIC STATIC ---------- */
router.get("/latest", getLatestJobs);
router.get("/nearby", getNearbyJobs); // 👈 ADD HERE
router.get("/", getJobs);

/* ---------- USER JOBS ---------- */
router.get("/user/:userId", getJobsByUser);

/* ---------- REVIEWS ---------- */
router.get("/:id/reviews", getReviews);
router.post("/:id/reviews", protect, addReview);

/* ---------- PROTECTED ---------- */
router.post("/", protect, createJob);
router.get("/my", protect, getMyJobs);
router.put("/:id", protect, updateJob);
router.delete("/:id", protect, deleteJob);

/* ---------- SINGLE JOB (ALWAYS LAST) ---------- */
router.get("/:id", getJobById);

export default router;
