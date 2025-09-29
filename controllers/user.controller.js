const { getCurrentDateInIST, istDate, logger, prisma } = require("../utils");
require("dotenv").config();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const csv = require("csv-parser");
const fs = require("fs");
const verifyToken = require("../utils/verifytoken");

const addUsers = async (request, response) => {
  try {
    const {
      name: name,
      phone_no: phone_no,
      email: email,
      password: password,
    } = request.body;
    if (name && password && email && phone_no) {
      const mobileNumber = phone_no;
      if (validateMobileNumber(mobileNumber)) {
        console.log("Valid mobile number");
      } else {
        console.log("Invalid mobile number");
        const resptext = "Invalid mobile number";
        return response.status(401).json({
          error: true,
          success: false,
          message: resptext,
        });
      }
      function validateMobileNumber(mobileNumber) {
        // Regular expression for a valid 10-digit Indian mobile number
        const mobileNumberRegex = /^[6-9]\d{9}$/;
        return mobileNumberRegex.test(mobileNumber);
      }

      const email_id = email;
      if (validateEmail(email_id)) {
        console.log("Valid email address");
      } else {
        console.log("Invalid email address");
        const resptext = "Invalid email address";
        return response.status(401).json({
          error: true,
          success: false,
          message: resptext,
        });
      }
      function validateEmail(email_id) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        return emailRegex.test(email_id);
      }
      const users = await prisma.user_details.findMany();
      const emaillowercase = email.toLowerCase();
      for (const user of users) {
        const decryptedEmail = user.email;
        const decryptedPhone = user.phone_no;

        if (decryptedEmail === email || decryptedEmail === emaillowercase) {
          return response.status(400).json({
            error: true,
            message: "Email address already exists",
            success: false,
          });
        } else if (decryptedPhone === phone_no) {
          return response.status(400).json({
            error: true,
            message: "Phone number already exists",
            success: false,
          });
        }
      }
      const datetime = getCurrentDateInIST();
      const hashedPass = await bcrypt.hash(password, 5);
      const emailencrypted = emaillowercase;
      const phoneencrypted = phone_no;
      await prisma.user_details.create({
        data: {
          name: encrypt(name, secretKey),
          password: hashedPass,
          email: emailencrypted,
          datetime: datetime,
          phone_no: phoneencrypted,
          status: "Y",
        },
      });
      const respText = "Registered successfully";
      response.status(200).json({
        success: true,
        message: respText,
      });
    } else {
      logger.error(`All fields are mandatory in addUsers api`);
      response.status(500).json("All fields are mandatory");
    }
  } catch (error) {
    console.log(error);
    logger.error(`Internal server error: ${error.message} in addUsers api`);
    response.status(500).json("An error occurred");
  } finally {
    await prisma.$disconnect();
  }
};

// const userLogin = async (request, response) => {
//   console.log("userLogin========>>", request.body);
//   const { email, password, name, verificationFrom } = request.body;

//   if (!email || !verificationFrom) {
//     return response.status(401).json({
//       error: true,
//       success: false,
//       message: "Email and verificationFrom required",
//     });
//   }

//   try {
//     let user = await prisma.user_details.findFirst({
//       where: { email: email },
//     });

//     if (verificationFrom === "googleAuth") {
//       if (!user) {
//         user = await prisma.user_details.create({
//           data: { email, password, name, created_date: istDate },
//         });
//       }
//       const refreshTokenPayload = {
//         id: user.id,
//       };

//       const accessTokenPayload = {
//         id: user.id,
//       };

//       const refreshTokenOptions = {
//         expiresIn: "900m",
//       };

//       const accessTokenOptions = {
//         expiresIn: "5m",
//       };

//       const refreshToken = jwt.sign(
//         refreshTokenPayload,
//         process.env.REFRESH_TOKEN_SECRET,
//         refreshTokenOptions
//       );

//       const accessToken = jwt.sign(
//         accessTokenPayload,
//         process.env.ACCESS_TOKEN_SECRET,
//         accessTokenOptions
//       );

//       return response.status(200).json({
//         success: true,
//         error: false,
//         message: "Login successful",
//         logged_id: user.id,
//         refreshToken,
//         accessToken,
//       });
//     }

