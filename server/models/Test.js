const mongoose = require('mongoose');

const placeholderSchema = new mongoose.Schema({
  id: { type: String }, // Убрали required
  expectedType: { type: String }, // Убрали required
  expected: { type: String, default: '' }, // Убрали required, добавили default
});

const itemSchema = new mongoose.Schema({
  id: { type: String }, // Убрали required
  content: { type: String, default: '' }, // Убрали required, добавили default
  category: { type: String }, // Убрали required
});

const questionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  type: { type: String, enum: ['single', 'multiple', 'expressionBuilder'], required: true },
  questionText: { type: String, required: true },
  template: { type: String },
  placeholders: [placeholderSchema],
  availableItems: [itemSchema],
  options: [String],
  correctAnswers: [String],
});

const testSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  subject: { type: String, enum: ['python', 'math', 'russian'], required: true },
  questions: [questionSchema],
  timeLimit: { type: Number },
});

module.exports = mongoose.model('Test', testSchema);