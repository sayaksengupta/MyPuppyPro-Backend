const express = require("express");
const Breed = require("../models/breeds");
const Category = require("../models/categories");
const router = express.Router();
const mongoose = require('mongoose');


router.get("/", (req, res) => {
  res.json({ message: "This is the categories api" });
});


// Add a new category
router.post('/add-category', async (req, res) => {
    try {
      const { name, image } = req.body;
  
      // Check for required fields
      if (!name || !image) {
        return res.status(400).json({ error: 'Name and image are mandatory fields' });
      }
  
      // Check if the category name already exists
      const existingCategory = await Category.findOne({ name: name.toLowerCase() });
  
      if (existingCategory) {
        return res.status(400).json({ error: 'Category with the same name already exists' });
      }
  
      // Create a new category object
      const category = new Category({
        name: name.toLowerCase(),
        image,
      });
  
      const savedCategory = await category.save();
      res.status(201).json({ message: 'Category Added Successfully!', success: true, category: savedCategory });
    } catch (error) {
      res.status(500).json({ message: `Internal Server Error --> ${error.message}` });
    }
});
  

// Edit an existing category
router.put('/edit-category/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
  
      // Check if any valid updates are provided
      const allowedUpdates = ['name', 'image'];
      const isValidOperation = Object.keys(updates).every((update) =>
        allowedUpdates.includes(update)
      );
  
      if (!isValidOperation) {
        return res.status(400).json({ error: 'Invalid updates!' });
      }
  
      const category = await Category.findByIdAndUpdate(id, updates, { new: true });
  
      if (!category) {
        return res.status(404).json({ error: 'Category not found' });
      }
  
      res.json(category);
    } catch (error) {
      res.status(500).json({ message: `Internal Server Error --> ${error.message}` });
    }
  });
  

// Get all categories
router.get('/get-all-categories', async (req, res) => {
    try {
      const categories = await Category.find();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: `Internal Server Error --> ${error.message}` });
    }
});

// Delete a category
router.delete('/delete-category/:id', async (req, res) => {
    try {
      const category = await Category.findByIdAndDelete(req.params.id);
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }
      res.json({ message: 'Category deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: `Internal Server Error --> ${error.message}` });
    }
});



// Add breeds to a category
router.post('/:categoryId/add-breeds', async (req, res) => {
    try {
      const { categoryId } = req.params;
      const { breedIds } = req.body;
  
      // Find the category
      const category = await Category.findById(categoryId);
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }
  
      // Replace the breed IDs in the category
      category.breeds = breedIds.map(breedId => ({ _id: new mongoose.Types.ObjectId(breedId) }));
      await category.save();
  
      res.json({ message: 'Breed IDs added to the category successfully', success: true });
    } catch (error) {
      res.status(500).json({ message: `Internal Server Error --> ${error.message}` });
    }
});
  
  

module.exports = router;