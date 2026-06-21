const express = require("express");
const { AccessToken } = require("livekit-server-sdk");

const router = express.Router();

router.get("/token", async (req, res) => {
  try {
    const { room, username } = req.query;

    if (!room || !username) {
      return res.status(400).json({
        message: "room and username are required",
      });
    }

    const token = new AccessToken(
      process.env.LIVEKIT_API_KEY,
      process.env.LIVEKIT_API_SECRET,
      {
        identity: username,
      }
    );

    token.addGrant({
      roomJoin: true,
      room,
    });

    const jwt = await token.toJwt();

    res.json({
      token: jwt,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: err.message,
    });
  }
});

module.exports = router;