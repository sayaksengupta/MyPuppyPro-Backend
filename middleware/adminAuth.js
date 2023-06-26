const jwt = require("jsonwebtoken");
const Admin = require("../models/admins.js");


const auth = async (req, res, next) => {
    try {
        const token = req.headers.token;
        const verifyToken = jwt.verify(token,process.env.SECRET_KEY);

        const rootUser = await Admin.findOne({_id:verifyToken._id})

        if(!rootUser){
            throw new Error("Admin Not Found.");
        }

        req.token = token;
        req.rootUser = rootUser;

        next();

    } catch (error) {
        res.status(401).send("Unauthorized : No token provided");
        console.log(error);
    }
};

module.exports = auth;