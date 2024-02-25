require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const corsOptions = {
  origin: true, //included origin as true
  credentials: true, //included credentials as true
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
require("./routes/startup/routes")(app);
const port = process.env.PORT || 8080;
require("./db/conn");
const connection = require("./db/conn");
const AWS = require("aws-sdk");
const multer = require("multer");
const multerS3 = require("multer-s3");
const cron = require("node-cron");

let s3 = new AWS.S3({
  region: "us-east-1",
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
});

connection();

cron.schedule("0 0 * * *", async () => {
  try {
    const currentDate = new Date();
    await User.updateMany(
      { "expiresAt": { $lte: currentDate } },
      { $set: { isPro: false } }
    );
    console.log("Expired plans removed successfully.");
  } catch (error) {
    console.error("Error removing expired plans:", error);
  }
});

const upload = multer({
  storage: multerS3({
    s3,
    bucket: process.env.BUCKET_NAME,
    metadata: (req, file, cb) => {
      cb(null, {
        fieldName: file.fieldname,
      });
    },
    key: (request, file, cb) => {
      fileName = file.originalname.replace(/\s+/g, "%20");
      cb(null, file.originalname);
    },
  }),
}).single("file");

app.post("/upload", function (request, response, next) {
  upload(request, response, function (error) {
    if (error) {
      console.log(error);
      return response.status(500).json({ message: error });
    }
    response.status(200).json({
      message: "File uploaded successfully.",
      success: true,
      fileUrl: `${process.env.S3_ENDPOINT}${fileName}`,
    });
  });
});

app.listen(port, () => {
  console.log(`Listening to port ${port}`);
});
