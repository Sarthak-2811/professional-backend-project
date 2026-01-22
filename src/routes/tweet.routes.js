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

/* ================= PUBLIC ================= */
router.get("/", getAllTweets); // 🔥 THIS FIXES 404

/* ================= PROTECTED ================= */
router.use(verifyJWT);

router.post("/", createTweet);
router.get("/user/:userId", getUserTweet);

router
  .route("/:tweetId")
  .patch(updateTweet)
  .delete(deleteTweet);

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



