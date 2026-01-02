import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

const app = express()

// Middlewares
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(express.static("public"))
app.use(cookieParser())

// Routes import
import userRouter from './routes/user.routes.js'
import subscriptionRouter from "./routes/subscription.routes.js"
import tweetRouter from "./routes/tweet.routes.js"

// Route declaration
app.use("/api/v1/users", userRouter)
app.use("/api/v1/subscriptions", subscriptionRouter)
app.use("/api/v1/tweets", tweetRouter)

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