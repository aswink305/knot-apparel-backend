const express = require("express");
const {
  addNewProduct,
  deleteProduct,
  updateProduct,
  productDetails,
  getUserDetails,
  getCustomerOrder,
  getDashboardCounts,
  getOrders,
  updateorderstatus
} = require("../controllers/admin.controller");
const AdminRouter = express.Router();

AdminRouter.post("/addProduct", addNewProduct);
AdminRouter.delete("/deleteProduct/:product_id", deleteProduct);
AdminRouter.put("/updateProduct", updateProduct);
AdminRouter.post("/productDetails", productDetails);
AdminRouter.get("/getUserDetails", getUserDetails);
AdminRouter.get("/getCustomerOrder", getCustomerOrder);
AdminRouter.get("/getDashboardCounts", getDashboardCounts);
AdminRouter.get("/getOrders", getOrders);
AdminRouter.post("/updateorderstatus", updateorderstatus);
module.exports = AdminRouter;
