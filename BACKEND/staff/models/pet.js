const mongoose = require('mongoose');

const petSchema = new mongoose.Schema({
  name: { type: String, required: true },
  species: { type: String, required: true }, // e.g., dog, cat
  breed: { type: String },
  age: { type: Number },
  weight: { type: Number },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  medicalHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Appointment' }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Pet', petSchema);