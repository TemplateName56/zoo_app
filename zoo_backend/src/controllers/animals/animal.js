const cloudinary = require("cloudinary").v2;
const pool = require("../../db");

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// GET /animals
async function getAnimals(req, res) {
    const { type, breed, owner_id } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    let sql = `SELECT a.* FROM animals a
           JOIN users u ON a.owner_id = u.id
           WHERE u.isBlocked = 0`;
    let countSql = `SELECT COUNT(*) as total FROM animals a
                JOIN users u ON a.owner_id = u.id
                WHERE u.isBlocked = 0`;
    const params = [];
    const countParams = [];

    if (type)      { sql += " AND type=?";      countSql += " AND type=?";      params.push(type);      countParams.push(type); }
    if (breed)     { sql += " AND breed=?";     countSql += " AND breed=?";     params.push(breed);     countParams.push(breed); }
    if (owner_id)  { sql += " AND owner_id=?";  countSql += " AND owner_id=?";  params.push(owner_id);  countParams.push(owner_id); }

    sql += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const [countRes] = await pool.query(countSql, countParams);
    const total = countRes[0]?.total || 0;

    const [rows] = await pool.query(sql, params);

    res.json({ items: rows, total });
}

async function getAnimalsByOwnerId(req, res) {
    const { owner_id } = req.query;
    const [rows] = await pool.query("SELECT * FROM animals WHERE owner_id = ? ORDER BY created_at DESC", [owner_id]);
    res.json(rows);
}

// GET /animals/mine
async function getMyAnimals(req, res) {
    const userId = req.user.id;
    const [rows] = await pool.query("SELECT * FROM animals WHERE owner_id = ? ORDER BY created_at DESC", [userId]);
    res.json(rows);
}

