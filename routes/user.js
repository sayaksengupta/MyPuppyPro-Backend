const express = require("express");
const router = express.Router();
const User = require("../models/users");
const bcrypt = require("bcrypt");
const userAuth = require("../middleware/userAuth");
const adminAuth = require("../middleware/adminAuth");
var Stopwatch = require("timer-stopwatch");
const Breed = require("../models/breeds");
const Dog = require("../models/dogs");
const Order = require("../models/orders");
const { default: mongoose } = require("mongoose");

router.get("/", (req, res) => {
  res.json({ message: "This is the User api" });
});

router.post("/register", async (req, res) => {
  const {
    name,
    email,
    phone,
    password,
    address,
    country,
    city,
    type,
    state,
    pincode,
  } = req.body;

  try {
    // Check if all the other fields are provided
    if (
      !name ||
      !password ||
      !address ||
      !country ||
      !city ||
      !email ||
      !phone ||
      !type
    ) {
      return res
        .status(400)
        .json({ error: "Please provide all the required fields" });
    }

    const UserFound = await User.findOne({
      $or: [
        { email: email },
        { phone: phone }, // Replace 'phoneNumber' with the actual phone number you want to search for
      ],
    });

    if (UserFound) {
      return res.status(422).json({
        message: "User already exists",
        status: false,
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);

    // Create a new user
    const user = new User({
      name,
      email,
      phone,
      password,
      address,
      country,
      city,
      state,
      pincode,
      type,
    });

    // Save the user to the database
    const registered = await user.save();

    const OtpStored = await User.findByIdAndUpdate(registered._id, {
      otp: otp,
    });

    var timer = new Stopwatch(300000);

    if (registered && OtpStored) {
      timer.start();
      timer.onDone(async function () {
        await User.findOneAndUpdate({ otp }, { otp: "" });
      });
    }

    const token = await registered.generateAuthToken();

    res.status(201).json({
      message: "User registered successfully!",
      success: true,
      user: {
        _id: registered._id,
        name: registered.name,
        email: registered.email,
        phone: registered.phone,
        address: registered.address,
        country: registered.country,
        city: registered.city,
        state: registered.state,
        pincode: registered.pincode,
        type: registered.type,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: `An error occurred while registering the user --> ${error}`,
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const logEmail = req.body.email;
    const logPass = req.body.password;

    if (!logEmail || !logPass) {
      return res
        .status(422)
        .json({ message: "Please fill all the fields.", success: false });
    }

    const userByEmail = await User.findOne({ email: logEmail });

    if (userByEmail) {
      const passCheck = await bcrypt.compare(logPass, userByEmail.password);
      const token = await userByEmail.generateAuthToken();

      if (passCheck) {
        const otp = Math.floor(100000 + Math.random() * 900000);

        const OtpStored = await User.findByIdAndUpdate(userByEmail._id, {
          otp: otp,
        });

        var timer = new Stopwatch(300000);

        if (OtpStored) {
          timer.start();
          timer.onDone(async function () {
            await User.findOneAndUpdate({ otp }, { otp: "" });
          });
        }

        await User.findOneAndUpdate({ email: logEmail }, { otp: otp });

        res.status(200).json({
          success: true,
          user: {
            _id: userByEmail._id,
            name: userByEmail.name,
            email: userByEmail.email,
            phone: userByEmail.phone,
            address: userByEmail.address,
            country: userByEmail.country,
            city: userByEmail.city,
            state: userByEmail.state,
            pincode: userByEmail.pincode,
            type: userByEmail.type,
          },
        });
      } else {
        res
          .status(400)
          .json({ message: "Invalid login credentials", success: false });
      }
    } else {
      res
        .status(400)
        .json({ message: "Invalid login credentials", success: false });
    }
  } catch (message) {
    res
      .status(500)
      .json({ message: `Server Error --> ${message}`, success: false });
  }
});

router.patch("/update-user", userAuth, async (req, res) => {
  const userId = req.rootUser._id;
  const updates = req.body;

  // Check if the provided fields are valid for update
  const allowedUpdates = [
    "name",
    "email",
    "address",
    "phone",
    "country",
    "city",
  ];
  const isValidOperation = Object.keys(updates).every((update) =>
    allowedUpdates.includes(update)
  );

  if (!isValidOperation) {
    return res.status(400).json({ error: "Invalid update operation." });
  }

  try {
    const user = await User.findOne({ _id: userId });

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
        success: false,
      });
    }

    // Update user fields based on the provided updates
    Object.keys(updates).forEach((update) => {
      user[update] = updates[update];
    });

    await user.save();

    res.status(200).json({
      message: "User updated successfully!",
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        country: user.country,
        city: user.city,
        state: user.state,
        pincode: user.pincode,
        type: user.type,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: `An error occurred while updating the user --> ${error}`,
    });
  }
});

// Delete user
router.delete("/delete-user", adminAuth, async (req, res) => {
  try {
    const userId = req.rootUser._id;

    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

router.post("/otp-verification", async (req, res) => {
  try {
    const { otp, user_number } = req.body;

    if (!otp) {
      return res.status(422).json({
        message: "Please provide the otp",
        success: false,
      });
    }

    const UserFound = await User.findOne({ phone: user_number.toString() });

    if (UserFound && UserFound.otp === otp) {
      const token = await UserFound.generateAuthToken();

      return res.status(200).json({
        message: "Otp Verified Successfully !",
        success: true,
        user: {
          _id: UserFound._id,
          name: UserFound.name,
          email: UserFound.email,
          phone: UserFound.phone,
          address: UserFound.address,
          country: UserFound.country,
          city: UserFound.city,
          state: UserFound.state,
          pincode: UserFound.pincode,
          type: UserFound.type,
        },
        token: token,
      });
    } else if (UserFound.otp == null) {
      return res.status(404).json({
        message: "Otp Expired !",
        success: false,
      });
    } else {
      return res.status(400).json({
        message: "Incorrect Otp !",
        success: false,
      });
    }
  } catch (e) {
    return res
      .status(500)
      .json({ message: `Server Error --> ${e}`, success: false });
  }
});

router.get("/get-user", userAuth, async (req, res) => {
  const userId = req.rootUser._id;

  try {
    const user = await User.findById(userId).select("-password -otp");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/get-user-dogs", userAuth, async (req, res) => {
  try {
    const user_id = req.rootUser._id;

    // Find dogs associated with the user and populate the 'breed' field
    const userDogs = await Dog.find({ user: user_id }).select({
      active: 0,
      user: 0,
    }); // Populate the 'breed' field with 'name' attribute from Breed model

    return res
      .status(200)
      .json({ message: "User Dogs fetched", success: true, userDogs });
  } catch (error) {
    console.error("Error fetching user dogs:", error);
    return res.status(500).json({
      message: `An error occurred while fetching user dogs --> ${error}`,
      success: false,
    });
  }
});

router.post("/toggle-like-dog", userAuth, async (req, res) => {
  try {
    const user_id = req.rootUser._id;
    const { dogId } = req.body;

    // Find the user and the dog by their IDs
    const user = await User.findById(user_id);
    const dog = await Dog.findById(dogId);

    if (!user || !dog) {
      return res.status(404).json({
        message: "User or Dog not found.",
        success: false,
      });
    }

    // Check if the dog is already liked by the user
    const isLiked = user.liked_dogs.includes(dogId);

    if (isLiked) {
      // Remove the dog from liked_dogs array
      user.liked_dogs.pull(dogId);
    } else {
      // Add the dog to liked_dogs array
      user.liked_dogs.push(dogId);
    }

    await user.save();

    return res.status(200).json({
      message: "Dog liked status toggled.",
      success: true,
      isLiked: !isLiked, // Return the updated liked status
    });
  } catch (error) {
    console.error("Error toggling liked dog:", error);
    return res.status(500).json({
      message: `An error occurred while toggling liked dog --> ${error}`,
      success: false,
    });
  }
});

router.get("/get-liked-dogs", userAuth, async (req, res) => {
  try {
    const user_id = req.rootUser._id;

    // Find liked dogs associated with the user and populate the 'breed' field
    const likedDogs = await User.findById(user_id)
      .populate({
        path: "liked_dogs",
        populate: {
          path: "breed",
          model: "Breed", // Replace with the name of your Breed model
          select: "name", // Assuming you want to only populate the 'name' field
        },
        select: {
          active: 0,
          user: 0,
        },
      })
      .select("liked_dogs"); // Select only the 'liked_dogs' field

    return res.status(200).json({
      message: "Liked Dogs fetched",
      success: true,
      likedDogs: likedDogs.liked_dogs,
    });
  } catch (error) {
    console.error("Error fetching liked dogs:", error);
    return res.status(500).json({
      message: `An error occurred while fetching liked dogs --> ${error}`,
      success: false,
    });
  }
});

router.post("/add-dog", userAuth, async (req, res) => {
  try {
    const user_id = req.rootUser._id;
    console.log(req.body);
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
      !generic_name ||
      !age ||
      !gender ||
      disability == undefined ||
      disability == null ||
      !address ||
      !price ||
      !name ||
      !image
    ) {
      return res
        .status(422)
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
    const breed = await Breed.findOne({ _id: breed_id, active: true });
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
      gender: gender.toLowerCase(),
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

router.post("/add-pedigree/:dogId", userAuth, async (req, res) => {
  try {
    const user_id = req.rootUser._id;
    const { dogId } = req.params;
    const { pedigreeDetails } = req.body;

    const allowedPedigreeFields = [
      "father",
      "mother",
      "grandfather",
      "grandmother",
    ];

    // Find the user and the dog by their IDs
    const user = await User.findById(user_id);
    const dog = await Dog.findById(dogId);

    if (!user || !dog) {
      return res.status(404).json({
        message: "User or Dog not found.",
        success: false,
      });
    }

    // Check if the user is a "breeder"
    if (user.type !== "breeder") {
      return res.status(403).json({
        message: "Only breeders can add pedigree details.",
        success: false,
      });
    }

    // Check if the dog belongs to the user
    if (dog.user.toString() !== user_id.toString()) {
      return res.status(403).json({
        message: "You are not the owner of this dog.",
        success: false,
      });
    }

    // Validate and update the pedigree details of the dog
    const updatedPedigree = {};
    for (const field of allowedPedigreeFields) {
      if (pedigreeDetails[field]) {
        updatedPedigree[field] = pedigreeDetails[field];
      }
    }

    dog.pedigree = updatedPedigree;
    await dog.save();

    return res.status(200).json({
      message: "Pedigree details added to the dog.",
      success: true,
    });
  } catch (error) {
    console.error("Error adding pedigree details:", error);
    return res.status(500).json({
      message: `An error occurred while adding pedigree details --> ${error}`,
      success: false,
    });
  }
});

router.get("/get-pedigree/:dogId", async (req, res) => {
  try {
    const { dogId } = req.params;

    // Find the dog by its ID
    const dog = await Dog.findById(dogId);

    if (!dog) {
      return res.status(404).json({
        message: "Dog not found.",
        success: false,
      });
    }

    // Retrieve the pedigree details from the dog's document
    const pedigreeDetails = dog.pedigree;

    return res.status(200).json({
      message: "Pedigree details fetched.",
      success: true,
      pedigreeDetails,
    });
  } catch (error) {
    console.error("Error fetching pedigree details:", error);
    return res.status(500).json({
      message: `An error occurred while fetching pedigree details --> ${error}`,
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

    // Check if the user exists
    const user = await User.findById(user_id);
    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found", success: false });
    }

    // Check if the dog exists
    const dog = await Dog.findById(id);
    if (!dog) {
      return res.status(404).json({ message: "Dog not found", success: false });
    }

    // Construct the updatedDog object with only the provided fields
    const updatedDog = {};
    if (breed_id) {
      const breed = await Breed.findOne({ _id: breed_id, active: true });
      if (!breed) {
        return res
          .status(404)
          .json({ message: "Breed not found", success: false });
      }
      updatedDog.breed = breed_id;
    }
    if (generic_name) updatedDog.generic_name = generic_name;
    if (age) updatedDog.age = age;
    if (gender) updatedDog.gender = gender.toLowerCase();
    if (disability != undefined && disability != null)
      updatedDog.disability = disability;
    if (address) updatedDog.address = address;
    if (comments) updatedDog.comments = comments;
    if (price) updatedDog.price = price;
    if (name) updatedDog.name = name;
    if (image) updatedDog.image = image;

    const UpdatedDoggo = await Dog.findByIdAndUpdate(id, updatedDog, {
      new: true,
    });
    return res.status(200).json({
      message: "Dog updated successfully",
      newDog: UpdatedDoggo,
      success: true,
    });
  } catch (error) {
    console.error("Error editing a dog:", error);
    return res.status(500).json({
      message: "An error occurred while editing the dog",
      success: false,
    });
  }
});

// Endpoint to delete a dog
router.delete("/delete-dog/:id", userAuth, async (req, res) => {
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

// Route to add a new order
router.post("/add-order", userAuth, async (req, res) => {
  try {
    const { amount } = req.body;
    let { dog } = req.body;

    const user = req.rootUser._id;
    dog = new mongoose.Types.ObjectId(dog);
    // Generate an 8-character order ID
    const orderId = nanoid(8);

    // Create a new order document
    const order = new Order({
      dog,
      user,
      amount,
      orderId,
      status: 0, // Default status is 0 (processing)
    });

    // Save the order to the database
    await order.save();

    res.status(201).json({ message: "Order added successfully", order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error adding order" });
  }
});
// Route to edit an existing order
router.put("/edit-order/:orderId", userAuth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const updates = req.body;

    // Check if the status is one of the allowed values (0, 1, or 2)
    if (updates.status !== undefined && ![0, 1, 2].includes(updates.status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    // Find the order by orderId and update the specified fields
    const order = await Order.findOneAndUpdate({ orderId }, updates, {
      new: true,
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({ message: "Order updated successfully", order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error editing order" });
  }
});

router.get("/logout", userAuth, async (req, res) => {
  try {
    res.status(200).send({ message: "logged out successfully!" });
  } catch (e) {
    res.status(500).send(e);
  }
});

module.exports = router;
