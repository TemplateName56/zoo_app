const express = require("express");
const {
    createChat,
    getChats,
    getChatMessages,
    sendMessage
} = require("../../controllers/chats/chat");
const { authMiddleware } = require("../../utils/authMiddleware");

const router = express.Router();

router.get("/", authMiddleware, getChats);
router.post("/", authMiddleware, createChat);
router.get("/:id/messages", authMiddleware, getChatMessages);
router.post("/:id/messages", authMiddleware, sendMessage);

module.exports = router;