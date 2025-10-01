const { request } = require("express");
const { prisma } = require("../utils");
require("dotenv").config();

const addNewProduct = async (req, res) => {
  console.log("Adding new product data:", req.body);

  try {
    const {
      product_name,
      description,
      price,
      size,
      color,
      color_name,
      quantity,
      product_type,
    } = req.body;

    // Validations
    if (!product_name)
      return res.status(400).json("Product Name cannot be blank");
    if (!product_type)
      return res.status(400).json("Please choose product type");

    const images = req.files?.map((file) => file.key); // array of S3 keys
    if (!images || images.length === 0)
      return res.status(400).json("At least one image is required");

    // Generate next product_code
    const lastProduct = await prisma.product_master.findFirst({
      orderBy: { product_code: "desc" },
      select: { product_code: true },
    });

    let nextNumber = 1;
    if (lastProduct && lastProduct.product_code) {
      const lastNumber = parseInt(lastProduct.product_code.slice(1), 10);
      if (!isNaN(lastNumber)) nextNumber = lastNumber + 1;
    }
    const product_code = `D${String(nextNumber).padStart(4, "0")}`;
    const now = new Date();

    // Convert numeric fields
    const quantityInt = parseInt(quantity, 10);
    if (isNaN(quantityInt))
      return res.status(400).json("Quantity must be a number");

    // Convert price to string (since DB expects VARCHAR)
    const priceStr = price.toString();

    // Create product
    const newProduct = await prisma.product_master.create({
      data: {
        product_code,
        product_name,
        description,
        product_type,
        price: priceStr,
        size,
        color,
        color_name,
        images: images,
        quantity: quantityInt,
        status: "Active",
        created_date: now,
        updated_date: now,
      },
    });

    console.log("newProduct----", newProduct);
    res
      .status(201)
      .json(`${product_name} added to the Product master successfully.`);
  } catch (err) {
    console.error("Error in productadd:", err.message);
    res.status(500).json("Internal Server Error");
  } finally {
    await prisma.$disconnect();
  }
};

const deleteProduct = async (request, response) => {
  console.log("Deleting product data:", request.params);

  try {
    const { product_id } = request.params;

    const id = parseInt(product_id);
    if (!id) return response.status(400).json("Product id cannot be null");

    const productToDelete = await prisma.product_master.findUnique({
      where: {
        product_id: id,
      },
      select: {
        product_name: true,
      },
    });

    if (!productToDelete) {
      return response.status(404).json("Product not found");
    }
    const deleteProduct = await prisma.product_master.update({
      where: {
        product_id: id,
      },
      data: {
        status: "Inactive",
      },
    });
    console.log("deleteProduct----", deleteProduct);
    response
      .status(201)
      .json(`${productToDelete.product_name} deleted successfully`);
  } catch (err) {
    console.error("Error in deleteProduct:", err.message);
    response.status(500).json("Internal Server Error");
  } finally {
    await prisma.$disconnect();
  }
};

const updateProduct = async (req, res) => {
  try {
    // Destructure incoming data
    let {
      product_id,
      product_name,
      description,
      price,
      size,
      color,
      color_name,
      quantity,
      product_type,
      existing_images, // array of previously uploaded images
    } = req.body;

    // Convert product_id to integer
    const productIdInt = parseInt(product_id, 10);
    if (isNaN(productIdInt)) return res.status(400).json("Invalid product id");

    // Find the product first
    const findProduct = await prisma.product_master.findFirst({
      where: { product_id: productIdInt },
    });

    if (!findProduct) return res.status(404).json("Product not found");

    // Handle uploaded images from multer
    const uploadedImages = req.files?.map((file) => file.key) || [];

    // Merge existing images with new uploads
    let imagesToSave = [];
    if (existing_images) {
      const parsedExisting =
        typeof existing_images === "string"
          ? JSON.parse(existing_images)
          : existing_images;
      imagesToSave = [...parsedExisting, ...uploadedImages];
    } else {
      imagesToSave = uploadedImages;
    }

    if (!imagesToSave.length)
      return res.status(400).json("At least one image is required");

    // Update the product
    const updatedProduct = await prisma.product_master.update({
      where: { product_id: productIdInt },
      data: {
        product_name,
        description,
        product_type,
        price: price.toString(),
        size,
        color,
        color_name,
        images: imagesToSave,
        quantity: parseInt(quantity, 10),
        updated_date: new Date(),
      },
    });

    console.log("Updated Product:", updatedProduct);
    res.status(201).json(`${product_name} updated successfully.`);
  } catch (err) {
    console.error("Error in updateProduct:", err.message);
    res.status(500).json("Internal Server Error");
  } finally {
    await prisma.$disconnect();
  }
};

