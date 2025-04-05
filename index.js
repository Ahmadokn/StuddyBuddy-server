const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { User, Assignment, ChatMessage } = require('./models');

const app = express();
const PORT = process.env.PORT || 3000;
const SECRET_KEY = 'your_secret_key';

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://Ahmadblivin:2629@cluster0.gukq20x.mongodb.net/studybuddy?retryWrites=true&w=majority&appName=Cluster0';
mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

app.use(express.json());
app.use(cors());

// ---------- Authentication Endpoints ----------

// Login endpoint: If the user doesn’t exist, create a new user. Then return a JWT token.
app.post('/api/login', async (req, res) => {
  const { email, name } = req.body;
  if (!email || !name) {
    return res.status(400).json({ message: 'Email and name required.' });
  }
  try {
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ email, name });
    }
    const token = jwt.sign({ email }, SECRET_KEY, { expiresIn: '1h' });
    return res.json({ token, user });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error during login.' });
  }
});

// Middleware to validate token on protected endpoints.
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader)
    return res.status(401).json({ message: 'Missing token' });
  const token = authHeader.split(' ')[1];
  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) return res.status(401).json({ message: 'Invalid token' });
    req.userEmail = decoded.email;
    next();
  });
}

// ---------- Assignment Endpoints ----------

// Get assignments for the authenticated user.
app.get('/api/assignments', authenticate, async (req, res) => {
  try {
    const assignments = await Assignment.find({ userEmail: req.userEmail });
    res.json(assignments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error retrieving assignments.' });
  }
});

// Add a new assignment.
app.post('/api/assignments', authenticate, async (req, res) => {
  const { title, due } = req.body;
  if (!title || !due)
    return res.status(400).json({ message: 'Title and due date required.' });
  try {
    const assignment = await Assignment.create({ userEmail: req.userEmail, title, due });
    res.json(assignment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating assignment.' });
  }
});

// Delete an assignment.
app.delete('/api/assignments/:id', authenticate, async (req, res) => {
  try {
    await Assignment.deleteOne({ _id: req.params.id, userEmail: req.userEmail });
    res.json({ message: 'Assignment deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error deleting assignment.' });
  }
});

// ---------- Chat Endpoints ----------

// Get all global chat messages.
app.get('/api/chat', authenticate, async (req, res) => {
  try {
    const messages = await ChatMessage.find().sort({ timestamp: 1 });
    res.json(messages);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error retrieving chat messages.' });
  }
});

// Post a new chat message.
app.post('/api/chat', authenticate, async (req, res) => {
  const { text } = req.body;
  if (!text)
    return res.status(400).json({ message: 'Message text required.' });
  try {
    const user = await User.findOne({ email: req.userEmail });
    const message = await ChatMessage.create({
      userEmail: req.userEmail,
      sender: user.name,
      text,
      timestamp: Date.now()
    });
    res.json(message);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error posting chat message.' });
  }
});

// ---------- Profile Endpoints ----------

// Get the authenticated user's profile.
app.get('/api/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.userEmail });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error retrieving profile.' });
  }
});

// Update the authenticated user's profile.
app.put('/api/profile', authenticate, async (req, res) => {
  const { name } = req.body;
  try {
    const user = await User.findOneAndUpdate({ email: req.userEmail }, { name }, { new: true });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error updating profile.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});