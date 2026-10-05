const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const downloadRoutes = require('./routes/downloadRoutes');

// Load env variables
dotenv.config();

// Connect to Database (Aapke PC me MongoDB install hona chahiye)
// Agar MongoDB error de, toh connectDB() ko abhi ke liye comment kar dena test karne ke liye.
connectDB(); 

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes setup
app.use('/api/v1', downloadRoutes);

// Health check route
app.get('/', (req, res) => {
    res.send('Universal Downloader API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running in Development mode on port ${PORT}`);
});