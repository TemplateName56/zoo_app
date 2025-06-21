const pool = require("../../db");

// GET /bookmarks
async function getBookmarks(req, res) {
    const userId = req.user.id;
    const [rows] = await pool.query(
        `SELECT bookmarks.id as bookmark_id, animals.*
         FROM bookmarks
                  JOIN animals ON bookmarks.animal_id = animals.id
                  JOIN users u ON animals.owner_id = u.id
         WHERE bookmarks.user_id = ? AND u.isBlocked = 0
         ORDER BY bookmarks.id DESC`,
        [userId]
    );
    res.json({ items: rows });
}

// POST /bookmarks
async function addBookmark(req, res) {
    const userId = req.user.id;
    const { animal_id } = req.body;
    if (!animal_id) return res.status(400).json({ error: "Missing animal_id" });

    // Перевірка на дубль
    const [found] = await pool.query(
        "SELECT id FROM bookmarks WHERE user_id = ? AND animal_id = ?",
        [userId, animal_id]
    );
    if (found.length) return res.status(200).json({ id: found[0].id });

    const [result] = await pool.query(
        "INSERT INTO bookmarks (user_id, animal_id) VALUES (?, ?)",
        [userId, animal_id]
    );
    res.status(201).json({ id: result.insertId });
}

// DELETE /bookmarks/:id
async function removeBookmark(req, res) {
    const userId = req.user.id;
    const { id } = req.params;
    // Дозволяємо видалити лише свою закладку
    await pool.query("DELETE FROM bookmarks WHERE id = ? AND user_id = ?", [id, userId]);
    res.json({ success: true });
}

module.exports = {
    getBookmarks,
    addBookmark,
    removeBookmark
};