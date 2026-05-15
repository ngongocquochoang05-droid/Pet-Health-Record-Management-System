const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  duration: { type: Number }, // in minutes
  category: { type: String }, // e.g., grooming, health check
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Service', serviceSchema);