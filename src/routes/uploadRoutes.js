import express from "express";
import upload from "../middlewares/upload.js";
import { protect } from "../middlewares/authMiddleware.js";
import { uploadJobImages } from "../controllers/uploadController.js";

const router = express.Router();

router.post(
  "/job-images",
  protect,
  upload.array("images", 5),
  uploadJobImages
);

export default router;
