const express = require("express");
const { uploadImage } = require("../../controllers/uploads/upload");
const { authMiddleware } = require("../../utils/authMiddleware");

const router = express.Router();

router.post("/image", authMiddleware, uploadImage);

module.exports = router;