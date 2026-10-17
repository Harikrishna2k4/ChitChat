import mongoose from "mongoose";
import { ENV } from "./env.js";

export async function connectdb() {
    try {
        const conn = await mongoose.connect(ENV.MONGO_URI);
        console.log(conn.connection.host);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}