const mongoose = require('mongoose');

const flaggedQuestionSchema = new mongoose.Schema({
  testId: { type: String, required: true },
  testTitle: { type: String, default: '' },
  subject: { type: String, default: '' },
  questionId: { type: String, required: true },
  questionType: { type: String, required: true },
  questionText: { type: String, default: '' },
  options: [String],
  correctAnswers: [String],
  template: { type: String, default: '' },
  placeholders: [mongoose.Schema.Types.Mixed],
  availableItems: [mongoose.Schema.Types.Mixed],

  // Последний ответ ученика (перезаписывается при повторном флаге)
  userAnswer: mongoose.Schema.Types.Mixed,

  // 🆕 Сколько раз этот вопрос отмечали
  flagCount: { type: Number, default: 1 },

  // 🆕 Когда первый раз отметили и когда последний
  firstFlaggedAt: { type: Date, default: Date.now },
  lastFlaggedAt: { type: Date, default: Date.now },

  status: {
    type: String,
    enum: ['new', 'reviewed', 'fixed', 'ignored'],
    default: 'new',
  },
});

// Уникальный индекс: одна запись на пару (testId, questionId)
flaggedQuestionSchema.index({ testId: 1, questionId: 1 }, { unique: true });

module.exports = mongoose.model('FlaggedQuestion', flaggedQuestionSchema);