//     if (!user) {
//       return response.status(401).json({
//         error: true,
//         success: false,
//         message: "User not found",
//       });
//     }

//     if (user.password !== password) {
//       return response.status(401).json({
//         error: true,
//         success: false,
//         message: "Incorrect password",
//       });
//     }
//     const refreshTokenPayload = {
//       id: user.id,
//     };

//     const accessTokenPayload = {
//       id: user.id,
//     };

//     const refreshTokenOptions = {
//       expiresIn: "900m",
//     };

//     const accessTokenOptions = {
//       expiresIn: "5m",
//     };

//     const refreshToken = jwt.sign(
//       refreshTokenPayload,
//       process.env.REFRESH_TOKEN_SECRET,
//       refreshTokenOptions
//     );

//     const accessToken = jwt.sign(
//       accessTokenPayload,
//       process.env.ACCESS_TOKEN_SECRET,
//       accessTokenOptions
//     );

//     return response.status(200).json({
//       success: true,
//       error: false,
//       message: "Login successful",
//       logged_id: user.id,
//       refreshToken,
//       accessToken,
//     });
//   } catch (error) {
//     console.log("errr", error);
//     return response.status(500).json({
//       error: true,
//       success: false,
//       message: "Internal Server Error!",
//     });
//   }
// };

const userLogin = async (request, response) => {
  console.log("userLogin========>>", request.body);
  const { email, password, name, verificationFrom, role } = request.body;

  if (!email) {
    return response.status(400).json({
      error: true,
      success: false,
      message: "Email  are required",
    });
  }

  try {
    let user = await prisma.user_details.findFirst({
      where: { email },
    });

    // --- Handle Google Login ---
    if (verificationFrom === "googleAuth") {
      if (!user) {
        user = await prisma.user_details.create({
          data: {
            email,
            password,
            name,
            role,
            created_date: istDate,
          },
        });
      }
      const token = jwt.sign({ id: user.id }, process.env.secret);

      return response.status(200).json({
        success: true,
        error: false,
        message: "Login successful",
        logged_id: user.id,
        token,
        role: user?.role,
      });
    }

    // --- Handle Regular Email/Password Login ---
    if (!user) {
      return response.status(404).json({
        error: true,
        success: false,
        message: "User not found",
      });
    }

    if (user.password !== password) {
      return response.status(401).json({
        error: true,
        success: false,
        message: "Incorrect password",
      });
    }

    const token = jwt.sign({ id: user.id }, process.env.secret);
    console.log("tokentokentoken", token);
    return response.status(200).json({
      success: true,
      error: false,
      message: "Login successful",
      logged_id: user.id,
      token,
      role: user?.role,
    });
  } catch (error) {
    console.error("Login Error:", error);
    return response.status(500).json({
      error: true,
      success: false,
      message: "Internal Server Error",
    });
  }
};

const getUserById = async (req, res) => {
  console.log("reeeee", req.headers.authorization);
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "No token provided",
      resetToken: 1,
    });
  }

  let decoded;
  try {
    decoded = await verifyToken(token);
  } catch (err) {
    logger.error(`Token verification failed: ${err}`);
    return res.status(401).json({
      success: false,
      message: "Unauthorized user",
      Error: err,
      resetToken: 1,
    });
  }

  const id = decoded.id;
  console.log("idd", id);
  try {
    const user = await prisma.user_details.findUnique({
      where: { id: parseInt(id) },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: true,
        message: "User not found",
      });
    }
    let locationaddress = null;
    if (user.location_id) {
      locationaddress = await prisma.customer_address.findFirst({
        where: { id: user.location_id },
      });
    }

    const finaldata = {
      ...user,
      address: locationaddress,
    };
    return res.status(200).json({
      success: true,
      error: false,
      data: finaldata,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return res.status(500).json({
      success: false,
      error: true,
      message: "Internal server error",
    });
  }
};

