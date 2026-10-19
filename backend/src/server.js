import express from "express";
import authRoute from "./routes/auth.route.js";
import messageRoute from "./routes/message.route.js";
import path from "path";
import { connectdb } from "./lib/db.js";
import { ENV } from "./lib/env.js";
import cookieParser from "cookie-parser";
import { fileURLToPath } from "url";
import { app, server } from "./lib/socket.js";


app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

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
const Server = server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    connectdb();
});
process.once('SIGUSR2', () => {
    if (Server) {
        Server.close(() => {
            console.log('Server closed on port ' + PORT + ' (Nodemon restart)');
            process.kill(process.pid, 'SIGUSR2');
        });
    } else {
        process.kill(process.pid, 'SIGUSR2');
    }
});
