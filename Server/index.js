// Train Seat Booking System - MERN Stack

// SERVER-SIDE (Node.js + Express + MongoDB)

import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import dotenv from 'dotenv';

const app = express();
const PORT = 5000;
const JWT_SECRET = 'your_jwt_secret';
dotenv.config();

app.use(express.json());
app.use(cors(
  {
      origin: ["https://train-seat-reservations.vercel.app"],
      methods: ["GET", "POST", "PUT", "DELETE"],
      credentials: true
  }
))

app.get('/', (req, res) => {
  res.send('This is Backend Server coming from Train Seat Booking')
})

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});


const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
});

const seatSchema = new mongoose.Schema({
  seatNumber: { type: Number, required: true, unique: true },
  isBooked: { type: Boolean, default: false },
  bookedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
});

const User = mongoose.model('User', userSchema);
const Seat = mongoose.model('Seat', seatSchema);

// Initialize seats in the database
async function initializeSeats() {
  const seats = await Seat.find();
  if (seats.length === 0) {
    for (let i = 1; i <= 80; i++) {
      await Seat.create({ seatNumber: i });
    }
    console.log('Seats initialized');
  }
}
initializeSeats();

// User signup
app.post('https://train-seat-reservations.vercel.app/api/signup', async (req, res) => {
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const newUser = await User.create({ username, password: hashedPassword });
    res.status(201).json({ message: 'User registered successfully!' });
  } catch (err) {
    res.status(400).json({ error: 'Username already exists' });
  }
});

// User login
app.post('https://train-seat-reservations.vercel.app/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(400).json({ error: 'Invalid credentials' });

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) return res.status(400).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });
  res.json({ token });
});

// Middleware for authentication
function authenticateToken(req, res, next) {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).json({ error: 'Access denied' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}

// Reserve seats
app.post('https://train-seat-reservations.vercel.app/api/reserve', authenticateToken, async (req, res) => {
  const { seatCount } = req.body;
  const userId = req.user.userId;

  if (seatCount < 1 || seatCount > 7) {
    return res.status(400).json({ error: 'You can reserve between 1 and 7 seats' });
  }

  const availableSeats = await Seat.find({ isBooked: false }).sort('seatNumber');

  if (availableSeats.length < seatCount) {
    return res.status(400).json({ error: 'Not enough seats available' });
  }

  let bookedSeats = [];
  let currentRow = Math.floor((availableSeats[0].seatNumber - 1) / 7);
  let currentRowSeats = availableSeats.filter(
    (seat) => Math.floor((seat.seatNumber - 1) / 7) === currentRow
  );

  if (currentRowSeats.length >= seatCount) {
    bookedSeats = currentRowSeats.slice(0, seatCount);
  } else {
    bookedSeats = availableSeats.slice(0, seatCount);
  }

  for (let seat of bookedSeats) {
    seat.isBooked = true;
    seat.bookedBy = userId;
    await seat.save();
  }

  res.json({ message: 'Seats reserved successfully', bookedSeats });
});

// Cancel reservation
app.post('https://train-seat-reservations.vercel.app/api/cancel', authenticateToken, async (req, res) => {
  const { seatNumbers } = req.body;
  const userId = req.user.userId;

  for (let seatNumber of seatNumbers) {
    const seat = await Seat.findOne({ seatNumber });
    if (seat && seat.bookedBy.toString() === userId) {
      seat.isBooked = false;
      seat.bookedBy = null;
      await seat.save();
    }
  }

  res.json({ message: 'Reservation canceled successfully' });
});

// Reset all seats (admin functionality)
app.post('https://train-seat-reservations.vercel.app/api/reset', async (req, res) => {
  await Seat.updateMany({}, { isBooked: false, bookedBy: null });
  res.json({ message: 'All reservations have been reset' });
});

// Get all seats
app.get('https://train-seat-reservations.vercel.app/api/seats', async (req, res) => {
  try {
    const seats = await Seat.find(); // Fetch all seats from the database
    res.json(seats);
  } catch (error) {
    console.error('Error fetching seats:', error);
    res.status(500).json({ error: 'Error fetching seats' });
  }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
