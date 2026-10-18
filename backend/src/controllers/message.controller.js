import Message from "../models/Message.js"
import User from "../models/User.js"
import cloudinary from "../lib/cloudinary.js";

export async function getAllContacts(req, res){
    try {
        const loggedInUserId = req.user._id;
        const fillteredUsers = await User.find({_id: {$ne: loggedInUserId}}).select("-password");
        res.status(200).json(fillteredUsers);
    } catch (error) {
        console.log("Error in getAllContacts", error);
        res.status(500).json({message: "Server error"});
    }
}

export async function getMessagesByUserId(req, res) {
    try {
        const myId = req.user._id;
        const {id:userToChatId} = req.params;
        const message = await Message.find({
            $or: [
                {senderId: myId, receiverId: userToChatId},
                {senderId: userToChatId, receiverId: myId},
            ]
        });
        res.status(200).json(message);
    } catch (error) {
        console.log("Error in getMessages controller: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
}

export async function sendMessage(req, res) {
    try {
        const {text, image} = req.body;
        const {id: receiverId} = req.params;
        const senderId = req.user._id;
        let imageUrl;
        if(image){
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;
        }
        const newMessage = new Message({
            senderId,
            receiverId,
            text,
            image: imageUrl,
        });
        await newMessage.save();
        res.status(201).json(newMessage);
    } catch (error) {
        console.log("Error in sendMessage controller: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
}

export async function getChatPartners(req, res) {
    try {
        const loggedInUserId = req.user._id;
        const messages = await Message.find({
            $or: [{senderId: loggedInUserId}, {receiverId: loggedInUserId}],
        });
        const chatPartnerIds = [...new Set(messages.map(msg => msg.senderId.toString() == loggedInUserId ? msg.receiverId.toString(): msg.senderId.toString()))];

        const chatpartners = await User.find({_id: {$in:chatPartnerIds}}).select("-password");
        res.status(200).json(chatpartners);
    } catch (error) {
        console.error("Error in getChatPartners: ", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
}