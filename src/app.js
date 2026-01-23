import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

const app = express()

// Middlewares
// app.use(cors({
//     origin: process.env.CORS_ORIGIN,
//     credentials: true
// }))

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",")
  : [];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // Postman, server calls

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(express.static("public"))
app.use(cookieParser())

// Routes import
import userRouter from './routes/user.routes.js'
import subscriptionRouter from "./routes/subscription.routes.js"
import tweetRouter from "./routes/tweet.routes.js"
import videoRouter from "./routes/video.routes.js"
import commentRouter from "./routes/comment.routes.js"
import likeRouter from "./routes/like.routes.js"
import playlistRouter from "./routes/playlist.routes.js"
import dashboardRouter from "./routes/dashboard.routes.js"

// Route declaration
app.use("/api/v1/users", userRouter)
app.use("/api/v1/subscriptions", subscriptionRouter)
app.use("/api/v1/tweets", tweetRouter)
app.use("/api/v1/videos", videoRouter)
app.use("/api/v1/comments", commentRouter)
app.use("/api/v1/likes", likeRouter)
app.use("/api/v1/playlists", playlistRouter)
app.use("/api/v1/dashboard", dashboardRouter)

// Export app
export { app }






// import express from 'express'
// import cors from 'cors'
// import cookieParser from 'cookie-parser'

// const app = express()

// app.use(cors({
//     origin: process.env.CORS_ORIGIN,
//     credential: true
// }))

// // import Routes
// import userRouter from './routes/user.routes.js'

// // Routes declaration
// app.use("/api/v1/users", userRouter)

// app.use(express.json({limit: "16kb"}))
// app.use(express.urlencoded({extended: true, limit: "16kb"}))
// app.use(express.static("public"))
// app.use(cookieParser())

// // import Routes
// import userRouter from './routes/user.routes.js'

// // Routes declaration
// app.use("/api/v1/users", userRouter)

// //http://localhost:8000/api/v1/users/register

// export {app}