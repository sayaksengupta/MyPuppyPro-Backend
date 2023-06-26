const express = require("express");
var indexRouter = require('../index');
var userRouter = require('../user');
var adminRouter = require('../admin');

module.exports = function(app) {
    app.use(express.json());
  
    app.use("/", indexRouter);
    app.use("/user", userRouter);
    app.use("/admin", adminRouter);
};