import express from "express";
import dotenv from "dotenv";
import authRoute from "./routes/auth.route.js";
import messageRoute from "./routes/message.route.js"

dotenv.config();
const app = express();

app.use("/api/auth", authRoute);
app.use("/api/message", messageRoute);

const PORT = process.env.PORT || 3000;
app.listen(PORT);