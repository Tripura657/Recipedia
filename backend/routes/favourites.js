// routes/favourites.js
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'CHANGE_THIS_SECRET';

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ message: 'No token provided' });
  const token = auth.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

// Get favourites
router.get('/', authMiddleware, async (req, res) => {
  const user = await User.findById(req.userId).select('favourites username');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json({ favourites: user.favourites });
});

// Add favourite
router.post('/add', authMiddleware, async (req, res) => {
  try {
    const { recipeId } = req.body;
    if (typeof recipeId === 'undefined') return res.status(400).json({ message: 'recipeId required' });

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.favourites.includes(recipeId)) {
      user.favourites.push(recipeId);
      await user.save();
    }

    res.json({ message: 'Added', favourites: user.favourites });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove favourite
router.post('/remove', authMiddleware, async (req, res) => {
  try {
    const { recipeId } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.favourites = user.favourites.filter(id => id !== recipeId);
    await user.save();
    res.json({ message: 'Removed', favourites: user.favourites });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
