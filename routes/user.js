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
const { sendMail } = require("../tools/sendMail");

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
    txnId,
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

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password should be of atleast 8 characters",
        success: false,
      });
    }

    if (type == "breeder" && !txnId) {
      return res.status(400).json({
        message: "Complete the payment to register as a breeder",
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
    email,
    password,
    type,
    profileImg,
    address,
    country,
    city,
    state,
    pincode,
    txnId,
    sellPuppy,
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
      !type
    ) {
      return res
        .status(400)
        .json({ message: "Please provide all the required fields" });
    }

    if (type == "breeder" && !txnId && !sellPuppy) {
      return res.status(400).json({
        message: "Complete the payment to register as a breeder",
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

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password should be of atleast 8 characters",
        success: false,
      });
    }

    // if (phone) {
    //   console.log("Phone Check");
    //   UserFound = await User.findOne({
    //     phone: phone,
    //   });
    // }

    if (UserFound) {
      return res.status(422).json({
        message: "User already exists",
        status: false,
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);

    // Create a new user
    let user = new User({
      name,
      email,
      type,
      profileImg,
      password,
      // phone,
      address,
      country,
      city,
      state,
      pincode,
    });

    if (type == "breeder" && txnId) {
      const expirationDate = new Date();
      user.isPro = true;
      user.expiresAt = expirationDate.setFullYear(
        expirationDate.getFullYear() + 1
      );
    }

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
            likedDogs: userByEmail.liked_dogs,
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
    const logPass = req.body.password;

    if (!logEmail || !logPass) {
      return res
        .status(422)
        .json({ message: "Please fill all the fields.", success: false });
    }

    const user = await User.findOne({ email: logEmail });

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
            likedDogs: user.liked_dogs,
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
    "password",
    "email",
    "address",
    "phone",
    "country",
    "city",
    "state",
    "profileImg",
    "coverImg",
    "pincode",
    "kennel",
    "about",
    "maleImage",
    "femaleImage",
    "availablePuppyImage",
    "pastPuppyImage",
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
        kennel: user.kennel,
        type: user.type,
        profileImg: user.profileImg,
        coverImg: user.coverImg,
        about: user.about,
        maleImage: user.maleImage,
        femaleImage: user.femaleImage,
        availablePuppyImage: user.availablePuppyImage,
        pastPuppyImage: user.pastPuppyImage,
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
    res.status(200).json({
      _id: user._id,
      address: user.address,
      name: user.name,
      kennel: user.kennel ? user.kennel : "",
      profileImg: user.profileImg ? user.profileImg : "",
      coverImg: user.coverImg ? user.coverImg : "",
      about: user.about,
      type: user.type,
      email: user.email,
      phone: user.phone,
      country: user.country,
      city: user.city,
      state: user.state,
      pincode: user.pincode,
      averageRating: 0,
      liked_dogs: user.liked_dogs,
      ratings: user.ratings,
      reviews: user.reviews,
      preferences: user.preferences,
      pastPuppies: user.pastPuppies,
      expiresAt: user.expiresAt,
      isPro: user.isPro,
      maleImage: user.maleImage,
      femaleImage: user.femaleImage,
      availablePuppyImage: user.availablePuppyImage,
      pastPuppyImage: user.pastPuppyImage,
      createdAt: user.createdAt,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/get-user/:id", async (req, res) => {
  const userId = req.params.id;

  try {
    const user = await User.findById(userId).select("-password -otp");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({
      _id: user._id,
      address: user.address,
      name: user.name,
      kennel: user.kennel ? user.kennel : "",
      profileImg: user.profileImg ? user.profileImg : "",
      coverImg: user.coverImg ? user.coverImg : "",
      type: user.type,
      email: user.email,
      phone: user.phone,
      country: user.country,
      city: user.city,
      state: user.state,
      pincode: user.pincode,
      averageRating: 0,
      liked_dogs: user.liked_dogs,
      ratings: user.ratings,
      reviews: user.reviews,
      preferences: user.preferences,
      pastPuppies: user.pastPuppies,
      maleImage: user.maleImage,
      femaleImage: user.femaleImage,
      availablePuppyImage: user.availablePuppyImage,
      pastPuppyImage: user.pastPuppyImage,
      createdAt: user.createdAt,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/get-user-dogs/:userId", async (req, res) => {
  try {
    const user_id = req.params.userId;

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
      color,
      dob,
      availableDate,
      momWeight,
      dadWeight,
      disability,
      address,
      comments,
      price,
      name,
      images,
      type,
      txnId,
      bredType,
      state,
      city,
    } = req.body;

    if (
      !breed_id ||
      !generic_name ||
      !age ||
      !gender ||
      !color ||
      !dob ||
      disability == undefined ||
      disability == null ||
      !address ||
      !name ||
      !type ||
      !state ||
      !city ||
      !bredType ||
      images.length == 0
    ) {
      return res
        .status(422)
        .json({ message: "Please fill all the fields !", success: false });
    }

    if (type == "puppy" && !txnId) {
      return res.status(400).json({
        message: "Please complete the payment before listing a puppy",
        success: false,
      });
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
      type,
      age,
      gender: gender.toLowerCase(),
      color,
      availableDate,
      DOB: dob,
      disability,
      address,
      comments,
      price,
      name,
      images,
      bredType,
      state,
      city,
    });

    newDog.pedigree.mother.weight = momWeight;
    newDog.pedigree.father.weight = dadWeight;

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
      "name",
      // "weight",
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

    if (req.body.DOB) {
      dog.DOB = req.body.DOB;
    }

    if (req.body.weight) {
      dog.weight = req.body.weight;
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
      color,
      dob,
      availableDate,
      momWeight,
      dadWeight,
      disability,
      address,
      comments,
      price,
      name,
      images,
      state,
      city,
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
    if (images) updatedDog.images = images;
    if (color) updatedDog.color = color;
    if (dob) updatedDog.DOB = dob;
    if (availableDate) updatedDog.availableDate = availableDate;
    if (state) updatedDog.state = state;
    if (city) updatedDog.city = city;

    const UpdatedDoggo = await Dog.findByIdAndUpdate(
      id,
      {
        ...updatedDog,
        "pedigree.mother.weight": momWeight,
        "pedigree.father.weight": dadWeight,
      },
      {
        new: true,
      }
    );
    return res.status(200).json({
      message: "Dog updated successfully",
      newDog: UpdatedDoggo,
      success: true,
    });
  } catch (error) {
    console.log(error);
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

    const dog = await Dog.findById(dogId);

    if (!dog) {
      return res.status(404).json({ message: "Dog not found" });
    }

    // Create a new review
    const newReview = {
      userId,
      review,
      userName: req.rootUser.name,
      dogName: dog.name,
      breed: dog.generic_name,
      image: dog.image ? dog.image : dog.images[0],
    };

    // Add the new review to the dog's reviews array
    dog.reviews.push(newReview);

    // Calculate the new average rating for the dog
    const totalRatings = dog.ratings.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRatings / dog.ratings.length;

    // Update the dog's average rating
    dog.averageRating = averageRating ? averageRating : 0;

    // Save the dog document with the new review and average rating
    await dog.save();

    res
      .status(201)
      .json({ message: "Review added successfully", review: newReview });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
});

router.get("/get-user-by-dog/:dogId", async (req, res) => {
  try {
    const dogId = req.params.dogId;
    const DogFound = await Dog.findById(dogId);

    if (!DogFound) {
      return res.status(404).json({
        message: "Dog not found !",
        success: false,
      });
    }

    const Breeder = await User.findById(DogFound.user).select("-password -otp");

    if (!Breeder) {
      return res.status(404).json({
        message: "Breeder not found !",
        success: false,
      });
    }

    return res.status(200).json({
      message: "Breeder Fetched !",
      success: true,
      Breeder: Breeder,
    });
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

    const dog = await Dog.findById(dogId);

    if (!dog) {
      return res.status(404).json({ message: "Dog not found" });
    }

    // Find the user's existing rating for the dog
    const userRating = dog.ratings.find((r) => r.userId.equals(userId));

    if (userRating) {
      // Update the user's existing rating
      userRating.rating = rating;
    } else {
      // Add a new rating for the user
      dog.ratings.push({ userId, rating });
    }

    // Calculate the new average rating for the dog
    const totalRatings = dog.ratings.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRatings / dog.ratings.length;

    // Update the dog's average rating
    dog.averageRating = averageRating;

    // Save the dog document with the updated rating and average rating
    await dog.save();

    res.status(200).json({
      message: "Rating added/updated successfully",
      averageRating: dog.averageRating,
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
    const dogs = await Dog.find({}, "reviews");

    const allReviews = dogs.map((dog) => dog.reviews).flat();

    res.status(200).json({ reviews: allReviews });
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
      userName,
      generic_name,
      age,
      gender,
      location,
      disability,
      minPrice,
      maxPrice,
      minAge,
      maxAge,
      bredType,
      searchBy,
    } = req.query;

    let breedNames = req.query.breedNames;

    if (breedNames) {
      breedNames = breedNames.split(",");
    }

    console.log(breedNames);
    // Fetch the breed and user documents by name
    const [breeds, user] = await Promise.all([
      Breed.find({ name: { $in: breedNames } }),
      User.findOne({ name: userName }),
    ]);

    // Build the filter object
    const filter = {};
    // if (breeds.length > 0) {
    //   filter.breed = breeds.map((breed) => breed._id);
    // }
    if (user) {
      filter.user = user._id;
    }
    if (gender) {
      filter.gender = gender.toLowerCase();
    }
    if (generic_name) {
      filter.generic_name = generic_name;
    }

    if (bredType) {
      if (bredType === "purebred_designer") {
        // Modify the filter to include dogs with 'purebred' or 'designer' in bredType
        filter.bredType = { $in: ["purebred", "designer"] };
      } else {
        filter.bredType = bredType;
      }
    }

    // if (location) {
    //   filter.address = { $regex: new RegExp(location, "i") };
    // }

    if (location && searchBy == "state") {
      filter.state = { $regex: new RegExp(location, "i") };
    }

    if (location && searchBy == "city") {
      filter.city = { $regex: new RegExp(location, "i") };
    }

    if (disability !== undefined) {
      filter.disability = disability === "true";
    }
    if (minPrice && maxPrice) {
      filter.price = { $gte: minPrice, $lte: maxPrice };
    } else if (minPrice && minPrice < 30000) {
      filter.price = { $gte: minPrice };
    } else if (maxPrice && maxPrice < 30000) {
      filter.price = { $lte: maxPrice };
    } else if (minPrice && maxPrice == 30000) {
      filter.price = { $gte: 30000 };
    }

    filter.type = "puppy";

    if (breedNames && breedNames.length > 0) {
      filter.generic_name = { $in: breedNames };
    }

    console.log(filter);
    // Query the database
    let filteredDogs = await Dog.find(filter);

    if (minAge || maxAge) {
      filteredDogs = filteredDogs.filter((dog) => {
        const dobDate = new Date(dog.DOB);
        const currentDate = new Date();
        const ageInWeeks = Math.floor(
          (currentDate - dobDate) / (7 * 24 * 60 * 60 * 1000)
        );

        console.log(`${dog.name}, ${dog.DOB}, ${ageInWeeks}`);
        // Check if the age falls within the given criteria
        if (minAge && maxAge) {
          return ageInWeeks >= minAge && ageInWeeks <= maxAge;
        } else if (minAge && maxAge == 72) {
          return ageInWeeks >= 72;
        } else if (minAge && maxAge <= 1) {
          return ageInWeeks <= maxAge;
        }
      });
    }
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

    filter.type = "puppy";

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

    return res.status(200).json({
      message: "Dog Fetched !",
      success: true,
      dog: DogFound,
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

    const dogs = await Dog.find({ type: "puppy" }).skip(skip).limit(limit);

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

router.post("/add-past-puppy", userAuth, async (req, res) => {
  try {
    const user = req.rootUser;
    const { image, description } = req.body;

    if (!image) {
      return res
        .status(400)
        .json({ error: "Image is required for the past puppy" });
    }

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Add the past puppy to the user's document
    user.pastPuppies.push({
      image,
      description: description ? description : "",
    });
    await user.save();

    return res.status(200).json({ message: "Past puppy added successfully" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
});

router.get("/get-past-puppies", userAuth, async (req, res) => {
  try {
    const user = req.rootUser;

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Return the user's past puppies
    return res.status(200).json({ pastPuppies: user.pastPuppies });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
});

// PRO --->

router.post("/buy-pro", async (req, res) => {
  const { userId, txnId } = req.body;
  if (!userId || !txnId) {
    return res
      .status(422)
      .json({ message: "Failed to buy pro", success: false });
  }

  const expirationDate = new Date();
  const proUser = await User.findByIdAndUpdate(
    userId,
    {
      isPro: true,
      expiresAt: expirationDate.setFullYear(expirationDate.getFullYear() + 1),
    },
    { new: true }
  );

  return res.status(200).json({
    message: "Subscribed to Pro Successfully!",
    success: true,
    user: proUser,
  });
});

router.get("/logout", userAuth, async (req, res) => {
  try {
    res.status(200).send({ message: "logged out successfully!" });
  } catch (e) {
    res.status(500).send(e);
  }
});

router.post("/contact-breeder", async (req, res) => {
  try {
    const { puppy, message, fromEmail, toEmail } = req.body;

    if (!fromEmail || !toEmail || !message || !puppy) {
      return res.status(422).json({
        message: "Please fill in all the fields!",
        success: false,
      });
    }

    const MailSent = await sendMail(fromEmail, toEmail, message, puppy);

    if (MailSent) {
      return res.status(200).json({
        message: "Message Sent to Breeder Successfully!",
        success: true,
      });
    }

    return res.status(400).json({
      message: "Failed to send message!",
      success: false,
    });
  } catch (e) {
    console.error(error);
    return res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
