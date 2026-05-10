const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
var UserDB = require("../model/model");

// Persistent mock database path
const MOCK_DB_PATH = path.join(__dirname, "../../mock_db.json");

const loadMockDB = () => {
  try {
    if (fs.existsSync(MOCK_DB_PATH)) {
      const data = fs.readFileSync(MOCK_DB_PATH, "utf-8");
      return new Map(JSON.parse(data));
    }
  } catch (err) {
    console.error("Error loading mock DB:", err);
  }
  return new Map();
};

const saveMockDB = (db) => {
  try {
    fs.writeFileSync(MOCK_DB_PATH, JSON.stringify(Array.from(db.entries())), "utf-8");
  } catch (err) {
    console.error("Error saving mock DB:", err);
  }
};

let mockDB = loadMockDB();

const saveMockUser = (user) => {
  if (!user._id) user._id = new mongoose.Types.ObjectId();
  const userData = { ...user.toObject(), _id: user._id };
  mockDB.set(user._id.toString(), userData);
  saveMockDB(mockDB);
  return userData;
};

exports.create = (req, res) => {
  const user = new UserDB({ active: "no", status: "0" }); // Default to inactive until button click
  if (!global.dbConnected) {
    const data = saveMockUser(user);
    return res.send(data._id);
  }
  user.save().then(data => res.send(data._id)).catch(err => res.status(500).send({ message: err.message }));
};

exports.leavingUserUpdate = (req, res) => {
  const userid = req.params.id;
  if (!global.dbConnected) {
    const user = mockDB.get(userid);
    if (user) { user.active = "no"; user.status = "0"; saveMockDB(mockDB); return res.send("1 document updated"); }
    return res.status(404).send({ message: "User not found" });
  }
  UserDB.updateOne({ _id: userid }, { $set: { active: "no", status: "0" } }).then(() => res.send("1 document updated"));
};

exports.updateOnOtherUserClosing = (req, res) => {
  const userid = req.params.id;
  if (!global.dbConnected) {
    const user = mockDB.get(userid);
    if (user) { user.active = "yes"; user.status = "0"; saveMockDB(mockDB); return res.send("1 document updated"); }
    return res.status(404).send({ message: "User not found" });
  }
  UserDB.updateOne({ _id: userid }, { $set: { active: "yes", status: "0" } }).then(() => res.send("1 document updated"));
};

exports.newUserUpdate = (req, res) => {
  const userid = req.params.id;
  if (!global.dbConnected) {
    let user = mockDB.get(userid);
    if (user) { user.active = "no"; saveMockDB(mockDB); return res.send("1 document updated"); }
    const newUser = new UserDB({ active: "no", status: "0" });
    const data = saveMockUser(newUser);
    return res.send({ omeID: data._id });
  }
  UserDB.findOne({ _id: userid }).then(user => {
    if (user) {
      UserDB.updateOne({ _id: userid }, { $set: { active: "no" } }).then(() => res.send("1 document updated"));
    } else {
      const newUser = new UserDB({ active: "no", status: "0" });
      newUser.save().then(data => res.send({ omeID: data._id }));
    }
  });
};

exports.updateOnEngagement = (req, res) => {
  const userid = req.params.id;
  if (!global.dbConnected) {
    const user = mockDB.get(userid);
    if (user) { user.status = "1"; saveMockDB(mockDB); return res.send("1 document updated"); }
    return res.status(404).send({ message: "User not found" });
  }
  UserDB.updateOne({ _id: userid }, { $set: { status: "1" } }).then(() => res.send("1 document updated"));
};

exports.updateOnNext = (req, res) => {
  const userid = req.params.id;
  if (!global.dbConnected) {
    const user = mockDB.get(userid);
    if (user) { user.status = "0"; saveMockDB(mockDB); return res.send("1 document updated"); }
    return res.status(404).send({ message: "User not found" });
  }
  UserDB.updateOne({ _id: userid }, { $set: { status: "0" } }).then(() => res.send("1 document updated"));
};

exports.remoteUserFind = (req, res) => {
  const omeID = req.body.omeID;
  if (!global.dbConnected) {
    const users = Array.from(mockDB.values()).filter(u => u._id.toString() !== omeID && u.active === "yes" && u.status === "0");
    return res.send(users.length > 0 ? [users[Math.floor(Math.random() * users.length)]] : []);
  }
  UserDB.aggregate([{ $match: { _id: { $ne: new mongoose.Types.ObjectId(omeID) }, active: "yes", status: "0" } }, { $sample: { size: 1 } }]).then(data => res.send(data));
};

exports.getNextUser = (req, res) => {
  const omeID = req.body.omeID;
  const remoteUser = req.body.remoteUser;
  let excludedIds = [omeID, remoteUser];
  if (!global.dbConnected) {
    const users = Array.from(mockDB.values()).filter(u => !excludedIds.includes(u._id.toString()) && u.active === "yes" && u.status === "0");
    return res.send(users.length > 0 ? [users[Math.floor(Math.random() * users.length)]] : []);
  }
  UserDB.aggregate([{ $match: { _id: { $nin: excludedIds.map(id => new mongoose.Types.ObjectId(id)) }, active: "yes", status: "0" } }, { $sample: { size: 1 } }]).then(data => res.send(data));
};

exports.reportUser = (req, res) => {
  const { userId } = req.body;
  if (!global.dbConnected) {
    const user = mockDB.get(userId);
    if (user) { user.reports = (user.reports || 0) + 1; saveMockDB(mockDB); return res.send({ success: true }); }
    return res.status(404).send({ message: "User not found" });
  }
  UserDB.updateOne({ _id: userId }, { $inc: { reports: 1 } }).then(() => res.send({ success: true }));
};

exports.deleteAllRecords = (req, res) => {
  if (!global.dbConnected) { mockDB.clear(); saveMockDB(mockDB); return res.send("Deleted"); }
  UserDB.deleteMany({}).then(() => res.send("Deleted"));
};
