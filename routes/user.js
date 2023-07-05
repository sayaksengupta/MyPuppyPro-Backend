const express = require("express");
const router = express.Router();
const User = require('../models/users');
const bcrypt = require("bcrypt");
const userAuth = require("../middleware/userAuth");
const adminAuth = require("../middleware/adminAuth");
var Stopwatch = require('timer-stopwatch');


router.get("/", (req, res) => {
    res.json({ message: "This is the User api" });
});
  
router.post("/register", async (req, res) => {
    const { name, email, phone, password, address, country, city, type, state, pincode } = req.body;

    try { 
      // Check if all the other fields are provided
      if (!name || !password || !address || !country || !city || !email || !phone || !type) {
        return res.status(400).json({ error: 'Please provide all the required fields' });
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
        type
      });
  
      // Save the user to the database
      const registered = await user.save();

      const OtpStored = await User.findByIdAndUpdate(registered._id, {otp : otp});

      var timer = new Stopwatch(300000); 

      if(registered && OtpStored){
        timer.start();
        timer.onDone(async function(){
          await User.findOneAndUpdate({otp},{otp : ""});
        })
      }

      const token = await registered.generateAuthToken();

      res.status(201).json({ 
        message: "User registered successfully!", 
        success : true, 
        user : {
        _id : registered._id,
        name : registered.name,
        email : registered.email,
        phone : registered.phone,
        address : registered.address,
        country : registered.country,
        city : registered.city,
        state : registered.state,
        pincode : registered.pincode,
        type : registered.type
        }
      });
  
    } catch (error) {
      res.status(500).json({ message: `An error occurred while registering the user --> ${error}` });
    }
});

router.post("/login", async (req, res) => {
    try {
   
      const logEmail = req.body.email;
      const logPass = req.body.password;
   
      if ((!logEmail) || !logPass) {
        return res.status(422).json({ message: "Please fill all the fields.", success : false });
      }
   
      const userByEmail = await User.findOne({email : logEmail});
  
   
   if(userByEmail){
    const passCheck = await bcrypt.compare(logPass, userByEmail.password);
    const token = await userByEmail.generateAuthToken();
   
    if (passCheck) {

      const otp = Math.floor(100000 + Math.random() * 900000);

      const OtpStored = await User.findByIdAndUpdate(userByEmail._id, {otp : otp});

      var timer = new Stopwatch(300000); 

      if(OtpStored){
        timer.start();
        timer.onDone(async function(){
          await User.findOneAndUpdate({otp},{otp : ""});
        })
      }

      await User.findOneAndUpdate({email: logEmail},{otp: otp});

      res.status(200).json({   
        success: true,
        user : {
          _id : userByEmail._id,
          name : userByEmail.name,
          email : userByEmail.email,
          phone : userByEmail.phone,
          address : userByEmail.address,
          country : userByEmail.country,
          city : userByEmail.city,
          state : userByEmail.state,
          pincode : userByEmail.pincode,
          type : userByEmail.type
        }
      });
    } else {
      res.status(400).json({ message: "Invalid login credentials", success : false });
    }
  } else {
    res.status(400).json({ message: "Invalid login credentials", success : false });
  }
    
   } catch (message) {
      res.status(500).json({ message: `Server Error --> ${message}`, success : false });
    }
});

router.patch("/update-user", userAuth, async (req, res) => {

    const  userId  = req.rootUser._id;
    const updates = req.body;
  
    // Check if the provided fields are valid for update
    const allowedUpdates = ["name", "email", "address", "phone", "country", "city"];
    const isValidOperation = Object.keys(updates).every((update) => allowedUpdates.includes(update));
  
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
          state : user.state,
          pincode : user.pincode,
          type: user.type
        },
      });
    } catch (error) {
      res.status(500).json({ message: `An error occurred while updating the user --> ${error}` });
    }
  });

// Delete user
router.delete('/delete-user', adminAuth, async (req, res) => {
    try {
      const  userId  = req.rootUser._id;
  
      const deletedUser = await User.findByIdAndDelete(userId);
  
      if (!deletedUser) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
});


router.post('/otp-verification', async (req,res) => {
  try{
    const {otp, user_number} = req.body;

    if(!otp){
      return res.status(422).json({
        message : "Please provide the otp",
        success :false
      })
    }

   const UserFound = await User.findOne({phone : user_number.toString()});

   if(UserFound && UserFound.otp === otp){
    const token = await UserFound.generateAuthToken();

    return res.status(200).json({
      message : "Otp Verified Successfully !",
      success : true,
      user : {
        _id : UserFound._id,
        name : UserFound.name,
        email : UserFound.email,
        phone : UserFound.phone,
        address : UserFound.address,
        country : UserFound.country,
        city : UserFound.city,
        state : UserFound.state,
        pincode : UserFound.pincode,
        type : UserFound.type,
      },
      token : token

    })
   }else if(UserFound.otp == null){
    return res.status(404).json({
      message : "Otp Expired !",
      success : false
    })
  }
   else{
    return res.status(400).json({
      message : "Incorrect Otp !",
      success : false
    })
   }
    
  }catch(e){
  return res.status(500).json({message: `Server Error --> ${e}`, success: false});
  }
})

router.get('/get-user', userAuth, async (req, res) => {
  const userId  = req.rootUser._id;

  try {
    const user = await User.findById(userId).select('-password -otp');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
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