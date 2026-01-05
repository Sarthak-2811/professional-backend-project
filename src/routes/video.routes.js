import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

import {
  getAllVideos,
  getAllUserVideos,
  publishVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus
} from "../controllers/video.controller.js";

const router = Router();

/* ================= PUBLIC ROUTES ================= */

// Home page videos
router.get("/", getAllVideos);

// Watch page video
router.get("/:videoId", getVideoById);

/* ================= PROTECTED ROUTES ================= */

router.use(verifyJWT);

// Upload video
router.post(
  "/",
  upload.fields([
    { name: "videoFile", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 }
  ]),
  publishVideo
);

// Logged-in user's videos
router.get("/user/videos", getAllUserVideos);

// Update / delete video
router
  .route("/:videoId")
  .delete(deleteVideo)
  .patch(upload.single("thumbnail"), updateVideo);

// Publish / unpublish
router.patch("/toggle/publish/:videoId", togglePublishStatus);

export default router;
