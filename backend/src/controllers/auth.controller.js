import { sendWelcomeEmail } from "../emails/emailHandlers.js";
import { ENV } from "../lib/env.js";
import { generateToken } from "../lib/utils.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken";
import cloudinary from "../lib/cloudinary.js"

export async function signup(req,res){
    const {fullName, email, password} = req.body;
    try {
        if(!password || !email || !fullName){
            return res.status(400).json({message: "all fields are required"});
        }
        if(password.length < 6){
            return res.status(400).json({message: "Password must be atleast 6 characters"});
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if(!emailRegex.test(email)){
            return res.status(400).json({message: "enter a valid email"});
        }
        const user = await User.findOne({email});
        if(user){
            return res.status(400).json({message: "This email already exist"});
        }
        const salt = await bcrypt.genSalt(10);
        const hashedpassword = await bcrypt.hash(password, salt);
        const newuser = new User({
            fullName,
            email,
            password: hashedpassword
        });
        if(newuser){
            const saveduser = await newuser.save();
            generateToken(saveduser._id, res);
            res.status(201).json({
                _id: newuser._id,
                fullName: newuser.fullName,
                email: newuser.email,
                profilePic: newuser.profilePic
            });
            try{
                await sendWelcomeEmail(saveduser.email, saveduser.fullName, ENV.CLIENT_URL);
            } catch(error){
                console.error("failed to send welcome email;", error);
            }

        }else{
            res.status(400).json({message: "Invalid user data"});
        }

    } catch (error) {
        console.log("error in sign up controller:", error);
        res.status(500).json({message:"Internal server error"});
    }
}

export async function login(req, res){
    const {email, password} = req.body;
    try{
        const user = await User.findOne({email});
        if(!user){
            return res.status(400).json({messge: "invalid Credentials"})
        }
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if(!isPasswordCorrect){
            return res.status(400).json({messge: "invalid Credentials"})
        }
        generateToken(user._id, res);
        res.status(201).json({
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                profilePic: user.profilePic
            });
    } catch(error){
        console.log("error in login controller: ", error);
        res.status(500).json({message: "Internal server error"});
    }
    
}

export function logout(_, res){
    res.cookie("jwt", "", {maxAge:0})
    res.status(200).json({message: "Logged out successfully"});
}

export async function updateProfile(req, res){
    try {
        const {profilePic} = req.body;
        if(!profilePic){
            return res.status(400).json({message:"Profile picture is required"});
        }
        const userId = req.user._id;
        const uploadResponse = await cloudinary.uploader.upload(profilePic);
        const updatedUser = await User.findByIdAndUpdate(userId, {profilePic:uploadResponse.secure_url}, {new:true});
        res.status(200).json(updatedUser);
    } catch (error) {
        console.log("Error in updating profile", error);
        res.status(500).json({message:"Internal server error"});
    }
}

export async function checkAuth(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        return res.status(200).json(req.user);
    } catch (error) {
        console.log("Error in checkAuth controller:", error.message);
        return res.status(500).json({ message: "Internal server error" });
    }
}