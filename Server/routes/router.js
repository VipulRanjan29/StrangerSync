const express = require("express");
const route = express.Router();
const services = require("../services/render");
const controller = require("../controller/controller");
const authController = require("../controller/auth_controller");

// Main Routes
route.get("/", services.homeRoutes);
route.get("/video_chat", services.video_chat);
route.get("/text_chat", services.text_chat);

// Auth Routes
route.get("/login", (req, res) => res.render("login"));
route.get("/signup", (req, res) => res.render("signup"));
route.post("/login", authController.login);
route.post("/signup", authController.signup);
route.get("/logout", authController.logout);

// API Routes
route.post("/api/users", controller.create);
route.put("/leaving-user-update/:id", controller.leavingUserUpdate);
route.put("/update-on-otheruser-closing/:id", controller.updateOnOtherUserClosing);
route.put("/new-user-update/:id", controller.newUserUpdate);
route.post("/get-remote-users", controller.remoteUserFind);
route.put("/update-on-engagement/:id", controller.updateOnEngagement);
route.put("/update-on-next/:id", controller.updateOnNext);
route.post("/get-next-user", controller.getNextUser);
route.delete("/deleteAllRecords", controller.deleteAllRecords);

// Moderation API
route.post("/api/report", controller.reportUser);

module.exports = route;
