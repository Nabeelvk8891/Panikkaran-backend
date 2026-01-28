import express from "express";
import { getUserById, canViewPhone } from "../controllers/userController.js";
import { protect } from "../middlewares/authMiddleware.js";

const router = express.Router();

/* PHONE VISIBILITY (PROTECTED) */
router.get("/:id/phone-visibility", protect, canViewPhone);

/* PUBLIC USER PROFILE */
router.get("/:id", getUserById);

export default router;
