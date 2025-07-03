const { getCurrentDateInIST, istDate, logger, prisma } = require("../../utils");
require("dotenv").config();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const csv = require("csv-parser");
const fs = require("fs");

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

const userLogin = async (request, response) => {
  console.log("userLogin========>>", request.body);
  const { email, password } = request.body;

  if (!email || !password) {
    return response.status(401).json({
      error: true,
      success: false,
      message: "Email and password required",
    });
  }
  try {
    const user = await prisma.users.findFirst({
      where: { email: email },
    });

    if (!user) {
      return response.status(401).json({
        error: true,
        success: false,
        message: "Incorrect Email or password!",
      });
    }

    const logged_id = user.id;
    const hashedDbPassword = user.password;
    bcrypt.compare(password, hashedDbPassword, async function (err, result) {
      if (err) {
        return response.status(500).json({
          error: true,
          success: false,
          message: "Password hashing error",
        });
      }

      if (!result) {
        return response.status(401).json({
          error: true,
          success: false,
          message: "Please check your password!",
        });
      }
      return response.status(200).json({
        success: true,
        error: false,
        message: "Login successful",
        logged_id: logged_id,
      });
    });
  } catch (error) {
    console.log("errr", error);
    // logger.error(`Internal server error: ${error.message} in userLogin api`);
    return response.status(500).json({
      error: true,
      success: false,
      message: "Internal Server Error!",
    });
  }
};
module.exports = {
  userLogin,
  addUsers,
};
