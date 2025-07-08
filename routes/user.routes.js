const express = require("express");
const {
  addUsers,
  userLogin,
  getUserById,
} = require("../controllers/user.controller");

const UserRouter = express.Router();

UserRouter.route("/addusers").post(addUsers);
UserRouter.post("/login", userLogin);
UserRouter.get("/getUserById", getUserById);

module.exports = UserRouter;
