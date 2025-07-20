const express = require("express");
const { getAllUsers, blockUser, unblockUser } = require("../../controllers/users/admin");
const { authMiddleware } = require("../../utils/authMiddleware");
const { adminMiddleware } = require("../../utils/adminMiddleware");

const router = express.Router();

router.get("/", authMiddleware, adminMiddleware, getAllUsers);
router.post("/block/:userId", authMiddleware, adminMiddleware, blockUser);
router.post("/unblock/:userId", authMiddleware, adminMiddleware, unblockUser);

module.exports = router;