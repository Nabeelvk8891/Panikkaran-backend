import express from "express";
import { protect } from "../middlewares/authMiddleware.js";
import { isAdmin } from "../middlewares/adminMiddleware.js";
import {
  createReport,
  getAllReports,
  updateReportStatus,
} from "../controllers/reportController.js";

const router = express.Router();

/* USER */
router.post("/", protect, createReport);

/* ADMIN */
router.get("/", protect, isAdmin, getAllReports);
router.put("/:id", protect, isAdmin, updateReportStatus);

export default router;
