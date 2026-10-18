import { v2 as cloudinary } from "cloudinary";
import { ENV } from "./env.js";

cloudinary.config({
  cloud_name: ENV.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME,
  api_key: ENV.CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY,
  api_secret: ENV.CLOUDINARY_API_SECRET || process.env.CLOUDINARY_API_SECRET,
});
console.log("Cloudinary config:", {
    cloud_name: cloudinary.config().cloud_name,
    api_key: cloudinary.config().api_key ? "set" : "MISSING",
    api_secret: cloudinary.config().api_secret ? "set" : "MISSING",
});
export default cloudinary;
