const express = require("express");
const router = express.Router();

const authRoutes = require("./users/auth");
const animalRoutes = require("./animals/animal");
const chatRoutes = require("./chats/chat");
const reviewRoutes = require("./reviews/review");
const uploadRoutes = require("./uploads/upload");

router.use("/auth", authRoutes);
router.use("/animals", animalRoutes);
router.use("/chats", chatRoutes);
router.use("/reviews", reviewRoutes);
router.use("/upload", uploadRoutes);

module.exports = router;