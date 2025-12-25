const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  ticket: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CastingTicket',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true
});

// Ensure one registration per user per ticket
registrationSchema.index({ ticket: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Registration', registrationSchema);

