const express = require("express");
const router = express.Router();
const Admin = require("../models/admins");
const bcrypt = require("bcrypt");
const adminAuth = require("../middleware/adminAuth");
const User = require("../models/users");
const Category = require("../models/categories");
const Breed = require("../models/breeds");
const Dog = require("../models/dogs");
const State = require("../models/states");
const Setting = require("../models/settings");
const City = require("../models/cities");

router.get("/", (req, res) => {
  res.json({ message: "This is the admin api" });
});

router.get("/auth-check", adminAuth, async (req, res) => {
  try {
    const admin = req.rootUser;

    return res.status(200).json({ admin: admin });
  } catch (e) {
    res.status(500).json({ message: `Your Session has expired !` });
  }
});

router.post("/register", async (req, res) => {
  const { email, password, cpassword, mobile, name } = req.body;

  if (!email || !password || !cpassword || !mobile || !name) {
    return res.status(422).json({ error: "Please fill all the fields." });
  }

  try {
    const userSearchByEmail = await Admin.findOne({ email: email });
    const userSearchByMobile = await Admin.findOne({ mobile: mobile });

    if (userSearchByEmail || userSearchByMobile) {
      return res.status(422).json({ error: "Admin already exists." });
    }

    if (password !== cpassword) {
      return res.status(422).json({ error: "passwords dont match." });
    } else {
      const admin = new Admin({
        name,
        email,
        password,
        cpassword,
        mobile,
      });

      const registered = await admin.save();

      const token = await registered.generateAuthToken();

      res.cookie("jwt", token, {
        expires: new Date(Date.now() + 60000000),
        httpOnly: true,
      });

      res.status(201).json({
        message: "Registered Successfully!",
        token: token,
        admin: admin,
      });
    }
  } catch (e) {
    res.status(500).json({ message: `Could not create account! --> ${e}` });
  }
});

router.post("/login", async (req, res) => {
  try {
    const logEmail = req.body.email;
    const logMobile = req.body.mobile;
    const logPass = req.body.password;

    if ((!logEmail && !logMobile) || !logPass) {
      return res.status(422).json({ error: "Please fill all the fields." });
    }

    const userByMobile = await Admin.findOne({ mobile: logMobile });
    const userEmail = await Admin.findOne({ email: logEmail });

    if (userEmail) {
      const passCheck = await bcrypt.compare(logPass, userEmail.password);
      const token = await userEmail.generateAuthToken();

      if (passCheck) {
        res.status(200).json({
          message: "Logged In Successfully!",
          token: token,
          success: true,
          admin: userEmail,
        });
      } else {
        res.status(400).json({ message: "Invalid login credentials" });
      }
    } else if (userByMobile) {
      const passCheck = await bcrypt.compare(logPass, userByMobile.password);
      const token = await userByMobile.generateAuthToken();

      res.cookie("jwt", token, {
        expires: new Date(Date.now() + 60000000),
        httpOnly: true,
      });

      if (passCheck) {
        res.status(200).json({
          message: "Logged In Successfully!",
          token: token,
          success: true,
          admin: userByMobile,
        });
      } else {
        res.status(400).json({ message: "Invalid login credentials" });
      }
    } else {
      res.status(400).json({ message: "Invalid login credentials" });
    }
  } catch (error) {
    res.status(500).json({ message: "Invalid login credentials" });
  }
});

router.get("/logout", adminAuth, async (req, res) => {
  try {
    res.status(200).send({ message: "logged out successfully!" });
  } catch (e) {
    res.status(500).send(e);
  }
});

router.delete("/remove-admin/:id", async (req, res) => {
  const _id = req.params.id;
  try {
    if (!_id) {
      res.status(422).json({ message: "Please Provide Admin ID." });
    }
    const deleteAdmin = await Admin.findByIdAndDelete(_id);

    if (deleteAdmin) {
      res.status(200).json({ message: "Admin Deleted !" });
    } else {
      res.status(404).json({ error: "Could Not Find Admin !" });
    }
  } catch (e) {
    res.status(500).json({ message: `Could not find admin --> ${e}` });
  }
});

