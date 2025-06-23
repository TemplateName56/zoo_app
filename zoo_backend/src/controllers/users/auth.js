const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("../../db");

const JWT_SECRET = process.env.JWT_SECRET || "secret";

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 100;
}

function isValidPhone(phone) {
    const cleaned = phone.replace(/\s+/g, "");
    return /^[\d\-\+\(\)]{7,20}$/.test(cleaned) && cleaned.replace(/\D/g, '').length >= 7 && cleaned.length <= 20;
}

function isValidName(name) {
    return typeof name === "string" && name.trim().length > 0 && name.length <= 100;
}

async function register(req, res) {
    let { name, email, password, phone } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: "Missing fields" });

    if (phone) {
        phone = phone.replace(/\s+/g, "");
    }

    if (!isValidName(name)) return res.status(400).json({ error: "Ім'я некоректне" });
    if (!isValidEmail(email)) return res.status(400).json({ error: "Email некоректний" });
    if (phone && !isValidPhone(phone)) return res.status(400).json({ error: "Телефон некоректний" });

    try {
        const [exists] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
        if (exists.length > 0) return res.status(409).json({ error: "Email already exists" });
        const hash = await bcrypt.hash(password, 10);
        const [result] = await pool.query(
            `INSERT INTO users (name, email, password_hash, phone)
            VALUES (?, ?, ?, ?)`,
            [name, email, hash, phone]
        );
        const id = result.insertId;
        const token = jwt.sign({ id: id, email: email, isAdmin: 0, isBlocked: 0 }, JWT_SECRET, { expiresIn: "7d" });
        res.status(201).json({ token });
    } catch (e) {
        res.status(500).json({ error: "Server error" });
    }
}

async function login(req, res) {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Missing fields" });
    try {
        const [users] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
        if (users.length === 0) return res.status(401).json({ error: "Invalid credentials" });
        const user = users[0];
        if (!(await bcrypt.compare(password, user.password_hash))) return res.status(401).json({ error: "Invalid credentials" });
        const token = jwt.sign({ id: user.id, email: user.email, isAdmin: user.isAdmin, isBlocked: user.isBlocked }, JWT_SECRET, { expiresIn: "7d" });
        res.json({ token });
    } catch (e) {
        res.status(500).json({ error: "Server error" });
    }
}

async function getProfile(req, res) {
    const userId = req.user.id;
    const [users] = await pool.query("SELECT id, name, email, avatar_url, phone, created_at, isAdmin, isBlocked FROM users WHERE id = ?", [userId]);
    if (users.length === 0) return res.status(404).json({ error: "User not found" });
    res.json(users[0]);
}

async function blockProfile(req, res) {

}

module.exports = { register, login, getProfile };