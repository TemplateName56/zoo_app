const cloudinary = require("cloudinary").v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
    api_key: process.env.CLOUDINARY_API_KEY || "",
    api_secret: process.env.CLOUDINARY_API_SECRET || "",
});

async function uploadImage(req, res) {
    const { image } = req.body;
    if (!image) return res.status(400).json({ error: "Missing image" });
    try {
        const result = await cloudinary.uploader.upload(image, { folder: "animal_adoption" });
        res.json({
            url: result.secure_url,
            cloudinary_id: result.public_id,
        });
    } catch (e) {
        res.status(500).json({ error: "Upload failed" });
    }
}

module.exports = { uploadImage };