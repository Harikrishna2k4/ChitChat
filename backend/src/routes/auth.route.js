import express from "express";
import { signup, login, logout, updateProfile } from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { arcjetProtection } from "../middleware/arcjet.middleware.js";
const router = express.Router();

router.get("/check", protectRoute, (req, res) => res.status(200).json(req.user));
router.post("/logout", logout);
router.post("/signup", arcjetProtection, signup);
router.post("/login", arcjetProtection, login);

router.put("/update-profile", protectRoute, updateProfile)


export default router;