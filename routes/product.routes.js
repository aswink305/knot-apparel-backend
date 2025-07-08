const express = require("express");
const { getProducts, productadd } = require("../controllers/product.controller");

const ProductRouter = express.Router();

ProductRouter.post("/productadd", productadd);
ProductRouter.get("/getProducts", getProducts);

module.exports = ProductRouter;