const productDetails = async (request, response) => {
  console.log("single product detail:", request.body);

  try {
    const { product_id } = request.body;

    if (!product_id)
      return response.status(400).json("Product id cannot be null");

    const getProductDetails = await prisma.product_master.findUnique({
      where: {
        product_id,
      },
    });

    if (!getProductDetails) {
      return response.status(404).json("Product not found");
    }

    response.status(201).json({
      success: true,
      message: "Succesfully fetched product details",
      data: getProductDetails,
    });
  } catch (err) {
    console.error("Error while fetching product details:", err.message);
    response.status(500).json("Internal Server Error");
  } finally {
    await prisma.$disconnect();
  }
};

const getUserDetails = async (request, response) => {
  try {
    const userData = await prisma.user_details.findMany({
      orderBy: {
        created_date: "desc",
      },
    });

    response.status(200).json({
      success: true,
      error: false,
      data: userData,
    });
  } catch (err) {
    console.error("Error in userData:", err.message);
    response.status(500).json("Internal Server Error");
  } finally {
    await prisma.$disconnect();
  }
};

const getCustomerOrder = async (request, response) => {
  try {
    const orderDetails = await prisma.customer_cart.findMany();

    const orders = [];

    for (const order of orderDetails) {
      const customer = await prisma.user_details.findUnique({
        where: {
          id: order.customer_id,
        },
      });

      const product = await prisma.product_master.findUnique({
        where: {
          product_id: order.product_id,
        },
      });

      orders.push({
        id: order.id,
        customer: customer ? customer : {},
        product: product ? product : {},
        quantity: order.quantity,
      });
    }

    response.status(200).json({
      success: true,
      error: false,
      data: orders,
    });
  } catch (err) {
    console.error("Error while finding order details:", err.message);
    response.status(500).json("Internal Server Error");
  } finally {
    await prisma.$disconnect();
  }
};

const getDashboardCounts = async (request, response) => {
  try {
    const [userCount, productCount, orderCount] = await Promise.all([
      prisma.user_details.count(),
      prisma.product_master.count(),
      prisma.customer_cart.count(),
    ]);

    response.status(200).json({
      success: true,
      error: false,
      data: {
        userCount,
        productCount,
        orderCount,
      },
    });
  } catch (err) {
    console.error("Error in getDashboardCounts:", err.message);
    response.status(500).json("Internal Server Error");
  } finally {
    await prisma.$disconnect();
  }
};

const getOrders = async (request, response) => {
  try {
    const orders = await prisma.sales_order.findMany({
      include: {
        customer_addressid: true,
      },
      orderBy: {
        created_date: "desc",
      },
    });

    for (const order of orders) {
      const sales = await prisma.sales_list.findMany({
        where: { so_number: order.sales_id },
        include: {
          product_master: true,
        },
        orderBy: {
          created_date: "desc",
        },
      });
      order.sales_list = sales;
    }

    return response.status(200).json({
      success: true,
      orders,
    });
  } catch (error) {
    logger.error(`An error occurred in getMyOrders: ${error.message}`);
    return response.status(500).json({
      success: false,
      message: "Internal server error",
    });
  } finally {
    await prisma.$disconnect();
  }
};

const updateorderstatus = async (request, response) => {
  console.log("update order data:", request.body);

  try {
    const { sales_id, so_status } = request.body;

    if (!sales_id) return response.status(400).json("sales_id cannot be null");

    const now = new Date();
    const findsales = await prisma.sales_order.findFirst({
      where: {
        sales_id,
      },
    });
    if (!findsales) {
      return response.status(404).json("Order not found");
    }

    const updateSales = await prisma.sales_order.update({
      where: {
        sales_id,
      },
      data: {
        so_status: so_status,
      },
    });

    response.status(201).json(`${sales_id} updated successfully.`);
  } catch (err) {
    console.error("Error in sales update:", err.message);
    response.status(500).json("Internal Server Error");
  } finally {
    await prisma.$disconnect();
  }
};

module.exports = {
  addNewProduct,
  deleteProduct,
  updateProduct,
  productDetails,
  getUserDetails,
  getCustomerOrder,
  getDashboardCounts,
  getOrders,
  updateorderstatus,
};
