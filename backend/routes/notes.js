const express = require("express");
const jwt = require("jsonwebtoken");
const Note = require("../models/Note");
const User = require("../models/User");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

// Middleware to verify token
function auth(req, res, next) {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "No token" });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.id;
        next();
    } catch {
        return res.status(401).json({ message: "Invalid token" });
    }
}

// ⭐ Create a note
router.post("/add", auth, async (req, res) => {
    const { title, content } = req.body;

    if (!title || !content)
        return res.status(400).json({ message: "Missing fields" });

    const note = new Note({ userId: req.userId, title, content });
    await note.save();

    res.json({ message: "Note saved", note });
});

// ⭐ Get all notes of logged-in user
router.get("/all", auth, async (req, res) => {
    const notes = await Note.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(notes);
});

// ⭐ Delete a note
router.delete("/delete/:id", auth, async (req, res) => {
    await Note.deleteOne({ _id: req.params.id, userId: req.userId });
    res.json({ message: "Note deleted" });
});

module.exports = router;
