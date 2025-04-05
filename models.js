const mongoose = require('mongoose');

// User Schema: Stores basic user info.
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);

// Assignment Schema: Each assignment is linked to a user.
const assignmentSchema = new mongoose.Schema({
  userEmail: { type: String, required: true },
  title: { type: String, required: true },
  due: { type: Date, required: true }
});
const Assignment = mongoose.model('Assignment', assignmentSchema);

// Chat Message Schema: Global chat messages with sender info.
const chatMessageSchema = new mongoose.Schema({
  userEmail: { type: String, required: true },
  sender: { type: String, required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});
const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);

module.exports = { User, Assignment, ChatMessage };