//   router.post('/forgot-password', async (req,res) => {
//     try{
//       const {email} = req.body;

//       if(!email){
//         return res.status(422).json({
//           message : "Please provide the email",
//           success : false
//         })
//       }

//       const ResetPasswordAdmin = await Admin.findOne({email : email})

//        if(ResetPasswordAdmin){

//       const mailOptions = {
//         from: 'growsharp.india@gmail.com',
//         to: email,
//         subject: 'Reset Password',
//         html: forgotEmailBody
//       };

//       transporter.sendMail(mailOptions, function(error, info){
//         if(error){
//           console.log(error);
//         }else{
//           console.log('Email sent: ' + info.response);
//           return res.status(200).json({
//             message : `Password reset link was sent to ${email} successfully !`,
//             success : true
//           })
//         }
//       });
//     }else{
//       return res.status(404).json({
//         message : "Admin not found !",
//         success : false
//       })
//     }

//     }catch(e){
//       res.status(500).json({ message: `Server Error --> ${e}` });
//     }
//   })

router.post("/change-password", async (req, res) => {
  try {
    const { password, cpassword } = req.body;

    if (!password || !cpassword) {
      return res.status(422).json({
        message: "Please fill all the fields !",
        success: false,
      });
    }

    if (password !== cpassword) {
      return res.status(422).json({
        message: "Passwords are not matching !",
        success: false,
      });
    }

    const AdminFound = await Admin.findOne();

    if (AdminFound) {
      let hashedPass = await bcrypt.hash(password, 10);
      let hashedcPass = await bcrypt.hash(cpassword, 10);
      const ResetPassword = await Admin.findByIdAndUpdate(
        AdminFound._id,
        { password: hashedPass, cpassword: hashedcPass },
        { new: true }
      );
      if (ResetPassword) {
        return res.status(200).json({
          message: "Password Reset Successfully !",
          success: true,
        });
      } else {
        return res.status(200).json({
          message: "Password could not be reset !",
          success: false,
        });
      }
    } else {
      return res.status(404).json({
        message: "Admin not found !",
        success: false,
      });
    }
  } catch (e) {
    return res.status(500).json({
      message: `Server Error --> ${e}`,
      success: false,
    });
  }
});

router.get("/get-all-users/:type", adminAuth, async (req, res) => {
  try {
    const { type } = req.params;
    const users = await User.find({ type: type });
    res.status(200).json(users);
  } catch (error) {
    res
      .status(500)
      .json({ message: `Server Error --> ${error}`, success: false });
  }
});

// router.get("/get-all-services", adminAuth, async (req, res) => {
//   try {
//     const services = await Service.find();
//     const allServices = services.reduce((servicesByType, service) => {
//       const { type } = service;
//       if (!servicesByType[type]) {
//         servicesByType[type] = [];
//       }
//       servicesByType[type].push(service);
//       return servicesByType;
//     }, []);

//     const formattedServices = Object.keys(allServices).map((type) => ({
//       name: type,
//       value: allServices[type],
//     }));

//     res.status(200).json({
//       message: "Services fetched successfully!",
//       success: true,
//       services: formattedServices,
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({
//       message: `Server Error --> ${err}`,
//       success: false,
//     });
//   }
// });

router.patch("/change-user-status/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found", success: false });
    }

    user.active = !user.active; // Toggle the status
    await user.save();

    res.status(200).json({
      message: "User status toggled successfully",
      active: user.active,
      success: true,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: `Internal server error --> ${error}`, success: false });
  }
});

router.patch("/change-category-status/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const category = await Category.findById(id);
    if (!category) {
      return res
        .status(404)
        .json({ message: "Category not found", success: false });
    }

    category.active = !category.active; // Toggle the status
    await category.save();

    res.status(200).json({
      message: "Category status toggled successfully",
      active: category.active,
      success: true,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: `Internal server error --> ${error}`, success: false });
  }
});

router.patch("/change-breed-status/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const breed = await Breed.findById(id);
    if (!breed) {
      return res
        .status(404)
        .json({ message: "Breed not found", success: false });
    }

    breed.active = !breed.active; // Toggle the status
    await breed.save();

    res.status(200).json({
      message: "Breed status toggled successfully",
      active: breed.active,
      success: true,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: `Internal server error --> ${error}`, success: false });
  }
});

