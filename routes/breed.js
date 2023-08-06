const express = require("express");
const { default: mongoose } = require("mongoose");
const Breed = require("../models/breeds");
const Category = require("../models/categories");
const router = express.Router();


router.get("/", (req, res) => {
  res.json({ message: "This is the breeds api" });
});


router.post('/add-breed', async (req, res) => {
    try {
      const { name, image } = req.body;

    // Check for required fields
    if (!name || !image) {
        return res.status(400).json({ error: 'Name and image are mandatory fields' });
      }

    // Create a new breed object
    const breed = new Breed({
      name: name.trim(),
      image
    });
  
      const savedBreed = await breed.save();
      res.status(201).json({ message: 'Breed created successfully', success: true, breed: savedBreed });
    } catch (error) {
      res.status(500).json({ message: `Internal Server Error --> ${error.message}` });
    }
});

router.put('/edit-breed/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check for valid inputs
    const validFields = ['name', 'image', 'breeds'];
    const isValidOperation = Object.keys(updates).every((update) =>
      validFields.includes(update)
    );

    if (!isValidOperation) {
      return res.status(400).json({ message: 'Invalid fields for update' });
    }

    // Convert the string breed IDs to object IDs
    if (updates.breeds && Array.isArray(updates.breeds)) {
      updates.breeds = updates.breeds.map((breedId) =>
        new mongoose.Types.ObjectId(breedId)
      );
    }

    const breed = await Breed.findByIdAndUpdate(id, updates, { new: true });

    if (!breed) {
      return res.status(404).json({ message: 'Breed not found' });
    }

    res.json({ message: 'Breed updated successfully', success: true, breed });
  } catch (error) {
    res.status(500).json({ message: `Internal Server Error --> ${error.message}` });
  }
});


router.get('/get-all-breeds', async (req, res) => {
    try {
      const breeds = await Breed.find();
      res.json({ success: true, breeds });
    } catch (error) {
      res.status(500).json({ message: `Internal Server Error --> ${error.message}` });
    }
});


router.get('/get-breeds/:categoryId', async (req, res) => {
  const { categoryId } = req.params;

  try {
    // Find the category by categoryId
    const category = await Category.findById(categoryId);

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Get all breeds based on the breeds array in the category
    const breeds = await Breed.find({ _id: { $in: category.breeds } });

    res.status(200).json({ breeds });
  } catch (error) {
    res.status(500).json({ message: `An error occurred while retrieving breeds --> ${error}` });
  }
});


router.get('/get-breed/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const breed = await Breed.findById(id);
  
      if (!breed) {
        return res.status(404).json({ message: 'Breed not found' });
      }
  
      res.json({ success: true, breed });
    } catch (error) {
      res.status(500).json({ message: `Internal Server Error --> ${error.message}` });
    }
});

router.post('/delete-category-breed', async (req, res) => {
  try {
    const { id, categoryId } = req.body;

    console.log(req.body)

    const BreedId = new mongoose.Types.ObjectId(id);
    const CategoryID = new mongoose.Types.ObjectId(categoryId);

    // Find the category that contains the breed
    const category = await Category.findByIdAndUpdate(
      CategoryID,
      { $pull: { breeds: {_id : BreedId } } }, // Pull/remove the breed ID from the breeds array
      { new: true }
    );

    if (!category) {
      return res.status(404).json({ message: 'Breed not found in any category' });
    }

    res.json({ message: 'Breed deleted successfully', success: true });
  } catch (error) {
    res.status(500).json({ message: `Internal Server Error --> ${error.message}` });
  }
});
  
  
router.delete('/delete-breed/:id', async (req, res) => {
    try {
      const { id } = req.params;
  
      const breed = await Breed.findByIdAndDelete(id);
  
      if (!breed) {
        return res.status(404).json({ message: 'Breed not found' });
      }
  
      res.json({ message: 'Breed deleted successfully', success: true });
    } catch (error) {
      res.status(500).json({ message: `Internal Server Error --> ${error.message}` });
    }
});

module.exports = router;