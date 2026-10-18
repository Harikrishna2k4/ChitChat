import express from "express";
import authRoute from "./routes/auth.route.js";
import messageRoute from "./routes/message.route.js";
import path from "path";
import { connectdb } from "./lib/db.js";
import { ENV } from "./lib/env.js";
import cookieParser from "cookie-parser";
import { fileURLToPath } from "url";

const app = express();
app.use(cookieParser());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use("/api/auth", authRoute);
app.use("/api/messages", messageRoute);

if(ENV.NODE_ENV === "production"){
    const frontendDistPath = path.join(__dirname, "..", "..", "frontend", "dist");
    
    app.use(express.static(frontendDistPath));
    app.get("*", (_, res) => {
        res.sendFile(path.join(frontendDistPath, "index.html"));
    });
}

const PORT = ENV.PORT || 3000;

// 💡 FIX 1: Assign app.listen to the 'server' variable so nodemon can close it
const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    connectdb();
});

// 💡 FIX 2: Added a safety check to ensure 'server' exists before closing
process.once('SIGUSR2', () => {
    if (server) {
        server.close(() => {
            console.log('Server closed on port ' + PORT + ' (Nodemon restart)');
            process.kill(process.pid, 'SIGUSR2');
        });
    } else {
        process.kill(process.pid, 'SIGUSR2');
    }
});
