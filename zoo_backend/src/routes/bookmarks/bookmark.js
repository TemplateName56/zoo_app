const express = require("express");
const {
    getBookmarks,
    addBookmark,
    removeBookmark
} = require("../../controllers/bookmarks/bookmark");
const { authMiddleware } = require("../../utils/authMiddleware");

const router = express.Router();

router.get("/", authMiddleware, getBookmarks);
router.post("/add", authMiddleware, addBookmark);
router.delete("/:id", authMiddleware, removeBookmark);

module.exports = router;