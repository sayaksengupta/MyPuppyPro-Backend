const express = require("express");
const Breed = require("../models/breeds");
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
      const validFields = ['name', 'image'];
      const isValidOperation = Object.keys(updates).every((update) =>
        validFields.includes(update)
      );
  
      if (!isValidOperation) {
        return res.status(400).json({ message: 'Invalid fields for update' });
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