const express = require("express");
const { getAllUsers, blockUser, unblockUser } = require("../../controllers/users/admin");
const { authMiddleware } = require("../../utils/authMiddleware");
const { adminMiddleware } = require("../../utils/adminMiddleware");

const router = express.Router();

router.get("/", authMiddleware, adminMiddleware, getAllUsers);              // GET /users?search=
router.post("/block/:userId", authMiddleware, adminMiddleware, blockUser);  // POST /users/block/:userId
router.post("/unblock/:userId", authMiddleware, adminMiddleware, unblockUser); // POST /users/unblock/:userId

module.exports = router;