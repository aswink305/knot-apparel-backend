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
  const { email, password, name, verificationFrom } = request.body;

  if (!email || !verificationFrom) {
    return response.status(400).json({
      error: true,
      success: false,
      message: "Email and verificationFrom are required",
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
  console.log("reeeee", req.headers);
  const token = req.headers.token;

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

module.exports = {
  userLogin,
  addUsers,
  getUserById,
};
