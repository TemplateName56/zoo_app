const pool = require("../../db");

// GET /chats
async function getChats(req, res) {
    const userId = req.user.id;

    const [rows] = await pool.query(
        `
            SELECT c.id, c.animal_id, c.user1_id, c.user2_id,
                   u.id as companion_id, u.name as companion_name, u.avatar_url as companion_avatar_url,
                   a.name as animal_name
            FROM chats c
                     LEFT JOIN animals a ON c.animal_id = a.id
                     LEFT JOIN users u ON u.id = (CASE WHEN c.user1_id = ? THEN c.user2_id ELSE c.user1_id END)
                     LEFT JOIN users animal_owner ON a.owner_id = animal_owner.id
            WHERE (c.user1_id = ? OR c.user2_id = ?)
              AND (a.id IS NULL OR animal_owner.isBlocked = 0)
            ORDER BY c.id DESC
        `,
        [userId, userId, userId]
    );

    const chats = rows.map(row => ({
        id: row.id,
        animal: row.animal_id ? { name: row.animal_name } : undefined,
        companion: row.companion_id ? {
            id: row.companion_id,
            name: row.companion_name,
            avatar_url: row.companion_avatar_url
        } : undefined
    }));
    res.json(chats);
}

// POST /chats
async function createChat(req, res) {
    console.log(1)
    console.log(req.body);
    const userId = req.user.id;
    let { other_user_id, animal_id } = req.body;
    console.log(other_user_id, animal_id);

    // Якщо не передано other_user_id, але є animal_id — визначаємо власника тварини
    if (!other_user_id && animal_id) {
        const [animalRows] = await pool.query("SELECT owner_id FROM animals WHERE id=?", [animal_id]);
        if (!animalRows.length) return res.status(404).json({ error: "Animal not found" });
        other_user_id = animalRows[0].owner_id;
        if (!other_user_id) return res.status(400).json({ error: "Animal has no owner" });
        // Не дозволяємо створювати чат із самим собою
        if (other_user_id === userId) {
            return res.status(400).json({ error: "You can't chat with yourself about your own animal" });
        }
    }
    if (!other_user_id) return res.status(400).json({ error: "Missing other_user_id" });

    // Знаходимо існуючий чат або створюємо новий
    const [found] = await pool.query(
        `SELECT id FROM chats WHERE ((user1_id=? AND user2_id=?) OR (user1_id=? AND user2_id=?)) AND (animal_id=? OR animal_id IS NULL)`,
        [userId, other_user_id, other_user_id, userId, animal_id]
    );
    if (found.length) return res.json({ id: found[0].id });

    const [result] = await pool.query(
        `INSERT INTO chats (user1_id, user2_id, animal_id) VALUES (?, ?, ?)`,
        [userId, other_user_id, animal_id]
    );
    res.status(201).json({ id: result.insertId });
}

// GET /chats/:id/messages
async function getChatMessages(req, res) {
    const { id } = req.params;
    const userId = req.user.id;
    const [chats] = await pool.query("SELECT * FROM chats WHERE id = ?", [id]);
    if (!chats.length || (chats[0].user1_id !== userId && chats[0].user2_id !== userId))
        return res.status(403).json({ error: "Forbidden" });
    const [rows] = await pool.query(
        `SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at ASC`,
        [id]
    );
    res.json(rows);
}

// POST /chats/:id/messages
async function sendMessage(req, res) {
    const { id } = req.params;
    const userId = req.user.id;
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: "Missing content" });
    const [chats] = await pool.query("SELECT * FROM chats WHERE id = ?", [id]);
    if (!chats.length || (chats[0].user1_id !== userId && chats[0].user2_id !== userId))
        return res.status(403).json({ error: "Forbidden" });
    await pool.query(
        `INSERT INTO messages (chat_id, sender_id, content) VALUES (?, ?, ?)`,
        [id, userId, content]
    );
    res.status(201).json({ success: true });
}

module.exports = {
    getChats,
    createChat,
    getChatMessages,
    sendMessage
};