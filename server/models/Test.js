const mongoose = require('mongoose');

const placeholderSchema = new mongoose.Schema({
  id: { type: String, required: true },
  expectedType: { type: String, required: true },
  expected: { type: String, required: true },
});

const itemSchema = new mongoose.Schema({
  id: { type: String, required: true },
  content: { type: String, required: true },
  category: { type: String, required: true },
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