const express = require("express");
var indexRouter = require('../index');
var userRouter = require('../user');
var adminRouter = require('../admin');
var categoryRouter = require('../category');
var breedRouter = require('../breed');

module.exports = function(app) {
    app.use(express.json());
  
    app.use("/", indexRouter);
    app.use("/admin", adminRouter);
    app.use("/user", userRouter);
    app.use("/category", categoryRouter);
    app.use("/breed", breedRouter);
};