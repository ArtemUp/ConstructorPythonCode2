const express = require('express');
const router = express.Router();
const FlaggedQuestion = require('../models/FlaggedQuestion');
const { requireAdmin } = require('../middleware/requireAdmin');

// ============================================================
// POST /api/flagged — добавить флаг(и)
// Если вопрос уже отмечен — увеличиваем flagCount
// ============================================================
router.post('/', async (req, res) => {
  try {
    const payload = req.body;
    const items = Array.isArray(payload) ? payload : [payload];

    if (items.length === 0) {
      return res.status(400).json({ error: 'Пустой список' });
    }

    const results = [];

    for (const item of items) {
      // Ищем существующий флаг по (testId, questionId)
      const existing = await FlaggedQuestion.findOne({
        testId: item.testId,
        questionId: item.questionId,
      });

      if (existing) {
        // Уже есть — увеличиваем счётчик, обновляем ответ, но НЕ перезаписываем статус
        existing.flagCount = (existing.flagCount || 1) + 1;
        existing.lastFlaggedAt = new Date();
        existing.userAnswer = item.userAnswer ?? existing.userAnswer;

        // Если был статус "fixed" или "ignored" — возвращаем в "new"
        // чтобы админ знал, что проблему ещё раз отметили
        if (existing.status === 'fixed' || existing.status === 'ignored') {
          existing.status = 'new';
        }

        await existing.save();
        results.push(existing);
      } else {
        // Новый флаг
        const created = await FlaggedQuestion.create({
          ...item,
          flagCount: 1,
          firstFlaggedAt: new Date(),
          lastFlaggedAt: new Date(),
          status: 'new',
        });
        results.push(created);
      }
    }

    res.status(201).json({ created: results.length, items: results });
  } catch (err) {
    console.error('Flag create error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

// ============================================================
// GET /api/flagged?status=new&sort=count — список флагов
// ============================================================
router.get('/', requireAdmin, async (req, res) => {
  try {
    const filter = {};
    if (req.query.status && req.query.status !== 'all') {
      filter.status = req.query.status;
    }
    if (req.query.testId) {
      filter.testId = req.query.testId;
    }

    // Сортировка: по количеству отметок (по убыванию) — по умолчанию
    const sort = req.query.sort === 'date'
      ? { lastFlaggedAt: -1 }
      : { flagCount: -1, lastFlaggedAt: -1 };

    const items = await FlaggedQuestion.find(filter)
      .sort(sort)
      .limit(200)
      .lean();

    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// GET /api/flagged/stats — счётчики
// ============================================================
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const stats = await FlaggedQuestion.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);
    const result = { new: 0, reviewed: 0, fixed: 0, ignored: 0, total: 0 };
    stats.forEach(s => {
      result[s._id] = s.count;
      result.total += s.count;
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================================
// PATCH /api/flagged/:id — обновить статус
// ============================================================
router.patch('/:id', requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['new', 'reviewed', 'fixed', 'ignored'].includes(status)) {
      return res.status(400).json({ error: 'Неверный статус' });
    }

    const updated = await FlaggedQuestion.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Не найдено' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ============================================================
// DELETE /api/flagged/:id
// ============================================================
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const removed = await FlaggedQuestion.findByIdAndDelete(req.params.id);
    if (!removed) return res.status(404).json({ error: 'Не найдено' });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;