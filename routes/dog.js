const express = require("express");
const { default: mongoose } = require("mongoose");
const Dog = require("../models/dogs");
const Category = require("../models/categories");
const User = require("../models/users");
const Breed = require("../models/breeds");
const router = express.Router();
const userAuth = require("../middleware/userAuth");

router.get("/", (req, res) => {
  res.json({ message: "This is the dogs api" });
});
router.post("/add-dog", userAuth, async (req, res) => {
  try {
    const user_id = req.rootUser._id;

    const {
      breed_id,
      generic_name,
      age,
      gender,
      disability,
      address,
      comments,
      price,
      name,
      image,
    } = req.body;

    if (
      !breed_id ||
      !user_id ||
      !generic_name ||
      !age ||
      !gender ||
      !disability ||
      !address ||
      !comments ||
      !price ||
      !name ||
      !image
    ) {
      return res
        .status(400)
        .json({ message: "Please fill all the fields !", success: false });
    }

    // Check if the user_id exists, you can add your own logic here
    // For example, if you have a User model, you can check if the user exists in the database.

    // Check if the user exists
    const user = await User.findById(user_id);
    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found", success: false });
    }

    // Check if the breed exists
    const breed = await Breed.findById(breed_id);
    if (!breed) {
      return res
        .status(404)
        .json({ message: "Breed not found", success: false });
    }

    const newDog = new Dog({
      breed: breed_id,
      user: user_id,
      generic_name,
      age,
      gender,
      disability,
      address,
      comments,
      price,
      name,
      image,
    });

    await newDog.save();
    return res.status(201).json({ newDog: newDog, success: true });
  } catch (error) {
    console.error("Error adding a dog:", error);
    return res.status(500).json({
      message: "An error occurred while adding the dog",
      success: false,
    });
  }
});

router.put("/edit-dog/:id", userAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.rootUser._id;
    const {
      breed_id,
      generic_name,
      age,
      gender,
      disability,
      address,
      comments,
      price,
      name,
      image,
    } = req.body;

    if (
      !breed_id ||
      !user_id ||
      !generic_name ||
      !age ||
      !gender ||
      !disability ||
      !address ||
      !comments ||
      !price ||
      !name ||
      !image
    ) {
      return res
        .status(400)
        .json({ message: "Please fill all the fields !", success: false });
    }

    // Check if the user exists
    const user = await User.findById(user_id);
    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found", success: false });
    }

    // Check if the breed exists
    const breed = await Breed.findById(breed_id);
    if (!breed) {
      return res
        .status(404)
        .json({ message: "Breed not found", success: false });
    }

    const updatedDog = {
      breed: breed_id,
      user: user_id,
      generic_name,
      age,
      gender,
      disability,
      address,
      comments,
      price,
      name,
      image,
    };

    await Dog.findByIdAndUpdate(id, updatedDog);
    return res
      .status(200)
      .json({ message: "Dog updated successfully", success: true });
  } catch (error) {
    console.error("Error editing a dog:", error);
    return res.status(500).json({
      message: "An error occurred while editing the dog",
      success: false,
    });
  }
});

// Endpoint to delete a dog
router.delete("/delete-dog/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const dog = await Dog.findByIdAndDelete(id);
    if (!dog) {
      return res.status(404).json({ message: "Dog not found", success: false });
    }

    return res
      .status(200)
      .json({ message: "Dog deleted successfully", success: true });
  } catch (error) {
    console.error("Error deleting a dog:", error);
    return res.status(500).json({
      message: "An error occurred while deleting the dog",
      success: false,
    });
  }
});

module.exports = router;
