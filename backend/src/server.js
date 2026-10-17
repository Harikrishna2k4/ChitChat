import express from "express";
import authRoute from "./routes/auth.route.js";
import messageRoute from "./routes/message.route.js";
import path from "path";
import { connectdb } from "./lib/db.js";
import { ENV } from "./lib/env.js";

const app = express();
app.use(express.json());
const __dirname = path.resolve();

app.use("/api/auth", authRoute);
app.use("/api/message", messageRoute);

if(ENV.NODE_ENV === "production"){
    app.use(express.static(path.join(__dirname,"..", "frontend", "dist")));
    app.get("*", (_,res) => {
        res.sendFile(path.join(__dirname,"..", "frontend", "dist", "index.html"));
    })
}

const PORT = ENV.PORT || 3000;
app.use(express.json());
app.listen(PORT, () => {
    connectdb();
});