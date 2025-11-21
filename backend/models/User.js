// models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: false, unique: false }, // optional
  password: { type: String, required: true },
  favourites: [{ type: Number }] // store recipe IDs as numbers (match your recipes.json id)
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
