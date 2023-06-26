const express = require("express");
const router = express.Router();
const Admin = require('../models/admins');
const bcrypt = require("bcrypt");
const adminAuth = require("../middleware/adminAuth");
const User = require('../models/users');



router.get("/", (req, res) => {
  res.json({ message: "This is the admin api" });
});

router.get("/auth-check", adminAuth, async(req,res) => {
  try{
    const admin = req.rootUser;

    return res.status(200).json({admin : admin})

  }catch(e){
    res.status(500).json({ message: `Your Session has expired !` });
  }
})

router.post("/register", async (req, res) => {
  const {
    email,
    password,
    cpassword,
    mobile,
    name
  } = req.body;

  if (
    !email ||
    !password ||
    !cpassword ||
    !mobile || 
    !name
  ) {
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
        mobile
      });

      const registered = await admin.save();

      const token = await registered.generateAuthToken();
  
      res.cookie("jwt", token, {
        expires: new Date(Date.now() + 60000000),
        httpOnly: true,
      });

      res.status(201).json({ message: "Registered Successfully!", token : token, admin : admin});
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

    const userByMobile = await Admin.findOne({mobile : logMobile});
    const userEmail = await Admin.findOne({ email: logEmail });


    if(userEmail){
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
  } 

 else if(userByMobile){
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

  router.delete("/remove-admin/:id", async (req,res) => {
    const _id = req.params.id;
    try{
      if(!_id){
        res.status(422).json({message : "Please Provide Admin ID."})
      }
      const deleteAdmin = await Admin.findByIdAndDelete(_id);

      if(deleteAdmin){
        res.status(200).json({message: "Admin Deleted !"});
      }else{
        res.status(404).json({error : "Could Not Find Admin !"});
      }
    }catch (e) {
     res.status(500).json({ message: `Could not find admin --> ${e}` });
    }
  })


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


  router.post('/change-password' , async(req,res) => {
    try{
  
      const {password, cpassword} = req.body;
  
      if(!password || !cpassword){
        return res.status(422).json({
          message : "Please fill all the fields !",
          success : false
        })
      }

      if(password !== cpassword){
        return res.status(422).json({
          message : "Passwords are not matching !",
          success : false
        })
      }
  
      const AdminFound = await Admin.findOne();
  
      if(AdminFound){
        let hashedPass = await bcrypt.hash(password, 10);
        let hashedcPass = await bcrypt.hash(cpassword, 10);
        const ResetPassword = await Admin.findByIdAndUpdate(AdminFound._id, {password : hashedPass, cpassword : hashedcPass}, {new : true})
        if(ResetPassword){
          return res.status(200).json({
            message : "Password Reset Successfully !",
            success : true
          })
        }else{
          return res.status(200).json({
            message : "Password could not be reset !",
            success : false
          })
        }
      }else{
        return res.status(404).json({
          message : "Admin not found !",
          success : false
        })
      }
    }catch(e){
      return res.status(500).json({
        message : `Server Error --> ${e}`,
        success : false
      })
    }
  });

  router.get('/get-all-users', adminAuth, async (req, res) => {
    try {
      const users = await User.find();
      res.status(200).json(users);
    } catch (error) {
      res.status(500).json({ message: `Server Error --> ${error}`, success: false });
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

router.patch('/change-user-status/:id', async (req, res) => {
    const { id } = req.params;
  
    try {
      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({ message: 'User not found', success: false });
      }
  
      user.active = !user.active; // Toggle the status
      await user.save();
  
      res.status(200).json({ message: 'User status toggled successfully', active: user.active, success:true });
    } catch (error) {
      res.status(500).json({ message: `Internal server error --> ${error}`, success:false });
    }
  });

  router.delete('/delete-user/:id', async (req, res) => {
    const { id } = req.params;
  
    try {
      const user = await User.findByIdAndDelete(id);
      if (!user) {
        return res.status(404).json({ message: 'User not found', success: false });
      }
  
      res.status(200).json({ message: 'User deleted successfully', success : true });
    } catch (error) {
       res.status(500).json({ message: `Internal server error --> ${error}`, success: false });
    }
  });

  
  module.exports = router;