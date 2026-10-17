import mongoose from "mongoose";

export async function connectdb() {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(conn.connection.host);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}