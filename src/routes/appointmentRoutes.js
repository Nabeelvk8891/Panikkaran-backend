import express from "express";
import {
  createAppointment,
  getSentAppointments,
  getReceivedAppointments,
  updateAppointmentStatus,
  cancelAppointment,
  deleteAppointment,
  getWorkerAcceptedSlots,
  getUserAppointmentsByWorker,
  chatPermission,
} from "../controllers/appointmentController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createAppointment);

// Sent / received
router.get("/sent", protect, getSentAppointments);
router.get("/sent/:workerId", protect, getUserAppointmentsByWorker);
router.get("/received", protect, getReceivedAppointments);

// Worker accepted slots
router.get("/worker/:workerId/accepted", protect, getWorkerAcceptedSlots);

router.get("/:appointmentId/chat-permission", protect, chatPermission);

// Status actions
router.patch("/:id/status", protect, updateAppointmentStatus);
router.patch("/:id/cancel", protect, cancelAppointment);
router.delete("/:id", protect, deleteAppointment);

export default router;
