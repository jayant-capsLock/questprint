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
const livekitRoutes = require("./routes/livekit");

const app = express();
app.use(express.json());
app.use(cors());
app.use("/api/social", socialRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/livekit", livekitRoutes);

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

io.on("connection", (socket) => {
  socket.on("user-online", (userId) => {
    onlineUsers[userId] = socket.id;
    io.emit("online-users", Object.keys(onlineUsers));
  });

  socket.on("call-user", ({ targetUserId, roomName, caller }) => {
    const targetSocket = onlineUsers[targetUserId];

    if (targetSocket) {
      io.to(targetSocket).emit("incoming-call", {
        roomName,
        caller,
      });
    }
  });

  socket.on("accept-call", ({ targetUserId, roomName }) => {
  const targetSocket = onlineUsers[targetUserId];

  if (targetSocket) {
    io.to(targetSocket).emit("call-accepted", {
      roomName,
    });
  }
});

socket.on("reject-call", ({ targetUserId }) => {
  const targetSocket = onlineUsers[targetUserId];

  if (targetSocket) {
    io.to(targetSocket).emit("call-rejected");
  }
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

  socket.on("disconnect", () => {
    let disconnectedUserId = null;

    for (const userId in onlineUsers) {
      if (onlineUsers[userId] === socket.id) {
        disconnectedUserId = userId;
        delete onlineUsers[userId];
        break;
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
