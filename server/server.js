require("dotenv").config();
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
const upload = require("./middleware/upload");

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

app.put("/profile-picture", auth, upload.single("image"), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      {
        profilePicture: req.file.path,
      },
      { new: true },
    );

    res.json({
      success: true,
      profilePicture: user.profilePicture,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
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
// Track active calls to prevent duplicate signaling
const activeCalls = new Map();

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

  // VOICE CALL SIGNALING
  socket.on("voice-offer", ({ targetUserId, offer, callerId }) => {
    console.log("VOICE OFFER ARRIVED");
    console.log("caller:", callerId);
    console.log("target:", targetUserId);

    const receiverSocket = onlineUsers[targetUserId];

    if (receiverSocket) {
      // Track the call
      activeCalls.set(callerId + "-" + targetUserId, {
        callerId,
        targetUserId,
        state: "offering",
        timestamp: Date.now(),
      });

      io.to(receiverSocket).emit("incoming-voice-offer", {
        offer,
        callerId,
      });
    } else {
      // Send error back to caller
      socket.emit("call-error", {
        message: "User is not online",
        code: "USER_OFFLINE",
      });
    }
  });

  socket.on("voice-answer", ({ targetUserId, answer }) => {
    const receiverSocket = onlineUsers[targetUserId];

    if (receiverSocket) {
      // Update call state
      const callKey = targetUserId + "-" + socket.id;
      if (activeCalls.has(callKey)) {
        const callData = activeCalls.get(callKey);
        callData.state = "connected";
      }

      io.to(receiverSocket).emit("incoming-voice-answer", {
        answer,
      });
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

  // SCREENSHARE SIGNALING - FIXED: Removed duplicate
  socket.on("screen-share-started", ({ targetUserId }) => {
    const targetSocket = onlineUsers[targetUserId];
    if (targetSocket) {
      io.to(targetSocket).emit("screen-share-started");
    }
  });

  socket.on("screen-share-stopped", ({ targetUserId }) => {
    const targetSocket = onlineUsers[targetUserId];
    if (targetSocket) {
      io.to(targetSocket).emit("screen-share-stopped");
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

    // Clean up call tracking
    const callKey = socket.id + "-" + targetUserId;
    activeCalls.delete(callKey);
  });

  // HEARTBEAT: Keep-alive mechanism for long calls
  socket.on("connection-heartbeat", (data) => {
    // Just acknowledge the heartbeat
    socket.emit("connection-heartbeat-ack");
  });

  socket.on("disconnect", () => {
    let disconnectedUserId = null;

    for (const userId in onlineUsers) {
      if (onlineUsers[userId] === socket.id) {
        disconnectedUserId = userId;
        delete onlineUsers[userId];
        break;
      }
    }

    // Clean up any active calls involving this user
    if (disconnectedUserId) {
      activeCalls.forEach((callData, key) => {
        if (
          callData.callerId === disconnectedUserId ||
          callData.targetUserId === disconnectedUserId
        ) {
          activeCalls.delete(key);
        }
      });
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