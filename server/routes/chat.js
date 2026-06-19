const express = require("express");
const auth = require("../middleware/auth");
const Message = require("../models/Message");
const User = require("../models/User");
const mongoose = require("mongoose");

const router = express.Router();

router.post("/send/:userId", auth, async (req, res) => {
  try {
    const sender = await User.findById(req.user.userId);

    if (!sender.friends.includes(req.params.userId)) {
      return res.status(403).json({
        message: "You can only message friends",
      });
    }
    const message = await Message.create({
      sender: req.user.userId,
      receiver: req.params.userId,
      content: req.body.content,
    });

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

router.get("/unread/counts", auth, async (req, res) => {
  try {
    const counts = await Message.aggregate([
      {
        $match: {
          receiver: new mongoose.Types.ObjectId(req.user.userId),
          isRead: false,
        },
      },
      {
        $group: {
          _id: "$sender",
          count: { $sum: 1 },
        },
      },
    ]);

    res.json(counts);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});

router.get("/:userId", auth, async (req, res) => {
  try {
    const currentUser = req.user.userId;

    const otherUser = req.params.userId;

    await Message.updateMany(
      {
        sender: otherUser,
        receiver: currentUser,
        isRead: false,
      },
      {
        isRead: true,
      },
    );

    const messages = await Message.find({
      $or: [
        {
          sender: currentUser,
          receiver: otherUser,
        },
        {
          sender: otherUser,
          receiver: currentUser,
        },
      ],
    }).sort({
      createdAt: 1,
    });

    res.json(messages);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

module.exports = router;
