'use strict';

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  fullName: { type: String, default: null },
  email: { type: String, unique: true },
  password: { type: String },
  mobile: { type: String },
  token: { type: String },
  role: { type: String, default: 'user' }
});

module.exports = mongoose.model("user", userSchema);