const customerWishList = async (req, res) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "No token provided",
      resetToken: 1,
    });
  }

  let decoded;
  try {
    decoded = await verifyToken(token);
  } catch (err) {
    logger.error(`Token verification failed: ${err}`);
    return res.status(401).json({
      success: false,
      message: "Unauthorized user",
      Error: err,
      resetToken: 1,
    });
  }

  const logged_id = decoded.id;
  const { prod_id } = req.body;

  try {
    if (!logged_id || !prod_id) {
      logger.error(
        "customer_id or prod_id is undefined in customerWishList api"
      );
      return res.send("invalid request");
    }

    const existingWish = await prisma.customer_wish_list.findMany({
      where: {
        user_details: { id: logged_id },
        product_master: { product_id: prod_id },
      },
    });

    console.log("existingWish", existingWish);

    if (existingWish.length > 0) {
      const deletedItem = await prisma.customer_wish_list.deleteMany({
        where: {
          user_details: { id: logged_id },
          product_master: { product_id: prod_id },
        },
      });

      if (deletedItem.count >= 1) {
        return res.status(200).json({
          success: true,
          message: "successfully removed from wishlist",
        });
      }
    }

    await prisma.customer_wish_list.create({
      data: {
        user_details: { connect: { id: logged_id } },
        product_master: { connect: { product_id: prod_id } },
      },
    });

    return res.status(201).json({
      success: true,
      message: "successfully wishlisted",
    });
  } catch (error) {
    console.log(error);
    logger.error(
      `Internal server error: ${error.message} in customer- customerwishlist api`
    );
    return res.status(500).json({
      message: "internal server error",
    });
  } finally {
    await prisma.$disconnect();
  }
};

