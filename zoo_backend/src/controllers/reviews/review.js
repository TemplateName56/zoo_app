const pool = require("../../db");

// GET /reviews/user/:id
async function getUserReviews(req, res) {
    const { id } = req.params;
    const [rows] = await pool.query(
        "SELECT r.*, u.name AS reviewer_name FROM reviews r JOIN users u ON r.reviewer_id=u.id WHERE r.reviewed_user_id = ? ORDER BY r.created_at DESC",
        [id]
    );
    res.json(rows);
}

// GET /reviews/me
async function getMyReviews(req, res) {
    const userId = req.user.id;
    const [rows] = await pool.query(
        "SELECT r.*, u.name AS reviewed_user_name FROM reviews r JOIN users u ON r.reviewed_user_id=u.id WHERE r.reviewer_id = ? ORDER BY r.created_at DESC",
        [userId]
    );
    res.json(rows);
}

// POST /reviews
async function createReview(req, res) {
    const reviewer_id = req.user.id;
    const { reviewed_user_id, rating, comment } = req.body;
    if (!reviewed_user_id || !rating) return res.status(400).json({ error: "Missing fields" });
    if (reviewer_id === reviewed_user_id) return res.status(400).json({ error: "Cannot review yourself" });
    try {
        await pool.query(
            "INSERT INTO reviews (reviewer_id, reviewed_user_id, rating, comment) VALUES (?, ?, ?, ?)",
            [reviewer_id, reviewed_user_id, rating, comment]
        );
        // Update rating for user
        await pool.query(
            "UPDATE users SET rating = (SELECT AVG(rating) FROM reviews WHERE reviewed_user_id=?) WHERE id=?",
            [reviewed_user_id, reviewed_user_id]
        );
        res.status(201).json({ success: true });
    } catch (e) {
        res.status(500).json({ error: "Server error" });
    }
}

module.exports = {
    getUserReviews,
    getMyReviews,
    createReview
};