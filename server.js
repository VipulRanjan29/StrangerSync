const express = require("express");
const path = require("path");
const bodyparser = require("body-parser");
const session = require("express-session");
const rateLimit = require("express-rate-limit");
const dotenv = require("dotenv");
const connectDB = require("./Server/database/connection");
const UserDB = require("./Server/model/model");

const app = express();
dotenv.config({ path: "config.env" });
const PORT = process.env.PORT || 8080;

connectDB();

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", limiter);

// Session Configuration
app.use(session({
  secret: process.env.SESSION_SECRET || "strangersync_secret_key_123",
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

app.use(bodyparser.urlencoded({ extended: true }));
app.use(bodyparser.json());
app.set("view engine", "ejs");

// Static Assets
app.use("/css", express.static(path.resolve(__dirname, "Assets/css")));
app.use("/img", express.static(path.resolve(__dirname, "Assets/img")));
app.use("/js", express.static(path.resolve(__dirname, "Assets/js")));

// Global Middleware to provide user context to views
app.use(async (req, res, next) => {
  if (req.session.userId) {
    if (global.dbConnected) {
      res.locals.user = await UserDB.findById(req.session.userId);
    } else {
      // Mock user context if DB is down
      res.locals.user = { _id: req.session.userId, username: "Guest User" };
    }
  } else {
    res.locals.user = null;
  }
  next();
});

app.use("/", require("./Server/routes/router"));

app.get("/health", (req, res) => res.send("OK"));
app.get("/api/online-count", (req, res) => {
  res.json({ count: 1234 + (Math.floor(Math.random() * 50)) }); // Realistic mock count
});

const server = app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

const io = require("socket.io")(server, {
  allowEIO3: true,
});

let userConnection = [];

io.on("connection", (socket) => {
  socket.on("userconnect", (data) => {
    userConnection.push({
      connectionId: socket.id,
      user_id: data.displayName,
    });
    socket.broadcast.emit("user_count_update", userConnection.length);
  });

  socket.on("typing", (data) => {
    const receiver = userConnection.find(u => u.user_id === data.remoteUser);
    if (receiver) {
      socket.to(receiver.connectionId).emit("remote_typing", { typing: true });
    }
  });

  socket.on("stop_typing", (data) => {
    const receiver = userConnection.find(u => u.user_id === data.remoteUser);
    if (receiver) {
      socket.to(receiver.connectionId).emit("remote_typing", { typing: false });
    }
  });

  socket.on("offerSentToRemote", (data) => {
    const offerReceiver = userConnection.find(o => o.user_id === data.remoteUser);
    if (offerReceiver) {
      socket.to(offerReceiver.connectionId).emit("ReceiveOffer", data);
    }
  });

  socket.on("answerSentToUser1", (data) => {
    const answerReceiver = userConnection.find(o => o.user_id === data.receiver);
    if (answerReceiver) {
      socket.to(answerReceiver.connectionId).emit("ReceiveAnswer", data);
    }
  });

  socket.on("candidateSentToUser", (data) => {
    const candidateReceiver = userConnection.find(o => o.user_id === data.remoteUser);
    if (candidateReceiver) {
      socket.to(candidateReceiver.connectionId).emit("candidateReceiver", data);
    }
  });

  socket.on("remoteUserClosed", (data) => {
    const closedUser = userConnection.find(o => o.user_id === data.remoteUser);
    if (closedUser) {
      socket.to(closedUser.connectionId).emit("closedRemoteUser", data);
    }
  });

  socket.on("disconnect", () => {
    userConnection = userConnection.filter((p) => p.connectionId !== socket.id);
  });
});
