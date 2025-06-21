const express = require("express");
const {
    createAnimal,
    getAnimals,
    getAnimalById,
    updateAnimal,
    deleteAnimal,
    getMyAnimals,
    getAnimalPhotos,
    searchAnimals,
    getBreeds,
    getAnimalsByOwnerId
} = require("../../controllers/animals/animal");
const { authMiddleware } = require("../../utils/authMiddleware");

const router = express.Router();

router.get("/owner", getAnimalsByOwnerId);
router.get("/", getAnimals);
router.get("/search", searchAnimals);
router.get("/breeds", getBreeds);
router.get("/mine", authMiddleware, getMyAnimals);
router.get("/:id", getAnimalById);
router.post("/add", authMiddleware, createAnimal);
router.put("/:id", authMiddleware, updateAnimal);
router.delete("/:id", authMiddleware, deleteAnimal);


router.get("/:id/photos", getAnimalPhotos);

module.exports = router;