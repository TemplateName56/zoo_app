const express = require("express");
const { getUser, } = require("../../controllers/users/user");
const { authMiddleware } = require("../../utils/authMiddleware");

const router = express.Router();

router.get("/:id", getUser);

module.exports = router;