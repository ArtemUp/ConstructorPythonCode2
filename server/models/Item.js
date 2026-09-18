const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  content: { type: String, required: true },
  category: { type: String, required: true },
});

module.exports = mongoose.model('Item', itemSchema);