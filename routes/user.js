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
const shortid = require("shortid");
const DogReview = require("../models/DogReviews");

router.get("/", (req, res) => {
  res.json({ message: "This is the User api" });
});

router.post("/register", async (req, res) => {
  const {
    name,
    password,
    address,
    country,
    city,
    type,
    state,
    pincode,
    profileImg,
  } = req.body;

  let { email, phone } = req.body;

  try {
    // Check if all the other fields are provided
    if (
      !name ||
      !password ||
      !address ||
      !country ||
      !city ||
      (!email && !phone) ||
      !type
    ) {
      return res.status(400).json({
        message: "Please provide all the required fields",
        success: false,
      });
    }
    let UserFound;

    if (email) {
      console.log("Email Check");
      UserFound = await User.findOne({
        email: email,
      });
    }

    if (phone) {
      console.log("Phone Check");
      UserFound = await User.findOne({
        phone: phone,
      });
    }

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
      profileImg,
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
        profileImg: registered.profileImg,
        type: registered.type.toLowerCase(),
      },
    });
  } catch (error) {
    res.status(500).json({
      message: `An error occurred while registering the user --> ${error}`,
    });
  }
});

router.post("/register-web", async (req, res) => {
  const {
    name,
    password,
    address,
    country,
    city,
    type,
    state,
    pincode,
    profileImg,
  } = req.body;

  let { email, phone } = req.body;

  try {
    // Check if all the other fields are provided
    if (
      !name ||
      !password ||
      !address ||
      !country ||
      !city ||
      (!email && !phone) ||
      !type
    ) {
      return res
        .status(400)
        .json({ message: "Please provide all the required fields" });
    }

    let UserFound;

    if (email) {
      console.log("Email Check");
      UserFound = await User.findOne({
        email: email,
      });
    }

    if (phone) {
      console.log("Phone Check");
      UserFound = await User.findOne({
        phone: phone,
      });
    }

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
      profileImg,
    });

    // Save the user to the database
    const registered = await user.save();

    const token = await registered.generateAuthToken();

    res.status(201).json({
      message: "User registered successfully!",
      token: token,
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
        profileImg: registered.profileImg,
        type: registered.type.toLowerCase(),
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
            profileImg: userByEmail.profileImg,
            type: userByEmail.type,
          },
          otp: otp,
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

router.post("/login-web", async (req, res) => {
  try {
    const logEmail = req.body.email;
    const logPhone = req.body.phone;
    const logPass = req.body.password;

    if ((!logEmail && !logPhone) || !logPass) {
      return res
        .status(422)
        .json({ message: "Please fill all the fields.", success: false });
    }

    const user = await User.findOne({
      $or: [{ email: logEmail }, { phone: logPhone }],
    });

    if (user) {
      const passCheck = await bcrypt.compare(logPass, user.password);
      const token = await user.generateAuthToken();

      if (passCheck) {
        res.status(200).json({
          success: true,
          token: token,
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
            profileImg: user.profileImg,
            type: user.type,
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
    "state",
    "profileImg",
    "coverImg"
  ];
  const isValidOperation = Object.keys(updates).every((update) =>
    allowedUpdates.includes(update)
  );

  if (!isValidOperation) {
    return res.status(400).json({ message: "Invalid update operation." });
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
        profileImg: user.profileImg,
        coverImg: user.coverImg
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
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
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
          profileImg: UserFound.profileImg,
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
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/get-user/:id", userAuth, async (req, res) => {
  const userId = req.params.id;

  try {
    const user = await User.findById(userId).select("-password -otp");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
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
      "fratFather",
      "fratMother",
      "matFather",
      "matMother",
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
    let { dog } = req.body;

    const user = req.rootUser._id;
    dog = new mongoose.Types.ObjectId(dog);

    const dogFound = await Dog.findById(dog);
    const amount = parseInt(dogFound.price);
    // Generate an 8-character order ID
    const orderId = shortid.generate();

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

    res.status(201).json({
      message: "Order added successfully",
      success: true,
      order: {
        _id: order._id,
        dog: dogFound,
        user: {
          _id: user._id,
          name: user.name,
          type: user.type,
          email: user.email,
          phone: user.phone,
          country: user.country,
          city: user.city,
          state: user.state,
          pincode: user.pincode,
        },
        amount: order.amount,
        orderId: order.orderId,
        status: order.status,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error adding order", success: false });
  }
});
// Route to edit an existing order
router.put("/edit-order/:orderId", userAuth, async (req, res) => {
  try {
    let { orderId } = req.params;
    const updates = req.body;

    console.log(orderId);

    orderId = new mongoose.Types.ObjectId(orderId);

    console.log(orderId);

    // Check if the status is one of the allowed values (0, 1, or 2)
    if (updates.status !== undefined && ![0, 1, 2].includes(updates.status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const orderFound = await Order.findById(orderId);

    console.log(orderFound);

    // Find the order by orderId and update the specified fields
    const order = await Order.findByIdAndUpdate(orderId, updates, {
      new: true,
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order && order.status === 1) {
      await Dog.findByIdAndUpdate(order.dog._id, { soldStatus: true });
    }

    res.json({ message: "Order updated successfully", success: true, order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error editing order", success: false });
  }
});

router.get("/get-orders", userAuth, async (req, res) => {
  try {
    const userId = req.rootUser._id;

    // Find all orders that belong to the specified user
    const orders = await Order.find({ user: userId }).populate("dog");

    res.status(200).json({
      message: "User orders fetched successfully",
      success: true,
      orders,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error retrieving orders", success: false });
  }
});

// Add Review to a Breeder
router.post("/add-review/:breederId", userAuth, async (req, res) => {
  try {
    const userId = req.rootUser._id;
    const userName = req.rootUser.name;
    const { review } = req.body;
    const breederId = req.params.breederId;

    const BreederFound = await User.findById(breederId);

    if (!BreederFound) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Validate if the provided product ID is a valid ObjectId
    if (
      !mongoose.Types.ObjectId.isValid(breederId) ||
      BreederFound.type.toLowerCase() !== "breeder"
    ) {
      return res.status(400).json({ message: "Invalid Breeder ID" });
    }

    // Validate the review data
    if (!userId || !userName || !review) {
      return res
        .status(400)
        .json({ message: "All fields are required for a review" });
    }

    // // Check if the product exists
    // const breeder = await User.findById(breederId);

    // Create a new review
    const newReview = {
      userId,
      userName,
      review,
    };

    // Add the review to the product's reviews array
    BreederFound.reviews.push(newReview);

    // Save the product with the new review
    await BreederFound.save();

    res
      .status(201)
      .json({ message: "Review added successfully", review: newReview });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", message: error.message });
  }
});

// Add or Edit Rating for a Breeder
router.post("/add-rating/:breederId", userAuth, async (req, res) => {
  try {
    const userId = req.rootUser._id;
    const { rating } = req.body;
    const breederId = req.params.breederId;

    const BreederFound = await User.findById(breederId);

    if (!BreederFound) {
      return res.status(404).json({ message: "Breeder not found" });
    }

    // Validate if the provided product ID is a valid ObjectId
    if (
      !mongoose.Types.ObjectId.isValid(breederId) ||
      BreederFound.type.toLowerCase() !== "breeder"
    ) {
      return res.status(400).json({ message: "Invalid Breeder ID" });
    }

    // Validate the rating data
    if (!userId || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "Invalid rating data" });
    }

    // Check if the user has already rated the product
    const existingRatingIndex = BreederFound.ratings.findIndex(
      (r) => r.userId.toString() === userId.toString()
    );

    if (existingRatingIndex !== -1) {
      // User has already rated the product, update the existing rating
      BreederFound.ratings[existingRatingIndex].rating = rating;
    } else {
      // User hasn't rated the product, add a new rating
      BreederFound.ratings.push({
        userId,
        rating,
      });
    }

    // Calculate the new average rating for the product
    const totalRatings = BreederFound.ratings.reduce(
      (sum, r) => sum + r.rating,
      0
    );
    const averageRating = totalRatings / BreederFound.ratings.length;

    // Update the product's average rating
    BreederFound.averageRating = averageRating;

    // Save the product with the updated rating
    await BreederFound.save();

    res.status(200).json({
      message: "Rating added/updated successfully",
      averageRating: BreederFound.averageRating,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", message: error.message });
  }
});

// Add Review to a Dog
router.post("/add-dog-review/:dogId", userAuth, async (req, res) => {
  try {
    const userId = req.rootUser._id;
    const { review } = req.body;
    const dogId = req.params.dogId;

    // Validate if the provided dogId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(dogId)) {
      return res.status(400).json({ message: "Invalid Dog ID" });
    }

    const DogFound = await Dog.findById(dogId);

    // Create a new review
    const newReview = new DogReview({
      userId,
      dogId,
      breed: DogFound.generic_name,
      image: DogFound.image,
      userName: req.rootUser.name,
      dogName: DogFound.name, // You can set the dog name here
      review,
    });

    // Save the review to the database
    await newReview.save();

    res
      .status(201)
      .json({ message: "Review added successfully", review: newReview });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

// Add or Edit Rating for a Breeder
router.post("/add-dog-rating/:dogId", userAuth, async (req, res) => {
  try {
    const userId = req.rootUser._id;
    const { rating } = req.body;
    const dogId = req.params.dogId;

    // Validate if the provided dogId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(dogId)) {
      return res.status(400).json({ message: "Invalid Dog ID" });
    }

    // Find the dog review for the specific dog and user
    let dogReview = await DogReview.findOne({ userId, dogId });

    if (!dogReview) {
      // If the review doesn't exist, create a new one
      dogReview = new DogReview({
        userId,
        dogId,
        ratings: [{ userId, rating }],
      });
    } else {
      // Update the existing rating
      const existingRatingIndex = dogReview.ratings.findIndex(
        (r) => r.userId.toString() === userId.toString()
      );
      if (existingRatingIndex !== -1) {
        // User has already rated the dog, update the existing rating
        dogReview.ratings[existingRatingIndex].rating = rating;
      } else {
        // User hasn't rated the dog, add a new rating
        dogReview.ratings.push({
          userId,
          rating,
        });
      }
    }

    // Calculate the new average rating for the dog
    const totalRatings = dogReview.ratings.reduce(
      (sum, r) => sum + r.rating,
      0
    );
    const averageRating = totalRatings / dogReview.ratings.length;

    // Update the dog's average rating
    dogReview.averageRating = averageRating;

    // Save the review to the database
    await dogReview.save();

    res.status(200).json({
      message: "Rating added/updated successfully",
      averageRating: dogReview.averageRating,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

// Get all dog reviews
router.get("/get-all-dog-reviews", async (req, res) => {
  try {
    // Fetch all dog reviews from the database
    const reviews = await DogReview.find();

    res.status(200).json({ reviews });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

router.get("/filter-dogs", async (req, res) => {
  try {
    // Parse query parameters
    const {
      breedName,
      userName,
      generic_name,
      age,
      gender,
      disability,
      minPrice,
      maxPrice,
    } = req.query;

    // Fetch the breed and user documents by name
    const [breed, user] = await Promise.all([
      Breed.findOne({ name: breedName }),
      User.findOne({ name: userName }),
    ]);

    // Build the filter object
    const filter = {};
    if (breed) {
      filter.breed = breed._id;
    }
    if (user) {
      filter.user = user._id;
    }
    if (gender) {
      filter.gender = gender.toLowerCase();
    }
    if (generic_name) {
      filter.generic_name = generic_name;
    }
    if (age) {
      filter.age = { $gte: age };
    }
    if (disability !== undefined) {
      filter.disability = disability === "true";
    }
    if (minPrice && maxPrice) {
      filter.price = { $gte: minPrice, $lte: maxPrice };
    } else if (minPrice) {
      filter.price = { $gte: minPrice };
    } else if (maxPrice) {
      filter.price = { $lte: maxPrice };
    }

    // Query the database
    const filteredDogs = await Dog.find(filter);

    // Return the filtered results as JSON
    res.status(200).json({
      message: "Dogs fetched successfully!",
      success: true,
      filteredDogs,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", success: false });
  }
});

router.get("/find-dogs", async (req, res) => {
  try {
    // Parse query parameters
    const { breedName, age, gender, minPrice, maxPrice, page, limit } =
      req.query;

    // Build the filter object
    const filter = {};

    if (breedName) {
      const breedIds = await Promise.all(
        (Array.isArray(breedName) ? breedName : [breedName]).map(
          async (name) => {
            const breed = await Breed.findOne({ name });
            return breed ? breed._id : null;
          }
        )
      );
      filter.breed = { $in: breedIds.filter((id) => id) };
    }

    if (gender) {
      filter.gender = {
        $in: Array.isArray(gender)
          ? gender.map((g) => g.toLowerCase())
          : [gender.toLowerCase()],
      };
    }

    if (age) {
      filter.age = { $in: Array.isArray(age) ? age : [age] };
    }

    if (minPrice && maxPrice) {
      filter.price = { $gte: minPrice, $lte: maxPrice };
    } else if (minPrice) {
      filter.price = { $gte: minPrice };
    } else if (maxPrice) {
      filter.price = { $lte: maxPrice };
    }

    // Calculate the skip value to implement pagination
    const skip = (page - 1) * limit;

    // Query the database based on the filter criteria with pagination
    const filteredDogs = await Dog.find(filter).skip(skip).limit(limit);
    const totalFilteredDogs = await Dog.find(filter).countDocuments();
    const totalPages = Math.ceil(totalFilteredDogs / limit);

    // Return the paginated results along with page information as JSON
    res.status(200).json({
      message: "Dogs fetched successfully!",
      success: true,
      currentPage: page,
      totalPages: totalPages,
      filteredDogs,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", success: false });
  }
});

router.get("/get-dog/:id", async (req, res) => {
  try {
    const dogId = req.params.id;

    const DogFound = await Dog.findById(dogId);
    const DogReviews = await DogReview.findOne({ dogId: dogId });
    console.log(DogReviews);

    return res.status(200).json({
      message: "Dog Fetched !",
      success: true,
      dog: DogFound,
      reviews: DogReviews,
    });
  } catch (e) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Define the route to get all dogs with pagination
router.get("/get-dogs", async (req, res) => {
  try {
    // Parse query parameters for pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Calculate the skip value to implement pagination
    const skip = (page - 1) * limit;

    // Query the database to retrieve paginated dogs
    const totalDogs = await Dog.countDocuments();
    const totalPages = Math.ceil(totalDogs / limit);

    const dogs = await Dog.find().skip(skip).limit(limit);

    // Return the paginated results along with page information as JSON
    res.json({
      currentPage: page,
      totalPages: totalPages,
      dogs: dogs,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// POST route to add preferences to a user's profile
router.post("/add-preferences", userAuth, async (req, res) => {
  const preferencesToAdd = req.body.preferences; // Array of preferences

  try {
    const user = req.rootUser;

    // Check if preferencesToAdd is an array
    if (!Array.isArray(preferencesToAdd)) {
      return res
        .status(400)
        .json({ message: "Preferences should be an array" });
    }

    // Check if the preferencesToAdd array is not empty
    if (preferencesToAdd.length === 0) {
      return res
        .status(400)
        .json({ message: "Please select atleast one preference !" });
    }

    const newPreferences = [];

    for (const preferenceData of preferencesToAdd) {
      const { name, breedId, image } = preferenceData;

      // Check if the breed exists
      const breed = await Breed.findById(breedId);

      if (!breed) {
        return res
          .status(404)
          .json({ message: `Breed not found for preference: ${name}` });
      }

      // Create a new preference object
      const preference = {
        name,
        breed: breed._id, // Assign the breed ObjectId
        image,
      };

      newPreferences.push(preference);
    }

    // Push the new preferences to the user's preferences array
    user.preferences.push(...newPreferences);

    // Save the updated user document
    await user.save();

    return res.status(201).json({
      message: "Preferences added successfully",
      preferences: user.preferences,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
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
