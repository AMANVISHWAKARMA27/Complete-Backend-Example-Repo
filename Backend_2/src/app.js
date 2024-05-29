import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    Credential: true
}))

app.use(express.json({ limit: "16kb" })) // accepting json 
app.use(express.urlencoded({ extended: true, limit: "16kb" })) // accepting data from url
app.use(express.static("public")) //storing data from user in public folder
app.use(cookieParser())

// routes import
import userRouter from "./routes/user.routes.js"

// routes decleration
app.use("/api/v1/users", userRouter) // whenever the user goes for /users, the control will be user.controller.js
// http://localhost:8000/api/users/register



export { app };