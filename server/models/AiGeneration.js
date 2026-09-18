const mongoose = require('mongoose');

const aiGenerationSchema = new mongoose.Schema({
  userId: { type: String, default: 'anonymous' },
  topic: { type: String, required: true },
  subject: { type: String, required: true },
  questionCount: { type: Number, required: true },
  attempts: { type: Number, default: 1 },
  inputTokens: { type: Number, default: 0 },
  completionTokens: { type: Number, default: 0 },
  totalTokens: { type: Number, default: 0 },
  model: { type: String, default: 'yandexgpt/latest' },
  success: { type: Boolean, default: true },
  errorMessage: { type: String },
  createdAt: { type: Date, default: Date.now },
  verifyTokens: { type: Number, default: 0 },
});

module.exports = mongoose.model('AiGeneration', aiGenerationSchema);