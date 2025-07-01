const express = require("express");
const {
  addUsers
 
} = require("./user.controller");

const UserRouter = express.Router();

UserRouter.route("/addusers").post(addUsers);


module.exports = UserRouter;