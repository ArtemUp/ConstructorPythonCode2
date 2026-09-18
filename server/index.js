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

// Проверка секретов ДО всего остального
if (!process.env.ADMIN_PASSWORD_HASH || !process.env.JWT_SECRET) {
  console.error('❌ ADMIN_PASSWORD_HASH или JWT_SECRET не заданы в .env');
  process.exit(1);
}

// CORS — только для dev/preview. В проде фронт и бэк на одном домене, CORS не нужен.
const allowedOrigins = (process.env.FRONTEND_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    // Запросы без origin (curl, Postman, мобильные приложения) — пропускаем
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    // Если FRONTEND_ORIGINS не задан, пропускаем всё (dev-режим)
    if (allowedOrigins.length === 0) return cb(null, true);
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

// ============ API-роуты ============
app.use('/api/auth', authRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/flagged', flaggedRoutes);
app.use('/api/ai', requireAdmin, aiRoutes);

// ============ Раздача статики фронта ============
const clientBuildPath = path.join(__dirname, '../dist');

app.use(express.static(clientBuildPath));

// SPA fallback — все GET-запросы, кроме /api/*, отдают index.html
app.use((req, res, next) => {
  if (req.method !== 'GET') return next();
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(clientBuildPath, 'index.html'), err => {
    if (err) next();
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});