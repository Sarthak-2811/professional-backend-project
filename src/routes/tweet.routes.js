import { Router } from "express";
import {
  createTweet,
  getAllTweets,
  getUserTweet,
  updateTweet,
  deleteTweet,
} from "../controllers/tweet.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

/* ================= AUTH-AWARE FEED ================= */
// ✅ MUST be protected because isLiked depends on req.user
router.get("/", verifyJWT, getAllTweets);

/* ================= PROTECTED ================= */
router.post("/", verifyJWT, createTweet);
router.get("/user/:userId", verifyJWT, getUserTweet);

router
  .route("/:tweetId")
  .patch(verifyJWT, updateTweet)
  .delete(verifyJWT, deleteTweet);

export default router;






// import { Router } from "express";
// import {
//     createTweet,
//     getUserTweet,
//     updateTweet,
//     deleteTweet
// } from "../controllers/tweet.controller.js"

// import { verifyJWT } from "../middlewares/auth.middleware.js";

// const router = Router()
// router.use(verifyJWT)

// router.route("/").post(createTweet);
// router.route("/user/:userId").get(getUserTweet)
// router.route("/:tweetId")
//     .patch(updateTweet)
//     .delete(deleteTweet)

// router.route("/").post(createTweet);

// export default router



