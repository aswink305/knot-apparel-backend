const {prisma} = require("../utils")
require("dotenv").config();

const addNewProduct = async (request, response) => {
  console.log("Adding new product data:", request.body);

  try {
    const {
      product_name,
      image, 
      description,
      price,
      size,
      color,
      product_type
    } = request.body;

  
    if (!product_name) return response.status(400).json("Product Name cannot be blank");
    if (!product_type)
      return response.status(400).json("Please choose product type");

    const lastProduct = await prisma.product_master.findFirst({
      orderBy: {
        product_code: 'desc' 
      },
      select: {
        product_code: true
      }
    });
     let nextNumber = 1;
    if (lastProduct && lastProduct.product_code) {
      const lastNumber = parseInt(lastProduct.product_code.slice(1), 10);
      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }
    const product_code = `D${String(nextNumber).padStart(4, '0')}`;
    const now = new Date();

    const newProduct = await prisma.product_master.create({
      data: {
        product_code,
        product_name,
        description,
        product_type,
        price,
        size,
        color,
        image,
        created_date: now,
        updated_date: now,
      },
    });
    console.log("newProduct----",newProduct)
    response
      .status(201)
      .json(`${product_name} added to the Product master successfully.`);
  } catch (err) {
    console.error("Error in productadd:", err.message);
    response.status(500).json("Internal Server Error");
  } finally {
    await prisma.$disconnect();
  }
}

const deleteProduct = async (request, response) => {
  console.log("Deleting product data:", request.body);

  try {
    const {
     product_id
    } = request.body;

  
    if (!product_id) return response.status(400).json("Product id cannot be null");

      const productToDelete = await prisma.product_master.findUnique({
      where: {
        product_id,
      },
      select: {
        product_name: true,
      },
    });

    if (!productToDelete) {
      return response.status(404).json("Product not found");
    }
    const deleteProduct = await prisma.product_master.delete({
     where:{
      product_id
     }
    });
    console.log("deleteProduct----",deleteProduct)
    response
      .status(201)
      .json(`${productToDelete.product_name} deleted successfully`);
  } catch (err) {
    console.error("Error in deleteProduct:", err.message);
    response.status(500).json("Internal Server Error");
  } finally {
    await prisma.$disconnect();
  }
}

const updateProduct = async (request, response) => {
  console.log("update product data:", request.body);

  try {
    const {
      product_id,
      product_name,
      image, 
      description,
      price,
      size,
      color,
      product_type
    } = request.body;

  
    if (!product_id) return response.status(400).json("Product id cannot be null");
   
    const now = new Date();
    const findProduct = await prisma.product_master.findFirst({
     where:{
      product_id
     },
      select: {
        product_name: true,
      }
    });
    if (!findProduct) {
      return response.status(404).json("Product not found");
    }
     
    const updateProduct = await prisma.product_master.update({
      where:{
        product_id
      },
      data: {
       product_name,
        description,
        product_type,
        price,
        size,
        color,
        image,
        updated_date: now,
      },
    });
    console.log("newProduct----",updateProduct)
    response
      .status(201)
      .json(`${findProduct.product_name} updated successfully.`);
  } catch (err) {
    console.error("Error in productadd:", err.message);
    response.status(500).json("Internal Server Error");
  } finally {
    await prisma.$disconnect();
  }
}

const productDetails = async (request, response) => {
  console.log("single product detail:", request.body);

  try {
    const {
     product_id
    } = request.body;

  
    if (!product_id) return response.status(400).json("Product id cannot be null");

      const getProductDetails = await prisma.product_master.findUnique({
      where: {
        product_id,
      }
     
    });

    if (!getProductDetails) {
      return response.status(404).json("Product not found");
    }
    
    response.status(201).json({
      success:true,
      message:"Succesfully fetched product details",
      data:getProductDetails
    });

  } catch (err) {
    console.error("Error while fetching product details:", err.message);
    response.status(500).json("Internal Server Error");
  } finally {
    await prisma.$disconnect();
  }
}














module.exports = {addNewProduct,deleteProduct,updateProduct,productDetails}