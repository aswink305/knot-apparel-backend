const express = require("express");
const {
  addUsers,
  userLogin,
  getUserById,
  removeFromCart,
  getCart,
  addToCart,
  removeFromWishList,
  getCustomerWishList,
  customerWishList,
} = require("../controllers/user.controller");

const UserRouter = express.Router();

UserRouter.route("/addusers").post(addUsers);
UserRouter.post("/login", userLogin);
UserRouter.get("/getUserById", getUserById);
UserRouter.post("/wishlist", customerWishList);
UserRouter.get("/getwishlist", getCustomerWishList);
UserRouter.post("/removewishlist", removeFromWishList);
UserRouter.post("/addtocart", addToCart);
UserRouter.get("/getcart", getCart);
UserRouter.post("/removefromcart", removeFromCart);

module.exports = UserRouter;
