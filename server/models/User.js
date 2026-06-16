const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
  },

  password: {
    type: String,
    required: true,
  },

  quizCompleted: {
    type: Boolean,
    default: false,
  },

  personality: {
    challenge: Number,
    exploration: Number,
    social: Number,
    creativity: Number,
    narrative: Number,
  },
  recommendations: [
  {
    name: String,
    match: Number,
  },
],
  friends: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
],
});

module.exports = mongoose.model("User", userSchema);