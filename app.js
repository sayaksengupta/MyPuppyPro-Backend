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


connection();


app.listen(port, () => {
    console.log(`Listening to port ${port}`);
});