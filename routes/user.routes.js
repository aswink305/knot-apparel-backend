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
  newsalesOrder,
  getMyOrders,
  addaddress,
  getalladdress,
  editAddress,
  updatelocationId,
  removeaddress
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
UserRouter.post("/newsalesOrder", newsalesOrder);
UserRouter.get("/getMyOrders", getMyOrders);
UserRouter.post("/addaddress", addaddress);
UserRouter.get("/getalladdress", getalladdress);
UserRouter.post("/editAddress", editAddress);
UserRouter.post("/updatelocationId", updatelocationId);
UserRouter.post("/removeaddress",removeaddress)

module.exports = UserRouter;
