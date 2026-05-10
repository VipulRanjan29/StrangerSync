const UserDB = require("../model/model");
const bcrypt = require("bcryptjs");

// Fallback mock storage for auth (since DB might be disconnected)
const mockAuthDB = new Map();

exports.signup = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).send({ message: "All fields are required" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  if (!global.dbConnected) {
    if (Array.from(mockAuthDB.values()).some(u => u.email === email)) {
      return res.status(400).send({ message: "Email already exists" });
    }
    const newUser = { _id: Date.now().toString(), username, email, password: hashedPassword };
    mockAuthDB.set(newUser._id, newUser);
    req.session.userId = newUser._id;
    return res.redirect("/");
  }

  try {
    const user = new UserDB({ username, email, password: hashedPassword });
    await user.save();
    req.session.userId = user._id;
    res.redirect("/");
  } catch (err) {
    res.status(500).send({ message: err.message || "Error during signup" });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!global.dbConnected) {
    const user = Array.from(mockAuthDB.values()).find(u => u.email === email);
    if (user && await bcrypt.compare(password, user.password)) {
      req.session.userId = user._id;
      return res.redirect("/");
    }
    return res.status(401).send({ message: "Invalid credentials" });
  }

  try {
    const user = await UserDB.findOne({ email });
    if (user && await bcrypt.compare(password, user.password)) {
      req.session.userId = user._id;
      return res.redirect("/");
    }
    res.status(401).send({ message: "Invalid credentials" });
  } catch (err) {
    res.status(500).send({ message: "Error during login" });
  }
};

exports.logout = (req, res) => {
  req.session.destroy();
  res.redirect("/");
};
