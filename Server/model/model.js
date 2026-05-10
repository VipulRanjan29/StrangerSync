const mongoose = require("mongoose");

var schema = new mongoose.Schema(
  {
    username: {
      type: String,
      unique: true,
      sparse: true,
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
    },
    password: {
      type: String,
    },
    active: {
      type: String,
      default: "no",
    },
    status: {
      type: String,
      default: "0",
    },
    isBanned: {
      type: Boolean,
      default: false,
    },
    reports: {
      type: Number,
      default: 0,
    }
  },
  { timestamps: true }
);

const UserDB = mongoose.model("User", schema);
module.exports = UserDB;
