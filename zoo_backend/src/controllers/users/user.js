const pool = require("../../db");

// GET /users/:id
async function getUser(req, res) {
    const { id } = req.params;
    const [rows] = await pool.query(
        "SELECT id, name, email, phone, avatar_url, isBlocked FROM users WHERE id=?",
        [id]
    );
    if (!rows.length) return res.status(404).json({ error: "User not found" });
    res.json(rows[0]);
}

module.exports = {
    getUser,
};