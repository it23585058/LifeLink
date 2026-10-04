const mongoose = require('mongoose');

const donorResponseSchema = new mongoose.Schema(
  {
    request: { type: mongoose.Schema.Types.ObjectId, ref: 'BloodRequest', required: true },
    donor: { type: mongoose.Schema.Types.ObjectId, ref: 'Donor', required: true },
    status: { type: String, enum: ['offered', 'accepted', 'declined', 'completed'], default: 'offered' },
    message: { type: String, trim: true },
  },
  { timestamps: true }
);

donorResponseSchema.index({ request: 1, donor: 1 }, { unique: true });

module.exports = mongoose.model('DonorResponse', donorResponseSchema);