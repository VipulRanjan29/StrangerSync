const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    //mongodb connection string
    const con = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${con.connection.host}`);
    global.dbConnected = true;
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    global.dbConnected = false;
    // process.exit(1);
  }
};
module.exports = connectDB;
