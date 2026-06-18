const express = require("express");
const calculateMatch = require("../utils/matchingEngine");
const router = express.Router();
const FriendRequest = require("../models/FriendRequest");

const User = require("../models/User");

const auth = require("../middleware/auth");

router.get("/search/:query", auth, async (req, res) => {
  try {
    const users = await User.find({
      username: {
        $regex: req.params.query,
        $options: "i",
      },
    }).limit(20);

    res.json(users);
  } catch (err) {
    console.log(err);
  }
});

router.get("/recommendations", auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.userId);
    const otherUsers = await User.find({
      _id: {
        $nin: [currentUser._id, ...currentUser.friends],
      },
    });
    const recommendations = otherUsers
      .map((user) => ({
        _id: user._id,
        username: user.username,
        profilePicture: user.profilePicture,
        match: calculateMatch(currentUser.personality, user.personality),
      }))
      .sort((a, b) => b.match - a.match)
      .slice(0, 10);

    res.json(recommendations);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});

router.post("/request/:userId", auth, async (req, res) => {
  try {
    const receiverId = req.params.userId;
    const senderId = req.user.userId;

    if (receiverId === senderId) {
      return res.status(400).json({
        message: "You cannot add yourself",
      });
    }

    const existingRequest = await FriendRequest.findOne({
      sender: senderId,
      receiver: receiverId,
    });

    if (existingRequest) {
      return res.status(400).json({
        message: "Request already sent",
      });
    }

    await FriendRequest.create({
      sender: senderId,
      receiver: receiverId,
    });

    res.json({
      success: true,
      message: "Friend request sent",
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});

router.get("/requests", auth, async (req, res) => {
  try {
    const requests = await FriendRequest.find({
      receiver: req.user.userId,
      status: "pending",
    }).populate("sender", "username profilePicture");

    res.json(requests);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});

router.post("/accept/:requestId", auth, async (req, res) => {
  try {
    const request = await FriendRequest.findById(req.params.requestId);

    // validate request

    request.status = "accepted";
    await request.save();

    await User.findByIdAndUpdate(request.sender, {
      $addToSet: {
        friends: request.receiver,
      },
    });

    await User.findByIdAndUpdate(request.receiver, {
      $addToSet: {
        friends: request.sender,
      },
    });

    await FriendRequest.findByIdAndDelete(req.params.requestId);

    res.json({
      success: true,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});

router.post("/reject/:requestId", auth, async (req, res) => {
  try {
    const request = await FriendRequest.findById(req.params.requestId);

    request.status = "rejected";

    await request.save();

    res.json({
      success: true,
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});

router.get("/friends", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).populate(
      "friends",
      "username profilePicture",
    );

    res.json(user.friends);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});

router.post("/remove-friend/:friendId", auth, async (req, res) => {
  try {
    const userId = req.user.userId;
    const friendId = req.params.friendId;

    await User.findByIdAndUpdate(userId, {
      $pull: {
        friends: friendId,
      },
    });

    await User.findByIdAndUpdate(friendId, {
      $pull: {
        friends: userId,
      },
    });

    res.json({
      success: true,
      message: "Friend removed",
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});

router.get("/profile/:userId", auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    res.json(user);
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});

module.exports = router;