// GET /animals/:id
async function getAnimalById(req, res) {
    const { id } = req.params;
    const [rows] = await pool.query("SELECT * FROM animals WHERE id = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ error: "Animal not found" });
    res.json(rows[0]);
}

// POST /animals
async function createAnimal(req, res) {
    const userId = req.user.id;
    let { name, type, breed, sex, age, description, photo_url, photos, lat, lng } = req.body;
    if (!name || !type || !photo_url) return res.status(400).json({ error: "Missing fields" });

    try {
        // Завантаження головного фото тварини на Cloudinary
        let mainPhotoUrl = photo_url;

        const isBase64 = typeof photo_url === "string" && photo_url.startsWith("data:image");
        if (isBase64) {
            const uploadMain = await cloudinary.uploader.upload(photo_url, {
                folder: "animal_adoption/animals"
            });
            mainPhotoUrl = uploadMain.secure_url;
        }

        // Додаємо тваринку (додаємо lat, lng)
        const [result] = await pool.query(
            `INSERT INTO animals (name, type, breed, sex, age, description, photo_url, owner_id, lat, lng)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, type, breed, sex, age, description, mainPhotoUrl, userId, lat || 0, lng || 0]
        );
        const animalId = result.insertId;

        // Якщо є додаткові фото
        if (Array.isArray(photos) && photos.length) {
            for (const p of photos) {
                let photoUrl = p.photo_url;
                if (typeof photoUrl === "string" && photoUrl.startsWith("data:image")) {
                    const upload = await cloudinary.uploader.upload(photoUrl, {
                        folder: "animal_adoption/animal_photos"
                    });
                    photoUrl = upload.secure_url;
                }
                await pool.query(
                    "INSERT INTO animal_photos (animal_id, photo_url) VALUES (?, ?)",
                    [animalId, photoUrl]
                );
            }
        }

        res.status(201).json({
            success: true,
            animal_id: animalId,
            photo_url: mainPhotoUrl
        });
    } catch (e) {
        console.error("Error in createAnimal:", e.message);
        res.status(500).json({ error: "Server error" });
    }
}

// PUT /animals/:id
async function updateAnimal(req, res) {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.isAdmin || req.user.role === "admin";
    let { name, type, breed, sex, age, description, photo_url, lat, lng, photos } = req.body;

    // Перевірка наявності тваринки та прав власника/адміна
    const [animals] = await pool.query("SELECT * FROM animals WHERE id = ?", [id]);
    if (!animals.length) return res.status(404).json({ error: "Animal not found" });
    if (animals[0].owner_id !== userId && !isAdmin) return res.status(403).json({ error: "Forbidden" });

    // --- ОБРОБКА ГОЛОВНОГО ФОТО ---
    let mainPhotoUrl = photo_url;
    if (typeof photo_url === "string" && photo_url.startsWith("data:image")) {
        // Завантажити на Cloudinary!
        const uploadMain = await cloudinary.uploader.upload(photo_url, {
            folder: "animal_adoption/animals"
        });
        mainPhotoUrl = uploadMain.secure_url;
    }

    // --- Оновлення (тільки задані поля) ---
    const updates = [];
    const values = [];
    if (name) { updates.push("name=?"); values.push(name); }
    if (type) { updates.push("type=?"); values.push(type); }
    if (breed) { updates.push("breed=?"); values.push(breed); }
    if (sex) { updates.push("sex=?"); values.push(sex); }
    if (age) { updates.push("age=?"); values.push(age); }
    if (description) { updates.push("description=?"); values.push(description); }
    if (mainPhotoUrl) { updates.push("photo_url=?"); values.push(mainPhotoUrl); }
    if (lat !== undefined) { updates.push("lat=?"); values.push(lat); }
    if (lng !== undefined) { updates.push("lng=?"); values.push(lng); }

    if (updates.length) {
        values.push(id);
        await pool.query(`UPDATE animals SET ${updates.join(', ')} WHERE id = ?`, values);
    }

    // --- ОНОВЛЕННЯ ДОДАТКОВИХ ФОТО ---
    if (Array.isArray(photos)) {
        // 1. Витягуємо наявні фото
        const [currentPhotos] = await pool.query(
            "SELECT id, photo_url FROM animal_photos WHERE animal_id=?",
            [id]
        );
        const incomingPhotoUrls = photos.map(p => p.photo_url);

        // 2. Видаляємо фото, яких вже нема у масиві
        const toDelete = currentPhotos.filter(
            p => !incomingPhotoUrls.includes(p.photo_url)
        );
        for (const del of toDelete) {
            await pool.query("DELETE FROM animal_photos WHERE id=?", [del.id]);
        }

        // 3. Додаємо нові фото (яких ще нема)
        const existingUrls = currentPhotos.map(p => p.photo_url);
        for (const p of photos) {
            if (!existingUrls.includes(p.photo_url)) {
                let url = p.photo_url;
                if (typeof url === "string" && url.startsWith("data:image")) {
                    try {
                        const upload = await cloudinary.uploader.upload(url, { folder: "animal_adoption/animal_photos" });
                        url = upload.secure_url;
                    } catch (e) {
                        console.error("Cloudinary upload error:", e?.message || e);
                        continue; // пропустити цю фотку
                    }
                }
                await pool.query(
                    "INSERT INTO animal_photos (animal_id, photo_url) VALUES (?, ?)",
                    [id, url]
                );
            }
        }
    }

    res.json({ success: true, photo_url: mainPhotoUrl });
}

// DELETE /animals/:id
async function deleteAnimal(req, res) {
    const { id } = req.params;
    const userId = req.user.id;
    const isAdmin = req.user.isAdmin || req.user.role === "admin";
    const [animals] = await pool.query("SELECT owner_id FROM animals WHERE id = ?", [id]);
    if (!animals.length || (animals[0].owner_id !== userId && !isAdmin)) return res.status(403).json({ error: "Forbidden" });
    await pool.query("DELETE FROM animals WHERE id = ?", [id]);
    res.json({ success: true });
}

// GET /animals/:id/photos
async function getAnimalPhotos(req, res) {
    const { id } = req.params;
    const [rows] = await pool.query("SELECT photo_url FROM animal_photos WHERE animal_id = ?", [id]);
    res.json(rows);
}

// GET /animals/search?breed=&age=&lat=&lng=&page=&limit=
async function searchAnimals(req, res) {
    const { breed, age, lat, lng } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    let sql = `SELECT a.* FROM animals a
           JOIN users u ON a.owner_id = u.id
           WHERE u.isBlocked = 0`;
    let countSql = `SELECT COUNT(*) as total FROM animals a
                JOIN users u ON a.owner_id = u.id
                WHERE u.isBlocked = 0`;
    const params = [];
    const countParams = [];

    if (breed) {
        sql += " AND breed = ?";
        countSql += " AND breed = ?";
        params.push(breed);
        countParams.push(breed);
    }
    if (age) {
        sql += " AND age <= ?";
        countSql += " AND age <= ?";
        params.push(age);
        countParams.push(age);
    }
    if (lat && lng) {
        sql += " AND lat BETWEEN ? AND ? AND lng BETWEEN ? AND ?";
        countSql += " AND lat BETWEEN ? AND ? AND lng BETWEEN ? AND ?";
        params.push(Number(lat) - 10, Number(lat) + 10, Number(lng) - 10, Number(lng) + 10);
        countParams.push(Number(lat) - 10, Number(lat) + 10, Number(lng) - 10, Number(lng) + 10);
    }

    sql += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    try {
        const [countRes] = await pool.query(countSql, countParams);
        const total = countRes[0]?.total || 0;
        const [rows] = await pool.query(sql, params);
        res.json({ items: rows, total });
    } catch (e) {
        console.error("Error in searchAnimals:", e.message);
        res.status(500).json({ error: "Server error" });
    }
}

// GET /animals/breeds -- список унікальних порід
async function getBreeds(req, res) {
    const [rows] = await pool.query("SELECT DISTINCT breed FROM animals WHERE breed IS NOT NULL AND breed <> '' ORDER BY breed ASC");
    res.json(rows.map(r => r.breed));
}


module.exports = {
    getAnimals,
    getMyAnimals,
    getAnimalById,
    createAnimal,
    updateAnimal,
    deleteAnimal,
    getAnimalPhotos,
    searchAnimals,
    getBreeds,
    getAnimalsByOwnerId
};