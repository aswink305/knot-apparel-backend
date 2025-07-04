const express = require("express");
const { addUsers, userLogin } = require("../controllers/user.controller");

const UserRouter = express.Router();

UserRouter.route("/addusers").post(addUsers);
UserRouter.post("/login", userLogin);

module.exports = UserRouter;
