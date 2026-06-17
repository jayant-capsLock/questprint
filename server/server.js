const express = require("express");
const mongoose = require("mongoose");
const User = require("./models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const auth = require("./middleware/auth");
const socialRoutes = require("./routes/social");
const chatRoutes = require("./routes/chat");
const http = require("http");
const { Server } = require("socket.io");
const Message = require("./models/Message");

require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());
app.use("/api/social", socialRoutes);
app.use("/api/chat", chatRoutes);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {})
  .catch((err) => {});

app.get("/", (req, res) => {
  res.send("Backend is running!");
});

app.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    res.json({
      success: true,
      message: "User registered successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.post("/save-questprint", auth, async (req, res) => {
  try {
    const { personality, recommendations } = req.body;

    await User.findByIdAndUpdate(req.user.userId, {
      personality,
      recommendations,
      quizCompleted: true,
    });

    res.json({
      success: true,
      message: "Questprint saved",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

app.get("/profile", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);

    res.json({
      success: true,
      user,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "user not found",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid password",
      });
    }
    const token = jwt.sign(
      {
        userId: user._id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});
const onlineUsers = {};

io.on("connection", (socket) => {
  socket.on("user-online", (userId) => {
    onlineUsers[userId] = socket.id;

    io.emit("online-users", Object.keys(onlineUsers));
  });

  socket.on("send-message", (data) => {
    const receiverSocket = onlineUsers[data.receiverId];

    if (receiverSocket) {
      io.to(receiverSocket).emit("new-message", {
        sender: data.senderId,
        receiver: data.receiverId,
        content: data.content,
      });
    }
  });

  socket.on("voice-offer", ({ targetUserId, offer, callerId }) => {
    console.log("VOICE OFFER ARRIVED");
    console.log("caller:", callerId);
    console.log("target:", targetUserId);

    const receiverSocket = onlineUsers[targetUserId];

    if (receiverSocket) {
      io.to(receiverSocket).emit("incoming-voice-offer", {
        offer,
        callerId,
      });
    }
  });

  socket.on("cancel-call", ({ targetUserId }) => {
    const receiverSocket = onlineUsers[targetUserId];

    if (receiverSocket) {
      io.to(receiverSocket).emit("call-cancelled");
    }
  });

  socket.on("end-call", ({ targetUserId }) => {
    const receiverSocket = onlineUsers[targetUserId];

    if (receiverSocket) {
      io.to(receiverSocket).emit("call-ended");
    }
  });

  socket.on("ice-candidate", ({ targetUserId, candidate }) => {
    const receiverSocket = onlineUsers[targetUserId];

    if (receiverSocket) {
      io.to(receiverSocket).emit("incoming-ice-candidate", {
        candidate,
      });
    }
  });

  socket.on("voice-answer", ({ targetUserId, answer }) => {
    const receiverSocket = onlineUsers[targetUserId];

    if (receiverSocket) {
      io.to(receiverSocket).emit("incoming-voice-answer", {
        answer,
      });
    }
  });

  socket.on("disconnect", () => {
    for (const userId in onlineUsers) {
      if (onlineUsers[userId] === socket.id) {
        delete onlineUsers[userId];
      }
    }

    io.emit("online-users", Object.keys(onlineUsers));
  });
});

server.listen(PORT, () => {});

app.get("/me", auth, (req, res) => {
  res.json({
    success: true,
    user: req.user,
  });
});
