import express from "express";
import {protect} from "../middlewares/authMiddleware.js";
import upload from "../middlewares/upload.js";
import {
  getMyProfile,
  saveProfile,
  deleteMyProfile,
} from "../controllers/profileController.js";

const router = express.Router();

router.get("/me", protect, getMyProfile);

router.put(
  "/save",
  protect,
  upload.single("image"),
  saveProfile
);

router.delete("/delete", protect, deleteMyProfile);

export default router;