const getCustomerWishList = async (req, res) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "No token provided",
      resetToken: 1,
    });
  }

  let decoded;
  try {
    decoded = await verifyToken(token);
  } catch (err) {
    logger.error(`Token verification failed: ${err}`);
    return res.status(401).json({
      success: false,
      message: "Unauthorized user",
      Error: err,
      resetToken: 1,
    });
  }

  const logged_id = decoded.id;
  console.log("logged_id", logged_id);
  try {
    const getdata = await prisma.customer_wish_list.findMany({
      where: {
        customer_id: logged_id,
      },
      include: {
        product_master: {
          select: {
            product_name: true,
            product_id: true,
            description: true,
            price: true,
            size: true,
          },
        },
      },
    });
    console.log("getdatagetdata", getdata);

    return res.status(200).json({
      success: true,
      data: getdata,
    });
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in getCustomerWishList API`
    );
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const removeFromWishList = async (req, res) => {
  const { prod_id } = req.body;
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "No token provided",
      resetToken: 1,
    });
  }

  let decoded;
  try {
    decoded = await verifyToken(token);
  } catch (err) {
    logger.error(`Token verification failed: ${err}`);
    return res.status(401).json({
      success: false,
      message: "Unauthorized user",
      Error: err,
      resetToken: 1,
    });
  }

  const customer_id = decoded.id;

  if (!customer_id || !prod_id) {
    logger.error(
      "customer_id or prod_id is undefined in customer-removeFromWishList api"
    );
    return res.status(400).json({
      error: true,
      message: "invalid request",
    });
  }
  try {
    const deletedItem = await prisma.customer_wish_list.deleteMany({
      where: {
        customer_id: customer_id,
        prod_id: prod_id,
      },
    });
    if (deletedItem.count === 1) {
      res.status(200).json({
        success: true,
        message: "successfully removed product ",
      });
    } else {
      logger.error("invalid data in removeFromWishList api");
      res.status(400).json({
        error: true,
        message: "invalid data",
      });
    }
  } catch (error) {
    res.status(500).json({
      error: "internal server error",
    });
    logger.error(
      `Internal server error: ${error.message} in customer- removewishlist api`
    );
  } finally {
    await prisma.$disconnect();
  }
};

const addToCart = async (req, res) => {
  console.log("reeeeeeee", req.body);
  const { prod_id, quantity } = req.body;

  try {
    const token = req.headers.authorization;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
        resetToken: 1,
      });
    }

    let decoded;
    try {
      decoded = await verifyToken(token);
    } catch (err) {
      logger.error(`Token verification failed: ${err}`);
      return res.status(401).json({
        success: false,
        message: "Unauthorized user",
        Error: err,
        resetToken: 1,
      });
    }

    const customer_id = decoded.id;

    // 🛠 Validate inputs
    if (!customer_id || !prod_id || !quantity || isNaN(quantity)) {
      logger.error("Invalid inputs in addToCart API");
      return res.status(400).json({
        success: false,
        message: "Invalid request data",
      });
    }

    // ✅ FIX: Use actual column names from model (`customer_id`, `product_id`)
    const existingCartItem = await prisma.customer_cart.findFirst({
      where: {
        customer_id: customer_id,
        product_id: prod_id,
      },
    });

    if (existingCartItem) {
      const updated = await prisma.customer_cart.update({
        where: {
          id: existingCartItem.id, // ✅ Use unique ID
        },
        data: {
          quantity: parseInt(quantity),
        },
      });
      return res.status(200).json({
        success: false,
        message: "Product added in cart",
      });
    }

    const created = await prisma.customer_cart.create({
      data: {
        customer_id: customer_id,
        product_id: prod_id,
        quantity: parseInt(quantity),
      },
    });

    return res.status(201).json({
      success: true,
      message: "Successfully added to cart",
      data: created,
    });
  } catch (error) {
    logger.error(`Internal server error: ${error.message} in addToCart API`);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  } finally {
    await prisma.$disconnect();
  }
};

const getCart = async (req, res) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "No token provided",
      resetToken: 1,
    });
  }

  let decoded;
  try {
    decoded = await verifyToken(token);
  } catch (err) {
    logger.error(`Token verification failed: ${err}`);
    return res.status(401).json({
      success: false,
      message: "Unauthorized user",
      Error: err,
      resetToken: 1,
    });
  }

  const logged_id = decoded.id;
  console.log("logged_id", logged_id);
  try {
    const getdata = await prisma.customer_cart.findMany({
      where: {
        customer_id: logged_id,
      },
      include: {
        product_master: {
          select: {
            product_name: true,
            product_id: true,
            description: true,
            price: true,
            size: true,
          },
        },
      },
       orderBy: {
        created_date: "desc",
      },
    });

    return res.status(200).json({
      success: true,
      data: getdata,
    });
  } catch (error) {
    logger.error(
      `Internal server error: ${error.message} in getCustomerWishList API`
    );
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const removeFromCart = async (req, res) => {
  const { prod_id } = req.body;

  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "No token provided",
      resetToken: 1,
    });
  }

  let decoded;
  try {
    decoded = await verifyToken(token);
  } catch (err) {
    logger.error(`Token verification failed: ${err}`);
    return res.status(401).json({
      success: false,
      message: "Unauthorized user",
      Error: err,
      resetToken: 1,
    });
  }

  const customer_id = decoded.id;
  if (!customer_id || !prod_id) {
    logger.error("customer_id or prod_id undefined in removefromCart api");
    return res.status(400).json({
      error: true,
      message: "invalid request",
    });
  }
  try {
    await prisma.customer_cart.deleteMany({
      where: {
        customer_id: customer_id,
        product_id: parseInt(prod_id),
      },
    });
    res.status(200).json({
      success: true,
      message: "successfully deleted",
    });
  } catch (error) {
    res.status(500).json({
      error: "internal server error",
    });
    logger.error(
      `Internal server error: ${error.message} in customer-removefromcart api`
    );
  } finally {
    await prisma.$disconnect();
  }
};

const newsalesOrder = async (request, response) => {
  try {
    const token = request.headers.authorization;

    if (!token) {
      return response.status(401).json({
        success: false,
        message: "No token provided",
        resetToken: 1,
      });
    }

    let decoded;
    try {
      decoded = await verifyToken(token);
    } catch (err) {
      logger.error(`Token verification failed: ${err}`);
      return response.status(401).json({
        success: false,
        message: "Unauthorized user",
        Error: err,
        resetToken: 1,
      });
    }
    console.log("newsalesorderrrr", request.body);
    const customer_id = decoded.id;

    const istDate = new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
    );
    const currentYear = istDate.getFullYear().toString().slice(-2);

    await prisma.$transaction(async (tx) => {
      const { so_status, total_amount, products, address, address_id } =
        request.body;

      const existingsalesOrders = await tx.sales_order.findMany({
        where: { customer_id },
      });

      const newId = existingsalesOrders.length + 1;
      const formattedNewId = ("0000" + newId).slice(-4);
      const so_number = `${currentYear}${formattedNewId}`;

      const sales_orderdata = await tx.sales_order.create({
        data: {
          so_number,
          total_amount,
          so_status,
          customer_address: address,
          created_date: istDate,
          address_id,
          customer_id,
        },
      });

      for (const product of products) {
        await tx.sales_list.create({
          data: {
            so_number: sales_orderdata.sales_id,
            product_id: product.product_id,
            order_qty: parseInt(product.quantity),
            sales_price: parseInt(product.sales_price),
            created_date: istDate,
          },
        });
      }

      // ✅ Use tx + correct model name
      await tx.customer_cart.deleteMany({
        where: { customer_id },
      });
    });

    console.log("fhfgfhj");
    return response
      .status(200)
      .json({ success: true, message: "Sales order created successfully" });
  } catch (error) {
    console.log("errrrrr", error);
    logger.error(`An error occurred: ${error.message} in newsalesOrder API`);
    response
      .status(500)
      .json({ success: false, error: "Internal server error" });
  } finally {
    await prisma.$disconnect();
  }
};

const getMyOrders = async (request, response) => {
  try {
    const token = request.headers.authorization;

    if (!token) {
      return response.status(401).json({
        success: false,
        message: "No token provided",
        resetToken: 1,
      });
    }

    let decoded;
    try {
      decoded = await verifyToken(token);
    } catch (err) {
      logger.error(`Token verification failed: ${err}`);
      return response.status(401).json({
        success: false,
        message: "Unauthorized user",
        resetToken: 1,
      });
    }

    const customer_id = decoded.id;

    const orders = await prisma.sales_order.findMany({
      where: { customer_id },
      include: {
        customer_addressid: true,
      },
      orderBy: {
        created_date: "desc",
      },
    });
    console.log("orders", orders);
    for (const order of orders) {
      const sales = await prisma.sales_list.findMany({
        where: { so_number: order.id },
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

const addaddress = async (request, response) => {
  try {
    const token = request.headers.authorization;

    if (!token) {
      return response.status(401).json({
        success: false,
        message: "No token provided",
        resetToken: 1,
      });
    }

    let decoded;
    try {
      decoded = await verifyToken(token);
    } catch (err) {
      logger.error(`Token verification failed: ${err}`);
      return response.status(401).json({
        success: false,
        message: "Unauthorized user",
        resetToken: 1,
      });
    }

    const customer_id = decoded.id;

    const {
      address,
      city,
      state,
      land_mark,
      contact_number,
      full_name,
      pincode,
      default_flag,
    } = request.body;
    if (!customer_id) {
      return res
        .status(400)
        .json({ success: false, message: "Customer ID is required" });
    }
    const newAddress = await prisma.customer_address.create({
      data: {
        customer_id,
        full_name,
        address: address || null,
        city: city || null,
        state: state || null,
        land_mark: land_mark || null,
        contact_number: contact_number || null,
        pincode: pincode || null,
        default: default_flag,
        created_date: istDate,
        active_flag: true,
      },
    });
    const updatelocationId = await prisma.user_details.update({
      where: {
        id: customer_id,
      },
      data: {
        location_id: newAddress.id,
      },
    });
    console.log("addadressss", updatelocationId);
    return response.status(200).json({
      success: true,
      message: "Customer address added successfully",
      data: newAddress,
    });
  } catch (error) {
    logger.error(`An error occurred in getMyOrders: ${error.message}`);
    return response.status(500).json({
      success: false,
      message: error.message,
    });
  } finally {
    await prisma.$disconnect();
  }
};

const getalladdress = async (request, response) => {
  try {
    const token = request.headers.authorization;

    if (!token) {
      return response.status(401).json({
        success: false,
        message: "No token provided",
        resetToken: 1,
      });
    }

    let decoded;
    try {
      decoded = await verifyToken(token);
    } catch (err) {
      logger.error(`Token verification failed: ${err}`);
      return response.status(401).json({
        success: false,
        message: "Unauthorized user",
        resetToken: 1,
      });
    }

    const customer_id = decoded.id;

    const alldata = await prisma.customer_address.findMany({
      where: { customer_id, active_flag: true },
      orderBy: {
        created_date: "desc",
      },
    });

    return response.status(200).json({
      success: true,
      data: alldata,
    });
  } catch (error) {
    logger.error(`An error occurred in getMyOrders: ${error.message}`);
    return response.status(500).json({
      success: false,
      message: error.message,
    });
  } finally {
    await prisma.$disconnect();
  }
};

const editAddress = async (req, res) => {
  try {
    const token = req.headers.authorization;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
        resetToken: 1,
      });
    }

    let decoded;
    try {
      decoded = await verifyToken(token);
    } catch (err) {
      logger.error(`Token verification failed: ${err}`);
      return res.status(401).json({
        success: false,
        message: "Unauthorized user",
        resetToken: 1,
      });
    }

    const customer_id = decoded.id;
    const {
      id,
      address,
      full_name,
      city,
      state,
      land_mark,
      contact_number,
      pincode,
    } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Address ID is required for update",
      });
    }

    // Check if address belongs to this customer
    const existingAddress = await prisma.customer_address.findFirst({
      where: { id: id, customer_id: customer_id, active_flag: true },
    });

    if (!existingAddress) {
      return res.status(404).json({
        success: false,
        message: "Address not found or does not belong to the customer",
      });
    }

    const updatedAddress = await prisma.customer_address.update({
      where: { id: id },
      data: {
        address: address || existingAddress.address,
        city: city || existingAddress.city,
        state: state || existingAddress.state,
        land_mark: land_mark || existingAddress.land_mark,
        contact_number: contact_number || existingAddress.contact_number,
        pincode: pincode || existingAddress.pincode,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Customer address updated successfully",
      data: updatedAddress,
    });
  } catch (error) {
    logger.error(`An error occurred in editAddress: ${error.message}`);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  } finally {
    await prisma.$disconnect();
  }
};

const updatelocationId = async (request, response) => {
  try {
    const token = request.headers.authorization;

    if (!token) {
      return response.status(401).json({
        success: false,
        message: "No token provided",
        resetToken: 1,
      });
    }

    let decoded;
    try {
      decoded = await verifyToken(token);
    } catch (err) {
      logger.error(`Token verification failed: ${err}`);
      return response.status(401).json({
        success: false,
        message: "Unauthorized user",
        resetToken: 1,
      });
    }

    const customer_id = decoded.id;

    const { location_id } = request.body;
    if (!customer_id) {
      return res
        .status(400)
        .json({ success: false, message: "Customer ID is required" });
    }

    const updatelocationId = await prisma.user_details.update({
      where: {
        id: customer_id,
      },
      data: {
        location_id: location_id,
      },
    });
    console.log("addadressss", updatelocationId);
    return response.status(200).json({
      success: true,
      message: "Updated successfully",
      data: updatelocationId,
    });
  } catch (error) {
    logger.error(`An error occurred in getMyOrders: ${error.message}`);
    return response.status(500).json({
      success: false,
      message: error.message,
    });
  } finally {
    await prisma.$disconnect();
  }
};

const removeaddress = async (req, res) => {
  const { location_id } = req.body;

  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "No token provided",
      resetToken: 1,
    });
  }

  let decoded;
  try {
    decoded = await verifyToken(token);
  } catch (err) {
    logger.error(`Token verification failed: ${err}`);
    return res.status(401).json({
      success: false,
      message: "Unauthorized user",
      Error: err,
      resetToken: 1,
    });
  }

  const customer_id = decoded.id;
  if (!customer_id || !location_id) {
    logger.error("customer_id or location_id undefined in removeaddress api");
    return res.status(400).json({
      error: true,
      message: "invalid request",
    });
  }
  try {
    await prisma.customer_address.update({
      where: {
        id: location_id,
      },
      data: {
        active_flag: false,
      },
    });
    res.status(200).json({
      success: true,
      message: "successfully deleted",
    });
  } catch (error) {
    res.status(500).json({
      error: "internal server error",
    });
    logger.error(
      `Internal server error: ${error.message} in customer-removeaddress api`
    );
  } finally {
    await prisma.$disconnect();
  }
};

module.exports = {
  userLogin,
  addUsers,
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
  removeaddress,
};
