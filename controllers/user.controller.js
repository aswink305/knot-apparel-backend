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

    return res.status(200).json({
      success: true,
      error: false,
      data: user,
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
          quantity: existingCartItem.quantity + parseInt(quantity),
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

// const newsalesOrder = async (request, response) => {
//   // const usertype=request.user.userType
//   console.log("newsaless====================>", request.body);

//   try {
//     // if(usertype==="ADM" || usertype==="SU"){
//     const customer_id = request.body.customer_id;
//     if (request.body.customer_id !== undefined) {
//       await prisma.$transaction(async (prisma) => {
//         const twoDigits = currentDate.getFullYear();
//         const lastFourDigits = twoDigits.toString().slice(-2);

//         const so_num = lastFourDigits.toUpperCase();

//         const existingsalesOrders = await prisma.sales_order.findMany({
//           where: { customer_id: customer_id },
//         });

//         const newid = existingsalesOrders.length + 1;
//         const formattedNewId = ("0000" + newid).slice(-4);
//         const so_number = so_num + formattedNewId;
//         const total_amt = parseFloat(request.body.tl_amt).toFixed(2);

//         const so_status = request.body.so_status;

//         const prod_list = request.body.products;
//         const address = parseInt(request.body.address);
//         const prod_name_array = prod_list.map((prod) => prod.product_id);
//         if (!so_status && !prod_list) {
//           response.status(404).json({
//             error: true,
//             message: "Check required fields",
//           });
//           return;
//         }
//         const products = await prisma.product_master.findMany({
//           where: { product_id: { in: prod_name_array } },
//           select: {
//             product_id: true,
//             product_name: true,
//           },
//         });
//         const prod_final_array = prod_list.map((prod) => {
//           const matchedProduct = products.find(
//             (p) => p.product_id === prod.product_id
//           );

//           return {
//             prod_id: matchedProduct.product_id,
//             qty: prod.qty,
//             amt: prod.selling_price,
//           };
//         });

//         const sales_orderdata = await prisma.sales_order_new.create({
//           data: {
//             so_number: so_number,
//             total_amount: total_amt,
//             quote_document_link1: quotation_link,
//             so_status,
//             remarks,
//             // created_by,
//             created_date: istDate,
//             discount: discount || 0,
//             updated_date: istDate,
//             customer_id: customer_id,
//             // logistics_id,
//             so_notes,
//           },
//         });

//         let taskStatus = "forpacking";
//         for (let i = 0; i < prod_list.length; i++) {
//           const product = prod_list[i];
//           const delivery_type = product.selecttype;
//           if (delivery_type === "fitted" || delivery_type === "Fitted") {
//             taskStatus = "forfitting";
//           }
//           const productAccessories = product?.products_accessories || [];
//           //inventory--parentproduct
//           const oldestInventoryEntries = await prisma.inventory.findMany({
//             where: {
//               prod_id: product.product_id,
//             },
//             select: {
//               batch_id: true,
//               total_quantity: true,
//               INVENTORY_id: true,
//               created_date: true,
//             },
//             orderBy: {
//               INVENTORY_id: "asc",
//             },
//           });
//           let qty = parseInt(product.qty);

//           const deductions = [];
//           for (let k = 0; k < oldestInventoryEntries.length; k++) {
//             const prodinv = oldestInventoryEntries[k].INVENTORY_id;
//             const batchId = oldestInventoryEntries[k].batch_id;

//             let totalqt = oldestInventoryEntries[k].total_quantity;
//             if (totalqt > 0 && qty > 0) {
//               if (qty >= totalqt) {
//                 // If qty is greater than or equal to totalqt, deduct totalqt from qty
//                 qty -= totalqt;
//                 deductions.push({
//                   INVENTORY_id: prodinv,
//                   batch_id: batchId,
//                   deductedQty: totalqt,
//                 });
//                 totalqt = 0; // Set total quantity to 0 as it's fully used up
//               } else {
//                 // If qty is less than totalqt, deduct qty from totalqt
//                 totalqt -= qty;
//                 deductions.push({
//                   INVENTORY_id: prodinv,
//                   batch_id: batchId,
//                   deductedQty: qty,
//                 });
//                 qty = 0;
//               }

//               const invupdate = await prisma.inventory.updateMany({
//                 where: {
//                   INVENTORY_id: prodinv,
//                 },
//                 data: {
//                   total_quantity: totalqt,
//                 },
//               });
//               if (qty === 0) {
//                 break;
//               }
//             }
//           }
//           const sales_price = product?.product_Price
//             ? parseInt(product.product_Price)
//             : parseInt(product?.original_price); //nw

//           const salesListEntryResult = await prisma.sales_list.create({
//             data: {
//               so_number: sales_orderdata.sales_id,
//               product_id: product.product_id,
//               order_qty: parseInt(product.qty),
//               sales_price: sales_price, //actually selling_price// changed from original_price
//               fitting_charge: parseInt(product.fitting_charge) || 0,
//               delivery_type: product.selecttype,
//               net_amount: parseFloat(product.total).toFixed(2),
//               discount: parseInt(product?.normalDiscount?.discount) || 0, //nw
//               batch: deductions,
//               created_date: istDate,
//               couponCode: product?.couponDiscount?.couponCode, //nw
//             },
//           });
//           //////inventoryaccessories////////////////
//           const accessorydeductions = [];
//           for (let j = 0; j < productAccessories.length; j++) {
//             const accessory = productAccessories[j];
//             const inventoryaccessories = await prisma.inventory.findMany({
//               where: {
//                 prod_id: accessory.prod_id,
//               },
//               select: {
//                 batch_id: true,
//                 total_quantity: true,
//                 INVENTORY_id: true,
//                 created_date: true,
//               },
//               orderBy: {
//                 INVENTORY_id: "asc",
//               },
//             });
//             let accqty = accessory.qty;

//             for (l = 0; l < inventoryaccessories.length; l++) {
//               const prodinv = inventoryaccessories[l].INVENTORY_id;
//               let totalqt = inventoryaccessories[l].total_quantity;
//               const batch = inventoryaccessories[l].batch_id;

//               if (totalqt > 0 && accqty > 0) {
//                 if (accqty >= totalqt) {
//                   accqty -= totalqt;
//                   accessorydeductions.push({
//                     INVENTORY_id: prodinv,
//                     batch_id: batch,
//                     deductedQty: totalqt,
//                   });
//                   totalqt = 0;
//                 } else {
//                   // If qty is less than totalqt, deduct qty from totalqt
//                   totalqt -= accqty;
//                   accessorydeductions.push({
//                     INVENTORY_id: prodinv,
//                     batch_id: batch,
//                     deductedQty: accqty,
//                   });
//                   accqty = 0;
//                 }

//                 const invupdate = await prisma.inventory.updateMany({
//                   where: {
//                     INVENTORY_id: prodinv,
//                   },
//                   data: {
//                     total_quantity: totalqt,
//                   },
//                 });

//                 if (accqty === 0) {
//                   break;
//                 }
//               }
//             }
//             await prisma.sales_list_accessories.create({
//               data: {
//                 so_number: sales_orderdata.sales_id,
//                 parent_product_id: product.product_id,
//                 product_id: accessory.prod_id,
//                 order_qty: parseInt(accessory.qty),
//                 sales_price: parseInt(accessory.price),
//                 net_amt: accessory.ac_tl_Price,
//                 // created_by: created_by,
//                 created_date: istDate,
//               },
//             });
//           }
//         }

//         if (so_status == "placed") {
//           const so_update = await prisma.sales_order_new.update({
//             where: {
//               so_number: so_number,
//             },
//             data: {
//               so_status: taskStatus,
//             },
//           });
//           const respText = `sales order ${so_number} has  ${so_status} successfully`;
//           const notification = await prisma.cus_notification.create({
//             data: {
//               text: respText,
//               receiver: customer_id,
//               read: "N",
//               type: "OR",
//               created_date: istDate,
//               verification_id: so_number,
//             },
//           });
//           response.status(201).json({
//             data: sales_orderdata,
//             success: true,
//             message: respText,
//           });
//         } else {
//           const so_update = await prisma.sales_order_new.update({
//             where: {
//               so_number: so_number,
//             },
//             data: {
//               so_status: so_status,
//             },
//           });
//           const respText = `sales order ${so_status} successfully`;
//           response.status(201).json({
//             data: sales_orderdata,
//             success: true,
//             message: respText,
//           });
//         }
//       });
//     }
//   } catch (error) {
//     logger.error(`An error occurred: ${error.message} in newsaleorders api`);
//     response.status(500).json({ error: "Internal server error" });
//   } finally {
//     await prisma.$disconnect();
//   }
// };

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
};
