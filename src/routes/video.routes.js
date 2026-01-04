import { Router } from "express";
import {verifyJWT} from "../middlewares/auth.middleware.js";
import {upload} from "../middlewares/multer.middleware.js";

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

// 🔐 Protect all routes
router.use(verifyJWT);

router
    .route("/")
    .get(getAllVideos)
    .post(
        upload.fields([
            { name: "videoFile", maxCount: 1 },
            { name: "thumbnail", maxCount: 1 }
        ]),
        publishVideo
    );

router.get("/user/videos", getAllUserVideos);

router
    .route("/:videoId")
    .get(getVideoById)
    .delete(deleteVideo)
    .patch(upload.single("thumbnail"), updateVideo);

router.patch("/toggle/publish/:videoId", togglePublishStatus);

export default router;















// import { Router } from "express";
// import verifyJWT from "../middlewares/auth.middleware"

// import {
//     getAllVideos,
//     getAllUserVideos,
//     publishVideo,
//     getVideoById,
//     updateVideo,
//     deleteVideo,
//     togglePublishStatus
// } from "../controllers/video.controller"

// const router = Router()

// router.use(verifyJWT)

// router
//     .route("/")
//     .get(getAllVideos)
//     .post(
//         upload.fields([
//             {
//                 name: "videoFile",
//                 maxCount: 1
//             },
//             {
//                 name: "thumbnail",
//                 maxCount: 1
//             }
//         ]),
//         publishVideo
//     )

// router
//     .route("/:videoId")
//     .get(getVideoById)
//     .delete(deleteVideo)
//     .patch(upload.single("thumbnail"), updateVideo)

// router.route("/toggle/publish/:videoId").patch(togglePublishStatus)

// export default router 