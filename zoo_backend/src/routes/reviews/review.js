const express = require("express");
const {
    createReview,
    getUserReviews,
    getMyReviews
} = require("../../controllers/reviews/review");
const { authMiddleware } = require("../../utils/authMiddleware");

const router = express.Router();

router.get("/user/:id", getUserReviews);
router.get("/me", authMiddleware, getMyReviews);
router.post("/", authMiddleware, createReview);

module.exports = router;