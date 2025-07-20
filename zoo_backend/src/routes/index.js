const express = require("express");
const router = express.Router();

const authRoutes = require("./users/auth");
const animalRoutes = require("./animals/animal");
const chatRoutes = require("./chats/chat");
const uploadRoutes = require("./uploads/upload");
const bookmarkRoutes = require("./bookmarks/bookmark");
const adminRoutes = require("./users/admin");
const userRoutes = require("./users/user");

router.use("/auth", authRoutes);
router.use("/animals", animalRoutes);
router.use("/bookmarks", bookmarkRoutes);
router.use("/chats", chatRoutes);
router.use("/admin", adminRoutes);
router.use("/users", userRoutes);

module.exports = router;