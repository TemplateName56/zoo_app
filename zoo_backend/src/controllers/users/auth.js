const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../../db");

const JWT_SECRET = process.env.JWT_SECRET || "secret";

async function register(req, res) {
    const { name, email, password, is_shelter, phone, address, lat, lng} = req.body;
    console.log("1")
    if (!name || !email || !password) return res.status(400).json({ error: "Missing fields" });
    console.log("1")
    try {
        const [exists] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
        console.log("1")
        if (exists.length > 0) return res.status(409).json({ error: "Email already exists" });
        console.log("1")
        const hash = await bcrypt.hash(password, 10);
        console.log("2")
        const [result] = await pool.query(
            `INSERT INTO users (name, email, password_hash, is_shelter, phone, address, lat, lng)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, email, hash, !!is_shelter, phone, address, lat, lng]
        );
        console.log("3")
        const id = result.insertId;
        const token = jwt.sign({ id, email }, JWT_SECRET, { expiresIn: "7d" });
        console.log("dsada")
        res.status(201).json({ token });
    } catch (e) {
        res.status(500).json({ error: "Server error" });
    }
}

async function login(req, res) {
    const { email, password } = req.body;
    console.log(email, password)
    if (!email || !password) return res.status(400).json({ error: "Missing fields" });
    try {
        const [users] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
        if (users.length === 0) return res.status(401).json({ error: "Invalid credentials" });
        const user = users[0];
        if (!(await bcrypt.compare(password, user.password_hash))) return res.status(401).json({ error: "Invalid credentials" });
        const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
        res.json({ token });
    } catch (e) {
        res.status(500).json({ error: "Server error" });
    }
}

async function getProfile(req, res) {
    const userId = req.user.id;
    const [users] = await pool.query("SELECT id, name, email, avatar_url, is_shelter, phone, address, lat, lng, rating, created_at FROM users WHERE id = ?", [userId]);
    if (users.length === 0) return res.status(404).json({ error: "User not found" });
    res.json(users[0]);
}

async function updateProfile(req, res) {
    const userId = req.user.id;
    const { name, phone, address, lat, lng, avatar_url, cloudinary_id } = req.body;
    try {
        await pool.query(
            `UPDATE users SET name=?, phone=?, address=?, lat=?, lng=?, avatar_url=?, cloudinary_id=? WHERE id=?`,
            [name, phone, address, lat, lng, avatar_url, cloudinary_id, userId]
        );
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: "Server error" });
    }
}

module.exports = { register, login, getProfile, updateProfile };