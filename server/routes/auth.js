const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Слишком много попыток, попробуйте позже' },
});

router.post('/login', loginLimiter, async (req, res) => {
  const { password } = req.body ?? {};

  if (typeof password !== 'string' || password.length === 0) {
    return res.status(400).json({ error: 'Пароль обязателен' });
  }

  if (!process.env.ADMIN_PASSWORD_HASH) {
    console.error('ADMIN_PASSWORD_HASH не задан в .env');
    return res.status(500).json({ error: 'Server misconfigured' });
  }

  const ok = await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH);

  if (!ok) {
    await new Promise(r => setTimeout(r, 400));
    return res.status(401).json({ error: 'Неверный пароль' });
  }

  const token = jwt.sign(
    { role: 'admin' },
    process.env.JWT_SECRET,
    { expiresIn: '8h', issuer: 'test-platform', audience: 'test-platform-api' },
  );

  res.json({ token, expiresIn: 28800 });
});

module.exports = router;