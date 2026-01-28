import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { isAdmin } from "../middlewares/adminMiddleware.js";

import {
  adminDashboard,
  getAllUsers,
  blockUser,
  unblockUser,
  deleteUser,
  getAllJobs,
  getJobsByUser,
  blockJob,
  unblockJob,
  deleteJob,
} from "../controllers/adminController.js";

const router = express.Router();

/* ================= DASHBOARD ================= */
router.get("/dashboard", protect, isAdmin, adminDashboard);

/* ================= USERS ================= */
router.get("/users", protect, isAdmin, getAllUsers);
router.put("/users/:id/block", protect, isAdmin, blockUser);
router.put("/users/:id/unblock", protect, isAdmin, unblockUser);
router.delete("/users/:id", protect, isAdmin, deleteUser);

/* ================= JOBS ================= */
router.get("/jobs", protect, isAdmin, getAllJobs);
router.get("/jobs/user/:userId", protect, isAdmin, getJobsByUser);
router.put("/jobs/:id/block", protect, isAdmin, blockJob);
router.put("/jobs/:id/unblock", protect, isAdmin, unblockJob);
router.delete("/jobs/:id", protect, isAdmin, deleteJob);

export default router;
