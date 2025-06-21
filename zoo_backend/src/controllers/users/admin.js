const pool = require("../../db");

// Пошук користувачів за ім'ям або email (GET /users?search=...)
async function getAllUsers(req, res) {
    const { search } = req.query;
    let sql = "SELECT id, name, email, phone, avatar_url, created_at, isAdmin, isBlocked FROM users";
    let params = [];
    if (search) {
        sql += " WHERE name LIKE ? OR email LIKE ?";
        params = [`%${search}%`, `%${search}%`];
    }
    sql += " ORDER BY created_at DESC";
    const [rows] = await pool.query(sql, params);
    res.json(rows);
}

// Заблокувати користувача (POST /users/block/:userId)
async function blockUser(req, res) {
    const { userId } = req.params;
    // Захист від самоблокування
    if (req.user.id == userId) return res.status(400).json({ error: "Не можна заблокувати себе" });
    const [users] = await pool.query("SELECT id FROM users WHERE id = ?", [userId]);
    if (!users.length) return res.status(404).json({ error: "User not found" });
    await pool.query("UPDATE users SET isBlocked=1 WHERE id=?", [userId]);
    res.json({ success: true });
}

// Розблокувати користувача
async function unblockUser(req, res) {
    const { userId } = req.params;
    const [users] = await pool.query("SELECT id FROM users WHERE id = ?", [userId]);
    if (!users.length) return res.status(404).json({ error: "User not found" });
    await pool.query("UPDATE users SET isBlocked=0 WHERE id=?", [userId]);
    res.json({ success: true });
}

module.exports = { getAllUsers, blockUser, unblockUser };