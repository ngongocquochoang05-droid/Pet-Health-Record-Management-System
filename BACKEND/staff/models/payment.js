const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
  amount: { type: Number, required: true },
  method: { type: String, enum: ['cash', 'card', 'online'], default: 'cash' },
  status: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  transactionId: { type: String },
  paidAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Payment', paymentSchema);