const { getCurrentDateInIST, istDate, logger, prisma } = require("../utils");
require("dotenv").config();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const csv = require("csv-parser");
const fs = require("fs");

const productadd = async (request, response) => {
  console.log("Incoming product data:", request.body);

  try {
    const {
      name,
      product_desc,
      Product_type: product_type,
      brand,
      color,
      color_family,
      product_code,
    } = JSON.parse(request.body.data);

    const product_image = req.files;
    let ProductImage = {};

    for (i = 0; i < product_image?.length; i++) {
      let keyName = `image${i + 1}`;

      ProductImage[keyName] = product_image[i].location;
    }
    // Basic validation
    if (!name) return response.status(400).json("Product Name cannot be blank");
    if (!product_type)
      return response.status(400).json("Please choose product type");
    if (!brand) return response.status(400).json("Please choose product brand");

    // Check if product_code already exists
    if (product_code) {
      const existing = await prisma.product_master.findUnique({
        where: { product_code },
        select: { product_code: true },
      });
      if (existing) {
        return response
          .status(409)
          .json({ error: "Product code already used" });
      }
    }

    const now = new Date();

    const newProduct = await prisma.product_master.create({
      data: {
        product_code,
        product_name: name,
        product_desc,
        product_type,
        created_date: now,
        updated_date: now,
        color,
        color_family,
        images: ProductImage,
      },
    });

    response
      .status(201)
      .json(`${name} added to the Product master successfully.`);
  } catch (err) {
    console.error("Error in productadd:", err.message);
    response.status(500).json("Internal Server Error");
  } finally {
    await prisma.$disconnect();
  }
};

const getProducts = async (request, response) => {
  try {
    const products = await prisma.product_master.findMany({
      orderBy: {
        created_date: "desc",
      },
    });

    response.status(200).json({
      success: true,
      error: false,
      data: products,
    });
  } catch (err) {
    console.error("Error in getProducts:", err.message);
    response.status(500).json("Internal Server Error");
  } finally {
    await prisma.$disconnect();
  }
};

module.exports = {
  productadd,
  getProducts,
};
