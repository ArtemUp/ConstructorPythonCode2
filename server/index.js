const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const testRoutes = require('./routes/tests');
const itemRoutes = require('./routes/items');
const aiRoutes = require('./routes/ai');
const flaggedRoutes = require('./routes/flagged');
const { requireAdmin } = require('./middleware/requireAdmin');

const app = express();

app.set('trust proxy', 1);

const allowedOrigins = (process.env.FRONTEND_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use(express.json({ limit: '2mb' }));

app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
}));

const PORT = process.env.PORT || 3001;

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

app.use('/api/auth', authRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/flagged', flaggedRoutes);
app.use('/api/ai', requireAdmin, aiRoutes);

if (!process.env.ADMIN_PASSWORD_HASH || !process.env.JWT_SECRET) {
  console.error('❌ ADMIN_PASSWORD_HASH или JWT_SECRET не заданы в .env');
  process.exit(1);
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});