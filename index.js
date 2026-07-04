import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import chatRoutes from './routes/chat.js';
import notifyRoutes from './routes/notify.js';
import replyRoutes from './routes/reply.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Basic health check
app.get('/', (req, res) => {
  res.send('Portfolio Backend is running');
});

// API Routes
app.use('/api/chat', chatRoutes);
app.use('/api/notify', notifyRoutes);
app.use('/api/reply', replyRoutes);

// Keep-Alive Ping for Render Free Tier
setInterval(() => {
  // Use dynamic import for node-fetch if needed, or native fetch in Node 18+
  fetch(`https://portfolio-backend-66he.onrender.com/`)
    .catch(() => {});
}, 10 * 60 * 1000); // Ping every 10 minutes

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