router.delete("/delete-user/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found", success: false });
    }

    res
      .status(200)
      .json({ message: "User deleted successfully", success: true });
  } catch (error) {
    res
      .status(500)
      .json({ message: `Internal server error --> ${error}`, success: false });
  }
});

router.get("/get-all-dogs", adminAuth, async (req, res) => {
  try {
    const Dogs = await Dog.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "user",
          foreignField: "_id",
          as: "UserData",
          pipeline: [
            {
              $project: {
                _id: 0,
                name: 1,
                email: 1,
                phone: 1,
                address: 1,
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: "$UserData",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          user: "$UserData",
          generic_name: 1,
          age: 1,
          gender: 1,
          disability: 1,
          address: 1,
          price: 1,
          active: 1,
          soldStatus: 1,
          name: 1,
          image: { $arrayElemAt: ["$images", 0] },
          averageRating: 1,
        },
      },
    ]);
    // If the middleware passed, the token is valid
    res
      .status(200)
      .json({ message: "Dogs fetched !", success: true, Dogs: Dogs });
  } catch (error) {
    res.status(500).json({ error: "Dogs not found !" });
  }
});

// Change status (toggle active flag) for a dog
router.put("/toggle-active/:dogId", adminAuth, async (req, res) => {
  try {
    const dogId = req.params.dogId;

    // Find the dog by ID
    const dog = await Dog.findById(dogId);

    if (!dog) {
      return res.status(404).json({ error: "Dog not found" });
    }

    // Toggle the active flag
    dog.active = !dog.active;

    // Save the updated dog
    await dog.save();

    res
      .status(200)
      .json({ message: "Dog status changed successfully", success: true, dog });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Change status (toggle soldStatus flag) for a dog
router.put("/toggle-sold/:dogId", adminAuth, async (req, res) => {
  try {
    const dogId = req.params.dogId;

    // Find the dog by ID
    const dog = await Dog.findById(dogId);

    if (!dog) {
      return res.status(404).json({ error: "Dog not found" });
    }

    // Toggle the active flag
    dog.soldStatus = !dog.soldStatus;

    // Save the updated dog
    await dog.save();

    res
      .status(200)
      .json({ message: "Dog status changed successfully", success: true, dog });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Delete a dog by ID
router.delete("/delete-dog/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const dog = await Dog.findByIdAndDelete(id);
    if (!dog) {
      return res.status(404).json({ message: "Dog not found", success: false });
    }

    res
      .status(200)
      .json({ message: "Dog deleted successfully", success: true });
  } catch (error) {
    res
      .status(500)
      .json({ message: `Internal server error --> ${error}`, success: false });
  }
});

// Check Token API
router.get("/check-token", adminAuth, async (req, res) => {
  try {
    // If the middleware passed, the token is valid
    res.status(200).json({ message: "Token is valid" });
  } catch (error) {
    res.status(500).json({ error: "Unable to verify token" });
  }
});

router.post("/add-state", adminAuth, async (req, res) => {
  try {
    const { state } = req.body;

    if (!state) {
      return res.status(422).json({
        message: "Please provide State Name !",
        success: false,
      });
    }

    const stateAdded = await State.create({ name: state.toLowerCase() });

    if (stateAdded) {
      return res.status(200).json({
        message: `${stateAdded.name} added successfully !`,
        success: true,
      });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: `Internal server error --> ${error}`, success: false });
  }
});

router.post("/add-states-bulk", adminAuth, async (req, res) => {
  try {
    const { states } = req.body;

    if (!states || !Array.isArray(states) || states.length === 0) {
      return res.status(422).json({
        message: "Please provide an array of states to add!",
        success: false,
      });
    }

    // Convert state names to lowercase
    const statesToAdd = states.map((state) => ({
      name: state.name.toLowerCase(),
    }));

    const statesAdded = await State.insertMany(statesToAdd);

    if (statesAdded && statesAdded.length > 0) {
      const addedStateNames = statesAdded.map((state) => state.name);

      return res.status(200).json({
        message: `${addedStateNames.join(", ")} added successfully!`,
        success: true,
      });
    }
  } catch (error) {
    res.status(500).json({
      message: `Internal server error --> ${error}`,
      success: false,
    });
  }
});

router.post("/add-city", adminAuth, async (req, res) => {
  try {
    const { city } = req.body;

    if (!city) {
      return res.status(422).json({
        message: "Please provide City Name !",
        success: false,
      });
    }

    const cityAdded = await City.create({ name: city.toLowerCase() });

    if (cityAdded) {
      return res.status(200).json({
        message: `${cityAdded.name} added successfully !`,
        success: true,
      });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: `Internal server error --> ${error}`, success: false });
  }
});

router.post("/add-cities-bulk", adminAuth, async (req, res) => {
  try {
    const { cities } = req.body;

    if (!cities || !Array.isArray(cities) || cities.length === 0) {
      return res.status(422).json({
        message: "Please provide an array of cities to add!",
        success: false,
      });
    }

    // Convert state names to lowercase
    const citiesToAdd = cities.map((city) => ({
      name: city.name.toLowerCase(),
    }));

    const citiesAdded = await City.insertMany(citiesToAdd);

    if (citiesAdded && citiesAdded.length > 0) {
      const addedCityNames = citiesAdded.map((city) => city.name);

      return res.status(200).json({
        message: `${addedCityNames.join(", ")} added successfully!`,
        success: true,
      });
    }
  } catch (error) {
    res.status(500).json({
      message: `Internal server error --> ${error}`,
      success: false,
    });
  }
});

// Fetch all states
router.get("/get-all-states", async (req, res) => {
  try {
    const allStates = await State.find(
      {},
      { __v: 0, createdAt: 0, updatedAt: 0 }
    ); // Exclude _id and __v fields

    return res.status(200).json({
      message: "States Fetched !",
      states: allStates,
      success: true,
    });
  } catch (error) {
    res.status(500).json({
      message: `Internal server error --> ${error}`,
      success: false,
    });
  }
});

// Search city route
router.get("/search-city", async (req, res) => {
  const searchQuery = req.query.city;

  if (!searchQuery) {
    return res
      .status(400)
      .json({ error: "Query parameter 'city' is required" });
  }

  try {
    const matchedCities = await City.find(
      {
        name: { $regex: searchQuery, $options: "i" },
      },
      { __v: 0, createdAt: 0, updatedAt: 0 }
    ).limit(10); // Limit to 10 results for better performance

    return res.status(200).json({
      message: "Cities Fetched !",
      cities: matchedCities,
      success: true,
    });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

router.post("/update-settings", adminAuth, async (req, res) => {
  try {
    const { breederPlan, puppyListing } = req.body;
    const updatedSettings = await Setting.findOneAndUpdate(
      {},
      { breederPlan, puppyListing },
      { new: true }
    );

    return res.status(200).json({ message: "Settings Updated", success: true });
  } catch (error) {
    res.status(500).json({
      message: `Internal server error --> ${error}`,
      success: false,
    });
  }
});

router.get("/get-settings", async (req, res) => {
  try {
    const settings = await Setting.findOne({});

    return res.status(200).json({
      message: "Fetched General Setttings",
      success: true,
      settings: settings,
    });
  } catch (error) {
    res.status(500).json({
      message: `Internal server error --> ${error}`,
      success: false,
    });
  }
});

// Delete State
router.delete("/delete-state/:stateId", adminAuth, async (req, res) => {
  try {
    const { stateId } = req.params;

    if (!stateId) {
      return res.status(422).json({
        message: "Please provide a State ID to delete!",
        success: false,
      });
    }

    const deletedState = await State.findByIdAndDelete(stateId);

    if (deletedState) {
      return res.status(200).json({
        message: `${deletedState.name} deleted successfully!`,
        success: true,
      });
    } else {
      return res.status(404).json({
        message: "State not found!",
        success: false,
      });
    }
  } catch (error) {
    res.status(500).json({
      message: `Internal server error --> ${error}`,
      success: false,
    });
  }
});

module.exports = router;
