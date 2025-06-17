const cloudinary = require("cloudinary").v2;
const pool = require("../../db");

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// GET /animals
async function getAnimals(req, res) {
    const { type, breed, status, owner_id } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    let sql = "SELECT * FROM animals WHERE 1=1";
    let countSql = "SELECT COUNT(*) as total FROM animals WHERE 1=1";
    const params = [];
    const countParams = [];

    if (type)      { sql += " AND type=?";      countSql += " AND type=?";      params.push(type);      countParams.push(type); }
    if (breed)     { sql += " AND breed=?";     countSql += " AND breed=?";     params.push(breed);     countParams.push(breed); }
    if (status)    { sql += " AND status=?";    countSql += " AND status=?";    params.push(status);    countParams.push(status); }
    if (owner_id)  { sql += " AND owner_id=?";  countSql += " AND owner_id=?";  params.push(owner_id);  countParams.push(owner_id); }

    sql += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const [countRes] = await pool.query(countSql, countParams);
    const total = countRes[0]?.total || 0;

    const [rows] = await pool.query(sql, params);

    res.json({ items: rows, total });
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
    let { name, type, breed, sex, age, description, photo_url, status, photos, lat, lng } = req.body;
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
            `INSERT INTO animals (name, type, breed, sex, age, description, photo_url, owner_id, status, lat, lng)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [name, type, breed, sex, age, description, mainPhotoUrl, userId, status || "available", lat || 0, lng || 0]
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

// PUT /animals/:id (оновлено для lat/lng)
async function updateAnimal(req, res) {
    const { id } = req.params;
    const userId = req.user.id;
    const { name, type, breed, sex, age, description, photo_url, status, lat, lng } = req.body;
    const [animals] = await pool.query("SELECT owner_id FROM animals WHERE id = ?", [id]);
    if (!animals.length || animals[0].owner_id !== userId) return res.status(403).json({ error: "Forbidden" });
    await pool.query(
        `UPDATE animals SET name=?, type=?, breed=?, sex=?, age=?, description=?, photo_url=?, status=?, lat=?, lng=? WHERE id=?`,
        [name, type, breed, sex, age, description, photo_url, status, lat || null, lng || null, id]
    );
    res.json({ success: true });
}

// DELETE /animals/:id
async function deleteAnimal(req, res) {
    const { id } = req.params;
    const userId = req.user.id;
    const [animals] = await pool.query("SELECT owner_id FROM animals WHERE id = ?", [id]);
    if (!animals.length || animals[0].owner_id !== userId) return res.status(403).json({ error: "Forbidden" });
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

    let sql = "SELECT * FROM animals WHERE 1=1";
    let countSql = "SELECT COUNT(*) as total FROM animals WHERE 1=1";
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
};