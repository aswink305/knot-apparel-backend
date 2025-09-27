const express = require("express");
const { getProducts, productadd } = require("../controllers/product.controller");
const { upload } = require("../middleware/Uploadimage");
const ProductRouter = express.Router();

ProductRouter.post("/productadd", upload.array("image"), productadd);
ProductRouter.get("/getProducts", getProducts);

module.exports = ProductRouter;
