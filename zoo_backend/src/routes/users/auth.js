const express = require("express");
const { register, login, getProfile, updateProfile } = require("../../controllers/users/auth");
const { authMiddleware } = require("../../utils/authMiddleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", authMiddleware, getProfile);
router.put("/me", authMiddleware, updateProfile);

module.exports = router;