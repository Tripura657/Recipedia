// server.js

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const favRoutes = require('./routes/favourites');
const notesRoutes = require("./routes/notes");


const app = express();

app.use(express.json());
//app.use(cors({
 // origin: process.env.FRONTEND_ORIGIN || '*' // set FRONTEND_ORIGIN in prod
//}));
app.use(cors({
  origin: ["http://127.0.0.1:5500", "http://localhost:5500"],
  methods: "GET,POST,DELETE,PUT,PATCH",
  allowedHeaders: "Content-Type,Authorization"
}));

// connect to MongoDB
const MONGO = process.env.MONGO_URI;
if (!MONGO) {
  console.error('MONGO_URI not set in .env');
  process.exit(1);
}

mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(()=> console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Routes
app.use('/auth', authRoutes);
app.use('/favourites', favRoutes);
app.use("/notes", notesRoutes);

// simple health
app.get('/', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, ()=> console.log(`Server running on port ${PORT}`));

