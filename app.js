'use strict';

const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const User = require("./model/user");
const databaseService = require("./config/database");
const authMiddleware = require("./middleware/auth");

const app = express();
databaseService.connect();

app.use(express.json({ limit: "5mb" }));

app.use(cors());
app.options("*", cors());
app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  next();
});

/**
 * API to login
 */
app.post("/api/v1/login", async (req, res) => {

  try {
    // Get user input
    const { email, password } = req.body;

    // Validate user input
    try {
      if (!email) {
        throw new Error("Email is required.");
      }

      if (!password) {
        throw new Error("Password is required.");
      }
    } catch (error) {
      return res.status(400).send(error.message || error);
    }

    // Validate if user exist in our database
    const userInfo = await User.findOne({ email: email.toLowerCase() });

    if (userInfo?._id) {

      const isValidPassword = await bcrypt.compare(password, userInfo.password);
      if (!isValidPassword) {
        return res.status(400).send("Invalid Credentials");
      }

      // Create token
      const token = jwt.sign({ user_id: userInfo._id, email }, process.env.TOKEN_KEY,
        {
          expiresIn: "2h",
        });

      // save user token
      const userObject = {
        id: userInfo._id,
        fullname: userInfo.fullName,
        email: userInfo.email,
        mobile: userInfo.mobile,
        role: userInfo.role,
        token
      };
      return res.status(200).json(userObject);
    }
    return res.status(400).send("User not exists.");
  } catch (err) {
    return res.status(500).send(err.message || err);
  }
});

/**
 * Api to register new user
 */
app.post("/api/v1/user", async (req, res) => {
  // Our register logic starts here
  try {
    // Get user input
    const { fullName, email, password, mobile } = req.body;

    // Validate user input
    try {
      if (!email) {
        throw new Error("Email is required.");
      }

      if (!password) {
        throw new Error("Password is required.");
      }

      if (!fullName) {
        throw new Error("Name is required.");
      }

      if (!mobile) {
        throw new Error("Mobile is required.");
      }
    } catch (error) {
      return res.status(400).send(error.message || error);
    }

    // check if user already exist
    // Validate if user exist in our database
    const userInfo = await User.findOne({ email });

    if (userInfo?._id) {
      return res.status(409).send("User Accout Already Exist. Please Login");
    }

    //Encrypt user password
    const encryptedPassword = await bcrypt.hash(password, 10);

    // Create user in our database
    const user = await User.create({
      fullName,
      email: email.toLowerCase(), // sanitize: convert email to lowercase
      password: encryptedPassword,
      mobile
    });

    // Create token
    const token = jwt.sign({ user_id: user._id, email }, process.env.TOKEN_KEY,
      {
        expiresIn: "2h",
      });

    // save user token
    user.token = token;

    const userObject = {
      id: user._id,
      fullname: user.fullName,
      email: user.email,
      mobile: user.mobile,
    };

    // return new user
    return res.status(201).json(userObject);
  } catch (err) {
    console.log(err);
    return res.status(500).json(err.message || err);
  }
});

/**
 * Api to get user list with details
 */
app.get("/api/v1/user", authMiddleware, async (req, res) => {
  try {
    const { id } = req.query || {};
    const conditionObj = {}
    if (id) {
      conditionObj._id = id;
    }
    const userList = await User.find(conditionObj);
    return res.status(200).json(userList);
  } catch (error) {
    return res.status(500).send(error.message || error);
  }
});

/**
 * Api to update user info
 */
app.put("/api/v1/user/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userInfo = await User.findOne({
      _id: id
    });

    if (userInfo?._id) {
      const { fullName, email, password, mobile } = req.body;
      if (fullName) {
        userInfo.fullName = fullName;
      }
      if (email) {
        userInfo.email = email;
      }
      if (mobile) {
        userInfo.mobile = mobile;
      }
      await userInfo.save();
      return res.status(200).send("User info updated successfully.");
    } else {
      return res.status(400).send("User not exists.");
    }
  } catch (error) {
    return res.status(500).send(error.message || error);
  }
});

/**
 * Api to delete user
 */
app.delete("/api/v1/user/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userInfo = await User.findOne({
      _id: id
    });

    if (userInfo?._id) {
      await userInfo.remove();
      return res.status(200).send({
        status:true,
        message:"User Info deleted successfully"
      });
    } else {
      return res.status(400).send("User not exists.");
    }
  } catch (error) {
    return res.status(500).send(error.message || error);
  }
});

module.exports = app;
