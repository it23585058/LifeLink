const mongoose = require('mongoose');

const bloodRequestSchema = new mongoose.Schema(
  {
    patientName: { type: String, required: true, trim: true },
    bloodGroup: { type: String, required: true, uppercase: true, trim: true },
    hospital: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    unitsNeeded: { type: Number, required: true, min: 1 },
    urgency: { type: String, enum: ['routine', 'urgent', 'critical'], default: 'urgent' },
    status: { type: String, enum: ['open', 'fulfilled', 'cancelled'], default: 'open' },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

bloodRequestSchema.index({ status: 1, bloodGroup: 1, city: 1, createdAt: -1 });

module.exports = mongoose.model('BloodRequest', bloodRequestSchema);